"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThalosLoader } from "@/components/thalos-loader"
import { useLanguage } from "@/lib/i18n"
import { useStellarWallet } from "@/lib/stellar-wallet"
import {
  getOpenDisputes,
  getDisputesByResolver,
  assignDisputeResolver,
  resolveDispute,
  type DisputeWithAgreement,
} from "@/lib/actions/disputes"

/* ── Icons ── */
const Icons = {
  shield: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  alert: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
  arrowLeft: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
  user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  scale: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3v18M3 7l9-4 9 4M3 7v4a9 9 0 0 0 9 9 9 9 0 0 0 9-9V7" /></svg>,
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

export default function DisputesPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { address, profile } = useStellarWallet()
  
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

  const canResolve = profile?.role === "dispute_resolver" || profile?.role === "admin"

  useEffect(() => {
    if (!address) {
      router.push("/")
      return
    }

    async function loadDisputes() {
      setIsLoading(true)
      
      let result
      if (canResolve) {
        // Show all open disputes for resolvers
        result = await getOpenDisputes()
      } else {
        // For regular users, this would show their own disputes (not implemented yet)
        result = await getOpenDisputes()
      }
      
      if (result.error) {
        console.error("Error loading disputes:", result.error)
      } else {
        setDisputes(result.disputes)
      }
      
      setIsLoading(false)
    }

    loadDisputes()
  }, [address, router, canResolve])

  const handleAssignToMe = async (dispute: DisputeWithAgreement) => {
    if (!address || !canResolve) return
    
    setIsAssigning(true)
    const { success, error } = await assignDisputeResolver(dispute.id, address)
    
    if (error) {
      console.error("Error assigning dispute:", error)
    } else if (success) {
      // Refresh disputes
      const result = await getOpenDisputes()
      if (!result.error) {
        setDisputes(result.disputes)
      }
    }
    
    setIsAssigning(false)
  }

  const handleResolve = async () => {
    if (!selectedDispute || !address || !canResolve) return
    
    setIsResolving(true)
    setResolveError(null)
    setResolveSuccess(false)

    const { resolution, error } = await resolveDispute({
      dispute_id: selectedDispute.id,
      resolved_by: address,
      payer_percentage: payerPercentage,
      payee_percentage: 100 - payerPercentage,
      resolution_notes: resolutionNotes,
    })

    if (error) {
      setResolveError(error)
    } else if (resolution) {
      setResolveSuccess(true)
      // Refresh disputes
      const result = await getOpenDisputes()
      if (!result.error) {
        setDisputes(result.disputes)
      }
      setTimeout(() => {
        setSelectedDispute(null)
        setResolveSuccess(false)
        setPayerPercentage(50)
        setResolutionNotes("")
      }, 2000)
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
        <ThalosLoader size="lg" />
      </div>
    )
  }

  if (!canResolve) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link href="/dashboard/personal">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                {Icons.arrowLeft}
                Back
              </Button>
            </Link>
            <Link href="/">
              <Image src="/thalos-icon.png" alt="Thalos" width={32} height={32} className="opacity-80" />
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
            <Link href={profile?.account_type === "business" ? "/dashboard/business" : "/dashboard/personal"}>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                {Icons.arrowLeft}
                Back to Dashboard
              </Button>
            </Link>
          </div>
          <Link href="/">
            <Image src="/thalos-icon.png" alt="Thalos" width={32} height={32} className="opacity-80 hover:opacity-100 transition-opacity" />
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
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dispute Resolution</h1>
            <p className="mt-1 text-muted-foreground">Review and resolve open disputes</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Disputes List */}
          <div>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Open Disputes ({disputes.filter(d => d.status !== "resolved").length})
            </h2>
            
            {disputes.length === 0 ? (
              <div className="rounded-xl border border-border/40 bg-card/50 p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                  {Icons.check}
                </div>
                <p className="text-foreground font-medium">No open disputes</p>
                <p className="mt-1 text-sm text-muted-foreground">All disputes have been resolved.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {disputes.map((dispute) => (
                  <button
                    key={dispute.id}
                    onClick={() => setSelectedDispute(dispute)}
                    className={cn(
                      "w-full rounded-xl border bg-card/50 p-4 text-left transition-all duration-200 hover:border-purple-500/30 hover:bg-card",
                      selectedDispute?.id === dispute.id && "border-purple-500/50 bg-card"
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
                          <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium", statusColors[dispute.status])}>
                            {statusLabels[dispute.status]}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {dispute.agreement?.amount} USDC
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">
                          {new Date(dispute.created_at).toLocaleDateString()}
                        </p>
                        {dispute.resolver_wallet && (
                          <p className="mt-1 text-xs text-purple-400">
                            Assigned
                          </p>
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
                  <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", statusColors[selectedDispute.status])}>
                    {statusLabels[selectedDispute.status]}
                  </span>
                </div>

                {/* Agreement Info */}
                <div className="mb-6 rounded-xl bg-background/50 p-4 border border-border/30">
                  <h3 className="font-medium text-foreground">{selectedDispute.agreement?.title}</h3>
                  <p className="mt-1 text-2xl font-bold text-[#f0b400]">{selectedDispute.agreement?.amount} USDC</p>
                </div>

                {/* Dispute Details */}
                <div className="mb-6 space-y-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Reason</p>
                    <p className="text-sm text-foreground">{selectedDispute.reason}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Opened By</p>
                    <p className="text-sm font-mono text-foreground">{truncateAddress(selectedDispute.opened_by)}</p>
                  </div>
                  {selectedDispute.evidence_urls.length > 0 && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Evidence</p>
                      <div className="space-y-1">
                        {selectedDispute.evidence_urls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block text-sm text-[#f0b400] hover:underline truncate">
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

                {/* Resolution Form */}
                {(selectedDispute.resolver_wallet === address || profile?.role === "admin") && selectedDispute.status !== "resolved" && (
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
                          <p className="text-xs font-medium uppercase tracking-wider text-blue-400 mb-1">Payer</p>
                          <p className="text-2xl font-bold text-blue-400">{payerPercentage}%</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {((Number(selectedDispute.agreement?.amount.replace(",", "")) || 0) * payerPercentage / 100).toFixed(2)} USDC
                          </p>
                        </div>
                        <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-4 text-center">
                          <p className="text-xs font-medium uppercase tracking-wider text-green-400 mb-1">Payee</p>
                          <p className="text-2xl font-bold text-green-400">{100 - payerPercentage}%</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {((Number(selectedDispute.agreement?.amount.replace(",", "")) || 0) * (100 - payerPercentage) / 100).toFixed(2)} USDC
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
                      disabled={isResolving || resolveSuccess}
                      className={cn(
                        "w-full",
                        resolveSuccess
                          ? "bg-green-500 text-white"
                          : "bg-purple-500 text-white hover:bg-purple-600"
                      )}
                    >
                      {isResolving ? (
                        <>
                          <ThalosLoader size="sm" className="mr-2" />
                          Resolving...
                        </>
                      ) : resolveSuccess ? (
                        <>
                          {Icons.check}
                          <span className="ml-2">Resolved Successfully</span>
                        </>
                      ) : (
                        "Resolve Dispute"
                      )}
                    </Button>

                    {resolveError && (
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
