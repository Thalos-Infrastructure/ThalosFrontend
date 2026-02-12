"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThalosLoader } from "@/components/thalos-loader"

/* ────────────────────────────────────────────────
   Agreement Wizard Steps
   ──────────────────────────────────────────────── */

const agreementSteps = ["Agreement Type", "Seller Info", "Buyer Info", "Agreement Details", "Review"]

/* ────────────────────────────────────────────────
   Escrow Builder Steps  
   ──────────────────────────────────────────────── */

const builderSteps = ["Escrow Type", "Roles", "Configure", "Milestones", "Review"]

const escrowTypes = [
  {
    id: "single",
    label: "Single Release",
    description: "One-time release of funds when conditions are met. Best for simple purchases, freelance gigs, or service payments.",
    icon: "zap",
  },
  {
    id: "milestone",
    label: "Milestone Release",
    description: "Progressive fund release based on deliverable stages. Ideal for projects, contracts, and phased work.",
    icon: "layers",
  },
]

const builderRoles = [
  { id: "service_provider", label: "Service Provider", description: "Can update milestone status and raise disputes." },
  { id: "approver", label: "Approver", description: "Validates milestone completion, can raise disputes." },
  { id: "platform", label: "Platform Address", description: "Can make changes before funding. Receives platform fee.", optional: true },
  { id: "release_signer", label: "Release Signer", description: "Executes the final funds release." },
  { id: "dispute_resolver", label: "Dispute Resolver", description: "Arbitrates when disputes are raised. Can re-route funds." },
  { id: "receiver", label: "Receiver", description: "Final destination of released funds." },
]

/* ────────────────────────────────────────────────
   Icons
   ──────────────────────────────────────────────── */

const iconMap: Record<string, React.ReactNode> = {
  zap: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>,
  layers: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
}

/* ────────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────────── */

