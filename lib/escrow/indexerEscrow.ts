/**
 * The Trustless Work boundary: one place that reads a raw escrow from the
 * indexer and says what it found.
 *
 * Every escrow bug this app has hit was a field read from the wrong place and
 * silently coming back `undefined` — roles read off the escrow root instead of
 * `roles`, a `balance` that is optional on this response, a service provider
 * papered over with a "-" filler. `undefined` then travelled all the way to the
 * UI as "not funded" or "not your escrow", with nothing to point at.
 *
 * So parsing here is explicit: whatever the payload is missing or has in an
 * unexpected shape comes back as an `issue`, instead of a quietly absent field.
 *
 * Shape: `GetEscrowsFromIndexerResponse` in
 * `.claude/skills/trustless-work-dev/skills/api/types.md`.
 */

import type { EscrowRolesInfo } from "@/lib/signing/types"
import type { EscrowKind } from "@/lib/permissions/escrowActions"

export interface NormalizedMilestone {
  description: string
  /** String because the dashboards render it; absent upstream for single-release. */
  amount?: string
  status: string
  approved: boolean
  released: boolean
  evidence?: string
}

export interface NormalizedEscrow {
  contractId: string
  title: string
  description?: string
  /** Agreed total, as a string for rendering. */
  amount: string
  /** Optional upstream — absence is not evidence of an unfunded escrow. */
  balance?: string
  /** Set once anyone funds it; the only funding evidence when balance is absent. */
  fundedBy?: string
  escrowType: EscrowKind
  roles: EscrowRolesInfo
  milestones: NormalizedMilestone[]
  flags: { disputed: boolean; released: boolean; resolved: boolean }
  createdAt?: string
}

export type EscrowShapeIssue =
  | { kind: "missing"; field: string }
  | { kind: "wrong-type"; field: string; expected: string; got: string }

interface ParseResult {
  escrow: NormalizedEscrow | null
  issues: EscrowShapeIssue[]
}

function typeOf(value: unknown): string {
  if (value === null) return "null"
  if (Array.isArray(value)) return "array"
  return typeof value
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** A role address, or undefined — never the "-" filler the dashboards used. */
function roleAt(
  roles: Record<string, unknown> | undefined,
  key: string,
  issues: EscrowShapeIssue[],
): string | undefined {
  const value = roles?.[key]
  if (value === undefined || value === null) return undefined
  if (typeof value !== "string") {
    issues.push({
      kind: "wrong-type",
      field: `roles.${key}`,
      expected: "string",
      got: typeOf(value),
    })
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function numericString(
  value: unknown,
  field: string,
  issues: EscrowShapeIssue[],
): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : undefined
  if (typeof value === "string") return value.trim() || undefined
  issues.push({ kind: "wrong-type", field, expected: "number | string", got: typeOf(value) })
  return undefined
}

/**
 * Trustless Work sends a Firestore timestamp — `{ _seconds }` — not the ISO
 * string its own type declares. Reading it as a string silently yields nothing,
 * and every agreement then renders with today's date.
 */
function parseCreatedAt(value: unknown, issues: EscrowShapeIssue[]): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === "string") return value
  if (isRecord(value) && typeof value._seconds === "number") {
    return new Date(value._seconds * 1000).toISOString()
  }
  issues.push({
    kind: "wrong-type",
    field: "createdAt",
    expected: "string | { _seconds: number }",
    got: typeOf(value),
  })
  return undefined
}

function parseMilestones(raw: unknown, issues: EscrowShapeIssue[]): NormalizedMilestone[] {
  if (raw === undefined) {
    issues.push({ kind: "missing", field: "milestones" })
    return []
  }
  if (!Array.isArray(raw)) {
    issues.push({ kind: "wrong-type", field: "milestones", expected: "array", got: typeOf(raw) })
    return []
  }

  return raw.map((entry, index) => {
    const milestone = isRecord(entry) ? entry : {}
    if (!isRecord(entry)) {
      issues.push({
        kind: "wrong-type",
        field: `milestones[${index}]`,
        expected: "object",
        got: typeOf(entry),
      })
    }
    const flags = isRecord(milestone.flags) ? milestone.flags : undefined
    const status = typeof milestone.status === "string" ? milestone.status : "pending"

    return {
      description: typeof milestone.description === "string" ? milestone.description : "",
      amount: numericString(milestone.amount, `milestones[${index}].amount`, issues),
      // Trustless Work reports the same thing two ways depending on the call:
      // a per-milestone flag object, or a plain boolean.
      status,
      approved: flags?.approved === true || milestone.approved === true || status === "approved",
      released: flags?.released === true || milestone.released === true || status === "released",
      evidence: typeof milestone.evidence === "string" ? milestone.evidence : undefined,
    }
  })
}

