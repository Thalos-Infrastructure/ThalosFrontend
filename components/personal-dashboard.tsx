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
  category: "payment" | "escrow" | "release" | "extras"
}

const availableModules: ServiceModule[] = [
  { id: "fiat-onramp", label: "Fiat On-ramp", description: "Convert local currency to USDC", icon: "arrow-up", color: "#f0b400", category: "payment" },
  { id: "escrow-basic", label: "Basic Escrow", description: "Lock funds until conditions met", icon: "lock", color: "#3b82f6", category: "escrow" },
  { id: "milestone-release", label: "Milestone Release", description: "Release by deliverable stages", icon: "layers", color: "#10b981", category: "release" },
  { id: "one-time-release", label: "One-time Release", description: "Single conditional release", icon: "zap", color: "#8b5cf6", category: "release" },
  { id: "accumulative", label: "Accumulative", description: "Collect until target amount", icon: "trending", color: "#f59e0b", category: "payment" },
  { id: "yield", label: "Yield on Idle", description: "Earn on escrowed funds", icon: "sparkle", color: "#06b6d4", category: "extras" },
  { id: "dispute", label: "Dispute Resolution", description: "Conflict mediation flow", icon: "shield", color: "#ef4444", category: "extras" },
  { id: "notification", label: "Notifications", description: "Email & webhook alerts", icon: "bell", color: "#a855f7", category: "extras" },
]

const moduleIcons: Record<string, React.ReactNode> = {
  "arrow-up": <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  lock: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  layers: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="12 2 2 7 12 12 22 7"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  zap: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10"/></svg>,
  trending: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  sparkle: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/></svg>,
  shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  bell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
}

export function PersonalDashboard({ onLogout }: { onLogout: () => void }) {
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
    { key: "payment", label: "Payments" },
    { key: "escrow", label: "Escrow" },
    { key: "release", label: "Release" },
    { key: "extras", label: "Extras" },
  ]

  return (
    <div className="relative py-16">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-full bg-[#f0b400]/10 flex items-center justify-center text-[#f0b400]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Personal Workspace</h2>
                <p className="text-sm text-muted-foreground">Freelancer & Retail profile</p>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogout}
            className="rounded-full border-border/60 text-muted-foreground hover:text-[#f0b400] hover:border-[#f0b400]/30 hover:bg-[#f0b400]/10 transition-all duration-300 bg-transparent"
          >
            Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Modules Palette */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-border/40 bg-card/40 p-5 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Available Modules
              </h3>
              <p className="mb-4 text-xs text-muted-foreground">Drag modules to the canvas to build your payment flow.</p>

              {categories.map((cat) => (
                <div key={cat.key} className="mb-4">
                  <p className="mb-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">{cat.label}</p>
                  <div className="flex flex-col gap-2">
                    {availableModules
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
                                : "border-border/40 bg-card/60 cursor-grab hover:border-[#f0b400]/30 hover:shadow-[0_2px_12px_rgba(240,180,0,0.1)] active:cursor-grabbing"
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
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ml-auto shrink-0 text-[#f0b400]">
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
                "min-h-[500px] rounded-2xl border-2 border-dashed p-6 transition-all duration-300",
                pipeline.length === 0 && !draggingId
                  ? "border-border/30 bg-card/20"
                  : draggingId
                    ? "border-[#f0b400]/40 bg-[#f0b400]/5"
                    : "border-border/40 bg-card/30",
                "shadow-[0_8px_32px_rgba(0,0,0,0.15)]"
              )}
              onDragOver={(e) => { e.preventDefault() }}
              onDrop={handleDropOnCanvas}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Your Payment Pipeline
                </h3>
                {pipeline.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPipeline([])}
                    className="text-xs text-muted-foreground hover:text-[#f0b400]"
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {pipeline.length === 0 ? (
                <div className="flex h-[400px] flex-col items-center justify-center gap-3 text-center">
                  <div className="rounded-2xl border border-dashed border-border/50 p-6">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-3 text-muted-foreground/40">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M12 8v8M8 12h8"/>
                    </svg>
                    <p className="text-sm text-muted-foreground/60">Drag modules here to assemble</p>
                    <p className="text-xs text-muted-foreground/40 mt-1">Your payment flow from left to right</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Pipeline nodes with connectors */}
                  <div className="flex flex-wrap items-center gap-2">
                    {pipeline.map((moduleId, index) => {
                      const mod = availableModules.find((m) => m.id === moduleId)
                      if (!mod) return null
                      return (
                        <div key={mod.id} className="flex items-center gap-2">
                          {/* Drop zone before */}
                          <div
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDrop={(e) => handleDrop(e, index)}
                            className={cn(
                              "h-16 w-1 rounded-full transition-all",
                              dragOverIndex === index ? "bg-[#f0b400] w-2" : "bg-transparent"
                            )}
                          />

                          {/* Module card */}
                          <div
                            draggable
                            onDragStart={() => handleDragStart(mod.id, "pipeline", index)}
                            onDragEnd={() => { setDraggingId(null); setDragOverIndex(null) }}
                            className={cn(
                              "group relative flex items-center gap-3 rounded-xl border p-4 cursor-grab active:cursor-grabbing transition-all duration-200",
                              "shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]",
                              "border-border/40 bg-card/60 hover:border-[#f0b400]/30",
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

                          {/* Connector arrow */}
                          {index < pipeline.length - 1 && (
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-[#f0b400]/40">
                              <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                          )}

                          {/* Drop zone after last */}
                          {index === pipeline.length - 1 && (
                            <div
                              onDragOver={(e) => handleDragOver(e, index + 1)}
                              onDrop={(e) => handleDrop(e, index + 1)}
                              className={cn(
                                "h-16 w-1 rounded-full transition-all",
                                dragOverIndex === index + 1 ? "bg-[#f0b400] w-2" : "bg-transparent"
                              )}
                            />
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
                        return mod ? (
                          <span key={id} className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${mod.color}15`, color: mod.color }}>
                            {mod.label}
                          </span>
                        ) : null
                      })}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button className="rounded-full bg-[#f0b400] text-background shadow-[0_4px_20px_rgba(240,180,0,0.25)] hover:bg-[#ffd000] hover:shadow-[0_6px_28px_rgba(240,180,0,0.35)] transition-all duration-300">
                        Deploy Escrow Flow
                      </Button>
                      <Button variant="outline" className="rounded-full border-border/60 text-muted-foreground hover:text-[#f0b400] hover:border-[#f0b400]/30 hover:bg-[#f0b400]/10 transition-all duration-300 bg-transparent">
                        Save Draft
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
