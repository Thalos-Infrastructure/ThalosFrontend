"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import { useStellarWallet } from "@/lib/stellar-wallet"
import { useAuthStore } from "@/lib/auth-store"
import { dashboardPathFor } from "@/lib/dashboard-path"
import { getOpenDisputes, assignResolver, type DisputeWithAgreement } from "@/lib/api/disputes"
import { getEscrowByContractId } from "@/services/escrowService"
import type { EscrowSnapshot } from "@/lib/api/escrow"
import { resolveDisputeOnChain, type TrustlineProblem } from "@/lib/disputes/resolveDispute"
import type { TxStatus } from "@/lib/signing"

/* ── Icons ── */
const Icons = {
  shield: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  alert: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  check: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  clock: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  arrowLeft: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  user: (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  scale: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 3v18M3 7l9-4 9 4M3 7v4a9 9 0 0 0 9 9 9 9 0 0 0 9-9V7" />
    </svg>
  ),
}

const statusColors: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  under_review: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  resolved: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
}

const statusLabels: Record<string, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
  cancelled: "Cancelled",
}

/** What the button says while a resolution is in flight. */
const TX_STATUS_LABELS: Record<TxStatus, string> = {
  building: "Preparing the transaction…",
  signing: "Waiting for your signature…",
  submitting: "Sending to the network…",
  confirmed: "Confirmed",
  error: "Failed",
}