/**
 * Read one escrow from an indexer response.
 *
 * Returns `escrow: null` only when there is nothing identifiable to work with;
 * anything else degrades field by field, with every degradation named.
 */
export function parseIndexerEscrow(raw: unknown): ParseResult {
  const issues: EscrowShapeIssue[] = []

  if (!isRecord(raw)) {
    return {
      escrow: null,
      issues: [{ kind: "wrong-type", field: "", expected: "object", got: typeOf(raw) }],
    }
  }

  const contractId = typeof raw.contractId === "string" ? raw.contractId.trim() : ""
  if (!contractId) {
    issues.push({ kind: "missing", field: "contractId" })
    return { escrow: null, issues }
  }

  if (raw.roles === undefined) issues.push({ kind: "missing", field: "roles" })
  else if (!isRecord(raw.roles)) {
    issues.push({ kind: "wrong-type", field: "roles", expected: "object", got: typeOf(raw.roles) })
  }
  const roles = isRecord(raw.roles) ? raw.roles : undefined

  const milestones = parseMilestones(raw.milestones, issues)

  // `type` is how Trustless Work names it; a milestone count is a fallback, not
  // a rule — a single-release escrow may hold several milestones.
  const declaredType = typeof raw.type === "string" ? raw.type : undefined
  const escrowType: EscrowKind =
    declaredType === "multi-release" || declaredType === "single-release"
      ? declaredType
      : (() => {
          issues.push({ kind: "missing", field: "type" })
          return milestones.length > 1 ? "multi-release" : "single-release"
        })()

  const rootAmount = numericString(raw.amount, "amount", issues)
  const summed = milestones.reduce((total, milestone) => total + Number(milestone.amount ?? 0), 0)
  const amount =
    rootAmount ?? (escrowType === "multi-release" && summed > 0 ? String(summed) : undefined)
  if (amount === undefined) issues.push({ kind: "missing", field: "amount" })

  const flags = isRecord(raw.flags) ? raw.flags : undefined

  return {
    escrow: {
      contractId,
      title: typeof raw.title === "string" ? raw.title : "",
      description: typeof raw.description === "string" ? raw.description : undefined,
      amount: amount ?? "0",
      balance: numericString(raw.balance, "balance", issues),
      fundedBy: typeof raw.fundedBy === "string" && raw.fundedBy.trim() ? raw.fundedBy : undefined,
      escrowType,
      roles: {
        approver: roleAt(roles, "approver", issues),
        serviceProvider: roleAt(roles, "serviceProvider", issues),
        releaseSigner: roleAt(roles, "releaseSigner", issues),
        disputeResolver: roleAt(roles, "disputeResolver", issues),
        receiver: roleAt(roles, "receiver", issues) ?? roleAt(roles, "serviceProvider", issues),
      },
      milestones,
      flags: {
        disputed: flags?.disputed === true,
        released: flags?.released === true,
        resolved: flags?.resolved === true,
      },
      createdAt: parseCreatedAt(raw.createdAt, issues),
    },
    issues,
  }
}

/** Parse a list, keeping what is usable and collecting every complaint. */
export function parseIndexerEscrows(raw: unknown): {
  escrows: NormalizedEscrow[]
  issues: EscrowShapeIssue[]
} {
  if (!Array.isArray(raw)) {
    return {
      escrows: [],
      issues: [{ kind: "wrong-type", field: "", expected: "array", got: typeOf(raw) }],
    }
  }
  const escrows: NormalizedEscrow[] = []
  const issues: EscrowShapeIssue[] = []
  for (const entry of raw) {
    const result = parseIndexerEscrow(entry)
    if (result.escrow) escrows.push(result.escrow)
    issues.push(...result.issues)
  }
  return { escrows, issues }
}

export function describeShapeIssue(issue: EscrowShapeIssue): string {
  const field = issue.field || "(root)"
  return issue.kind === "missing"
    ? `${field} is missing`
    : `${field} should be ${issue.expected}, got ${issue.got}`
}

/**
 * Say so, once, when the payload is not the shape we parse.
 *
 * Deliberately not silent: a shape change upstream previously surfaced as a
 * feature that merely stopped working, with nothing in the console to explain
 * it. Shape drift is not a user error, so it logs rather than throwing.
 */
export function reportEscrowShapeIssues(source: string, issues: EscrowShapeIssue[]): void {
  if (issues.length === 0) return
  globalThis.console.warn(
    `[escrow] ${source}: Trustless Work payload is not the expected shape — ` +
      issues.map(describeShapeIssue).join("; "),
  )
}
