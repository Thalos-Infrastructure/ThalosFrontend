"use client"

/**
 * What the approver can see and do with each milestone.
 *
 * Extracted so the two dashboards cannot disagree about it. They did: the
 * business dashboard offered approve, dispute and release, while the personal
 * one rendered the approver a read-only list — description and status, no
 * evidence, no buttons. An approver who funded from the personal dashboard had
 * no way to finish the agreement, and the banner above kept telling them the
 * next step was to approve.
 */

import React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import { useHasSigningWallet } from "@/lib/use-current-address"
import { useAuthStore } from "@/lib/auth-store"
import { signEscrowOperation, type EscrowOperation, type TxStatus } from "@/lib/signing"
import type { AgreementResponse } from "@/services/escrow.types"
import type { MilestoneStatus } from "@/lib/types/status"
import { AlertTriangle } from "lucide-react"
import { reportMilestoneToNest } from "@/lib/agreements/reportMilestoneToNest"

export type ApproverMilestone = {
  description: string
  amount: string
  status: MilestoneStatus
  approved?: boolean
  /** Work submitted and waiting on this approver. See `AgreementViewMilestone`. */
  delivered?: boolean
  evidence?: string
}

export type ApproverAgreement = {
  /** Contract id: what every escrow operation is addressed to. */
  id: string
  type: "Single Release" | "Multi Release"
  amount: string
  milestones: ApproverMilestone[]
  released?: boolean
  serviceProvider?: string
  approver?: string
  releaseSigner?: string
  disputeResolver?: string
  /** Supabase agreement id, when the agreement was persisted in Thalos. */
  agreement_id?: string
}

interface Props {
  agr: ApproverAgreement
  walletAddress: string
  /** Funded escrows only: nothing below can happen before the funds are there. */
  isFunded: boolean
  allReleased?: boolean
  onEscrowChanged?: () => void | Promise<void>
}

const TX_LABELS: Record<TxStatus, string> = {
  building: "Preparing…",
  signing: "Waiting for your signature…",
  submitting: "Sending to the network…",
  confirmed: "Confirmed",
  error: "Failed",
}

