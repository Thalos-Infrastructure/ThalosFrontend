"use client"

import { useEffect, useState, type ReactNode } from "react"
import { Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  getDisputesByAgreement,
  getDisputeDetail,
  openDispute,
  proposeSettlement,
  acceptProposal,
  rejectProposal,
  type Dispute,
  type DisputeProposal,
} from "@/lib/api/disputes"

interface ChatDisputePanelProps {
  agreementId: string
  currentUserWallet: string
  token?: string | null
  /** Trustless Work already shows this escrow as disputed. */
  escrowDisputed?: boolean
  /** Opens the existing Trustless Work dispute flow on the agreement (simple). */
  onOpenSimpleDispute?: () => void
  /** Reload the chat after a proposal so the timeline event is visible. */
  onChanged?: () => void
  /** Title/counterparty, rendered on the same row as the Dispute button. */
  children?: ReactNode
}

/**
 * Dispute entry on the chat: simple (two parties) vs escalated (later).
 * Rendered inline under the header — a popover was clipped by overflow:hidden
 * on the floating panel, so the menu looked like it did nothing.
 */
export function ChatDisputePanel({
  agreementId,
  currentUserWallet,
  token,
  escrowDisputed = false,
  onOpenSimpleDispute,
  onChanged,
  children,
}: ChatDisputePanelProps) {
  const [open, setOpen] = useState(escrowDisputed)
  const [dispute, setDispute] = useState<Dispute | null>(null)
  const [proposal, setProposal] = useState<DisputeProposal | null>(null)
  const [payer, setPayer] = useState(50)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    if (!token) return
    const list = await getDisputesByAgreement(agreementId, token)
    if (!list.success) {
      setError(list.error ?? "Could not load the dispute")
      return
    }
    let active =
      (list.data || []).find((d) => d.status === "open" || d.status === "under_review") ?? null

    // On-chain disputed, no Nest row (the old insert died on evidence_urls).
    if (!active && escrowDisputed) {
      const created = await openDispute(
        {
          agreement_id: agreementId,
          opened_by: currentUserWallet,
          reason: "Escrow is in dispute",
        },
        token,
      )
      if (created.success && created.data) {
        active = created.data
        onChanged?.()
      } else if (created.error) {
        setError(created.error)
      }
    }

    setDispute(active)
    if (!active) {
      setProposal(null)
      return
    }
    const detail = await getDisputeDetail(active.id, token)
    if (detail.success) {
      setProposal(detail.data?.proposal ?? null)
    }
  }

  useEffect(() => {
    void refresh()
  }, [agreementId, token, escrowDisputed])

  useEffect(() => {
    if (escrowDisputed) setOpen(true)
  }, [escrowDisputed])

  const payee = 100 - payer
  const mine = (wallet: string) => wallet.toLowerCase() === currentUserWallet.toLowerCase()
  const pending = proposal?.status === "pending" ? proposal : null
  const iProposed = pending ? mine(pending.proposed_by) : false

  async function handlePropose() {
    if (!token || !dispute) return
    setBusy(true)
    setError(null)
    const res = await proposeSettlement(
      dispute.id,
      {
        proposed_by: currentUserWallet,
        payer_percentage: payer,
        payee_percentage: payee,
      },
      token,
    )
    setBusy(false)
    if (!res.success) {
      setError(res.error ?? "Could not record the proposal")
      return
    }
    setProposal(res.data ?? null)
    onChanged?.()
  }

  async function handleRespond(accept: boolean) {
    if (!token || !dispute || !pending) return
    setBusy(true)
    setError(null)
    const fn = accept ? acceptProposal : rejectProposal
    const res = await fn(dispute.id, pending.id, currentUserWallet, token)
    setBusy(false)
    if (!res.success) {
      setError(res.error ?? "Could not respond")
      return
    }
    setProposal(res.data ?? null)
    onChanged?.()
  }

  return (
    <div className="shrink-0 border-b border-white/10">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="min-w-0 flex-1">{children}</div>
        <button
          type="button"
          onClick={() => {
            setOpen((v) => !v)
            void refresh()
          }}
          className={cn(
            "flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-white/50 hover:bg-white/10 hover:text-white",
            (open || dispute || escrowDisputed) && "bg-white/10 text-[#f0b400]",
          )}
          title="Disputes"
          aria-label="Disputes"
        >
          <Scale className="h-4 w-4" />
          Dispute
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#0a0d14] px-3 py-3">
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-white/40">
            Dispute
          </p>

          <button
            type="button"
            disabled={Boolean(dispute) || escrowDisputed || busy}
            onClick={() => onOpenSimpleDispute?.()}
            className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left hover:bg-white/10 disabled:opacity-50"
          >
            <p className="text-sm font-medium text-white">Simple dispute</p>
            <p className="mt-0.5 text-[11px] leading-snug text-white/45">
              Resolution between the two parties. Trustless Work holds the funds until both accept a
              split and the resolver signs.
            </p>
            {(dispute || escrowDisputed) && (
              <p className="mt-1 text-[11px] text-[#f0b400]">Already open on this agreement.</p>
            )}
            {!dispute && !escrowDisputed && !onOpenSimpleDispute && (
              <p className="mt-1 text-[11px] text-white/35">
                Use Dispute on the milestone in the agreement, then come back here to propose a
                split.
              </p>
            )}
          </button>

          <div className="w-full rounded-lg border border-white/10 px-3 py-2 opacity-60">
            <p className="text-sm font-medium text-white">Escalated dispute</p>
            <p className="mt-0.5 text-[11px] leading-snug text-white/45">
              Other actors join (three arbitrators, quorum of two). Soroban registry — not available
              yet.
            </p>
          </div>

          {(dispute || escrowDisputed) && (
            <div className="mt-3 border-t border-white/10 pt-3">
              {!dispute ? (
                <p className="text-[11px] text-white/45">
                  Recording this dispute in Thalos so you can propose a split…
                </p>
              ) : (
                <>
                  <p className="mb-2 text-[11px] text-white/50">
                    Propose a split (must sum to 100%)
                  </p>
                  <div className="mb-2 flex items-center gap-2 text-xs text-white/70">
                    <label className="flex items-center gap-1">
                      Payer
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={payer}
                        onChange={(e) =>
                          setPayer(Math.min(100, Math.max(0, Number(e.target.value))))
                        }
                        className="w-14 rounded bg-white/5 px-1 py-0.5 text-white"
                      />
                      %
                    </label>
                    <span>Payee {payee}%</span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    disabled={busy || payer + payee !== 100}
                    onClick={() => void handlePropose()}
                    className="h-8 w-full bg-[#f0b400] text-[#0c1220] hover:bg-[#e5ab00]"
                  >
                    Propose split
                  </Button>
                </>
              )}

              {proposal && (
                <div className="mt-2 rounded-lg bg-white/5 px-2 py-2 text-[11px] text-white/70">
                  <p>
                    Offer: payer {proposal.payer_percentage}% · payee {proposal.payee_percentage}%
                    {proposal.status !== "pending" ? ` · ${proposal.status}` : ""}
                  </p>
                  {proposal.status === "pending" && iProposed && (
                    <p className="mt-1 text-white/40">Waiting for the other party.</p>
                  )}
                  {proposal.status === "pending" && !iProposed && (
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => void handleRespond(true)}
                        className="h-7 flex-1 bg-[#f0b400] text-[#0c1220]"
                      >
                        Accept
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => void handleRespond(false)}
                        className="h-7 flex-1 border-white/20 text-white"
                      >
                        Reject
                      </Button>
                    </div>
                  )}
                  {proposal.status === "accepted" && (
                    <p className="mt-1 text-[#f0b400]">
                      Accepted. The dispute resolver still has to sign resolve_dispute on-chain.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
        </div>
      )}
    </div>
  )
}
