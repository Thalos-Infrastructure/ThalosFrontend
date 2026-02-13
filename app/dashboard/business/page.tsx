"use client"

import React, { useState, useEffect, useCallback, useId } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThalosLoader } from "@/components/thalos-loader"

/* ────────────────────────────────────────────────
   Enterprise Scenarios
   ──────────────────────────────────────────────── */

const scenarios = [
  { id: "vendor", label: "Vendor Contract", description: "Pay vendors with protected funds and milestone approvals.", defaultTitle: "Vendor Contract" },
  { id: "milestone", label: "Milestone-Based Project", description: "Large project with staged deliverables and progressive payment.", defaultTitle: "Milestone Project Agreement" },
  { id: "retainer", label: "Retainer Agreement", description: "Recurring service retainer with periodic releases.", defaultTitle: "Retainer Agreement" },
]

/* ────────────────────────────────────────────────
   Stable Input components
   ──────────────────────────────────────────────── */

function FormInput({ label, value, onChange, placeholder, type = "text", disabled = false, info }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean; info?: string
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
        {info && <span className="normal-case tracking-normal font-normal text-muted-foreground/50">({info})</span>}
      </label>
      <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className={cn("h-11 w-full rounded-xl border border-border/50 bg-card/40 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#f0b400]/40 focus:outline-none focus:ring-1 focus:ring-[#f0b400]/20 transition-all", disabled && "opacity-60 cursor-not-allowed")} />
    </div>
  )
}

function FormTextarea({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-24 w-full rounded-xl border border-border/50 bg-card/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#f0b400]/40 focus:outline-none focus:ring-1 focus:ring-[#f0b400]/20 transition-all resize-none" />
    </div>
  )
}

/* ────────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────────── */

const wizardSteps = ["Choose Scenario", "Agreement Details", "Payment Structure", "Review & Confirm"]