export function ApproverMilestoneSection({
  agr,
  walletAddress,
  isFunded,
  allReleased,
  onEscrowChanged,
}: Props) {
  const { t } = useLanguage()
  const { token } = useAuthStore()
  const isExternalWallet = useHasSigningWallet()

  const [loadingMs, setLoadingMs] = React.useState<number | null>(null)
  const [errorMs, setErrorMs] = React.useState<string | null>(null)
  const [disputingMs, setDisputingMs] = React.useState<number | null>(null)
  const [disputedMs, setDisputedMs] = React.useState<Set<number>>(new Set())
  const [showDisputeConfirm, setShowDisputeConfirm] = React.useState<number | null>(null)
  const [txStatus, setTxStatus] = React.useState<TxStatus | null>(null)

  const milestones = agr.milestones
  const allApproved = milestones.length > 0 && milestones.every((m) => m.approved === true)
  const escrowType = agr.type === "Multi Release" ? "multi-release" : "single-release"

  const escrowRoles = {
    approver: agr.approver,
    serviceProvider: agr.serviceProvider,
    releaseSigner: agr.releaseSigner,
    disputeResolver: agr.disputeResolver,
  }

  /**
   * Sign and submit one escrow operation.
   *
   * @returns true only when an XDR was actually signed AND submitted — callers
   * with side effects of their own must gate on it.
   */
  async function signAndSubmit(
    operation: EscrowOperation,
    res: AgreementResponse<unknown>,
    errorMessage: string,
  ): Promise<boolean> {
    if (!res.success) throw new Error(res.error || errorMessage)
    const xdr =
      res.data && typeof res.data === "object" && "unsignedTransaction" in res.data
        ? (res.data as { unsignedTransaction?: string }).unsignedTransaction
        : undefined
    if (!xdr) return false

    const signedResult = await signEscrowOperation({
      xdr,
      operation,
      address: walletAddress,
      roles: escrowRoles,
      onStatus: setTxStatus,
    })
    setTxStatus("submitting")
    if (!token) throw new Error("Sign in to submit this transaction")
    const { submitSignedTransaction } = await import("@/lib/api/escrow")
    const sendRes = await submitSignedTransaction(signedResult.signedTxXdr, token)
    if (!sendRes.success) throw new Error(sendRes.error || "Error sending transaction")
    setTxStatus("confirmed")
    return true
  }

  async function handleApprove(idx: number) {
    setLoadingMs(idx)
    setErrorMs(null)
    setTxStatus("building")
    try {
      const { approveMilestone } = await import("@/services/escrowService")
      const res = await approveMilestone(
        agr.id,
        idx.toString(),
        walletAddress,
        escrowType,
        token ?? undefined,
      )
      const submitted = await signAndSubmit("approveMilestone", res, "Error approving milestone")
      // Only now: the record follows the chain, and this is what makes Thalos
      // emit the event the email notifications hang off.
      if (submitted) {
        await reportMilestoneToNest({
          step: "approved",
          agreementId: agr.agreement_id,
          contractId: agr.id,
          milestoneIndex: idx,
          actorWallet: walletAddress,
          token,
        })
      }
      await onEscrowChanged?.()
    } catch (e) {
      setTxStatus("error")
      setErrorMs(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoadingMs(null)
    }
  }

  async function handleDispute(idx: number) {
    setDisputingMs(idx)
    setErrorMs(null)
    setTxStatus("building")
    try {
      const { disputeMilestone } = await import("@/services/escrowService")
      const { openDispute } = await import("@/lib/actions/disputes")

      const res = await disputeMilestone(
        agr.id,
        idx.toString(),
        walletAddress,
        token ?? undefined,
        escrowType,
      )
      const submitted = await signAndSubmit("dispute", res, "Error raising dispute")

      // Register the dispute in Supabase only after the on-chain one went
      // through: a build response without an XDR must not create a DB-only
      // dispute.
      if (submitted && agr.agreement_id) {
        await openDispute({
          agreement_id: agr.agreement_id,
          opened_by: walletAddress,
          reason: `Dispute raised on milestone ${idx + 1}`,
          evidence_urls: [],
        })
      }
      setDisputedMs((prev) => new Set(prev).add(idx))
      await onEscrowChanged?.()
      setShowDisputeConfirm(null)
    } catch (e) {
      setTxStatus("error")
      setErrorMs(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setDisputingMs(null)
    }
  }

  async function handleReleaseAll() {
    setLoadingMs(-1)
    setErrorMs(null)
    setTxStatus("building")
    try {
      const { releaseFunds } = await import("@/services/escrowService")
      const res = await releaseFunds(
        agr.id,
        walletAddress,
        escrowType,
        undefined,
        token ?? undefined,
      )
      const submitted = await signAndSubmit("releaseFunds", res, "Error releasing funds")
      if (submitted) {
        // Single-release pays every milestone at once, so each one is recorded.
        await Promise.all(
          milestones.map((_, index) =>
            reportMilestoneToNest({
              step: "released",
              agreementId: agr.agreement_id,
              contractId: agr.id,
              milestoneIndex: index,
              actorWallet: walletAddress,
              token,
            }),
          ),
        )
      }
      await onEscrowChanged?.()
    } catch (e) {
      setTxStatus("error")
      setErrorMs(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoadingMs(null)
    }
  }

  /** The label the approver reads. "Pending" for delivered work is a lie. */
  function statusLabel(ms: ApproverMilestone): string {
    if (ms.status === "released") return t("flow.released")
    if (ms.approved || ms.status === "approved") return t("status.approved")
    if (ms.delivered) return t("flow.evidenceSubmitted")
    return isFunded ? t("flow.awaitingEvidence") : t("flow.pendingFundingDesc")
  }

  return (
    <div className="flex flex-col gap-3">
      {milestones.map((ms, idx) => {
        const isReleased = ms.status === "released"
        const isApproved = ms.approved === true || ms.status === "approved"
        const isDisputed = disputedMs.has(idx)
        // Approving is what moves a funded escrow forward, so it is offered
        // until the milestone is approved or released. It used to be gated on
        // `status === "pending" || "released"` — the second of which cannot be
        // approved at all.
        const canApprove = isFunded && !allReleased && !isReleased && !isApproved && !isDisputed

        return (
          <div
            key={idx}
            className={cn(
              "rounded-2xl border p-5 backdrop-blur-md transition-all",
              isReleased
                ? "border-emerald-500/20 bg-emerald-500/5"
                : isApproved
                  ? "border-[#f0b400]/20 bg-[#f0b400]/5"
                  : ms.delivered
                    ? "border-cyan-500/20 bg-cyan-500/5"
                    : "border-white/[0.06] bg-[#0a0a0c]/70",
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    isReleased
                      ? "bg-emerald-500/20 text-emerald-400"
                      : isApproved
                        ? "bg-[#f0b400]/20 text-[#f0b400]"
                        : ms.delivered
                          ? "bg-cyan-500/20 text-cyan-400"
                          : "bg-white/10 text-white/40",
                  )}
                >
                  {idx + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{ms.description}</p>
                  <p
                    className={cn(
                      "text-xs font-medium mt-0.5",
                      isReleased
                        ? "text-emerald-400"
                        : isApproved
                          ? "text-[#f0b400]"
                          : ms.delivered
                            ? "text-cyan-400"
                            : "text-white/30",
                    )}
                  >
                    {statusLabel(ms)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <p className="text-lg font-bold text-white">
                  {"$"}
                  {milestones.length === 1 && idx === 0 ? agr.amount : ms.amount}{" "}
                  <span className="text-xs font-normal text-white/35">USDC</span>
                </p>

                {isFunded && !isReleased && !isDisputed && isExternalWallet && (
                  <Button
                    size="sm"
                    onClick={() => setShowDisputeConfirm(idx)}
                    disabled={disputingMs === idx}
                    className="rounded-full bg-red-500/10 text-xs font-semibold text-red-400 hover:bg-red-500/20 border border-red-500/20"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {disputingMs === idx ? "..." : t("dispute.raiseDispute")}
                  </Button>
                )}

                {isDisputed && (
                  <span className="rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400 border border-red-500/20 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {t("dispute.inDispute")}
                  </span>
                )}

                {canApprove && isExternalWallet && (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(idx)}
                    disabled={loadingMs === idx}
                    className="rounded-full bg-[#f0b400]/15 text-xs font-semibold text-[#f0b400] hover:bg-[#f0b400]/25 border border-[#f0b400]/20"
                  >
                    {loadingMs === idx ? t("flow.approving") : t("flow.approveMs")}
                  </Button>
                )}

                {isReleased && (
                  <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                    {t("flow.released")}
                  </span>
                )}
              </div>
            </div>

            {/* The work being approved. Approving without seeing it is signing
                blind, which is what this screen used to ask for. */}
            {ms.evidence?.trim() ? (
              <div className="mt-3 rounded-lg border border-cyan-500/10 bg-cyan-500/5 px-3 py-2">
                <p className="text-xs font-medium text-cyan-400/60">{t("flow.viewEvidence")}:</p>
                <p className="mt-0.5 break-all text-xs text-white/60">{ms.evidence}</p>
              </div>
            ) : ms.delivered ? (
              <p className="mt-3 text-xs text-white/35">{t("flow.evidenceSubmitted")}</p>
            ) : null}
          </div>
        )
      })}

      {txStatus && txStatus !== "error" && (
        <p className="text-xs text-white/45">{TX_LABELS[txStatus]}</p>
      )}
      {errorMs && <div className="mt-2 text-xs text-red-400">{errorMs}</div>}

      {/* Dispute confirmation */}
      {showDisputeConfirm !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowDisputeConfirm(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#0c0c0e] p-6 shadow-[0_16px_48px_rgba(0,0,0,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{t("dispute.raiseDispute")}</h3>
                <p className="text-xs text-white/40">{t("dispute.disputeDesc")}</p>
              </div>
            </div>
            <div className="mb-4 rounded-xl border border-red-500/10 bg-red-500/5 p-4">
              <p className="text-sm text-white/70">{t("dispute.confirmDispute")}</p>
              <p className="mt-2 text-xs text-white/40">{t("dispute.disputeWarning")}</p>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDisputeConfirm(null)}
                className="rounded-full border-white/10 text-white/60 hover:bg-white/5"
              >
                {t("dispute.cancel")}
              </Button>
              <Button
                onClick={() => handleDispute(showDisputeConfirm)}
                disabled={disputingMs === showDisputeConfirm}
                className="rounded-full bg-red-500 text-white hover:bg-red-600 shadow-[0_4px_16px_rgba(239,68,68,0.25)]"
              >
                {disputingMs === showDisputeConfirm ? "..." : t("dispute.confirm")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Release */}
      {allApproved && !agr.released && !allReleased && isExternalWallet && (
        <div className="mt-1 flex flex-col gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-400">{t("flow.releaseAll")}</p>
            <p className="mt-0.5 text-xs text-white/35">
              All milestones are approved. Release funds to the seller.
            </p>
          </div>
          <Button
            onClick={() => handleReleaseAll()}
            disabled={loadingMs === -1}
            className="rounded-full bg-emerald-500 px-6 text-sm font-semibold text-white hover:bg-emerald-600 shadow-[0_4px_16px_rgba(16,185,129,0.25)]"
          >
            {loadingMs === -1 ? t("flow.releasing") : t("flow.releaseAll")}
          </Button>
        </div>
      )}
    </div>
  )
}
