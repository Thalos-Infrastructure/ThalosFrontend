"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThalosLoader } from "@/components/thalos-loader"

/* ────────────────────────────────────────────────
   Trustless Work Escrow Roles
   ──────────────────────────────────────────────── */

const twRoles = [
  { key: "approver", label: "Approver", description: "Validates milestone completion, can raise disputes.", required: true },
  { key: "serviceProvider", label: "Service Provider", description: "Delivers the work, can update milestone status.", required: true },
  { key: "releaseSigner", label: "Release Signer", description: "Executes the final funds release.", required: true },
  { key: "disputeResolver", label: "Dispute Resolver", description: "Arbitrates when disputes are raised.", required: true },
  { key: "receiver", label: "Receiver", description: "Final destination of released funds.", required: true },
  { key: "platformAddress", label: "Platform Address", description: "Receives platform fee. Can make changes before funding.", required: false },
]

/* ────────────────────────────────────────────────
   Wizard Steps
   ──────────────────────────────────────────────── */

const agreementSteps = ["Agreement Info", "Roles & Wallets", "Milestones", "Review & JSON"]

/* ────────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────────── */

export default function BusinessDashboardPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400)
    return () => clearTimeout(timer)
  }, [])

  /* ── Wizard State ── */
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  // Step 1
  const [engagementId, setEngagementId] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")

  // Step 2
  const [roles, setRoles] = useState<Record<string, string>>({
    approver: "", serviceProvider: "", releaseSigner: "",
    disputeResolver: "", receiver: "", platformAddress: "",
  })

  // Step 3
  const [milestones, setMilestones] = useState([{ description: "" }])

  // Computed
  const platformFee = amount ? (parseFloat(amount) * 0.01).toFixed(2) : "0.00"
  const signerAddress = "GXXXXXXXXXXXXXXXX"

  const updateRole = (key: string, val: string) => setRoles((prev) => ({ ...prev, [key]: val }))
  const addMilestone = () => setMilestones([...milestones, { description: "" }])
  const removeMilestone = (i: number) => milestones.length > 1 && setMilestones(milestones.filter((_, idx) => idx !== i))
  const updateMilestone = (i: number, val: string) => {
    const n = [...milestones]; n[i] = { description: val }; setMilestones(n)
  }

  const generateJSON = () => ({
    engagementId: engagementId || "Thalos-Enterprise",
    title: title || "Untitled Agreement",
    description: description || "",
    amount: amount || "0",
    platformFee,
    signer: signerAddress,
    roles: {
      approver: roles.approver || "",
      serviceProvider: roles.serviceProvider || "",
      platformAddress: roles.platformAddress || "",
      releaseSigner: roles.releaseSigner || "",
      disputeResolver: roles.disputeResolver || "",
      receiver: roles.receiver || "",
    },
    milestones: milestones.map((m) => ({ description: m.description || "Milestone" })),
    trustline: { symbol: "USDC", address: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  })

  const [copiedJson, setCopiedJson] = useState(false)
  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(generateJSON(), null, 2))
    setCopiedJson(true)
    setTimeout(() => setCopiedJson(false), 2000)
  }

  /* ── Reusable Input ── */
  const Input = ({ label, value, onChange, placeholder, type = "text", disabled = false, info }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; info?: string }) => (
    <div>
      <label className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        {info && <span className="normal-case tracking-normal font-normal text-muted-foreground/50">({info})</span>}
      </label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className={cn("h-11 w-full rounded-xl border border-border/50 bg-card/40 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#f0b400]/40 focus:outline-none focus:ring-1 focus:ring-[#f0b400]/20 transition-all", disabled && "opacity-60 cursor-not-allowed")} />
    </div>
  )

  /* ── Step Indicator ── */
  const StepIndicator = () => (
    <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
      {agreementSteps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <button onClick={() => setStep(i)} className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
            "shadow-[0_2px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
            i === step ? "bg-[#f0b400] text-background shadow-[0_4px_16px_rgba(240,180,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
              : i < step ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-secondary text-muted-foreground"
          )}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs">
              {i < step ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
            </span>
            <span className="hidden sm:inline">{s}</span>
          </button>
          {i < agreementSteps.length - 1 && <div className={cn("h-px w-6", i < step ? "bg-[#f0b400]" : "bg-border")} />}
        </div>
      ))}
    </div>
  )

  if (loading) return <ThalosLoader />

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/10 backdrop-blur-md">
        <nav className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="group flex items-center [perspective:800px]">
            <Image src="/thalos-icon.png" alt="Thalos" width={250} height={250}
              className="h-36 w-auto object-contain brightness-0 invert [transform-style:preserve-3d] transition-transform duration-[1.2s] ease-[cubic-bezier(0.45,0.05,0.55,0.95)] group-hover:[transform:rotateY(360deg)]"
              priority />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              </div>
              <span className="text-sm text-white/70 font-medium hidden sm:inline">Enterprise Account</span>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-full border-white/20 bg-white/5 text-white/70 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-300">
                Sign Out
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Enterprise Agreement</h1>
          <p className="mt-1 text-muted-foreground">Single-Release Escrow powered by Trustless Work on Stellar</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Active Escrows", value: "12" },
            { label: "Total Volume", value: "$2.4M" },
            { label: "Platform Fees", value: "$24K" },
            { label: "Completed", value: "48" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border/40 bg-card/40 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-[#f0b400]/30">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Fixed info bar */}
        <div className="mb-8 flex flex-wrap gap-3">
          {[
            { label: "Network", value: "Stellar" },
            { label: "Currency", value: "USDC" },
            { label: "Platform Fee", value: "1%" },
            { label: "Contract", value: "Single Release" },
          ].map((t) => (
            <div key={t.label} className="flex items-center gap-2 rounded-full border border-border/40 bg-card/40 px-4 py-2 text-xs shadow-[0_2px_6px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.03)]">
              <span className="text-muted-foreground">{t.label}:</span>
              <span className="font-semibold text-[#f0b400]">{t.value}</span>
            </div>
          ))}
        </div>

        {!submitted ? (
          <>
            <StepIndicator />
            <div className="rounded-2xl border border-border/40 bg-card/40 p-6 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)] md:p-10">

              {/* Step 1: Agreement Info */}
              {step === 0 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Agreement Information</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Basic details about this enterprise escrow agreement.</p>
                  </div>
                  <Input label="Engagement ID" value={engagementId} onChange={setEngagementId} placeholder="Thalos-Enterprise-001" info="unique identifier" />
                  <Input label="Title" value={title} onChange={setTitle} placeholder="Marketplace Integration" />
                  <div>
                    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</label>
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Scope of the enterprise agreement..."
                      className="h-24 w-full rounded-xl border border-border/50 bg-card/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#f0b400]/40 focus:outline-none focus:ring-1 focus:ring-[#f0b400]/20 transition-all resize-none" />
                  </div>
                  <Input label="Total Amount" value={amount} onChange={setAmount} placeholder="50000" type="number" info="USDC" />
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/30 bg-secondary/20 p-4">
                      <p className="text-xs text-muted-foreground">Platform Fee (1%)</p>
                      <p className="mt-1 text-lg font-bold text-[#f0b400]">{platformFee} USDC</p>
                    </div>
                    <div className="rounded-xl border border-border/30 bg-secondary/20 p-4">
                      <p className="text-xs text-muted-foreground">Signer (your wallet)</p>
                      <p className="mt-1 text-sm font-mono text-foreground/70 truncate">{signerAddress}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Roles & Wallets */}
              {step === 1 && (
                <div className="flex flex-col gap-5">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Roles & Wallet Addresses</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Assign Stellar wallet addresses to each escrow role.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {twRoles.map((role) => (
                      <div key={role.key} className="rounded-xl border border-border/40 bg-card/30 p-4 transition-all duration-300 hover:border-[#f0b400]/20">
                        <div className="mb-3 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0b400]/10 text-[#f0b400]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{role.label}</p>
                            {!role.required && <span className="text-xs text-muted-foreground/50">Optional</span>}
                          </div>
                        </div>
                        <p className="mb-2 text-xs text-muted-foreground leading-relaxed">{role.description}</p>
                        <input value={roles[role.key]} onChange={(e) => updateRole(role.key, e.target.value)} placeholder="GXXX..."
                          className="h-10 w-full rounded-lg border border-border/40 bg-card/40 px-3 font-mono text-xs text-foreground placeholder:text-muted-foreground/40 focus:border-[#f0b400]/40 focus:outline-none focus:ring-1 focus:ring-[#f0b400]/20 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Milestones */}
              {step === 2 && (
                <div className="flex flex-col gap-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Milestones</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Define the deliverable stages for this agreement.</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={addMilestone} className="text-xs text-[#f0b400] hover:bg-[#f0b400]/10">+ Add Milestone</Button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {milestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-4 transition-all duration-300 hover:border-[#f0b400]/20">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0b400]/10 text-sm font-bold text-[#f0b400]">{i + 1}</span>
                        <input value={m.description} onChange={(e) => updateMilestone(i, e.target.value)} placeholder={`Milestone ${i + 1} description...`}
                          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
                        {milestones.length > 1 && (
                          <button onClick={() => removeMilestone(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground/60">All milestones are released together in a single transaction upon approval.</p>
                </div>
              )}

              {/* Step 4: Review & JSON */}
              {step === 3 && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Review & Submit</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Verify the agreement before deploying the escrow.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-border/40 bg-secondary/20 p-5">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Agreement</p>
                      <p className="text-sm font-semibold text-foreground">{title || "Untitled"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{engagementId || "No ID"}</p>
                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{description || "No description"}</p>
                    </div>
                    <div className="rounded-xl border border-border/40 bg-secondary/20 p-5">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Financial</p>
                      <p className="text-2xl font-bold text-[#f0b400]">{amount || "0"} <span className="text-sm font-normal text-muted-foreground">USDC</span></p>
                      <p className="mt-2 text-xs text-muted-foreground">Platform Fee: {platformFee} USDC (1%)</p>
                      <p className="text-xs text-muted-foreground">Trustline: USDC on Stellar</p>
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-secondary/20 p-5">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Roles</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {twRoles.filter((r) => roles[r.key]).map((role) => (
                        <div key={role.key} className="flex items-center gap-2 rounded-lg bg-card/30 px-3 py-2">
                          <span className="text-xs font-medium text-[#f0b400]">{role.label}:</span>
                          <span className="truncate font-mono text-xs text-foreground/60">{roles[role.key].slice(0, 8)}...{roles[role.key].slice(-4)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-secondary/20 p-5">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Milestones ({milestones.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {milestones.map((m, i) => (
                        <span key={i} className="rounded-full bg-[#f0b400]/10 px-3 py-1.5 text-xs font-medium text-[#f0b400]">{m.description || `Milestone ${i + 1}`}</span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/30 bg-card/30 p-5">
                    <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Escrow Flow</p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {["Signer Funds", "Escrow Lock", ...milestones.map((m, i) => m.description || `M${i + 1}`), "Single Release", "Receiver"].map((node, i, arr) => (
                        <div key={`${node}-${i}`} className="flex items-center gap-3">
                          <span className="rounded-lg bg-[#f0b400]/10 px-3 py-1.5 text-xs font-medium text-[#f0b400]">{node}</span>
                          {i < arr.length - 1 && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#f0b400]/40"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border/40 bg-background/60 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Trustless Work JSON</p>
                      <button onClick={copyJson} className="flex items-center gap-1.5 rounded-lg bg-[#f0b400]/10 px-3 py-1.5 text-xs font-medium text-[#f0b400] transition-all hover:bg-[#f0b400]/20">
                        {copiedJson ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg> Copied</> : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy JSON</>}
                      </button>
                    </div>
                    <pre className="max-h-64 overflow-auto rounded-lg bg-background/80 p-4 font-mono text-xs text-foreground/70 leading-relaxed">{JSON.stringify(generateJSON(), null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between">
                <Button variant="outline" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                  className="rounded-full border-border/60 text-foreground shadow-[0_2px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-[#f0b400]/10 hover:text-[#f0b400] hover:border-[#f0b400]/30 transition-all duration-300">
                  Back
                </Button>
                {step < agreementSteps.length - 1 ? (
                  <Button onClick={() => setStep(step + 1)}
                    className="rounded-full bg-[#f0b400] text-background shadow-[0_4px_16px_rgba(240,180,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#ffd000] transition-all duration-300">
                    Next Step
                  </Button>
                ) : (
                  <Button onClick={() => setSubmitted(true)}
                    className="rounded-full bg-[#f0b400] text-background shadow-[0_4px_16px_rgba(240,180,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#ffd000] transition-all duration-300">
                    Deploy Escrow
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-[#f0b400]/20 bg-[#f0b400]/5 p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0b400]/10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 className="text-2xl font-bold text-foreground">Escrow Deployed</h3>
            <p className="max-w-md text-sm text-muted-foreground">Your enterprise Single-Release Escrow has been configured with {milestones.length} milestone{milestones.length > 1 ? "s" : ""}.</p>
            <div className="rounded-xl border border-border/30 bg-card/30 p-4 max-w-sm w-full">
              <p className="text-xs text-muted-foreground">Engagement ID</p>
              <p className="mt-1 text-sm font-bold text-[#f0b400]">{engagementId || "Thalos-Enterprise"}</p>
              <p className="mt-2 text-xs text-muted-foreground">Amount</p>
              <p className="text-sm font-bold text-foreground">{amount || "0"} USDC</p>
            </div>
            <Button onClick={() => { setSubmitted(false); setStep(0); setEngagementId(""); setTitle(""); setDescription(""); setAmount(""); setRoles({ approver: "", serviceProvider: "", releaseSigner: "", disputeResolver: "", receiver: "", platformAddress: "" }); setMilestones([{ description: "" }]) }}
              className="rounded-full bg-[#f0b400] text-background hover:bg-[#ffd000] transition-all duration-300">
              Create Another
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
