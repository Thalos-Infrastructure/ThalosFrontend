/**
 * Who may submit milestone evidence.
 *
 * Thin adapter over `lib/permissions/escrowActions`, kept because the dashboard
 * and its i18n keys speak this vocabulary. The rule itself is not duplicated
 * here: the permissions module is the single table, so what the UI renders and
 * what signing accepts cannot drift.
 */

import { checkRole, normalizeRoleAddress } from "@/lib/permissions/escrowActions"

/** The service provider address, or null when it is not actually known. */
export function resolveServiceProvider(value?: string | null): string | null {
  return normalizeRoleAddress(value) ?? null
}

export type EvidencePermission =
  | { allowed: true; serviceProvider: string }
  | { allowed: false; reason: "no-session" }
  | { allowed: false; reason: "unresolved-service-provider" }
  | { allowed: false; reason: "not-service-provider"; serviceProvider: string }

export function canSubmitEvidence(params: {
  serviceProvider?: string | null
  walletAddress?: string | null
}): EvidencePermission {
  const decision = checkRole(
    "changeMilestoneStatus",
    { serviceProvider: params.serviceProvider ?? undefined },
    params.walletAddress,
  )

  if (decision.allowed) {
    // checkRole only passes here once the role resolved and matched.
    return { allowed: true, serviceProvider: resolveServiceProvider(params.serviceProvider)! }
  }

  switch (decision.reason) {
    case "no-session":
      return { allowed: false, reason: "no-session" }
    case "unresolved-roles":
      return { allowed: false, reason: "unresolved-service-provider" }
    default:
      return {
        allowed: false,
        reason: "not-service-provider",
        serviceProvider: resolveServiceProvider(params.serviceProvider)!,
      }
  }
}
