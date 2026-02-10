"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ThalosLoader } from "@/components/thalos-loader"

/* ────────────────────────────────────────────────
   Step wizard data (enterprise-focused)
   ──────────────────────────────────────────────── */

const wizardSteps = ["Select Services", "Identity & Roles", "Payment Logic", "Review"]

const services = [
  { id: "onramp", label: "Fiat to USDC On-ramp", description: "Multi-currency on/off ramp for global payments.", icon: "arrow-up" },
  { id: "escrow", label: "Escrow (Protected Funds)", description: "Multi-party escrow with custom roles and conditions.", icon: "lock" },
  { id: "milestones", label: "Staged Payments (Milestones)", description: "Release funds across multiple project stages.", icon: "layers" },
  { id: "accumulative", label: "Accumulative Payments (Installments)", description: "Collect installments toward a target amount at scale.", icon: "trending" },
  { id: "yield", label: "Yield on Idle Funds", description: "Enterprise yield on idle capital while held in escrow.", icon: "sparkle", optional: true },
]

const roles = [
  { id: "sender", label: "Sender (Payer)", description: "The party initiating and funding payments." },
  { id: "receiver", label: "Receiver (Seller / Provider)", description: "The party receiving funds upon conditions met." },
  { id: "platform", label: "Platform (Intermediary)", description: "Your platform managing the payment flow.", optional: false },
]

const paymentLogic = [
  { id: "one-time", label: "One-time Payment", description: "A single payment released upon condition." },
  { id: "milestones", label: "Payments by Milestones", description: "Funds released incrementally per deliverable." },
  { id: "accumulation", label: "Monthly Accumulation", description: "Monthly contributions until target amount reached." },
]

/* ────────────────────────────────────────────────
   Drag-and-drop enterprise modules
   ──────────────────────────────────────────────── */

interface ServiceModule {
  id: string
  label: string
  description: string
  icon: string
  color: string
  category: "infrastructure" | "commerce" | "compliance" | "advanced"
}

const businessModules: ServiceModule[] = [
  { id: "multi-escrow", label: "Multi-Party Escrow", description: "N-party escrow with custom roles", icon: "users", color: "#3b82f6", category: "infrastructure" },
  { id: "fiat-gateway", label: "Fiat Gateway", description: "Multi-currency on/off ramp", icon: "globe", color: "#f0b400", category: "infrastructure" },
  { id: "api-bridge", label: "API Bridge", description: "REST & webhook integrations", icon: "code", color: "#8b5cf6", category: "infrastructure" },
  { id: "marketplace-engine", label: "Marketplace Engine", description: "Buyer-seller payment orchestration", icon: "store", color: "#f59e0b", category: "commerce" },
  { id: "travel-accum", label: "Travel Accumulator", description: "Installment travel package flows", icon: "plane", color: "#06b6d4", category: "commerce" },
  { id: "staged-release", label: "Staged Release", description: "Multi-stage conditional releases", icon: "layers", color: "#10b981", category: "commerce" },
  { id: "kyc-module", label: "KYC / AML", description: "Identity verification pipeline", icon: "shield", color: "#ef4444", category: "compliance" },
  { id: "audit-trail", label: "Audit Trail", description: "Full transaction logging", icon: "scroll", color: "#64748b", category: "compliance" },
  { id: "yield-pool", label: "Yield Pool", description: "Enterprise yield on idle capital", icon: "trending", color: "#a855f7", category: "advanced" },
  { id: "auto-settlement", label: "Auto Settlement", description: "Scheduled fund settlements", icon: "clock", color: "#22c55e", category: "advanced" },
]

/* ────────────────────────────────────────────────
   Icons
   ──────────────────────────────────────────────── */

const iconMap: Record<string, React.ReactNode> = {
  "arrow-up": <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  lock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  layers: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  trending: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  sparkle: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/></svg>,
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  globe: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  code: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  store: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  plane: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>,
  shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  scroll: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 21h12a2 2 0 002-2v-2H10v2a2 2 0 01-2 2z"/><path d="M14 17V5a2 2 0 00-2-2H4a2 2 0 00-2 2v12a4 4 0 004 4"/><path d="M14 5h6a2 2 0 012 2v10"/></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
}

const serviceIconMap: Record<string, React.ReactNode> = {
  "arrow-up": <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>,
  lock: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  layers: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  trending: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  sparkle: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/></svg>,
}

const enterpriseCategories = [
  { key: "infrastructure" as const, label: "Infrastructure" },
  { key: "commerce" as const, label: "Commerce" },
  { key: "compliance" as const, label: "Compliance" },
  { key: "advanced" as const, label: "Advanced" },
]

/* ────────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────────── */

