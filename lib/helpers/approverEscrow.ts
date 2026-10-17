/**
 * Which detail view an agreement should open in.
 *
 * The dashboard lists two sources side by side: agreements from Nest, and
 * escrows read on-chain by role. Only the second carries the escrow roles and
 * balance, which is what the approver actions (funding above all) need.
 *
 * When the viewer holds the approver role, that view wins. The Nest branch
 * renders the service provider's evidence form, and an approver submitting
 * evidence is rejected by the backend.
 */
export function findApproverEscrow<T extends { id: string; approver?: string }>(
  escrows: T[],
  viewingAgreementId: string | null,
  walletAddress: string | null,
): T | null {
  if (!viewingAgreementId || !walletAddress) return null
  return (
    escrows.find(
      (escrow) => escrow.id === viewingAgreementId && escrow.approver === walletAddress,
    ) ?? null
  )
}
