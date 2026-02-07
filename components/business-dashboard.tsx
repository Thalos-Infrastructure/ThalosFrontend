"use client"

import React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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
  { id: "fiat-gateway", label: "Fiat Gateway", description: "Multi-currency on/off ramp", icon: "globe", color: "#e6b800", category: "infrastructure" },
  { id: "api-bridge", label: "API Bridge", description: "REST & webhook integrations", icon: "code", color: "#8b5cf6", category: "infrastructure" },
  { id: "marketplace-engine", label: "Marketplace Engine", description: "Buyer-seller payment orchestration", icon: "store", color: "#f59e0b", category: "commerce" },
  { id: "travel-accum", label: "Travel Accumulator", description: "Installment travel package flows", icon: "plane", color: "#06b6d4", category: "commerce" },
  { id: "staged-release", label: "Staged Release", description: "Multi-stage conditional releases", icon: "layers", color: "#10b981", category: "commerce" },
  { id: "kyc-module", label: "KYC / AML", description: "Identity verification pipeline", icon: "shield", color: "#ef4444", category: "compliance" },
  { id: "audit-trail", label: "Audit Trail", description: "Full transaction logging", icon: "scroll", color: "#64748b", category: "compliance" },
  { id: "yield-pool", label: "Yield Pool", description: "Enterprise yield on idle capital", icon: "trending", color: "#a855f7", category: "advanced" },
  { id: "auto-settlement", label: "Auto Settlement", description: "Scheduled fund settlements", icon: "clock", color: "#22c55e", category: "advanced" },
]

const moduleIcons: Record<string, React.ReactNode> = {
  users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  globe: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>,
  code: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  store: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  plane: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>,
  layers: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  scroll: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 21h12a2 2 0 002-2v-2H10v2a2 2 0 01-2 2z"/><path d="M14 17V5a2 2 0 00-2-2H4a2 2 0 00-2 2v12a4 4 0 004 4"/><path d="M14 5h6a2 2 0 012 2v10"/></svg>,
  trending: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  clock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
}

