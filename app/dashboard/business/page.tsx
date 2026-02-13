"use client"

import React, { useState, useEffect, useCallback, useId, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThalosLoader } from "@/components/thalos-loader"

/* ────────────────────────────────────────────────
   Enterprise Use-Case Presets
   ──────────────────────────────────────────────── */

const useCases = [
  { id: "car-rental", label: "Car Rental Company", icon: "car" },
  { id: "travel", label: "Travel Agency Package", icon: "plane" },
  { id: "dealership", label: "Car Dealership Sale", icon: "tag" },
  { id: "rental-platform", label: "Short-Term Rental Platform", icon: "home" },
  { id: "event", label: "Event Management Contract", icon: "calendar" },
]

/* ────────────────────────────────────────────────
   Stable Form Components
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
        className={cn(
          "h-12 w-full rounded-xl border border-border/40 bg-card/30 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-[#f0b400]/50 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/15 transition-all duration-200",
          disabled && "opacity-50 cursor-not-allowed"
        )} />
    </div>
  )
}

function FormTextarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full rounded-xl border border-border/40 bg-card/30 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-[#f0b400]/50 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/15 transition-all duration-200 resize-none" />
    </div>
  )
}

/* ────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────── */

const PLATFORM_ADDRESS = "GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM7OAVRWPLXS"
const DISPUTE_RESOLVER = "GBXGQJWVLWOYHFLVTKWV5FGHA3LNYY2JQKM7OAVDISPUTE"
const TRUSTLINE_USDC = { symbol: "USDC", address: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" }

const wizardSteps = ["Escrow Type", "Use Case", "Agreement Info", "Wallets", "Review"]

/* ────────────────────────────────────────────────
   Mock Agreements
   ──────────────────────────────────────────────── */

const mockAgreements = [
  { id: "ENT-001", title: "Fleet Vehicle Purchase", status: "funded", type: "Multi Release", counterparty: "G...DLR5", amount: "125,000" },
  { id: "ENT-002", title: "Resort Partnership Q2", status: "in_progress", type: "Multi Release", counterparty: "G...TRV8", amount: "48,000" },
  { id: "ENT-003", title: "Corporate Event Setup", status: "released", type: "Single Release", counterparty: "G...EVT2", amount: "15,000" },
  { id: "ENT-004", title: "Property Management Fee", status: "awaiting", type: "Single Release", counterparty: "G...RNT9", amount: "6,500" },
]

const statusConfig: Record<string, { label: string; color: string }> = {
  funded: { label: "Funded", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  in_progress: { label: "In Progress", color: "bg-[#f0b400]/10 text-[#f0b400] border-[#f0b400]/20" },
  awaiting: { label: "Awaiting Approval", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  released: { label: "Released", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
}

export default function BusinessDashboardPage() {
  const [loading, setLoading] = useState(true)
  useEffect(() => { const t = setTimeout(() => setLoading(false), 1400); return () => clearTimeout(t) }, [])

  const [view, setView] = useState<"agreements" | "create">("agreements")
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)

  const [escrowType, setEscrowType] = useState<"single" | "multi">("single")
  const [useCase, setUseCase] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [spWallet, setSpWallet] = useState("")
  const [signerWallet, setSignerWallet] = useState("")
  const [milestones, setMilestones] = useState([{ description: "Full delivery", amount: "" }])

  const dragItem = useRef<number | null>(null)
  const dragOverItem = useRef<number | null>(null)

  const totalAmount = escrowType === "single"
    ? (parseFloat(milestones[0]?.amount) || 0)
    : milestones.reduce((s, m) => s + (parseFloat(m.amount) || 0), 0)
  const platformFee = (totalAmount * 0.01).toFixed(2)

  const addMilestone = () => setMilestones((p) => [...p, { description: "", amount: "" }])
  const removeMilestone = (i: number) => milestones.length > 1 && setMilestones((p) => p.filter((_, idx) => idx !== i))
  const updateMilestone = useCallback((i: number, field: "description" | "amount", val: string) => {
    setMilestones((p) => { const n = [...p]; n[i] = { ...n[i], [field]: val }; return n })
  }, [])

  const handleDragStart = (i: number) => { dragItem.current = i }
  const handleDragEnter = (i: number) => { dragOverItem.current = i }
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return
    setMilestones((prev) => { const c = [...prev]; const d = c.splice(dragItem.current!, 1)[0]; c.splice(dragOverItem.current!, 0, d); return c })
    dragItem.current = null; dragOverItem.current = null
  }

  const generateJSON = () => ({
    engagementId: `THALOS-E-${Date.now().toString(36).toUpperCase()}`,
    title, description, amount: totalAmount.toString(), platformFee: "1",
    signer: signerWallet || "AUTO_FROM_CONNECTED_WALLET",
    serviceType: escrowType === "single" ? "single-release" : "multi-release",
    roles: { approver: "CONNECTED_WALLET", serviceProvider: spWallet, releaseSigner: signerWallet || "CONNECTED_WALLET", platformAddress: PLATFORM_ADDRESS, disputeResolver: DISPUTE_RESOLVER, receiver: spWallet },
    milestones: escrowType === "single" ? [{ description: milestones[0]?.description || "Full delivery", amount: totalAmount.toString(), status: "pending" }] : milestones.map((m) => ({ description: m.description || "Milestone", amount: m.amount || "0", status: "pending" })),
    trustline: TRUSTLINE_USDC,
  })

  const [copiedJson, setCopiedJson] = useState(false)
  const copyJson = () => { navigator.clipboard.writeText(JSON.stringify(generateJSON(), null, 2)); setCopiedJson(true); setTimeout(() => setCopiedJson(false), 2000) }

  const canProceed = () => {
    if (step === 0) return true
    if (step === 1) return !!useCase
    if (step === 2) return title.trim().length > 0
    if (step === 3) return spWallet.trim().length > 0 && totalAmount > 0
    return true
  }

  const resetWizard = () => {
    setStep(0); setSubmitted(false); setEscrowType("single"); setUseCase(null)
    setTitle(""); setDescription(""); setSpWallet(""); setSignerWallet("")
    setMilestones([{ description: "Full delivery", amount: "" }])
  }

  if (loading) return <ThalosLoader />

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
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
              <span className="text-sm text-white/70 font-medium hidden sm:inline">Enterprise</span>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-full border-white/20 bg-white/5 text-white/70 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-300">Sign Out</Button>
            </Link>
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[{ l: "Active", v: "12" }, { l: "Volume", v: "$2.4M" }, { l: "Fees", v: "$24K" }, { l: "Completed", v: "48" }].map((s) => (
            <div key={s.l} className="rounded-xl border border-border/30 bg-card/30 p-4 text-center backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{s.l}</p>
              <p className="mt-1 text-lg font-bold text-foreground">{s.v}</p>
            </div>
          ))}
        </div>

        {/* Toggle */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {view === "agreements" ? "Enterprise Agreements" : "New Agreement"}
          </h1>
          <Button onClick={() => { setView(view === "agreements" ? "create" : "agreements"); if (view === "create") resetWizard() }}
            className={cn("rounded-full px-6 text-sm font-semibold transition-all duration-300",
              view === "agreements" ? "bg-[#f0b400] text-background hover:bg-[#d4a000] shadow-[0_4px_16px_rgba(240,180,0,0.25)]" : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
            )}>
            {view === "agreements" ? "+ New Agreement" : "View Agreements"}
          </Button>
        </div>

        {/* ══════════ AGREEMENTS VIEW ══════════ */}
        {view === "agreements" && (
          <div className="flex flex-col gap-4">
            {mockAgreements.map((agr) => {
              const st = statusConfig[agr.status] || statusConfig.funded
              return (
                <div key={agr.id} className="flex flex-col gap-4 rounded-2xl border border-border/30 bg-card/30 p-5 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-300 hover:border-white/15 hover:shadow-[0_4px_24px_rgba(0,0,0,0.25)] sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-base font-semibold text-foreground">{agr.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{agr.type}</span>
                      <span className="text-muted-foreground/30">|</span>
                      <span>{agr.counterparty}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={cn("rounded-full border px-3 py-1 text-xs font-semibold", st.color)}>{st.label}</span>
                    <p className="text-lg font-bold text-foreground">${agr.amount} <span className="text-xs font-normal text-muted-foreground">USDC</span></p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ══════════ CREATE VIEW ══════════ */}
        {view === "create" && (
          <>
            {!submitted && (
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between">
                  {wizardSteps.map((s, i) => (
                    <button key={s} onClick={() => i <= step && setStep(i)}
                      className={cn("flex items-center gap-1.5 text-xs font-semibold transition-all sm:text-sm",
                        i === step ? "text-[#f0b400]" : i < step ? "text-[#f0b400]/60 cursor-pointer" : "text-muted-foreground/40"
                      )}>
                      <span className={cn("flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all sm:h-7 sm:w-7 sm:text-xs",
                        i === step ? "bg-[#f0b400] text-background" : i < step ? "bg-[#f0b400]/15 text-[#f0b400]" : "bg-secondary/40 text-muted-foreground/40"
                      )}>
                        {i < step ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
                      </span>
                      <span className="hidden md:inline">{s}</span>
                    </button>
                  ))}
                </div>
                <div className="h-1 w-full overflow-hidden rounded-full bg-secondary/30">
                  <div className="h-full bg-[#f0b400] transition-all duration-500 ease-out" style={{ width: `${(step / (wizardSteps.length - 1)) * 100}%` }} />
                </div>
              </div>
            )}

            {submitted ? (
              <div className="flex flex-col items-center gap-6 rounded-2xl border border-border/30 bg-card/30 p-10 text-center backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Agreement Created</h2>
                  <p className="mt-2 text-sm text-muted-foreground">Your enterprise escrow has been submitted.</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" onClick={copyJson} className="rounded-full border-border/30 bg-card/40 text-sm font-medium hover:bg-white/10 hover:text-white transition-all">{copiedJson ? "Copied" : "Copy Details"}</Button>
                  <Button onClick={() => { resetWizard(); setView("agreements") }}
                    className="rounded-full bg-[#f0b400] text-background font-semibold hover:bg-[#d4a000] transition-all shadow-[0_4px_16px_rgba(240,180,0,0.25)]">View Agreements</Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/30 bg-card/30 p-6 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] sm:p-8">

                {/* Step 0: Escrow Type */}
                {step === 0 && (
                  <div className="flex flex-col gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground sm:text-xl">How should the payment work?</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Choose how funds will be released.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {([
                        { id: "single" as const, label: "One-time Payment", desc: "Funds released all at once upon completion.", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M16 8l-8 8M8 8h8v8"/></svg> },
                        { id: "multi" as const, label: "Milestone-based", desc: "Funds released in stages as work progresses.", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                      ]).map((opt) => (
                        <button key={opt.id} onClick={() => { setEscrowType(opt.id); if (opt.id === "single") setMilestones([{ description: "Full delivery", amount: "" }]) }}
                          className={cn("flex flex-col gap-3 rounded-xl border p-6 text-left transition-all duration-300",
                            escrowType === opt.id ? "border-[#f0b400]/40 bg-[#f0b400]/5 shadow-[0_0_0_1px_rgba(240,180,0,0.15)]" : "border-border/30 bg-card/20 hover:border-white/15 hover:bg-white/5"
                          )}>
                          <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl transition-colors", escrowType === opt.id ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-secondary/30 text-muted-foreground")}>{opt.icon}</div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 1: Use Case */}
                {step === 1 && (
                  <div className="flex flex-col gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground sm:text-xl">What is this agreement for?</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Select the business category.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {useCases.map((uc) => (
                        <button key={uc.id} onClick={() => setUseCase(uc.id)}
                          className={cn("flex items-center gap-3 rounded-xl border p-4 text-left transition-all duration-300",
                            useCase === uc.id ? "border-[#f0b400]/40 bg-[#f0b400]/5" : "border-border/30 bg-card/20 hover:border-white/15 hover:bg-white/5"
                          )}>
                          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                            useCase === uc.id ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-secondary/30 text-muted-foreground"
                          )}>
                            {uc.icon === "car" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>}
                            {uc.icon === "plane" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>}
                            {uc.icon === "tag" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>}
                            {uc.icon === "home" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>}
                            {uc.icon === "calendar" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
                          </div>
                          <span className="text-sm font-medium text-foreground">{uc.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 2: Agreement Info */}
                {step === 2 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground sm:text-xl">Agreement Information</h3>
                      <p className="mt-1 text-sm text-muted-foreground">What is the agreement about?</p>
                    </div>
                    <FormInput label="Title" value={title} onChange={setTitle} placeholder="e.g. Fleet Vehicle Purchase Q2" />
                    <FormTextarea label="Description" value={description} onChange={setDescription} placeholder="Scope of the enterprise agreement..." />
                  </div>
                )}

                {/* Step 3: Wallets + Amount */}
                {step === 3 && (
                  <div className="flex flex-col gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground sm:text-xl">Payment Details</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Enter the wallet addresses and payment amount.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormInput label="Service Provider Wallet" value={spWallet} onChange={setSpWallet} placeholder="G...VENDOR" info="Who receives the funds" />
                      <FormInput label="Release Signer Wallet" value={signerWallet} onChange={setSignerWallet} placeholder="G...SIGNER" info="Optional, defaults to you" />
                    </div>
                    {escrowType === "single" ? (
                      <FormInput label="Amount" value={milestones[0]?.amount || ""} onChange={(v) => updateMilestone(0, "amount", v)} placeholder="50000" type="number" info="USDC" />
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment Stages</p>
                          <button onClick={addMilestone} className="text-xs font-semibold text-[#f0b400] hover:underline transition-all">+ Add Stage</button>
                        </div>
                        {milestones.map((m, i) => (
                          <div key={i} draggable onDragStart={() => handleDragStart(i)} onDragEnter={() => handleDragEnter(i)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}
                            className="flex flex-col gap-2 rounded-xl border border-border/30 bg-card/20 p-4 transition-all sm:flex-row sm:items-center sm:gap-3 cursor-grab active:cursor-grabbing">
                            <div className="flex items-center gap-3 sm:gap-2">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted-foreground/40"><circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/></svg>
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0b400]/10 text-xs font-bold text-[#f0b400]">{i + 1}</span>
                            </div>
                            <input value={m.description} onChange={(e) => updateMilestone(i, "description", e.target.value)} placeholder="Stage description..."
                              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none" />
                            <input value={m.amount} onChange={(e) => updateMilestone(i, "amount", e.target.value)} placeholder="Amount" type="number"
                              className="w-28 rounded-lg border border-border/30 bg-card/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/30 focus:border-[#f0b400]/40 focus:outline-none" />
                            {milestones.length > 1 && (
                              <button onClick={() => removeMilestone(i)} className="self-end text-muted-foreground/50 hover:text-destructive transition-colors sm:self-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
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

                {/* Step 4: Review */}
                {step === 4 && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground sm:text-xl">Review Your Agreement</h3>
                      <p className="mt-1 text-sm text-muted-foreground">Confirm everything before creating the secure payment.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-border/30 bg-secondary/15 p-5">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Agreement</p>
                        <p className="text-sm font-semibold text-foreground">{title || "Untitled"}</p>
                        <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">{description || "No description"}</p>
                        <p className="mt-3 text-[10px] text-muted-foreground/50">{useCases.find((u) => u.id === useCase)?.label} &middot; {escrowType === "single" ? "One-time" : "Milestone-based"}</p>
                      </div>
                      <div className="rounded-xl border border-border/30 bg-secondary/15 p-5">
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Protected Funds</p>
                        <p className="text-3xl font-bold text-[#f0b400]">{totalAmount.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">USDC</span></p>
                        <p className="mt-2 text-xs text-muted-foreground">Platform fee: {platformFee} USDC (1%)</p>
                      </div>
                    </div>
                    <div className="rounded-xl border border-border/30 bg-secondary/15 p-5">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Participants</p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="flex items-center gap-3 rounded-lg bg-card/20 px-4 py-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0b400]/10 text-[#f0b400]">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground">Service Provider</p>
                            <p className="truncate text-xs font-medium text-foreground">{spWallet || "Not set"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg bg-card/20 px-4 py-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-muted-foreground">Release Signer</p>
                            <p className="truncate text-xs font-medium text-foreground">{signerWallet || "You (connected wallet)"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    {escrowType === "multi" && (
                      <div className="rounded-xl border border-border/30 bg-secondary/15 p-5">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Payment Stages</p>
                        <div className="flex flex-col gap-2">
                          {milestones.map((m, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg bg-card/20 px-4 py-2.5">
                              <div className="flex items-center gap-3">
                                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#f0b400]/10 text-[10px] font-bold text-[#f0b400]">{i + 1}</span>
                                <span className="text-sm text-foreground">{m.description || "Untitled"}</span>
                              </div>
                              <span className="text-sm font-semibold text-foreground">{m.amount || "0"} USDC</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="rounded-xl border border-border/20 bg-card/20 p-5">
                      <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">How your funds are protected</p>
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {["You Fund", "Funds Protected", ...(escrowType === "multi" ? milestones.map((m, i) => m.description || `Stage ${i + 1}`) : ["Delivery"]), "Approval", "Release"].map((node, i, arr) => (
                          <React.Fragment key={i}>
                            <span className="rounded-full bg-secondary/30 px-3 py-1.5 text-xs font-medium text-foreground">{node}</span>
                            {i < arr.length - 1 && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground/30"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="mt-8 flex items-center justify-between border-t border-border/15 pt-6">
                  <Button variant="ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}
                    className="rounded-full text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-20 transition-all">Back</Button>
                  {step < wizardSteps.length - 1 ? (
                    <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}
                      className="rounded-full bg-[#f0b400] px-8 text-sm font-semibold text-background hover:bg-[#d4a000] disabled:opacity-20 shadow-[0_4px_16px_rgba(240,180,0,0.25)] transition-all duration-300">Continue</Button>
                  ) : (
                    <Button onClick={() => setSubmitted(true)}
                      className="rounded-full bg-[#f0b400] px-8 text-sm font-semibold text-background hover:bg-[#d4a000] shadow-[0_4px_16px_rgba(240,180,0,0.25)] transition-all duration-300">Create Secure Payment</Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
