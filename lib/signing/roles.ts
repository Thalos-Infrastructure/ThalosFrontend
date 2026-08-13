/**
 * Trustless Work role validation for escrow lifecycle operations.
 *
 * Each build endpoint expects the signer to hold a specific escrow role; TW
 * rejects the submission otherwise, but only after the user has already been
 * asked to sign. Validating here fails cleanly *before* the wallet popup.
 */

import type { EscrowOperation, EscrowRolesInfo } from "./types"
import { RoleValidationError } from "./types"

/** Roles allowed to sign each operation. Empty array = any wallet may sign. */
const ALLOWED_ROLES: Record<EscrowOperation, (keyof EscrowRolesInfo)[]> = {
  create: [],
  fund: [],
  approveMilestone: ["approver"],
  releaseFunds: ["releaseSigner"],
  // TW allows either party (not the resolver) to raise a dispute.
  dispute: ["approver", "serviceProvider"],
  resolve: ["disputeResolver"],
  changeMilestoneStatus: ["serviceProvider"],
}

const ROLE_LABELS: Record<keyof EscrowRolesInfo, string> = {
  approver: "approver",
  serviceProvider: "service provider",
  releaseSigner: "release signer",
  disputeResolver: "dispute resolver",
  receiver: "receiver",
}

/**
 * Throw a RoleValidationError when the wallet doesn't hold any role the
 * operation requires. Roles the caller doesn't know (undefined) are skipped:
 * validation only runs against known role addresses, and TW remains the
 * final authority on submit.
 */
export function assertOperationRole(
  operation: EscrowOperation,
  roles: EscrowRolesInfo | undefined,
  walletAddress: string,
): void {
  const allowed = ALLOWED_ROLES[operation]
  if (allowed.length === 0 || !roles) return

  const known = allowed.filter((role) => roles[role])
  if (known.length === 0) return

  if (!known.some((role) => roles[role] === walletAddress)) {
    const labels = known.map((role) => ROLE_LABELS[role]).join(" or ")
    throw new RoleValidationError(
      `Your connected wallet is not the ${labels} of this escrow, so it can't sign this operation.`,
    )
  }
}