export default function PersonalDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"agreement" | "builder">("agreement")

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400)
    return () => clearTimeout(timer)
  }, [])

  /* ── Agreement Wizard State ── */
  const [agStep, setAgStep] = useState(0)
  const [agType, setAgType] = useState<"one-time" | "milestone" | null>(null)
  const [sellerName, setSellerName] = useState("")
  const [sellerWallet, setSellerWallet] = useState("")
  const [sellerEmail, setSellerEmail] = useState("")
  const [buyerName, setBuyerName] = useState("")
  const [buyerWallet, setBuyerWallet] = useState("")
  const [buyerEmail, setBuyerEmail] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [platformFee, setPlatformFee] = useState("2")
  const [stages, setStages] = useState([{ name: "Stage 1", amount: "" }])
  const [agSubmitted, setAgSubmitted] = useState(false)

  /* ── Builder State ── */
  const [bStep, setBStep] = useState(0)
  const [bEscrowType, setBEscrowType] = useState<"single" | "milestone" | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set(["service_provider", "approver", "release_signer", "receiver"]))
  const [bTitle, setBTitle] = useState("")
  const [bDescription, setBDescription] = useState("")
  const [bAmount, setBAmount] = useState("")
  const [bPlatformFee, setBPlatformFee] = useState("2")
  const [bStages, setBStages] = useState([{ name: "Milestone 1", amount: "" }])
  const [bSubmitted, setBSubmitted] = useState(false)

  const addStage = () => setStages([...stages, { name: `Stage ${stages.length + 1}`, amount: "" }])
  const removeStage = (i: number) => stages.length > 1 && setStages(stages.filter((_, idx) => idx !== i))
  const updateStage = (i: number, field: "name" | "amount", val: string) => {
    const n = [...stages]; n[i] = { ...n[i], [field]: val }; setStages(n)
  }

  const addBStage = () => setBStages([...bStages, { name: `Milestone ${bStages.length + 1}`, amount: "" }])
  const removeBStage = (i: number) => bStages.length > 1 && setBStages(bStages.filter((_, idx) => idx !== i))
  const updateBStage = (i: number, field: "name" | "amount", val: string) => {
    const n = [...bStages]; n[i] = { ...n[i], [field]: val }; setBStages(n)
  }

  const toggleRole = (id: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  /* ── Input Component ── */
  const Input = ({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) => (
    <div>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-border/50 bg-card/40 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#f0b400]/40 focus:outline-none focus:ring-1 focus:ring-[#f0b400]/20 transition-all"
      />
    </div>
  )

  /* ── Step Indicator Renderer ── */
  const StepIndicator = ({ steps, current, onStep }: { steps: string[]; current: number; onStep: (i: number) => void }) => (
    <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          <button
            onClick={() => onStep(i)}
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
              "shadow-[0_2px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
              i === current
                ? "bg-[#f0b400] text-background shadow-[0_4px_16px_rgba(240,180,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
                : i < current
                  ? "bg-[#f0b400]/10 text-[#f0b400]"
                  : "bg-secondary text-muted-foreground"
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs">
              {i < current ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              ) : i + 1}
            </span>
            <span className="hidden sm:inline">{step}</span>
          </button>
          {i < steps.length - 1 && (
            <div className={cn("h-px w-6", i < current ? "bg-[#f0b400]" : "bg-border")} />
          )}
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
              <div className="h-8 w-8 rounded-full bg-[#f0b400]/10 flex items-center justify-center text-[#f0b400]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <span className="text-sm text-white/70 font-medium hidden sm:inline">Personal Account</span>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-full border-white/20 bg-white/5 text-white/70 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)] hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-300">
                Sign Out
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Personal Workspace</h1>
          <p className="mt-1 text-muted-foreground">{"Freelancer & Retail profile -- Create agreements and build escrow flows"}</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Active Agreements", value: "3" },
            { label: "Total Protected", value: "$8,200" },
            { label: "Yield Earned", value: "+$20.80" },
            { label: "Completed", value: "7" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border/40 bg-card/40 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-[#f0b400]/30 hover:shadow-[0_4px_24px_rgba(240,180,0,0.08)]">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tab Switch */}
        <div className="mb-6 flex gap-2">
          {[
            { id: "agreement" as const, label: "Create Agreement" },
            { id: "builder" as const, label: "Escrow Builder" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300",
                "shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
                activeTab === tab.id
                  ? "border-[#f0b400]/50 bg-[#f0b400] text-background shadow-[0_4px_20px_rgba(240,180,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:border-[#f0b400]/30 hover:text-[#f0b400] hover:bg-[#f0b400]/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── CREATE AGREEMENT TAB ─── */}
        {activeTab === "agreement" && (
          <div className="animate-fade-in-up">
            {!agSubmitted ? (
              <>
                <StepIndicator steps={agreementSteps} current={agStep} onStep={setAgStep} />
                <div className="rounded-2xl border border-border/40 bg-card/40 p-6 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)] md:p-10">
                  {/* Step 1: Agreement Type */}
                  {agStep === 0 && (
                    <div className="flex flex-col gap-4">
                      <h3 className="mb-2 text-lg font-semibold text-foreground">Choose Agreement Type</h3>
                      <p className="mb-4 text-sm text-muted-foreground">Select the type of payment agreement you want to create.</p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {[
                          { id: "one-time" as const, label: "One-Time Payment", desc: "Single payment released when both parties confirm. Best for purchases, gigs, or services.", icon: "zap" },
                          { id: "milestone" as const, label: "Milestone-Based", desc: "Funds released progressively per deliverable stage. Ideal for projects and phased contracts.", icon: "layers" },
                        ].map((t) => (
                          <button key={t.id} onClick={() => setAgType(t.id)}
                            className={cn(
                              "flex flex-col items-center gap-4 rounded-2xl border p-8 text-center transition-all duration-300",
                              "shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
                              agType === t.id
                                ? "border-[#f0b400]/40 bg-[#f0b400]/5 shadow-[0_4px_24px_rgba(240,180,0,0.12)]"
                                : "border-border hover:border-[#f0b400]/30 hover:bg-[#f0b400]/5"
                            )}>
                            <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
                              agType === t.id ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-secondary text-muted-foreground")}>
                              {iconMap[t.icon]}
                            </div>
                            <div>
                              <p className="text-base font-semibold text-foreground">{t.label}</p>
                              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Seller Info */}
                  {agStep === 1 && (
                    <div className="flex flex-col gap-5">
                      <h3 className="mb-2 text-lg font-semibold text-foreground">Seller Information</h3>
                      <p className="mb-2 text-sm text-muted-foreground">The party providing the service or product.</p>
                      <Input label="Full Name" value={sellerName} onChange={setSellerName} placeholder="John Doe" />
                      <Input label="Stellar Wallet Address" value={sellerWallet} onChange={setSellerWallet} placeholder="G..." />
                      <Input label="Email (optional)" value={sellerEmail} onChange={setSellerEmail} placeholder="john@example.com" type="email" />
                    </div>
                  )}

                  {/* Step 3: Buyer Info */}
                  {agStep === 2 && (
                    <div className="flex flex-col gap-5">
                      <h3 className="mb-2 text-lg font-semibold text-foreground">Buyer Information</h3>
                      <p className="mb-2 text-sm text-muted-foreground">The party funding and approving the agreement.</p>
                      <Input label="Full Name" value={buyerName} onChange={setBuyerName} placeholder="Jane Smith" />
                      <Input label="Stellar Wallet Address" value={buyerWallet} onChange={setBuyerWallet} placeholder="G..." />
                      <Input label="Email (optional)" value={buyerEmail} onChange={setBuyerEmail} placeholder="jane@example.com" type="email" />
                    </div>
                  )}

                  {/* Step 4: Agreement Details */}
                  {agStep === 3 && (
                    <div className="flex flex-col gap-5">
                      <h3 className="mb-2 text-lg font-semibold text-foreground">Agreement Details</h3>
                      <Input label="Agreement Title" value={title} onChange={setTitle} placeholder="Website Development" />
                      <div>
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the scope of work..."
                          className="h-24 w-full rounded-xl border border-border/50 bg-card/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#f0b400]/40 focus:outline-none focus:ring-1 focus:ring-[#f0b400]/20 transition-all resize-none" />
                      </div>
                      {agType === "one-time" ? (
                        <Input label="Total Amount (USDC)" value={amount} onChange={setAmount} placeholder="1000" type="number" />
                      ) : (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Payment Stages</label>
                            <Button variant="ghost" size="sm" onClick={addStage} className="text-xs text-[#f0b400] hover:bg-[#f0b400]/10">+ Add Stage</Button>
                          </div>
                          {stages.map((s, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0b400]/10 text-xs font-bold text-[#f0b400]">{i + 1}</span>
                              <input value={s.name} onChange={(e) => updateStage(i, "name", e.target.value)} placeholder="Stage name"
                                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
                              <input value={s.amount} onChange={(e) => updateStage(i, "amount", e.target.value)} placeholder="Amount" type="number"
                                className="w-24 bg-transparent text-right text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
                              <span className="text-xs text-muted-foreground">USDC</span>
                              {stages.length > 1 && (
                                <button onClick={() => removeStage(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <Input label="Platform Fee (%)" value={platformFee} onChange={setPlatformFee} placeholder="2" type="number" />
                    </div>
                  )}

                  {/* Step 5: Review */}
                  {agStep === 4 && (
                    <div className="flex flex-col gap-6">
                      <h3 className="mb-2 text-lg font-semibold text-foreground">Review Agreement</h3>
                      {[
                        { title: "Type", items: [agType === "one-time" ? "One-Time Payment" : "Milestone-Based"] },
                        { title: "Seller", items: [sellerName || "Not set", sellerWallet ? `${sellerWallet.slice(0, 6)}...${sellerWallet.slice(-4)}` : "No wallet"] },
                        { title: "Buyer", items: [buyerName || "Not set", buyerWallet ? `${buyerWallet.slice(0, 6)}...${buyerWallet.slice(-4)}` : "No wallet"] },
                        { title: "Details", items: [title || "Untitled", agType === "one-time" ? `${amount || "0"} USDC` : stages.map((s) => `${s.name}: ${s.amount || "0"} USDC`).join(", ")] },
                      ].map((g) => (
                        <div key={g.title} className="rounded-xl border border-border/40 bg-secondary/20 p-5">
                          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{g.title}</p>
                          <div className="flex flex-wrap gap-2">
                            {g.items.map((item) => (
                              <span key={item} className="rounded-full bg-[#f0b400]/10 px-3 py-1 text-xs font-medium text-[#f0b400]">{item}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                      {/* Flow Preview */}
                      <div className="rounded-xl border border-border/30 bg-card/30 p-5">
                        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Flow Preview</p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          {["Buyer Funds", "Protected Escrow", ...(agType === "milestone" ? stages.map((s) => s.name || "Stage") : ["Release"]), "Seller Receives"].map((node, i, arr) => (
                            <div key={`${node}-${i}`} className="flex items-center gap-3">
                              <span className="rounded-lg bg-[#f0b400]/10 px-3 py-1.5 text-xs font-medium text-[#f0b400]">{node}</span>
                              {i < arr.length - 1 && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#f0b400]/40"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="mt-8 flex items-center justify-between">
                    <Button variant="outline" onClick={() => setAgStep(Math.max(0, agStep - 1))} disabled={agStep === 0}
                      className="rounded-full border-border/60 text-foreground shadow-[0_2px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-[#f0b400]/10 hover:text-[#f0b400] hover:border-[#f0b400]/30 transition-all duration-300">
                      Back
                    </Button>
                    {agStep < agreementSteps.length - 1 ? (
                      <Button onClick={() => setAgStep(agStep + 1)}
                        className="rounded-full bg-[#f0b400] text-background shadow-[0_4px_16px_rgba(240,180,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#ffd000] transition-all duration-300">
                        Next Step
                      </Button>
                    ) : (
                      <Button onClick={() => setAgSubmitted(true)}
                        className="rounded-full bg-[#f0b400] text-background shadow-[0_4px_16px_rgba(240,180,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#ffd000] transition-all duration-300">
                        Create Agreement
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* Success */
              <div className="flex flex-col items-center gap-6 rounded-2xl border border-[#f0b400]/20 bg-[#f0b400]/5 p-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f0b400]/10">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Agreement Created</h3>
                <p className="max-w-md text-sm text-muted-foreground">Your agreement has been created. The counterparty will be notified to review and fund the escrow.</p>
                <Button onClick={() => { setAgSubmitted(false); setAgStep(0); setAgType(null); setTitle(""); setDescription(""); setAmount(""); setStages([{ name: "Stage 1", amount: "" }]) }}
                  className="rounded-full bg-[#f0b400] text-background hover:bg-[#ffd000] transition-all duration-300">
                  Create Another
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ─── ESCROW BUILDER TAB ─── */}
        {activeTab === "builder" && (
          <div className="animate-fade-in-up">
            {!bSubmitted ? (
              <>
                <StepIndicator steps={builderSteps} current={bStep} onStep={setBStep} />
                <div className="rounded-2xl border border-border/40 bg-card/40 p-6 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)] md:p-10">
                  {/* Step 1: Escrow Type */}
                  {bStep === 0 && (
                    <div className="flex flex-col gap-4">
                      <h3 className="mb-2 text-lg font-semibold text-foreground">Select Escrow Type</h3>
                      <p className="mb-4 text-sm text-muted-foreground">Choose the smart contract type for your escrow.</p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {escrowTypes.map((t) => (
                          <button key={t.id} onClick={() => setBEscrowType(t.id as "single" | "milestone")}
                            className={cn(
                              "flex flex-col items-center gap-4 rounded-2xl border p-8 text-center transition-all duration-300",
                              "shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
                              bEscrowType === t.id
                                ? "border-[#f0b400]/40 bg-[#f0b400]/5 shadow-[0_4px_24px_rgba(240,180,0,0.12)]"
                                : "border-border hover:border-[#f0b400]/30 hover:bg-[#f0b400]/5"
                            )}>
                            <div className={cn("flex h-14 w-14 items-center justify-center rounded-2xl transition-colors",
                              bEscrowType === t.id ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-secondary text-muted-foreground")}>
                              {iconMap[t.icon]}
                            </div>
                            <div>
                              <p className="text-base font-semibold text-foreground">{t.label}</p>
                              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{t.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Roles */}
                  {bStep === 1 && (
                    <div className="flex flex-col gap-4">
                      <h3 className="mb-2 text-lg font-semibold text-foreground">Escrow Roles</h3>
                      <p className="mb-4 text-sm text-muted-foreground">Define the participants and their roles in the escrow contract.</p>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        {builderRoles.map((role) => (
                          <button key={role.id} onClick={() => toggleRole(role.id)}
                            className={cn(
                              "flex items-start gap-4 rounded-xl border p-5 text-left transition-all duration-300",
                              "shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
                              selectedRoles.has(role.id)
                                ? "border-[#f0b400]/40 bg-[#f0b400]/5 shadow-[0_2px_16px_rgba(240,180,0,0.1)]"
                                : "border-border hover:border-[#f0b400]/30 hover:bg-[#f0b400]/5"
                            )}>
                            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                              selectedRoles.has(role.id) ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-secondary text-muted-foreground")}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground">{role.label}</p>
                                {role.optional && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">Optional</span>}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">{role.description}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Configure */}
                  {bStep === 2 && (
                    <div className="flex flex-col gap-5">
                      <h3 className="mb-2 text-lg font-semibold text-foreground">Configure Escrow</h3>
                      <Input label="Escrow Title" value={bTitle} onChange={setBTitle} placeholder="Project Escrow" />
                      <div>
                        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Description</label>
                        <textarea value={bDescription} onChange={(e) => setBDescription(e.target.value)} placeholder="Describe the escrow terms..."
                          className="h-24 w-full rounded-xl border border-border/50 bg-card/40 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#f0b400]/40 focus:outline-none focus:ring-1 focus:ring-[#f0b400]/20 transition-all resize-none" />
                      </div>
                      {bEscrowType === "single" && (
                        <Input label="Total Amount (USDC)" value={bAmount} onChange={setBAmount} placeholder="5000" type="number" />
                      )}
                      <Input label="Platform Fee (%)" value={bPlatformFee} onChange={setBPlatformFee} placeholder="2" type="number" />
                    </div>
                  )}

                  {/* Step 4: Milestones (only for milestone type, or summary for single) */}
                  {bStep === 3 && (
                    <div className="flex flex-col gap-5">
                      {bEscrowType === "milestone" ? (
                        <>
                          <h3 className="mb-2 text-lg font-semibold text-foreground">Define Milestones</h3>
                          <p className="mb-2 text-sm text-muted-foreground">Add the deliverable stages and their associated amounts.</p>
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Milestones</label>
                            <Button variant="ghost" size="sm" onClick={addBStage} className="text-xs text-[#f0b400] hover:bg-[#f0b400]/10">+ Add Milestone</Button>
                          </div>
                          {bStages.map((s, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-3">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#f0b400]/10 text-xs font-bold text-[#f0b400]">{i + 1}</span>
                              <input value={s.name} onChange={(e) => updateBStage(i, "name", e.target.value)} placeholder="Milestone name"
                                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
                              <input value={s.amount} onChange={(e) => updateBStage(i, "amount", e.target.value)} placeholder="Amount" type="number"
                                className="w-24 bg-transparent text-right text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
                              <span className="text-xs text-muted-foreground">USDC</span>
                              {bStages.length > 1 && (
                                <button onClick={() => removeBStage(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </>
                      ) : (
                        <>
                          <h3 className="mb-2 text-lg font-semibold text-foreground">Release Conditions</h3>
                          <p className="text-sm text-muted-foreground">For a single release escrow, funds are released when both the Approver confirms and the Release Signer executes.</p>
                          <div className="rounded-xl border border-border/40 bg-secondary/20 p-5">
                            <p className="text-sm text-foreground">Total: <span className="font-bold text-[#f0b400]">{bAmount || "0"} USDC</span></p>
                            <p className="mt-2 text-xs text-muted-foreground">Released in a single transaction upon approval and signing.</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Step 5: Review */}
                  {bStep === 4 && (
                    <div className="flex flex-col gap-6">
                      <h3 className="mb-2 text-lg font-semibold text-foreground">Review Escrow Configuration</h3>
                      {[
                        { title: "Escrow Type", items: [bEscrowType === "single" ? "Single Release" : "Milestone Release"] },
                        { title: "Roles", items: builderRoles.filter((r) => selectedRoles.has(r.id)).map((r) => r.label) },
                        { title: "Details", items: [bTitle || "Untitled", bEscrowType === "single" ? `${bAmount || "0"} USDC` : bStages.map((s) => `${s.name}: ${s.amount || "0"} USDC`).join(", ")] },
                        { title: "Platform Fee", items: [`${bPlatformFee}%`] },
                      ].map((g) => (
                        <div key={g.title} className="rounded-xl border border-border/40 bg-secondary/20 p-5">
                          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{g.title}</p>
                          <div className="flex flex-wrap gap-2">
                            {g.items.map((item) => (
                              <span key={item} className="rounded-full bg-[#f0b400]/10 px-3 py-1 text-xs font-medium text-[#f0b400]">{item}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                      {/* Flow Preview */}
                      <div className="rounded-xl border border-border/30 bg-card/30 p-5">
                        <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Escrow Flow</p>
                        <div className="flex flex-wrap items-center justify-center gap-3">
                          {["Funding", "Escrow Lock", ...(bEscrowType === "milestone" ? bStages.map((s) => s.name || "Milestone") : ["Approval"]), "Release", "Receiver"].map((node, i, arr) => (
                            <div key={`${node}-${i}`} className="flex items-center gap-3">
                              <span className="rounded-lg bg-[#f0b400]/10 px-3 py-1.5 text-xs font-medium text-[#f0b400]">{node}</span>
                              {i < arr.length - 1 && (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#f0b400]/40"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="mt-8 flex items-center justify-between">
                    <Button variant="outline" onClick={() => setBStep(Math.max(0, bStep - 1))} disabled={bStep === 0}
                      className="rounded-full border-border/60 text-foreground shadow-[0_2px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-[#f0b400]/10 hover:text-[#f0b400] hover:border-[#f0b400]/30 transition-all duration-300">
                      Back
                    </Button>
                    {bStep < builderSteps.length - 1 ? (
                      <Button onClick={() => setBStep(bStep + 1)}
                        className="rounded-full bg-[#f0b400] text-background shadow-[0_4px_16px_rgba(240,180,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#ffd000] transition-all duration-300">
                        Next Step
                      </Button>
                    ) : (
                      <Button onClick={() => setBSubmitted(true)}
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
                <p className="max-w-md text-sm text-muted-foreground">Your escrow smart contract has been configured. Participants will be notified of their roles.</p>
                <Button onClick={() => { setBSubmitted(false); setBStep(0); setBEscrowType(null); setBTitle(""); setBDescription(""); setBAmount(""); setBStages([{ name: "Milestone 1", amount: "" }]) }}
                  className="rounded-full bg-[#f0b400] text-background hover:bg-[#ffd000] transition-all duration-300">
                  Create Another
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
