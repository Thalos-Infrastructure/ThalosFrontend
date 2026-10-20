/**
 * Tell Thalos what just happened on the chain.
 *
 * Submitting evidence, approving a milestone and releasing funds all go
 * straight to the escrow relay, which builds the transaction and nothing else.
 * Nest never heard about any of them, so it emitted no event — and every email
 * notification hangs off those events. Of the seven the backend implements,
 * only "agreement created" could ever fire.
 *
 * `PATCH /v1/agreements/:id/milestones` is the authoritative path for this (the
 * relay's `change-milestone-status` logs a deprecation pointing at it), and it
 * is what emits EVIDENCE_SUBMITTED / MILESTONE_APPROVED / MILESTONE_RELEASED.
 *
 * Two rules hold everywhere this is used:
 *
 * 1. **Only after the chain confirms.** This records what happened; it must
 *    never claim something the chain did not do. That is the same mistake the
 *    dispute flow was built to undo.
 * 2. **Never fatal.** By the time this runs the funds have already moved.
 *    Failing the operation here would tell the user to retry something the
 *    chain would now reject, so a failure is logged and reported, not thrown.
 */

import { updateMilestoneStatus, getAgreementByContractIdApi } from "@/lib/api/agreements"

export type MilestoneStep = "evidence" | "approved" | "released"

export interface ReportMilestoneParams {
  step: MilestoneStep
  /** Nest `agreements.id` (UUID). Looked up from `contractId` when absent. */
  agreementId?: string
  /** Escrow contract id, used to find the agreement when the id is unknown. */
  contractId?: string
  milestoneIndex: number
  /** Wallet that performed the step on-chain. */
  actorWallet: string
  /** Evidence text, for the evidence step. */
  evidence?: string
  token?: string | null
}

export interface ReportMilestoneResult {
  reported: boolean
  /** Why it did not reach Nest. Worth surfacing quietly, never as a failure. */
  error?: string
}

/**
 * Nest keys agreements by its own UUID, while every escrow operation is
 * addressed by contract id. Callers hold one or the other depending on whether
 * the agreement came from Nest or from the Trustless Work indexer.
 */
async function resolveAgreementId(
  params: ReportMilestoneParams,
  token: string,
): Promise<string | undefined> {
  if (params.agreementId) return params.agreementId
  if (!params.contractId) return undefined

  const found = await getAgreementByContractIdApi(params.contractId, token).catch(() => null)
  return found?.success ? found.data?.id : undefined
}

/**
 * The status Nest should record for this step.
 *
 * Evidence keeps the milestone `pending`: Trustless Work's "completed" means
 * delivered, not released, and the canonical statuses have no value for it.
 * Sending the evidence text is what makes Nest emit EVIDENCE_SUBMITTED.
 */
function statusFor(step: MilestoneStep): "pending" | "approved" | "released" {
  if (step === "approved") return "approved"
  if (step === "released") return "released"
  return "pending"
}

export async function reportMilestoneToNest(
  params: ReportMilestoneParams,
): Promise<ReportMilestoneResult> {
  const token = params.token ?? undefined
  if (!token) {
    return { reported: false, error: "No session: the step was not recorded in Thalos." }
  }

  const agreementId = await resolveAgreementId(params, token)
  if (!agreementId) {
    // Agreements created before Thalos persisted them have no row at all. The
    // chain is still correct; there is simply nothing here to notify about.
    return {
      reported: false,
      error: "This agreement is not registered in Thalos, so no notification was sent.",
    }
  }

  const result = await updateMilestoneStatus(
    agreementId,
    params.milestoneIndex,
    statusFor(params.step),
    params.actorWallet,
    params.step === "evidence" ? (params.evidence ?? "Evidence submitted") : undefined,
    token,
  ).catch((error: unknown) => ({
    success: false as const,
    error: error instanceof Error ? error.message : "Unknown error",
  }))

  if (!result.success) {
    // Loud in the console, quiet in the UI: this chain of failures going
    // unnoticed is why nobody knew the notifications were dead.
    console.error("[agreements] on-chain step not recorded in Thalos — no notification sent", {
      step: params.step,
      agreementId,
      milestoneIndex: params.milestoneIndex,
      error: result.error,
    })
    return { reported: false, error: result.error }
  }

  return { reported: true }
}
