/**
 * Who may do what to an escrow, and when.
 *
 * One table, two consumers: the dashboard asks it what to render, and
 * `lib/signing` asks it whether to let a signature through. They used to decide
 * separately, which is how the approver ended up being offered "Submit
 * Evidence" — a button the backend rejects, because Trustless Work accepts
 * `changeMilestoneStatus` only from the service provider.
 *
 * Role requirements mirror the backend DTOs in
 * `ThalosBackend/src/internal-trustless/dto/escrow-write.dto.ts`: approve takes
 * an `approver`, change-milestone-status a `serviceProvider`, release a
 * `releaseSigner`; create, fund and dispute take a plain `signer`.
 */

import type { EscrowOperation, EscrowRolesInfo } from "@/lib/signing/types"

export type EscrowRole = keyof EscrowRolesInfo

/** Roles allowed to sign each operation. Empty = any wallet may sign. */
export const ALLOWED_ROLES: Record<EscrowOperation, EscrowRole[]> = {
  create: [],
  // Trustless Work lets any wallet put funds in; it does not have to be a party.
  fund: [],
  approveMilestone: ["approver"],
  releaseFunds: ["releaseSigner"],
  // Either party may raise a dispute — but not the resolver, who settles it.
  dispute: ["approver", "serviceProvider"],
  resolve: ["disputeResolver"],
  changeMilestoneStatus: ["serviceProvider"],
}

export const ROLE_LABELS: Record<EscrowRole, string> = {
  approver: "approver",
  serviceProvider: "service provider",
  releaseSigner: "release signer",
  disputeResolver: "dispute resolver",
  receiver: "receiver",
}

export type EscrowLifecycleState =
  "waiting_for_funding" | "funded" | "in_progress" | "disputed" | "completed" | "unknown"

export type MilestoneState = "pending" | "approved" | "released"

/**
 * States in which each operation makes sense. `unknown` is never in a list:
 * when the lifecycle state cannot be established, nothing is offered, because
 * offering an action that the chain will reject is the failure mode this module
 * exists to prevent.
 */
const ALLOWED_STATES: Record<EscrowOperation, EscrowLifecycleState[]> = {
  create: ["waiting_for_funding", "funded", "in_progress", "disputed", "completed"],
  fund: ["waiting_for_funding"],
  changeMilestoneStatus: ["funded", "in_progress"],
  approveMilestone: ["funded", "in_progress"],
  releaseFunds: ["funded", "in_progress"],
  dispute: ["funded", "in_progress"],
  resolve: ["disputed"],
}

/** Milestone states each operation acts on, when it is milestone-scoped. */
const ALLOWED_MILESTONE_STATES: Partial<Record<EscrowOperation, MilestoneState[]>> = {
  changeMilestoneStatus: ["pending"],
  approveMilestone: ["pending"],
  releaseFunds: ["approved"],
  dispute: ["pending", "approved"],
}

/**
 * Single-release pays out the whole escrow at once, so releasing is a property
 * of every milestone rather than of the one in hand:
 *
 *   "Single-release requires ALL milestones approved before any release: you
 *    cannot call release-funds until every milestone is individually approved.
 *    Multi-release allows per-milestone releases."
 *   — .claude/skills/trustless-work-dev/SKILL.md
 *
 * The backend's endpoint split says the same thing from the other side:
 * `release-funds` takes no milestone index for single-release, while
 * multi-release has `release-milestone-funds`.
 */
export type EscrowKind = "single-release" | "multi-release"

export type DenialReason =
  | "no-session"
  | "unresolved-roles"
  | "wrong-role"
  | "wrong-state"
  | "wrong-milestone-state"
  | "milestones-not-all-approved"
  | "unknown-escrow-type"

export type ActionDecision =
  { allowed: true } | { allowed: false; reason: DenialReason; requiredRoles?: EscrowRole[] }

/**
 * Placeholders the two agreement mappings use for "not known": the Nest mapping
 * leaves the field undefined, the on-chain mapping fills "-". Treating "-" as an
 * address made role checks compare against it and reject the real party.
 */
const UNRESOLVED_MARKERS = new Set(["", "-", "unknown", "n/a"])

export function normalizeRoleAddress(value?: string | null): string | undefined {
  const trimmed = (value ?? "").trim()
  if (!trimmed || UNRESOLVED_MARKERS.has(trimmed.toLowerCase())) return undefined
  return trimmed
}