export default function BusinessDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"builder" | "wizard">("wizard")

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1400)
    return () => clearTimeout(timer)
  }, [])

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set(["onramp", "escrow", "milestones"]))
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set(["sender", "receiver", "platform"]))
  const [selectedLogic, setSelectedLogic] = useState("milestones")

  // Drag-and-drop state
  const [pipeline, setPipeline] = useState<string[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragSourceRef = useRef<"palette" | "pipeline">("palette")
  const dragPipelineIndexRef = useRef<number>(-1)

  const toggleService = (id: string) => {
    setSelectedServices((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleRole = (id: string) => {
    setSelectedRoles((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDragStart = (id: string, source: "palette" | "pipeline", pipelineIndex?: number) => {
    setDraggingId(id)
    dragSourceRef.current = source
    dragPipelineIndexRef.current = pipelineIndex ?? -1
  }

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (!draggingId) return
    if (dragSourceRef.current === "palette") {
      if (!pipeline.includes(draggingId)) {
        const n = [...pipeline]
        n.splice(dropIndex, 0, draggingId)
        setPipeline(n)
      }
    } else {
      const from = dragPipelineIndexRef.current
      if (from !== dropIndex && from !== -1) {
        const n = [...pipeline]
        const [moved] = n.splice(from, 1)
        n.splice(dropIndex > from ? dropIndex - 1 : dropIndex, 0, moved)
        setPipeline(n)
      }
    }
    setDraggingId(null)
    setDragOverIndex(null)
  }, [draggingId, pipeline])

  const handleDropOnCanvas = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!draggingId) return
    if (dragSourceRef.current === "palette" && !pipeline.includes(draggingId)) {
      setPipeline([...pipeline, draggingId])
    }
    setDraggingId(null)
    setDragOverIndex(null)
  }, [draggingId, pipeline])

  const removeFromPipeline = (id: string) => setPipeline(pipeline.filter((m) => m !== id))

  if (loading) return <ThalosLoader />

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar - matching landing navbar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/10 backdrop-blur-md">
        <nav className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="group flex items-center [perspective:800px]">
            <Image
              src="/thalos-icon.png"
              alt="Thalos"
              width={250}
              height={250}
              className="h-36 w-auto object-contain brightness-0 invert transition-transform duration-700 ease-in-out [transform-style:preserve-3d] group-hover:[transform:rotateY(360deg)]"
              priority
            />
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

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Enterprise Workspace</h1>
          <p className="mt-1 text-muted-foreground">Business / Enterprise profile -- Architect your payment platform at scale</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Active Flows", value: "12", sub: "running" },
            { label: "Total Volume", value: "$2.4M", sub: "USDC" },
            { label: "APIs Connected", value: "8", sub: "endpoints" },
            { label: "Yield Earned", value: "$12.5K", sub: "this month" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border/40 bg-card/40 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-[#f0b400]/30 hover:shadow-[0_4px_24px_rgba(240,180,0,0.08)]">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <p className="text-2xl font-semibold text-foreground">{s.value}</p>
                <span className="text-xs text-muted-foreground">{s.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tab Switch */}
        <div className="mb-6 flex gap-2">
          {[
            { id: "wizard" as const, label: "Platform Builder (Wizard)" },
            { id: "builder" as const, label: "Drag & Drop Builder" },
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

        {/* ─── WIZARD TAB ─── */}
        {activeTab === "wizard" && (
          <div className="animate-fade-in-up">
            <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
              {wizardSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(i)}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                      "shadow-[0_2px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
                      i === currentStep
                        ? "bg-[#f0b400] text-background shadow-[0_4px_16px_rgba(240,180,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
                        : i < currentStep
                          ? "bg-[#f0b400]/10 text-[#f0b400]"
                          : "bg-secondary text-muted-foreground"
                    )}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs">
                      {i < currentStep ? (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : i + 1}
                    </span>
                    <span className="hidden sm:inline">{step}</span>
                  </button>
                  {i < wizardSteps.length - 1 && <div className={cn("h-px w-6", i < currentStep ? "bg-[#f0b400]" : "bg-border")} />}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border/40 bg-card/40 p-6 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)] md:p-10">
              {currentStep === 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Select Services</h3>
                  <p className="mb-4 text-sm text-muted-foreground">Toggle the building blocks for your enterprise payment platform.</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {services.map((service) => (
                      <button key={service.id} onClick={() => toggleService(service.id)} className={cn("flex items-start gap-4 rounded-xl border p-5 text-left transition-all duration-300", "shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]", selectedServices.has(service.id) ? "border-[#f0b400]/40 bg-[#f0b400]/5 shadow-[0_2px_16px_rgba(240,180,0,0.1)]" : "border-border hover:border-[#f0b400]/30 hover:bg-[#f0b400]/5")}>
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors", selectedServices.has(service.id) ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-secondary text-muted-foreground")}>
                          {serviceIconMap[service.icon] || iconMap[service.icon]}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{service.label}</p>
                            {service.optional && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">Optional</span>}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">{service.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="flex flex-col gap-4">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Identity & Roles</h3>
                  <p className="mb-4 text-sm text-muted-foreground">Define the participants in your payment flow.</p>
                  <div className="flex flex-col gap-3">
                    {roles.map((role) => (
                      <button key={role.id} onClick={() => toggleRole(role.id)} className={cn("flex items-center gap-4 rounded-xl border p-5 text-left transition-all duration-300", "shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]", selectedRoles.has(role.id) ? "border-[#f0b400]/40 bg-[#f0b400]/5 shadow-[0_2px_16px_rgba(240,180,0,0.1)]" : "border-border hover:border-[#f0b400]/30 hover:bg-[#f0b400]/5")}>
                        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors", selectedRoles.has(role.id) ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-secondary text-muted-foreground")}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
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

              {currentStep === 2 && (
                <div className="flex flex-col gap-4">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Payment Logic</h3>
                  <p className="mb-4 text-sm text-muted-foreground">Choose how funds are released in your escrow flow.</p>
                  <div className="flex flex-col gap-3">
                    {paymentLogic.map((logic) => (
                      <button key={logic.id} onClick={() => setSelectedLogic(logic.id)} className={cn("flex items-center gap-4 rounded-xl border p-5 text-left transition-all duration-300", "shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]", selectedLogic === logic.id ? "border-[#f0b400]/40 bg-[#f0b400]/5 shadow-[0_2px_16px_rgba(240,180,0,0.1)]" : "border-border hover:border-[#f0b400]/30 hover:bg-[#f0b400]/5")}>
                        <div className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors", selectedLogic === logic.id ? "border-[#f0b400]" : "border-muted-foreground")}>
                          {selectedLogic === logic.id && <div className="h-2.5 w-2.5 rounded-full bg-[#f0b400]" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{logic.label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{logic.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="flex flex-col gap-6">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Review Your Configuration</h3>
                  <div className="flex flex-col gap-4">
                    {[
                      { title: "Services", items: services.filter((s) => selectedServices.has(s.id)).map((s) => s.label) },
                      { title: "Roles", items: roles.filter((r) => selectedRoles.has(r.id)).map((r) => r.label) },
                      { title: "Payment Logic", items: [paymentLogic.find((l) => l.id === selectedLogic)?.label ?? ""] },
                    ].map((group) => (
                      <div key={group.title} className="rounded-xl border border-border/40 bg-secondary/20 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.03)]">
                        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">{group.title}</p>
                        <div className="flex flex-wrap gap-2">
                          {group.items.map((item) => (
                            <span key={item} className="rounded-full bg-[#f0b400]/10 px-3 py-1 text-xs font-medium text-[#f0b400]">{item}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl border border-border/30 bg-card/30 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                    <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Flow Preview</p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {["Platform", "Fiat Gateway", "USDC", "Multi-Party Escrow", selectedLogic === "milestones" ? "Staged Release" : selectedLogic === "accumulation" ? "Accumulation" : "Single Release", "Recipients"].map((node, i, arr) => (
                        <div key={node} className="flex items-center gap-3">
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

              <div className="mt-8 flex items-center justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0} className="rounded-full border-border/60 text-foreground shadow-[0_2px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-[#f0b400]/10 hover:text-[#f0b400] hover:border-[#f0b400]/30 transition-all duration-300">
                  Back
                </Button>
                {currentStep < wizardSteps.length - 1 ? (
                  <Button onClick={() => setCurrentStep(Math.min(wizardSteps.length - 1, currentStep + 1))} className="rounded-full bg-[#f0b400] text-background shadow-[0_4px_16px_rgba(240,180,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#ffd000] hover:shadow-[0_6px_24px_rgba(240,180,0,0.35)] transition-all duration-300">
                    Next Step
                  </Button>
                ) : (
                  <Button className="rounded-full bg-[#f0b400] text-background shadow-[0_4px_16px_rgba(240,180,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#ffd000] hover:shadow-[0_6px_24px_rgba(240,180,0,0.35)] transition-all duration-300">
                    Create Payment Flow
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── DRAG & DROP TAB ─── */}
        {activeTab === "builder" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 animate-fade-in-up">
            <div className="lg:col-span-4">
              <div className="sticky top-24 rounded-2xl border border-border/40 bg-card/40 p-5 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Enterprise Modules</h3>
                <p className="mb-4 text-xs text-muted-foreground">Drag modules to the canvas to architect your platform.</p>
                {enterpriseCategories.map((cat) => (
                  <div key={cat.key} className="mb-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">{cat.label}</p>
                    <div className="flex flex-col gap-2">
                      {businessModules.filter((m) => m.category === cat.key).map((mod) => {
                        const inPipeline = pipeline.includes(mod.id)
                        return (
                          <div key={mod.id} draggable={!inPipeline} onDragStart={() => handleDragStart(mod.id, "palette")} onDragEnd={() => { setDraggingId(null); setDragOverIndex(null) }} className={cn("flex items-center gap-3 rounded-xl border p-3 transition-all duration-200", "shadow-[0_2px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]", inPipeline ? "border-border/30 bg-secondary/20 opacity-40 cursor-not-allowed" : "border-border/40 bg-card/60 cursor-grab hover:border-[#f0b400]/30 hover:shadow-[0_2px_12px_rgba(240,180,0,0.1)] active:cursor-grabbing")}>
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${mod.color}15`, color: mod.color }}>
                              {iconMap[mod.icon]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{mod.label}</p>
                              <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
                            </div>
                            {inPipeline && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto shrink-0 text-[#f0b400]"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className={cn("min-h-[520px] rounded-2xl border-2 border-dashed p-6 transition-all duration-300", pipeline.length === 0 && !draggingId ? "border-border/30 bg-card/20" : draggingId ? "border-[#f0b400]/40 bg-[#f0b400]/5" : "border-border/40 bg-card/30", "shadow-[0_8px_32px_rgba(0,0,0,0.15)]")} onDragOver={(e) => e.preventDefault()} onDrop={handleDropOnCanvas}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Platform Architecture</h3>
                  {pipeline.length > 0 && <Button variant="ghost" size="sm" onClick={() => setPipeline([])} className="text-xs text-muted-foreground hover:text-[#f0b400]">Clear All</Button>}
                </div>

                {pipeline.length === 0 ? (
                  <div className="flex h-[430px] flex-col items-center justify-center gap-3 text-center">
                    <div className="rounded-2xl border border-dashed border-border/50 p-6">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 text-muted-foreground/40"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
                      <p className="text-sm text-muted-foreground/60">Drag enterprise modules here</p>
                      <p className="text-xs text-muted-foreground/40 mt-1">Build your platform architecture visually</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {pipeline.map((moduleId, index) => {
                        const mod = businessModules.find((m) => m.id === moduleId)
                        if (!mod) return null
                        return (
                          <div key={mod.id} className="flex items-center gap-2">
                            <div onDragOver={(e) => handleDragOver(e, index)} onDrop={(e) => handleDrop(e, index)} className={cn("h-16 w-1 rounded-full transition-all", dragOverIndex === index ? "bg-[#f0b400] w-2" : "bg-transparent")} />
                            <div draggable onDragStart={() => handleDragStart(mod.id, "pipeline", index)} onDragEnd={() => { setDraggingId(null); setDragOverIndex(null) }} className={cn("group relative flex items-center gap-3 rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all duration-200", "shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]", "border-border/40 bg-card/60 hover:border-[#f0b400]/30", draggingId === mod.id && "opacity-50 scale-95")}>
                              <button onClick={() => removeFromPipeline(mod.id)} className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-card border border-border text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground hover:border-destructive" aria-label={`Remove ${mod.label}`}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              </button>
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${mod.color}15`, color: mod.color }}>{iconMap[mod.icon]}</div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{mod.label}</p>
                                <p className="text-xs text-muted-foreground">{mod.description}</p>
                              </div>
                            </div>
                            {index < pipeline.length - 1 && <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-[#f0b400]/40"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
                            {index === pipeline.length - 1 && <div onDragOver={(e) => handleDragOver(e, index + 1)} onDrop={(e) => handleDrop(e, index + 1)} className={cn("h-16 w-1 rounded-full transition-all", dragOverIndex === index + 1 ? "bg-[#f0b400] w-2" : "bg-transparent")} />}
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-6 rounded-xl border border-border/30 bg-secondary/20 p-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Architecture Summary</p>
                      <div className="flex flex-wrap gap-2">
                        {pipeline.map((id) => {
                          const mod = businessModules.find((m) => m.id === id)
                          return mod ? <span key={id} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${mod.color}15`, color: mod.color }}>{mod.label}</span> : null
                        })}
                      </div>
                      <div className="mt-4 flex gap-3">
                        <Button className="rounded-full bg-[#f0b400] text-background shadow-[0_4px_20px_rgba(240,180,0,0.25)] hover:bg-[#ffd000] hover:shadow-[0_6px_28px_rgba(240,180,0,0.35)] transition-all duration-300">Deploy Platform</Button>
                        <Button variant="outline" className="rounded-full border-border/60 text-muted-foreground hover:text-[#f0b400] hover:border-[#f0b400]/30 hover:bg-[#f0b400]/10 transition-all duration-300 bg-transparent">Export Config</Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
