"use client"

import React, { useState, useEffect, useId } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThalosLoader } from "@/components/thalos-loader"
import { useLanguage } from "@/lib/i18n"
import { useStellarWallet } from "@/lib/stellar-wallet"
import {
  createBounty,
  getBountiesByCreator,
  getBountiesForValidator,
  getOpenBounties,
  type Bounty,
} from "@/lib/actions/bounties"
import { getBountyShareableLink } from "@/lib/utils/bounty"

/* ── Icons ── */
const Icons = {
  trophy: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 22V8h4v14" /><rect x="6" y="2" width="12" height="12" rx="2" /></svg>,
  plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>,
  arrowLeft: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>,
  copy: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>,
  external: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><path d="M15 3h6v6" /><path d="M10 14L21 3" /></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>,
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

/* ── Form Input ── */
function FormInput({ label, value, onChange, placeholder, type = "text", info, required = false }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; info?: string; required?: boolean
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}{required && <span className="text-[#f0b400]">*</span>}
        {info && <span className="normal-case tracking-normal font-normal text-muted-foreground/50">({info})</span>}
      </label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-border/40 bg-card/30 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-[#f0b400]/50 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/15 transition-all duration-200" />
    </div>
  )
}

export default function BountiesDashboardPage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { address, profile } = useStellarWallet()
  
  const [isLoading, setIsLoading] = useState(true)
  const [myBounties, setMyBounties] = useState<Bounty[]>([])
  const [validatorBounties, setValidatorBounties] = useState<Bounty[]>([])
  const [openBounties, setOpenBounties] = useState<Bounty[]>([])
  
  // Create bounty form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [validators, setValidators] = useState("")
  const [deadline, setDeadline] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)

  useEffect(() => {
    if (!address) {
      router.push("/")
      return
    }

    async function loadBounties() {
      setIsLoading(true)
      
      const [creatorResult, validatorResult, openResult] = await Promise.all([
        getBountiesByCreator(address),
        getBountiesForValidator(address),
        getOpenBounties(),
      ])
      
      if (!creatorResult.error) setMyBounties(creatorResult.bounties)
      if (!validatorResult.error) setValidatorBounties(validatorResult.bounties)
      if (!openResult.error) setOpenBounties(openResult.bounties)
      
      setIsLoading(false)
    }

    loadBounties()
  }, [address, router])

  const handleCreate = async () => {
    if (!address || !title || !description || !amount || !validators) return
    
    setIsCreating(true)
    setCreateError(null)
    
    const validatorList = validators.split(",").map((v) => v.trim()).filter(Boolean)
    
    if (validatorList.length === 0) {
      setCreateError("Please add at least one validator")
      setIsCreating(false)
      return
    }
    
    const { bounty, error } = await createBounty({
      title,
      description,
      amount,
      created_by: address,
      validators: validatorList,
      deadline: deadline || undefined,
    })
    
    if (error) {
      setCreateError(error)
    } else if (bounty) {
      // Refresh bounties
      const { bounties } = await getBountiesByCreator(address)
      setMyBounties(bounties)
      
      // Reset form
      setShowCreateForm(false)
      setTitle("")
      setDescription("")
      setAmount("")
      setValidators("")
      setDeadline("")
    }
    
    setIsCreating(false)
  }

  const handleCopyLink = (slug: string) => {
    const link = getBountyShareableLink(slug)
    navigator.clipboard.writeText(link)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 2000)
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href={profile?.account_type === "enterprise" ? "/dashboard/business" : "/dashboard/personal"}>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                {Icons.arrowLeft}
                Back
              </Button>
            </Link>
          </div>
          <Link href="/">
            <Image src="/thalos-icon.png" alt="Thalos" width={32} height={32} className="opacity-80 hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12">
        {/* Page Header */}
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0b400]/20 text-[#f0b400]">
              {Icons.trophy}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Thalos Bounties</h1>
              <p className="mt-1 text-muted-foreground">Create and manage bounty agreements</p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowCreateForm(true)}
            className="gap-2 bg-[#f0b400] text-black hover:bg-[#f0b400]/90"
          >
            {Icons.plus}
            Create Bounty
          </Button>
        </div>

        {/* Create Bounty Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateForm(false)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
              className="relative z-10 w-full max-w-lg rounded-2xl border border-border/40 bg-card p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowCreateForm(false)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              >
                {Icons.x}
              </button>
              
              <h2 className="text-xl font-bold text-foreground mb-6">Create New Bounty</h2>
              
              <div className="space-y-5">
                <FormInput
                  label="Title"
                  value={title}
                  onChange={setTitle}
                  placeholder="Design a new logo"
                  required
                />
                
                <div>
                  <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Description <span className="text-[#f0b400]">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the bounty requirements..."
                    rows={3}
                    className="w-full rounded-xl border border-border/40 bg-card/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-[#f0b400]/50 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/15 resize-none"
                  />
                </div>
                
                <FormInput
                  label="Amount"
                  value={amount}
                  onChange={setAmount}
                  placeholder="1000"
                  type="number"
                  info="USDC"
                  required
                />
                
                <FormInput
                  label="Validators"
                  value={validators}
                  onChange={setValidators}
                  placeholder="G...ABC1, G...XYZ2"
                  info="Comma-separated wallet addresses"
                  required
                />
                
                <FormInput
                  label="Deadline"
                  value={deadline}
                  onChange={setDeadline}
                  type="date"
                  info="Optional"
                />
                
                <div className="flex items-center gap-3 pt-4">
                  <Button
                    onClick={handleCreate}
                    disabled={isCreating || !title || !description || !amount || !validators}
                    className="flex-1 bg-[#f0b400] text-black hover:bg-[#f0b400]/90"
                  >
                    {isCreating ? "Creating..." : "Create Bounty"}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                    Cancel
                  </Button>
                </div>
                
                {createError && (
                  <p className="text-sm text-red-400">{createError}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* My Bounties */}
        <section className="mb-12">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            My Bounties ({myBounties.length})
          </h2>
          
          {myBounties.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/40 bg-card/30 p-8 text-center">
              <p className="text-muted-foreground">You haven&apos;t created any bounties yet.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myBounties.map((bounty) => (
                <div
                  key={bounty.id}
                  className="rounded-xl border border-border/40 bg-card/50 p-5 hover:border-[#f0b400]/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-medium text-foreground line-clamp-1">{bounty.title}</h3>
                    <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium", statusColors[bounty.status])}>
                      {statusLabels[bounty.status]}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[#f0b400] mb-3">{bounty.amount} USDC</p>
                  <div className="flex items-center gap-2">
                    <Link href={`/bounty/${bounty.slug}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full gap-1">
                        View {Icons.external}
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyLink(bounty.slug)}
                      className="shrink-0"
                    >
                      {copiedSlug === bounty.slug ? Icons.check : Icons.copy}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Bounties to Validate */}
        {validatorBounties.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Bounties to Validate ({validatorBounties.length})
            </h2>
            
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {validatorBounties.map((bounty) => (
                <div
                  key={bounty.id}
                  className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-5"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-medium text-foreground line-clamp-1">{bounty.title}</h3>
                    <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium", statusColors[bounty.status])}>
                      {statusLabels[bounty.status]}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-[#f0b400] mb-1">{bounty.amount} USDC</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Created by {truncateAddress(bounty.created_by)}
                  </p>
                  <Link href={`/bounty/${bounty.slug}`}>
                    <Button variant="outline" size="sm" className="w-full gap-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                      Review Submissions {Icons.external}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Open Bounties */}
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Open Bounties ({openBounties.length})
          </h2>
          
          {openBounties.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/40 bg-card/30 p-8 text-center">
              <p className="text-muted-foreground">No open bounties available.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {openBounties.map((bounty) => (
                <div
                  key={bounty.id}
                  className="rounded-xl border border-border/40 bg-card/50 p-5 hover:border-green-500/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-medium text-foreground line-clamp-1">{bounty.title}</h3>
                    <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium", statusColors[bounty.status])}>
                      {statusLabels[bounty.status]}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{bounty.description}</p>
                  <p className="text-2xl font-bold text-[#f0b400] mb-3">{bounty.amount} USDC</p>
                  <Link href={`/bounty/${bounty.slug}`}>
                    <Button className="w-full bg-[#f0b400] text-black hover:bg-[#f0b400]/90">
                      View Bounty
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