export default function DisputesPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { address, profile } = useStellarWallet()
  const { token } = useAuthStore()

  const [isLoading, setIsLoading] = useState(true)
  const [disputes, setDisputes] = useState<DisputeWithAgreement[]>([])
  const [selectedDispute, setSelectedDispute] = useState<DisputeWithAgreement | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)

  // Resolution form state
  const [payerPercentage, setPayerPercentage] = useState(50)
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [resolveError, setResolveError] = useState<string | null>(null)
  const [resolveSuccess, setResolveSuccess] = useState(false)

  /**
   * The live escrow behind the selected dispute. The split is computed from
   * what the contract holds, so without it there is nothing to resolve.
   *
   * Stored with the contract it was read for, and used only when the two match:
   * otherwise picking a second dispute shows the first escrow's balance until
   * the new read lands, and the resolver reads a split of the wrong number.
   */
  const [escrowRead, setEscrowRead] = useState<{
    contractId: string
    loading: boolean
    escrow: EscrowSnapshot | null
    error: string | null
  } | null>(null)
  const [txStatus, setTxStatus] = useState<TxStatus | null>(null)
  const [trustlineProblems, setTrustlineProblems] = useState<TrustlineProblem[] | null>(null)
  const [pendingConfirmation, setPendingConfirmation] = useState(false)

  // Who may open this screen. Who may actually settle a given dispute is a
  // different question, answered on-chain — see `isEscrowResolver` below.
  const canResolve = profile?.role === "dispute_resolver" || profile?.role === "admin"

  const sameAddress = (a?: string | null, b?: string | null) =>
    Boolean(a && b && a.toUpperCase() === b.toUpperCase())

  // An agreement with no contract has nothing to settle, and that is a fact
  // about the selected dispute, not a result to fetch and store.
  const selectedContractId = selectedDispute?.agreement?.contract_id ?? null
  const currentRead = escrowRead?.contractId === selectedContractId ? escrowRead : null
  const escrow = currentRead?.escrow ?? null
  // Still loading whenever there is a contract whose read has not landed yet.
  const isLoadingEscrow = currentRead?.loading ?? Boolean(selectedContractId)
  const escrowProblem =
    selectedDispute && !selectedContractId
      ? "This agreement has no escrow on-chain, so it cannot be settled here."
      : (currentRead?.error ?? null)

  /**
   * Only the escrow's own `disputeResolver` can sign the resolution; the
   * contract refuses everyone else. The app role is what opens this page, and
   * the two can disagree — an admin used to reach the form, fill in a split and
   * fail at the wallet with nothing explaining why.
   */
  const isEscrowResolver = sameAddress(escrow?.roles.disputeResolver, address)

  // What the resolution actually distributes. The agreement's `amount` is what
  // was agreed, which is a different number on a partly funded escrow.
  const distributable = escrow?.balance ?? 0
  const payerAmount = (distributable * payerPercentage) / 100
  const payeeAmount = distributable - payerAmount

  useEffect(() => {
    if (!address) {
      router.push("/")
      return
    }

    async function loadDisputes() {
      setIsLoading(true)

      if (!token) {
        setIsLoading(false)
        return
      }

      const result = await getOpenDisputes(token)

      if (!result.success) {
        console.error("Error loading disputes:", result.error)
      } else {
        setDisputes(result.data || [])
      }

      setIsLoading(false)
    }

    loadDisputes()
  }, [address, router, token])

  // Read the escrow whenever a dispute is selected: balance, role addresses
  // and type all come from the chain, not from our database.
  useEffect(() => {
    const contractId = selectedDispute?.agreement?.contract_id
    if (!contractId) return

    let cancelled = false

    const load = async () => {
      setEscrowRead({ contractId, loading: true, escrow: null, error: null })
      const result = await getEscrowByContractId(contractId, token ?? undefined)
      if (cancelled) return

      setEscrowRead({
        contractId,
        loading: false,
        escrow: result.success ? (result.data ?? null) : null,
        error: result.success
          ? null
          : (result.error ?? "Could not read this escrow from the chain."),
      })
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [selectedDispute, token])

  const handleAssignToMe = async (dispute: DisputeWithAgreement) => {
    if (!address || !canResolve || !token) return

    setIsAssigning(true)
    const result = await assignResolver(dispute.id, address, token)

    if (!result.success) {
      console.error("Error assigning dispute:", result.error)
    } else {
      // Refresh disputes
      const refreshResult = await getOpenDisputes(token)
      if (refreshResult.success) {
        setDisputes(refreshResult.data || [])
      }
    }

    setIsAssigning(false)
  }

  const handleResolve = async () => {
    if (!selectedDispute || !address || !token || !escrow) return

    setIsResolving(true)
    setResolveError(null)
    setResolveSuccess(false)
    setTrustlineProblems(null)
    setPendingConfirmation(false)
    setTxStatus(null)

    // Settles on-chain first and records it afterwards. The button used to
    // write `resolved` to the database and show a tick while the escrow stayed
    // disputed and the funds stayed locked.
    const result = await resolveDisputeOnChain({
      disputeId: selectedDispute.id,
      contractId: escrow.contractId,
      escrow,
      payerPercentage,
      resolutionNotes,
      walletAddress: address,
      token,
      onStatus: setTxStatus,
    })

    if (result.pendingConfirmation) {
      setPendingConfirmation(true)
    } else if (!result.success) {
      setResolveError(result.failure?.message ?? "Failed to resolve dispute")
      setTrustlineProblems(result.failure?.trustlineProblems ?? null)
    } else {
      // Succeeded on-chain. `failure` here means only that Thalos could not
      // write the record, which must not read as "the funds did not move".
      setResolveSuccess(true)
      if (result.failure) setResolveError(result.failure.message)

      const refreshResult = await getOpenDisputes(token)
      if (refreshResult.success) {
        setDisputes(refreshResult.data || [])
      }
      setTimeout(() => {
        setSelectedDispute(null)
        setResolveSuccess(false)
        setPayerPercentage(50)
        setResolutionNotes("")
        setTxStatus(null)
      }, 2500)
    }

    setIsResolving(false)
  }

  const truncateAddress = (addr: string) => {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-border/20 border-t-purple-500 animate-spin"></div>
        </div>
      </div>
    )
  }

  if (!canResolve) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link href="/dashboard/personal">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                {Icons.arrowLeft}
                Back
              </Button>
            </Link>
            <Link href="/">
              <Image
                src="/thalos-icon.png"
                alt="Thalos"
                width={32}
                height={32}
                className="opacity-80"
              />
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-8 text-center">
            {Icons.shield}
            <h2 className="mt-4 text-xl font-semibold text-foreground">Access Denied</h2>
            <p className="mt-2 text-muted-foreground">
              You need to be a Dispute Resolver or Admin to access this page.
            </p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href={dashboardPathFor(profile)}>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                {Icons.arrowLeft}
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <Link href="/">
            <Image
              src="/thalos-icon.png"
              alt="Thalos"
              width={32}
              height={32}
              className="opacity-80 hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Page Title */}
        <div className="mb-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
            {Icons.scale}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Dispute Resolution
            </h1>
            <p className="mt-1 text-muted-foreground">Review and resolve open disputes</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Disputes List */}
          <div>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Open Disputes (
              {disputes.filter((d) => d.status !== "resolved" && d.status !== "cancelled").length})
            </h2>

            {disputes.length === 0 ? (
              <div className="rounded-xl border border-border/40 bg-card/50 p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                  {Icons.check}
                </div>
                <p className="text-foreground font-medium">No open disputes</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  All disputes have been resolved.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {disputes.map((dispute) => (
                  <button
                    key={dispute.id}
                    onClick={() => setSelectedDispute(dispute)}
                    className={cn(
                      "w-full rounded-xl border bg-card/50 p-4 text-left transition-all duration-200 hover:border-purple-500/30 hover:bg-card",
                      selectedDispute?.id === dispute.id && "border-purple-500/50 bg-card",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {dispute.agreement?.title || "Agreement"}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                          {dispute.reason}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-xs font-medium",
                              statusColors[dispute.status],
                            )}
                          >
                            {statusLabels[dispute.status]}
                          </span>
                          {dispute.agreement?.amount && (
                            <span className="text-xs text-muted-foreground">
                              {dispute.agreement.amount} USDC
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {new Date(dispute.created_at).toLocaleDateString()}
                        </p>
                        {dispute.resolver_wallet && (
                          <p className="mt-1 text-xs text-purple-400">Assigned</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Resolution Panel */}
          <div>
            {selectedDispute ? (
              <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">Resolve Dispute</h2>
                  <span
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-medium",
                      statusColors[selectedDispute.status],
                    )}
                  >
                    {statusLabels[selectedDispute.status]}
                  </span>
                </div>

                {/* Agreement Info */}
                <div className="mb-6 rounded-xl bg-background/50 p-4 border border-border/30">
                  <h3 className="font-medium text-foreground">
                    {selectedDispute.agreement?.title}
                  </h3>
                  {/* What the contract holds, which is what a resolution splits.
                      The agreed amount is shown next to it only when it differs,
                      so a partly funded escrow cannot read as the full one. */}
                  <p className="mt-1 text-2xl font-bold text-[#f0b400]">
                    {isLoadingEscrow
                      ? "…"
                      : `${distributable} ${escrow?.trustline?.symbol ?? "USDC"}`}
                    <span className="ml-2 text-xs font-normal uppercase tracking-wider text-muted-foreground">
                      in escrow
                    </span>
                  </p>
                  {escrow && escrow.amount !== escrow.balance && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Agreed: {escrow.amount} {escrow.trustline?.symbol ?? "USDC"}
                    </p>
                  )}
                </div>

                {/* Dispute Details */}
                <div className="mb-6 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      Reason
                    </p>
                    <p className="text-sm text-foreground">{selectedDispute.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                      Opened By
                    </p>
                    <p className="text-sm font-mono text-foreground">
                      {truncateAddress(selectedDispute.opened_by)}
                    </p>
                  </div>
                  {selectedDispute.evidence_urls.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                        Evidence
                      </p>
                      <div className="space-y-1">
                        {selectedDispute.evidence_urls.map((url, i) => (
                          <a
                            key={i}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm text-[#f0b400] hover:underline truncate"
                          >
                            {url}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Assign to Me */}
                {!selectedDispute.resolver_wallet && selectedDispute.status === "open" && (
                  <Button
                    onClick={() => handleAssignToMe(selectedDispute)}
                    disabled={isAssigning}
                    className="w-full mb-6 bg-blue-500 text-white hover:bg-blue-600"
                  >
                    {isAssigning ? "Assigning..." : "Assign to Me"}
                  </Button>
                )}

                {escrowProblem && (
                  <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
                    <p className="text-sm text-red-400">{escrowProblem}</p>
                  </div>
                )}

                {/* The escrow names its own resolver, and nobody else can sign. */}
                {escrow && !isEscrowResolver && (
                  <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <p className="text-sm text-amber-400">
                      Only the dispute resolver of this escrow can settle it
                      {escrow.roles.disputeResolver
                        ? ` (${truncateAddress(escrow.roles.disputeResolver)})`
                        : ""}
                      . Connect that wallet to continue.
                    </p>
                  </div>
                )}

                {/* Resolution Form */}
                {(selectedDispute.resolver_wallet === address || profile?.role === "admin") &&
                  selectedDispute.status !== "resolved" &&
                  selectedDispute.status !== "cancelled" && (
                    <>
                      <div className="mb-6">
                        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Fund Distribution
                        </p>

                        {/* Slider */}
                        <div className="mb-4">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={payerPercentage}
                            onChange={(e) => setPayerPercentage(Number(e.target.value))}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-blue-500 to-green-500"
                          />
                        </div>

                        {/* Distribution Display */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-xl bg-blue-500/10 border border-blue-500/30 p-4 text-center">
                            <p className="text-xs font-medium uppercase tracking-wider text-blue-400 mb-1">
                              Payer
                            </p>
                            <p className="text-2xl font-bold text-blue-400">{payerPercentage}%</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {payerAmount.toFixed(2)} {escrow?.trustline?.symbol ?? "USDC"}
                            </p>
                          </div>
                          <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-center">
                            <p className="text-xs font-medium uppercase tracking-wider text-green-400 mb-1">
                              Payee
                            </p>
                            <p className="text-2xl font-bold text-green-400">
                              {100 - payerPercentage}%
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {payeeAmount.toFixed(2)} {escrow?.trustline?.symbol ?? "USDC"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="mb-6">
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Resolution Notes
                        </label>
                        <textarea
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          placeholder="Explain the reasoning for this resolution..."
                          rows={3}
                          className="w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/15 transition-all resize-none"
                        />
                      </div>

                      {/* Resolve Button */}
                      <Button
                        onClick={handleResolve}
                        disabled={
                          isResolving ||
                          resolveSuccess ||
                          !escrow ||
                          !isEscrowResolver ||
                          isLoadingEscrow
                        }
                        className={cn(
                          "w-full",
                          resolveSuccess
                            ? "bg-green-500 text-white"
                            : "bg-purple-500 text-white hover:bg-purple-600",
                        )}
                      >
                        {isResolving ? (
                          <>
                            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                            {TX_STATUS_LABELS[txStatus ?? "building"]}
                          </>
                        ) : resolveSuccess ? (
                          <>
                            {Icons.check}
                            <span className="ml-2">Funds distributed on-chain</span>
                          </>
                        ) : (
                          "Resolve Dispute"
                        )}
                      </Button>

                      {/* Named, not just reported: the resolver cannot add
                          someone else's trustline, so the party who has to act
                          must be identifiable. */}
                      {trustlineProblems && (
                        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-left">
                          <p className="text-sm font-medium text-red-400">
                            This resolution cannot be sent yet
                          </p>
                          <ul className="mt-2 space-y-1">
                            {trustlineProblems.map((problem) => (
                              <li key={problem.address} className="text-sm text-red-300/90">
                                <span className="font-mono">
                                  {truncateAddress(problem.address)}
                                </span>{" "}
                                {problem.reason === "no-account"
                                  ? "has no account on the network yet."
                                  : `cannot receive ${escrow?.trustline?.symbol ?? "USDC"} yet.`}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-2 text-xs text-red-300/70">
                            Only the owner of each address can fix this, by adding the trustline in
                            their own wallet. Ask them to do it, then try again.
                          </p>
                        </div>
                      )}

                      {pendingConfirmation && (
                        <p className="mt-3 text-sm text-amber-400 text-center">
                          Submitted, but the network has not confirmed it yet. Check the escrow in a
                          moment before trying again — it may already be settled.
                        </p>
                      )}

                      {resolveError && !trustlineProblems && (
                        <p className="mt-3 text-sm text-red-400 text-center">{resolveError}</p>
                      )}
                    </>
                  )}

                {selectedDispute.status === "resolved" && (
                  <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-400">
                      {Icons.check}
                      <span className="font-medium">This dispute has been resolved</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/40 bg-card/30 p-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/10 text-purple-400">
                  {Icons.scale}
                </div>
                <p className="text-foreground font-medium">Select a dispute</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a dispute from the list to review and resolve it.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
