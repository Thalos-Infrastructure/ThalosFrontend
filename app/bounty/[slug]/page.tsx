"use client"

import React, { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThalosLoader } from "@/components/thalos-loader"
import { useLanguage } from "@/lib/i18n"
import { useStellarWallet } from "@/lib/stellar-wallet"
import {
  getBountyBySlug,
  submitToBounty,
  validateSubmission,
  getBountyShareableLink,
  type BountyWithDetails,
} from "@/lib/actions/bounties"

/* ── Icons ── */
const Icons = {
  trophy: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 22V8h4v14" /><rect x="6" y="2" width="12" height="12" rx="2" /></svg>,
  check: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
  link: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>,
  copy: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
  user: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  wallet: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>,
  external: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14L21 3" /></svg>,
}

const statusColors: Record<string, string> = {
  draft: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  funded: "bg-[#f0b400]/20 text-[#f0b400] border-[#f0b400]/30",
  in_progress: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  validating: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  completed: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  funded: "Funded",
  in_progress: "In Progress",
  validating: "Validating",
  completed: "Completed",
  cancelled: "Cancelled",
}

const submissionStatusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
}

export default function BountyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const { t } = useLanguage()
  const router = useRouter()
  const { address, profile, openWalletModal } = useStellarWallet()
  
  const [isLoading, setIsLoading] = useState(true)
  const [bounty, setBounty] = useState<BountyWithDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Submission form
  const [showSubmitForm, setShowSubmitForm] = useState(false)
  const [submissionUrl, setSubmissionUrl] = useState("")
  const [submissionNotes, setSubmissionNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  
  // Link copied
  const [linkCopied, setLinkCopied] = useState(false)

  // Validation state
  const [validatingId, setValidatingId] = useState<string | null>(null)

  useEffect(() => {
    async function loadBounty() {
      setIsLoading(true)
      const { bounty: data, error: err } = await getBountyBySlug(slug)
      
      if (err) {
        setError(err)
      } else {
        setBounty(data)
      }
      
      setIsLoading(false)
    }

    loadBounty()
  }, [slug])

  const handleCopyLink = () => {
    const link = getBountyShareableLink(slug)
    navigator.clipboard.writeText(link)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleConnectWallet = () => {
    openWalletModal(() => {
      // Wallet connected
    })
  }

  const handleSubmit = async () => {
    if (!address || !bounty) return
    
    setIsSubmitting(true)
    setSubmitError(null)
    
    const { submission, error } = await submitToBounty(
      bounty.id,
      address,
      submissionUrl,
      submissionNotes
    )
    
    if (error) {
      setSubmitError(error)
    } else if (submission) {
      // Refresh bounty data
      const { bounty: updated } = await getBountyBySlug(slug)
      if (updated) setBounty(updated)
      setShowSubmitForm(false)
      setSubmissionUrl("")
      setSubmissionNotes("")
    }
    
    setIsSubmitting(false)
  }

  const handleValidate = async (submissionId: string, approved: boolean) => {
    if (!address) return
    
    setValidatingId(submissionId)
    
    const { success, error } = await validateSubmission(submissionId, address, approved)
    
    if (error) {
      console.error("Validation error:", error)
    } else if (success) {
      // Refresh bounty data
      const { bounty: updated } = await getBountyBySlug(slug)
      if (updated) setBounty(updated)
    }
    
    setValidatingId(null)
  }

  const truncateAddress = (addr: string) => {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const isValidator = bounty?.validators.some((v) => v.wallet_address === address) || false
  const isCreator = bounty?.created_by === address

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <ThalosLoader size="lg" />
      </div>
    )
  }

  if (error || !bounty) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-4xl items-center justify-center px-6">
            <Link href="/">
              <Image src="/thalos-icon.png" alt="Thalos" width={32} height={32} />
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-6 py-24">
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/20 text-red-400">
              {Icons.x}
            </div>
            <h1 className="text-2xl font-bold text-foreground">Bounty Not Found</h1>
            <p className="mt-2 text-muted-foreground">{error || "This bounty doesn't exist or has been removed."}</p>
            <Link href="/">
              <Button className="mt-6">Go Home</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/">
            <Image src="/thalos-icon.png" alt="Thalos" width={32} height={32} className="opacity-80 hover:opacity-100 transition-opacity" />
          </Link>
          
          {address ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground font-mono">{truncateAddress(address)}</span>
              <Link href="/profile">
                <Button variant="outline" size="sm">Profile</Button>
              </Link>
            </div>
          ) : (
            <Button onClick={handleConnectWallet} className="bg-[#f0b400] text-black hover:bg-[#f0b400]/90">
              Connect Wallet
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Bounty Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0b400]/20 text-[#f0b400]">
                {Icons.trophy}
              </div>
              <div>
                <span className={cn("rounded-full border px-3 py-1 text-xs font-medium", statusColors[bounty.status])}>
                  {statusLabels[bounty.status]}
                </span>
              </div>
            </div>
            
            {/* Share Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="gap-2"
            >
              {linkCopied ? Icons.check : Icons.copy}
              {linkCopied ? "Copied!" : "Copy Link"}
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">{bounty.title}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{bounty.description}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prize Info */}
            <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Prize Pool</p>
                  <p className="text-4xl font-bold text-[#f0b400]">{bounty.amount} <span className="text-xl">{bounty.asset}</span></p>
                </div>
                {bounty.deadline && (
                  <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Deadline</p>
                    <p className="text-lg font-semibold text-foreground">{new Date(bounty.deadline).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Work Section */}
            {(bounty.status === "open" || bounty.status === "funded" || bounty.status === "in_progress") && (
              <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Submit Your Work</h3>
                
                {!address ? (
                  <div className="text-center py-6">
                    <p className="text-muted-foreground mb-4">Connect your wallet to submit work</p>
                    <Button onClick={handleConnectWallet} className="bg-[#f0b400] text-black hover:bg-[#f0b400]/90">
                      Connect Wallet
                    </Button>
                  </div>
                ) : showSubmitForm ? (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Submission URL <span className="text-[#f0b400]">*</span>
                      </label>
                      <input
                        type="url"
                        value={submissionUrl}
                        onChange={(e) => setSubmissionUrl(e.target.value)}
                        placeholder="https://github.com/your/submission"
                        className="h-12 w-full rounded-xl border border-border/40 bg-background/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-[#f0b400]/50 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/15"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Notes (optional)
                      </label>
                      <textarea
                        value={submissionNotes}
                        onChange={(e) => setSubmissionNotes(e.target.value)}
                        placeholder="Describe your submission..."
                        rows={3}
                        className="w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-[#f0b400]/50 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/15 resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !submissionUrl}
                        className="bg-[#f0b400] text-black hover:bg-[#f0b400]/90"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Work"}
                      </Button>
                      <Button variant="outline" onClick={() => setShowSubmitForm(false)}>
                        Cancel
                      </Button>
                    </div>
                    {submitError && (
                      <p className="text-sm text-red-400">{submitError}</p>
                    )}
                  </div>
                ) : (
                  <Button
                    onClick={() => setShowSubmitForm(true)}
                    className="w-full bg-[#f0b400] text-black hover:bg-[#f0b400]/90"
                  >
                    Submit Your Work
                  </Button>
                )}
              </div>
            )}

            {/* Submissions */}
            {bounty.submissions.length > 0 && (
              <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Submissions ({bounty.submissions.length})
                </h3>
                
                <div className="space-y-4">
                  {bounty.submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="rounded-xl border border-border/30 bg-background/50 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-mono text-foreground">
                              {truncateAddress(submission.submitter_wallet)}
                            </span>
                            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", submissionStatusColors[submission.status])}>
                              {submission.status}
                            </span>
                          </div>
                          <a
                            href={submission.submission_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-[#f0b400] hover:underline truncate"
                          >
                            {submission.submission_url}
                            {Icons.external}
                          </a>
                          {submission.notes && (
                            <p className="mt-2 text-sm text-muted-foreground">{submission.notes}</p>
                          )}
                          
                          {/* Validations */}
                          {submission.validations.length > 0 && (
                            <div className="mt-3 flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Validations:</span>
                              {submission.validations.map((v, i) => (
                                <span
                                  key={i}
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-xs",
                                    v.approved ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                                  )}
                                >
                                  {truncateAddress(v.wallet)} {v.approved ? "Approved" : "Rejected"}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        {/* Validator Actions */}
                        {isValidator && submission.status === "pending" && !submission.validations.some((v) => v.wallet === address) && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleValidate(submission.id, true)}
                              disabled={validatingId === submission.id}
                              className="border-green-500/30 text-green-400 hover:bg-green-500/10"
                            >
                              {Icons.check}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleValidate(submission.id, false)}
                              disabled={validatingId === submission.id}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            >
                              {Icons.x}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Validators */}
            <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
                Validators ({bounty.validators.length})
              </h3>
              <div className="space-y-3">
                {bounty.validators.map((validator) => (
                  <div key={validator.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
                      {Icons.user}
                    </div>
                    <span className="font-mono text-sm text-foreground">
                      {truncateAddress(validator.wallet_address)}
                    </span>
                    {validator.wallet_address === address && (
                      <span className="rounded-full bg-[#f0b400]/20 px-2 py-0.5 text-xs text-[#f0b400]">You</span>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {bounty.required_validations} of {bounty.validators.length} validations required
              </p>
            </div>

            {/* Contract Info */}
            {bounty.agreement_id && (
              <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
                  Contract Details
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Agreement ID</p>
                    <p className="font-mono text-sm text-foreground truncate">{bounty.agreement_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created By</p>
                    <p className="font-mono text-sm text-foreground">{truncateAddress(bounty.created_by)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm text-foreground">{new Date(bounty.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Shareable Link */}
            <div className="rounded-2xl border border-[#f0b400]/30 bg-[#f0b400]/5 p-6">
              <h3 className="text-sm font-medium uppercase tracking-wider text-[#f0b400] mb-3">
                Share This Bounty
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={getBountyShareableLink(slug)}
                  readOnly
                  className="flex-1 h-10 rounded-lg border border-border/40 bg-background/50 px-3 text-xs font-mono text-muted-foreground"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {linkCopied ? Icons.check : Icons.copy}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