export function normalizeRoles(roles?: Partial<EscrowRolesInfo> | null): EscrowRolesInfo {
  return {
    approver: normalizeRoleAddress(roles?.approver),
    serviceProvider: normalizeRoleAddress(roles?.serviceProvider),
    releaseSigner: normalizeRoleAddress(roles?.releaseSigner),
    disputeResolver: normalizeRoleAddress(roles?.disputeResolver),
    receiver: normalizeRoleAddress(roles?.receiver),
  }
}

export interface ActionContext {
  roles?: Partial<EscrowRolesInfo> | null
  walletAddress?: string | null
  state?: EscrowLifecycleState
  /** State of the milestone the action targets. */
  milestoneState?: MilestoneState
  /** Decides whether releasing is per-milestone or all-or-nothing. */
  escrowType?: EscrowKind
  /** Every milestone's state, needed to judge a single-release release. */
  milestoneStates?: MilestoneState[]
}

/**
 * Releasing is the one operation whose rule depends on the escrow type, so it
 * gets its own check rather than another entry in the state tables.
 */
function checkReleaseScope(context: ActionContext): ActionDecision | null {
  const all = context.milestoneStates
  // One milestone makes both rules identical, so the type does not matter.
  if (!all || all.length <= 1) return null

  if (!context.escrowType) {
    // Guessing picks a bug either way: assume multi-release and we offer a
    // release the chain rejects, assume single and we hide a valid one.
    return { allowed: false, reason: "unknown-escrow-type" }
  }
  if (context.escrowType === "multi-release") return null

  return all.every((state) => state === "approved" || state === "released")
    ? null
    : { allowed: false, reason: "milestones-not-all-approved" }
}

/**
 * Role check on its own.
 *
 * Signing knows the roles but not always the lifecycle state, so the two
 * dimensions are separable. Rendering should prefer `canPerform`, which applies
 * both.
 */
export function checkRole(
  operation: EscrowOperation,
  roles: Partial<EscrowRolesInfo> | null | undefined,
  walletAddress: string | null | undefined,
): ActionDecision {
  const wallet = normalizeRoleAddress(walletAddress)
  if (!wallet) return { allowed: false, reason: "no-session" }

  const required = ALLOWED_ROLES[operation]
  if (required.length === 0) return { allowed: true }

  const normalized = normalizeRoles(roles)
  const resolved = required.filter((role) => normalized[role])
  // Refuse rather than assume. The old behaviour was to skip validation when a
  // role was unknown, and the caller then sent its own wallet as that role — a
  // claim it had no basis for, which the backend threw on.
  if (resolved.length === 0) {
    return { allowed: false, reason: "unresolved-roles", requiredRoles: required }
  }

  if (!resolved.some((role) => normalized[role] === wallet)) {
    return { allowed: false, reason: "wrong-role", requiredRoles: resolved }
  }
  return { allowed: true }
}

export function canPerform(operation: EscrowOperation, context: ActionContext): ActionDecision {
  const wallet = normalizeRoleAddress(context.walletAddress)
  if (!wallet) return { allowed: false, reason: "no-session" }

  const state = context.state ?? "unknown"
  if (!ALLOWED_STATES[operation].includes(state)) {
    return { allowed: false, reason: "wrong-state" }
  }

  const milestoneStates = ALLOWED_MILESTONE_STATES[operation]
  if (
    milestoneStates &&
    context.milestoneState &&
    !milestoneStates.includes(context.milestoneState)
  ) {
    return { allowed: false, reason: "wrong-milestone-state" }
  }

  if (operation === "releaseFunds") {
    const scope = checkReleaseScope(context)
    if (scope) return scope
  }

  return checkRole(operation, context.roles, context.walletAddress)
}

/** Every operation this wallet may perform right now, for driving a UI. */
export function availableOperations(context: ActionContext): EscrowOperation[] {
  return (Object.keys(ALLOWED_ROLES) as EscrowOperation[]).filter(
    (operation) => operation !== "create" && canPerform(operation, context).allowed,
  )
}

/** Human-readable role list for a denial, e.g. "approver or service provider". */
export function describeRequiredRoles(roles: EscrowRole[] | undefined): string {
  if (!roles || roles.length === 0) return ""
  return roles.map((role) => ROLE_LABELS[role]).join(" or ")
}