export default function BusinessDashboardPage() {
  const [loading, setLoading] = useState(true)
  useEffect(() => { const t = setTimeout(() => setLoading(false), 1400); return () => clearTimeout(t) }, [])

  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [releaseType, setReleaseType] = useState<"single" | "multi">("single")
  const [amount, setAmount] = useState("")
  const [milestones, setMilestones] = useState([{ description: "", amount: "" }])

  const totalAmount = releaseType === "single" ? parseFloat(amount) || 0 : milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0)
  const platformFee = (totalAmount * 0.01).toFixed(2)
  const netAmount = (totalAmount - parseFloat(platformFee)).toFixed(2)

  const selectScenario = useCallback((id: string) => {
    setSelectedScenario(id)
    const s = scenarios.find((sc) => sc.id === id)
    if (s) { setTitle(s.defaultTitle); setDescription(s.description) }
  }, [])

  const addMilestone = () => setMilestones((p) => [...p, { description: "", amount: "" }])
  const removeMilestone = (i: number) => milestones.length > 1 && setMilestones((p) => p.filter((_, idx) => idx !== i))
  const updateMilestone = useCallback((i: number, field: "description" | "amount", val: string) => {
    setMilestones((p) => { const n = [...p]; n[i] = { ...n[i], [field]: val }; return n })
  }, [])

  const generateJSON = () => ({
    engagementId: `THALOS-E-${Date.now().toString(36).toUpperCase()}`,
    title, description, amount: totalAmount.toString(), platformFee,
    signer: "AUTO_FROM_CONNECTED_WALLET",
    serviceType: releaseType === "single" ? "single-release" : "multi-release",
    roles: { approver: "AUTO_ASSIGNED", serviceProvider: "AUTO_ASSIGNED", platformAddress: "THALOS_PLATFORM_WALLET", releaseSigner: "AUTO_FROM_CONNECTED_WALLET", disputeResolver: "THALOS_DISPUTE_RESOLVER", receiver: "AUTO_ASSIGNED" },
    milestones: releaseType === "single" ? [{ description: "Full delivery", amount: totalAmount.toString() }] : milestones.map((m) => ({ description: m.description || "Milestone", amount: m.amount || "0" })),
    trustline: { symbol: "USDC", address: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  })

  const [copiedJson, setCopiedJson] = useState(false)
  const copyJson = () => { navigator.clipboard.writeText(JSON.stringify(generateJSON(), null, 2)); setCopiedJson(true); setTimeout(() => setCopiedJson(false), 2000) }

  const canProceed = () => {
    if (step === 0) return !!selectedScenario
    if (step === 1) return title.trim().length > 0
    if (step === 2) return releaseType === "single" ? parseFloat(amount) > 0 : milestones.every((m) => m.description.trim() && parseFloat(m.amount) > 0)
    return true
  }

  if (loading) return <ThalosLoader />

  return (
    <div className="min-h-screen bg-background text-foreground">
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
              <Button variant="outline" size="sm" className="rounded-full border-white/20 bg-white/5 text-white/70 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-300">Sign Out</Button>
            </Link>
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-4xl">Enterprise Agreement</h1>
          <p className="mt-2 text-sm text-muted-foreground">Create a protected business payment in a few simple steps.</p>
        </div>

        {/* Stats bar */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[{ label: "Active", value: "12" }, { label: "Volume", value: "$2.4M" }, { label: "Fees", value: "$24K" }, { label: "Completed", value: "48" }].map((s) => (
            <div key={s.label} className="rounded-xl border border-border/30 bg-card/40 p-4 text-center shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-lg font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Step indicator */}
        {!submitted && (
          <div className="mb-10 flex items-center justify-center gap-1">
            {wizardSteps.map((s, i) => (
              <React.Fragment key={s}>
                <button onClick={() => i <= step && setStep(i)}
                  className={cn("flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-300 sm:px-4 sm:py-2 sm:text-sm",
                    i === step ? "bg-[#f0b400] text-background shadow-[0_4px_16px_rgba(240,180,0,0.25)]" : i < step ? "bg-[#f0b400]/10 text-[#f0b400] cursor-pointer" : "bg-secondary/40 text-muted-foreground/50"
                  )}>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs">
                    {i < step ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s}</span>
                </button>
                {i < wizardSteps.length - 1 && <div className={cn("h-px w-4 sm:w-8", i < step ? "bg-[#f0b400]" : "bg-border/30")} />}
              </React.Fragment>
            ))}
          </div>
        )}

        {submitted ? (
          <div className="flex flex-col items-center gap-6 rounded-2xl border border-border/30 bg-card/40 p-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#f0b400]/10">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Agreement Created</h2>
              <p className="mt-2 text-sm text-muted-foreground">Your enterprise escrow has been submitted.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={copyJson} className="rounded-full border-border/30 bg-card/40 text-sm font-medium hover:bg-white/10 hover:text-white transition-all">{copiedJson ? "Copied" : "Copy JSON"}</Button>
              <Button onClick={() => { setSubmitted(false); setStep(0); setSelectedScenario(null); setTitle(""); setDescription(""); setAmount(""); setMilestones([{ description: "", amount: "" }]); setReleaseType("single") }}
                className="rounded-full bg-[#f0b400] text-background font-semibold hover:bg-[#d4a000] transition-all">New Agreement</Button>
            </div>
          </div>
        ) : (

          <div className="rounded-2xl border border-border/30 bg-card/40 p-6 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] md:p-10">

            {/* Step 0: Scenario */}
            {step === 0 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">What type of agreement?</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Choose a scenario that fits your business need.</p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {scenarios.map((sc) => (
                    <button key={sc.id} onClick={() => selectScenario(sc.id)}
                      className={cn("flex flex-col gap-2 rounded-xl border p-5 text-left transition-all duration-300",
                        selectedScenario === sc.id ? "border-[#f0b400]/40 bg-[#f0b400]/5 shadow-[0_0_0_1px_rgba(240,180,0,0.2)]" : "border-border/30 bg-card/30 hover:border-white/20 hover:bg-white/5"
                      )}>
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                        selectedScenario === sc.id ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-secondary/30 text-muted-foreground"
                      )}>
                        {sc.id === "vendor" && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>}
                        {sc.id === "milestone" && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                        {sc.id === "retainer" && <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
                      </div>
                      <p className="text-sm font-semibold text-foreground">{sc.label}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{sc.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 1: Details */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Agreement Details</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Describe the enterprise agreement scope.</p>
                </div>
                <FormInput label="Title" value={title} onChange={setTitle} placeholder="My Enterprise Agreement" />
                <FormTextarea label="Description" value={description} onChange={setDescription} placeholder="Scope of the enterprise agreement..." />
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Payment Structure</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Define how and when payment will be released.</p>
                </div>
                <div className="flex items-center gap-1 rounded-full border border-border/30 bg-secondary/20 p-1">
                  <button onClick={() => setReleaseType("single")}
                    className={cn("flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300",
                      releaseType === "single" ? "bg-[#f0b400] text-background shadow-[0_2px_8px_rgba(240,180,0,0.25)]" : "text-muted-foreground hover:text-foreground")}>
                    One-time Payment</button>
                  <button onClick={() => setReleaseType("multi")}
                    className={cn("flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-all duration-300",
                      releaseType === "multi" ? "bg-[#f0b400] text-background shadow-[0_2px_8px_rgba(240,180,0,0.25)]" : "text-muted-foreground hover:text-foreground")}>
                    Milestones</button>
                </div>
                {releaseType === "single" ? (
                  <FormInput label="Total Amount" value={amount} onChange={setAmount} placeholder="50000" type="number" info="USDC" />
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Milestones</p>
                      <button onClick={addMilestone} className="text-xs font-semibold text-[#f0b400] hover:underline">+ Add Milestone</button>
                    </div>
                    {milestones.map((m, i) => (
                      <div key={i} className="flex flex-col gap-2 rounded-xl border border-border/30 bg-card/30 p-4 sm:flex-row sm:items-center sm:gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0b400]/10 text-sm font-bold text-[#f0b400]">{i + 1}</span>
                        <input value={m.description} onChange={(e) => updateMilestone(i, "description", e.target.value)} placeholder="Milestone description..."
                          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
                        <input value={m.amount} onChange={(e) => updateMilestone(i, "amount", e.target.value)} placeholder="Amount" type="number"
                          className="w-28 rounded-lg border border-border/30 bg-card/40 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-[#f0b400]/40 focus:outline-none" />
                        {milestones.length > 1 && (
                          <button onClick={() => removeMilestone(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center justify-between rounded-xl bg-secondary/20 px-4 py-3">
                      <span className="text-xs text-muted-foreground">Total</span>
                      <span className="text-sm font-bold text-foreground">{totalAmount.toFixed(2)} USDC</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="flex flex-col gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">Review & Confirm</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Verify everything before creating the escrow.</p>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/30 bg-secondary/20 p-5">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Agreement</p>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{description}</p>
                    <p className="mt-3 text-xs text-muted-foreground/50">Scenario: {scenarios.find((s) => s.id === selectedScenario)?.label}</p>
                  </div>
                  <div className="rounded-xl border border-border/30 bg-secondary/20 p-5">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment</p>
                    <p className="text-2xl font-bold text-[#f0b400]">{totalAmount.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">USDC</span></p>
                    <p className="mt-1 text-xs text-muted-foreground">{releaseType === "single" ? "One-time release" : `${milestones.length} milestone(s)`}</p>
                  </div>
                </div>
                {releaseType === "multi" && (
                  <div className="rounded-xl border border-border/30 bg-secondary/20 p-5">
                    <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">Milestones</p>
                    <div className="flex flex-col gap-2">
                      {milestones.map((m, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg bg-card/30 px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f0b400]/10 text-xs font-bold text-[#f0b400]">{i + 1}</span>
                            <span className="text-sm text-foreground">{m.description || "Untitled"}</span>
                          </div>
                          <span className="text-sm font-semibold text-foreground">{m.amount || "0"} USDC</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="rounded-xl border border-[#f0b400]/15 bg-[#f0b400]/5 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-[#f0b400]">Platform Fee</p>
                      <p className="mt-1 text-xs text-muted-foreground">1% fee for escrow infrastructure and dispute resolution.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#f0b400]">{platformFee} USDC</p>
                      <p className="text-xs text-muted-foreground">Net: {netAmount} USDC</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/20 bg-card/30 p-5">
                  <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">How it works</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {["You Fund", "Funds Locked", ...(releaseType === "multi" ? milestones.map((m, i) => m.description || `Stage ${i + 1}`) : ["Delivery"]), "Approval", "Released"].map((node, i, arr) => (
                      <React.Fragment key={i}>
                        <span className="rounded-full bg-secondary/30 px-3 py-1.5 text-xs font-medium text-foreground">{node}</span>
                        {i < arr.length - 1 && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/40"><path d="M5 12h14M12 5l7 7-7 7" /></svg>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between border-t border-border/20 pt-6">
              <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                className="rounded-full text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30">Back</Button>
              {step < wizardSteps.length - 1 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}
                  className="rounded-full bg-[#f0b400] px-8 text-sm font-semibold text-background hover:bg-[#d4a000] disabled:opacity-30 shadow-[0_4px_16px_rgba(240,180,0,0.25)] transition-all">Continue</Button>
              ) : (
                <Button onClick={() => setSubmitted(true)}
                  className="rounded-full bg-[#f0b400] px-8 text-sm font-semibold text-background hover:bg-[#d4a000] shadow-[0_4px_16px_rgba(240,180,0,0.25)] transition-all">Create Agreement</Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
