"use client"

import React, { useState, useRef, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/* ────────────────────────────────────────────────
   Step wizard data
   ──────────────────────────────────────────────── */

const wizardSteps = ["Select Services", "Identity & Roles", "Payment Logic", "Review"]

const services = [
  { id: "onramp", label: "Fiat to USDC On-ramp", description: "Convert local currencies to USDC via integrated partners.", icon: "arrow-up" },
  { id: "escrow", label: "Escrow (Protected Funds)", description: "Lock funds in a smart contract until conditions are met.", icon: "lock" },
  { id: "milestones", label: "Staged Payments (Milestones)", description: "Release funds progressively based on milestone completion.", icon: "layers" },
  { id: "accumulative", label: "Accumulative Payments (Installments)", description: "Collect installments toward a target amount over time.", icon: "trending" },
  { id: "yield", label: "Yield on Idle Funds", description: "Earn returns on escrowed funds while they are held.", icon: "sparkle", optional: true },
]

const roles = [
  { id: "sender", label: "Sender (Payer)", description: "The party initiating and funding payments." },
  { id: "receiver", label: "Receiver (Seller / Provider)", description: "The party receiving funds upon conditions met." },
  { id: "platform", label: "Platform (Optional)", description: "An intermediary managing the payment flow.", optional: true },
]

const paymentLogic = [
  { id: "one-time", label: "One-time Payment", description: "A single payment released upon condition." },
  { id: "milestones", label: "Payments by Milestones", description: "Funds released incrementally per deliverable." },
  { id: "accumulation", label: "Monthly Accumulation", description: "Monthly contributions until target amount reached." },
]

/* ────────────────────────────────────────────────
   Drag-and-drop module definitions
   ──────────────────────────────────────────────── */

interface ServiceModule {
  id: string
  label: string
  description: string
  icon: string
  color: string
  category: "payment" | "escrow" | "release" | "extras"
}

const availableModules: ServiceModule[] = [
  { id: "fiat-onramp", label: "Fiat On-ramp", description: "Convert local currency to USDC", icon: "arrow-up", color: "#e6b800", category: "payment" },
  { id: "escrow-basic", label: "Basic Escrow", description: "Lock funds until conditions met", icon: "lock", color: "#3b82f6", category: "escrow" },
  { id: "milestone-release", label: "Milestone Release", description: "Release by deliverable stages", icon: "layers", color: "#10b981", category: "release" },
  { id: "one-time-release", label: "One-time Release", description: "Single conditional release", icon: "zap", color: "#8b5cf6", category: "release" },
  { id: "accumulative", label: "Accumulative", description: "Collect until target amount", icon: "trending", color: "#f59e0b", category: "payment" },
  { id: "yield", label: "Yield on Idle", description: "Earn on escrowed funds", icon: "sparkle", color: "#06b6d4", category: "extras" },
  { id: "dispute", label: "Dispute Resolution", description: "Conflict mediation flow", icon: "shield", color: "#ef4444", category: "extras" },
  { id: "notification", label: "Notifications", description: "Email & webhook alerts", icon: "bell", color: "#a855f7", category: "extras" },
]

/* ────────────────────────────────────────────────
   Icons
   ──────────────────────────────────────────────── */

const iconMap: Record<string, React.ReactNode> = {
  "arrow-up": <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  lock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  layers: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  zap: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>,
  trending: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  sparkle: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/></svg>,
  shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
}

const serviceIconMap: Record<string, React.ReactNode> = {
  "arrow-up": <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>,
  lock: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  layers: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  trending: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  sparkle: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/></svg>,
}

const categories = [
  { key: "payment" as const, label: "Payments" },
  { key: "escrow" as const, label: "Escrow" },
  { key: "release" as const, label: "Release" },
  { key: "extras" as const, label: "Extras" },
]

/* ────────────────────────────────────────────────
   Page Component
   ──────────────────────────────────────────────── */

export default function PersonalDashboardPage() {
  const [activeTab, setActiveTab] = useState<"builder" | "wizard">("wizard")

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set(["onramp", "escrow"]))
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set(["sender", "receiver"]))
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/thalos-logo-dark.png" alt="Thalos" width={160} height={44} className="h-9 w-auto object-contain mix-blend-screen" priority />
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-[#e6b800]/10 flex items-center justify-center text-[#e6b800]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <span className="text-sm text-foreground font-medium hidden sm:inline">Personal Account</span>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm" className="rounded-full border-border/60 text-muted-foreground hover:text-[#e6b800] hover:border-[#e6b800]/30 hover:bg-[#e6b800]/10 transition-all duration-300 bg-transparent">
                Sign Out
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Personal Workspace</h1>
          <p className="mt-1 text-muted-foreground">Freelancer & Retail profile -- Build your personal payment flows</p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Active Flows", value: "3" },
            { label: "Total Locked", value: "$8,200" },
            { label: "Yield Earned", value: "+$20.80" },
            { label: "Completed", value: "7" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border/40 bg-card/40 p-5 shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-300 hover:border-[#e6b800]/30 hover:shadow-[0_4px_24px_rgba(230,184,0,0.08)]">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold text-foreground">{s.value}</p>
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
                  ? "border-[#e6b800]/50 bg-[#e6b800] text-background shadow-[0_4px_20px_rgba(230,184,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
                  : "border-border/60 bg-card/40 text-muted-foreground hover:border-[#e6b800]/30 hover:text-[#e6b800] hover:bg-[#e6b800]/5"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ─── WIZARD TAB ─── */}
        {activeTab === "wizard" && (
          <div className="animate-fade-in-up">
            {/* Step Indicators */}
            <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
              {wizardSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentStep(i)}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
                      "shadow-[0_2px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
                      i === currentStep
                        ? "bg-[#e6b800] text-background shadow-[0_4px_16px_rgba(230,184,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]"
                        : i < currentStep
                          ? "bg-[#e6b800]/10 text-[#e6b800]"
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
                  {i < wizardSteps.length - 1 && (
                    <div className={cn("h-px w-6", i < currentStep ? "bg-[#e6b800]" : "bg-border")} />
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-border/40 bg-card/40 p-6 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.04)] md:p-10">
              {/* Step 1: Select Services */}
              {currentStep === 0 && (
                <div className="flex flex-col gap-4">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Select Services</h3>
                  <p className="mb-4 text-sm text-muted-foreground">Toggle the building blocks for your payment platform.</p>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {services.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => toggleService(service.id)}
                        className={cn(
                          "flex items-start gap-4 rounded-xl border p-5 text-left transition-all duration-300",
                          "shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
                          selectedServices.has(service.id)
                            ? "border-[#e6b800]/40 bg-[#e6b800]/5 shadow-[0_2px_16px_rgba(230,184,0,0.1),inset_0_1px_0_rgba(255,255,255,0.06)]"
                            : "border-border hover:border-[#e6b800]/30 hover:bg-[#e6b800]/5"
                        )}
                      >
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                          selectedServices.has(service.id) ? "bg-[#e6b800]/10 text-[#e6b800]" : "bg-secondary text-muted-foreground"
                        )}>
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

              {/* Step 2: Identity & Roles */}
              {currentStep === 1 && (
                <div className="flex flex-col gap-4">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Identity & Roles</h3>
                  <p className="mb-4 text-sm text-muted-foreground">Define the participants in your payment flow.</p>
                  <div className="flex flex-col gap-3">
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => toggleRole(role.id)}
                        className={cn(
                          "flex items-center gap-4 rounded-xl border p-5 text-left transition-all duration-300",
                          "shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
                          selectedRoles.has(role.id)
                            ? "border-[#e6b800]/40 bg-[#e6b800]/5 shadow-[0_2px_16px_rgba(230,184,0,0.1)]"
                            : "border-border hover:border-[#e6b800]/30 hover:bg-[#e6b800]/5"
                        )}
                      >
                        <div className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                          selectedRoles.has(role.id) ? "bg-[#e6b800]/10 text-[#e6b800]" : "bg-secondary text-muted-foreground"
                        )}>
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

              {/* Step 3: Payment Logic */}
              {currentStep === 2 && (
                <div className="flex flex-col gap-4">
                  <h3 className="mb-2 text-lg font-semibold text-foreground">Payment Logic</h3>
                  <p className="mb-4 text-sm text-muted-foreground">Choose how funds are released in your escrow flow.</p>
                  <div className="flex flex-col gap-3">
                    {paymentLogic.map((logic) => (
                      <button
                        key={logic.id}
                        onClick={() => setSelectedLogic(logic.id)}
                        className={cn(
                          "flex items-center gap-4 rounded-xl border p-5 text-left transition-all duration-300",
                          "shadow-[0_2px_8px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
                          selectedLogic === logic.id
                            ? "border-[#e6b800]/40 bg-[#e6b800]/5 shadow-[0_2px_16px_rgba(230,184,0,0.1)]"
                            : "border-border hover:border-[#e6b800]/30 hover:bg-[#e6b800]/5"
                        )}
                      >
                        <div className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                          selectedLogic === logic.id ? "border-[#e6b800]" : "border-muted-foreground"
                        )}>
                          {selectedLogic === logic.id && <div className="h-2.5 w-2.5 rounded-full bg-[#e6b800]" />}
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

              {/* Step 4: Review */}
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
                            <span key={item} className="rounded-full bg-[#e6b800]/10 px-3 py-1 text-xs font-medium text-[#e6b800]">{item}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Flow Preview */}
                  <div className="rounded-xl border border-border/30 bg-card/30 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                    <p className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">Flow Preview</p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {["Sender", "Fiat On-ramp", "USDC", "Escrow", selectedLogic === "milestones" ? "Milestone Release" : selectedLogic === "accumulation" ? "Accumulation" : "Single Release", "Receiver"].map((node, i, arr) => (
                        <div key={node} className="flex items-center gap-3">
                          <span className="rounded-lg bg-[#e6b800]/10 px-3 py-1.5 text-xs font-medium text-[#e6b800]">{node}</span>
                          {i < arr.length - 1 && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#e6b800]/40">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-8 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                  disabled={currentStep === 0}
                  className="rounded-full border-border/60 text-foreground shadow-[0_2px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-[#e6b800]/10 hover:text-[#e6b800] hover:border-[#e6b800]/30 transition-all duration-300"
                >
                  Back
                </Button>
                {currentStep < wizardSteps.length - 1 ? (
                  <Button
                    onClick={() => setCurrentStep(Math.min(wizardSteps.length - 1, currentStep + 1))}
                    className="rounded-full bg-[#e6b800] text-background shadow-[0_4px_16px_rgba(230,184,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#ffd000] hover:shadow-[0_6px_24px_rgba(230,184,0,0.35)] transition-all duration-300"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button className="rounded-full bg-[#e6b800] text-background shadow-[0_4px_16px_rgba(230,184,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-[#ffd000] hover:shadow-[0_6px_24px_rgba(230,184,0,0.35)] transition-all duration-300">
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
            {/* Modules Palette */}
            <div className="lg:col-span-4">
              <div className="sticky top-24 rounded-2xl border border-border/40 bg-card/40 p-5 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Available Modules</h3>
                <p className="mb-4 text-xs text-muted-foreground">Drag modules to the canvas to build your payment flow.</p>
                {categories.map((cat) => (
                  <div key={cat.key} className="mb-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">{cat.label}</p>
                    <div className="flex flex-col gap-2">
                      {availableModules.filter((m) => m.category === cat.key).map((mod) => {
                        const inPipeline = pipeline.includes(mod.id)
                        return (
                          <div
                            key={mod.id}
                            draggable={!inPipeline}
                            onDragStart={() => handleDragStart(mod.id, "palette")}
                            onDragEnd={() => { setDraggingId(null); setDragOverIndex(null) }}
                            className={cn(
                              "flex items-center gap-3 rounded-xl border p-3 transition-all duration-200",
                              "shadow-[0_2px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]",
                              inPipeline
                                ? "border-border/30 bg-secondary/20 opacity-40 cursor-not-allowed"
                                : "border-border/40 bg-card/60 cursor-grab hover:border-[#e6b800]/30 hover:shadow-[0_2px_12px_rgba(230,184,0,0.1)] active:cursor-grabbing"
                            )}
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${mod.color}15`, color: mod.color }}>
                              {iconMap[mod.icon]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{mod.label}</p>
                              <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
                            </div>
                            {inPipeline && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto shrink-0 text-[#e6b800]"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pipeline Canvas */}
            <div className="lg:col-span-8">
              <div
                className={cn(
                  "min-h-[500px] rounded-2xl border-2 border-dashed p-6 transition-all duration-300",
                  pipeline.length === 0 && !draggingId ? "border-border/30 bg-card/20" : draggingId ? "border-[#e6b800]/40 bg-[#e6b800]/5" : "border-border/40 bg-card/30",
                  "shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropOnCanvas}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Payment Pipeline</h3>
                  {pipeline.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setPipeline([])} className="text-xs text-muted-foreground hover:text-[#e6b800]">Clear All</Button>
                  )}
                </div>

                {pipeline.length === 0 ? (
                  <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-center">
                    <div className="rounded-2xl border border-dashed border-border/50 p-6">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 text-muted-foreground/40"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
                      <p className="text-sm text-muted-foreground/60">Drag modules here to assemble</p>
                      <p className="text-xs text-muted-foreground/40 mt-1">Your payment flow from left to right</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {pipeline.map((moduleId, index) => {
                        const mod = availableModules.find((m) => m.id === moduleId)
                        if (!mod) return null
                        return (
                          <div key={mod.id} className="flex items-center gap-2">
                            <div onDragOver={(e) => handleDragOver(e, index)} onDrop={(e) => handleDrop(e, index)} className={cn("h-16 w-1 rounded-full transition-all", dragOverIndex === index ? "bg-[#e6b800] w-2" : "bg-transparent")} />
                            <div
                              draggable
                              onDragStart={() => handleDragStart(mod.id, "pipeline", index)}
                              onDragEnd={() => { setDraggingId(null); setDragOverIndex(null) }}
                              className={cn(
                                "group relative flex items-center gap-3 rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all duration-200",
                                "shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]",
                                "border-border/40 bg-card/60 hover:border-[#e6b800]/30",
                                draggingId === mod.id && "opacity-50 scale-95"
                              )}
                            >
                              <button onClick={() => removeFromPipeline(mod.id)} className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-card border border-border text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground hover:border-destructive" aria-label={`Remove ${mod.label}`}>
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                              </button>
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${mod.color}15`, color: mod.color }}>
                                {iconMap[mod.icon]}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-foreground">{mod.label}</p>
                                <p className="text-xs text-muted-foreground">{mod.description}</p>
                              </div>
                            </div>
                            {index < pipeline.length - 1 && (
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-[#e6b800]/40"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                            )}
                            {index === pipeline.length - 1 && (
                              <div onDragOver={(e) => handleDragOver(e, index + 1)} onDrop={(e) => handleDrop(e, index + 1)} className={cn("h-16 w-1 rounded-full transition-all", dragOverIndex === index + 1 ? "bg-[#e6b800] w-2" : "bg-transparent")} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {/* Summary */}
                    <div className="mt-6 rounded-xl border border-border/30 bg-secondary/20 p-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Flow Summary</p>
                      <div className="flex flex-wrap gap-2">
                        {pipeline.map((id) => {
                          const mod = availableModules.find((m) => m.id === id)
                          return mod ? <span key={id} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${mod.color}15`, color: mod.color }}>{mod.label}</span> : null
                        })}
                      </div>
                      <div className="mt-4 flex gap-3">
                        <Button className="rounded-full bg-[#e6b800] text-background shadow-[0_4px_20px_rgba(230,184,0,0.25)] hover:bg-[#ffd000] hover:shadow-[0_6px_28px_rgba(230,184,0,0.35)] transition-all duration-300">Deploy Escrow Flow</Button>
                        <Button variant="outline" className="rounded-full border-border/60 text-muted-foreground hover:text-[#e6b800] hover:border-[#e6b800]/30 hover:bg-[#e6b800]/10 transition-all duration-300 bg-transparent">Save Draft</Button>
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
