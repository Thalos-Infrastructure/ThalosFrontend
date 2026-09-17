/**
 * Trustless Work role validation for escrow lifecycle operations.
 *
 * Each build endpoint expects the signer to hold a specific escrow role; TW
 * rejects the submission otherwise, but only after the user has already been
 * asked to sign. Validating here fails cleanly *before* the wallet popup.
 *
 * The rule itself lives in `lib/permissions/escrowActions` so that what the
 * dashboard renders and what signing accepts cannot drift apart — they were
 * separate decisions, which is how the approver ended up being offered a button
 * the backend rejects.
 */

import { checkRole, describeRequiredRoles } from "@/lib/permissions/escrowActions"
import type { EscrowOperation, EscrowRolesInfo } from "./types"
import { RoleValidationError } from "./types"

export { ALLOWED_ROLES, ROLE_LABELS } from "@/lib/permissions/escrowActions"

/**
 * Throw a RoleValidationError when the wallet may not sign this operation.
 *
 * An unresolved role is a refusal, not a pass. It used to be skipped, and the
 * caller then submitted its own wallet as that role — a claim it had no basis
 * for, which the backend threw on.
 */
export function assertOperationRole(
  operation: EscrowOperation,
  roles: EscrowRolesInfo | undefined,
  walletAddress: string,
): void {
  const decision = checkRole(operation, roles, walletAddress)
  if (decision.allowed) return

  if (decision.reason === "no-session") {
    throw new RoleValidationError("Connect a wallet before signing this operation.")
  }

  const labels = describeRequiredRoles(decision.requiredRoles)

  if (decision.reason === "unresolved-roles") {
    throw new RoleValidationError(
      `This escrow's ${labels || "roles"} could not be resolved, so this operation cannot be signed yet.`,
    )
  }

  throw new RoleValidationError(
    `Your connected wallet is not the ${labels} of this escrow, so it can't sign this operation.`,
  )
}