export function BusinessDashboard({ onLogout }: { onLogout: () => void }) {
  const [pipeline, setPipeline] = useState<string[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragSourceRef = useRef<"palette" | "pipeline">("palette")
  const dragPipelineIndexRef = useRef<number>(-1)

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
        const newPipeline = [...pipeline]
        newPipeline.splice(dropIndex, 0, draggingId)
        setPipeline(newPipeline)
      }
    } else {
      const fromIndex = dragPipelineIndexRef.current
      if (fromIndex !== dropIndex && fromIndex !== -1) {
        const newPipeline = [...pipeline]
        const [moved] = newPipeline.splice(fromIndex, 1)
        newPipeline.splice(dropIndex > fromIndex ? dropIndex - 1 : dropIndex, 0, moved)
        setPipeline(newPipeline)
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

  const removeFromPipeline = (id: string) => {
    setPipeline(pipeline.filter((m) => m !== id))
  }

  const categories = [
    { key: "infrastructure", label: "Infrastructure" },
    { key: "commerce", label: "Commerce" },
    { key: "compliance", label: "Compliance" },
    { key: "advanced", label: "Advanced" },
  ]

  return (
    <div className="relative py-16">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-full bg-[#3b82f6]/10 flex items-center justify-center text-[#3b82f6]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Enterprise Workspace</h2>
                <p className="text-sm text-muted-foreground">Business / Enterprise profile</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="rounded-full border-border/60 text-muted-foreground hover:text-[#e6b800] hover:border-[#e6b800]/30 hover:bg-[#e6b800]/10 transition-all duration-300 bg-transparent"
          >
            Sign Out
          </Button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Active Flows", value: "12", sub: "running" },
            { label: "Total Volume", value: "$2.4M", sub: "USDC" },
            { label: "APIs Connected", value: "8", sub: "endpoints" },
            { label: "Yield Earned", value: "$12.5K", sub: "this month" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border/40 bg-card/40 p-4 shadow-[0_4px_16px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.04)]">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <div className="mt-1 flex items-baseline gap-1">
                <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                <span className="text-xs text-muted-foreground">{stat.sub}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Modules Palette */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-border/40 bg-card/40 p-5 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Enterprise Modules
              </h3>
              <p className="mb-4 text-xs text-muted-foreground">Drag modules to the canvas to architect your platform.</p>

              {categories.map((cat) => (
                <div key={cat.key} className="mb-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">{cat.label}</p>
                  <div className="flex flex-col gap-2">
                    {businessModules
                      .filter((m) => m.category === cat.key)
                      .map((mod) => {
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
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${mod.color}15`, color: mod.color }}
                            >
                              {moduleIcons[mod.icon]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{mod.label}</p>
                              <p className="text-xs text-muted-foreground truncate">{mod.description}</p>
                            </div>
                            {inPipeline && (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto shrink-0 text-[#e6b800]">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
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
                "min-h-[520px] rounded-2xl border-2 border-dashed p-6 transition-all duration-300",
                pipeline.length === 0 && !draggingId
                  ? "border-border/30 bg-card/20"
                  : draggingId
                    ? "border-[#e6b800]/40 bg-[#e6b800]/5"
                    : "border-border/40 bg-card/30",
                "shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
              )}
              onDragOver={(e) => { e.preventDefault() }}
              onDrop={handleDropOnCanvas}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Platform Architecture
                </h3>
                {pipeline.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPipeline([])}
                    className="text-xs text-muted-foreground hover:text-[#e6b800]"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {pipeline.length === 0 ? (
                <div className="flex h-[430px] flex-col items-center justify-center gap-3 text-center">
                  <div className="rounded-2xl border border-dashed border-border/50 p-6">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 text-muted-foreground/40">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M12 8v8M8 12h8"/>
                    </svg>
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
                          <div
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            className={cn(
                              "h-16 w-1 rounded-full transition-all",
                              dragOverIndex === index ? "bg-[#e6b800] w-2" : "bg-transparent"
                            )}
                          />

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
                            <button
                              onClick={() => removeFromPipeline(mod.id)}
                              className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-card border border-border text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
                              aria-label={`Remove ${mod.label}`}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                            <div
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${mod.color}15`, color: mod.color }}
                            >
                              {moduleIcons[mod.icon]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{mod.label}</p>
                              <p className="text-xs text-muted-foreground">{mod.description}</p>
                            </div>
                          </div>

                          {index < pipeline.length - 1 && (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-[#e6b800]/40">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                          )}

                          {index === pipeline.length - 1 && (
                            <div
                              onDragOver={(e) => handleDragOver(e, index + 1)}
                              onDrop={(e) => handleDrop(e, index + 1)}
                              className={cn(
                                "h-16 w-1 rounded-full transition-all",
                                dragOverIndex === index + 1 ? "bg-[#e6b800] w-2" : "bg-transparent"
                              )}
                            />
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-6 rounded-xl border border-border/30 bg-secondary/20 p-4">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Architecture Summary</p>
                    <div className="flex flex-wrap gap-2">
                      {pipeline.map((id) => {
                        const mod = businessModules.find((m) => m.id === id)
                        return mod ? (
                          <span key={id} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${mod.color}15`, color: mod.color }}>
                            {mod.label}
                          </span>
                        ) : null
                      })}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button className="rounded-full bg-[#e6b800] text-background shadow-[0_4px_20px_rgba(230,184,0,0.25)] hover:bg-[#ffd000] hover:shadow-[0_6px_28px_rgba(230,184,0,0.35)] transition-all duration-300">
                        Deploy Platform
                      </Button>
                      <Button variant="outline" className="rounded-full border-border/60 text-muted-foreground hover:text-[#e6b800] hover:border-[#e6b800]/30 hover:bg-[#e6b800]/10 transition-all duration-300 bg-transparent">
                        Export Config
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
