/**
 * Who may submit milestone evidence.
 *
 * Trustless Work accepts `changeMilestoneStatus` only from the escrow's service
 * provider, and the backend rejects anyone else. The UI has to know that before
 * rendering the button, not after the user has typed evidence and signed.
 *
 * The two agreement sources spell "unknown" differently: the Nest mapping
 * leaves `serviceProvider` undefined, the on-chain mapping uses a "-" filler.
 * Both mean the same thing here — the role is unresolved, so nothing can be
 * asserted about it.
 */

const UNRESOLVED_MARKERS = new Set(["", "-", "unknown"])

/** The service provider address, or null when it is not actually known. */
export function resolveServiceProvider(value?: string | null): string | null {
  const trimmed = (value ?? "").trim()
  if (!trimmed || UNRESOLVED_MARKERS.has(trimmed.toLowerCase())) return null
  return trimmed
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
  const wallet = (params.walletAddress ?? "").trim()
  if (!wallet) return { allowed: false, reason: "no-session" }

  const serviceProvider = resolveServiceProvider(params.serviceProvider)
  // Deliberately a refusal rather than a fallback. Substituting the viewer's own
  // wallet here is what made the app claim a role it had no basis for, which the
  // backend then rejected.
  if (!serviceProvider) return { allowed: false, reason: "unresolved-service-provider" }

  if (serviceProvider !== wallet) {
    return { allowed: false, reason: "not-service-provider", serviceProvider }
  }
  return { allowed: true, serviceProvider }
}
