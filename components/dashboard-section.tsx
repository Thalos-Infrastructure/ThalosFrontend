"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useSectionReveal } from "@/hooks/use-section-reveal"

const escrows = [
  {
    id: "ESC-001",
    title: "Web Development Project",
    amount: "5,000.00",
    status: "locked" as const,
    timeRemaining: "14 days",
    yield: "+12.50",
    yieldEnabled: true,
    progress: 33,
    milestones: 3,
    completedMilestones: 1,
  },
  {
    id: "ESC-002",
    title: "Caribbean Travel Package",
    amount: "3,200.00",
    status: "partial" as const,
    timeRemaining: "45 days",
    yield: "+8.30",
    yieldEnabled: true,
    progress: 60,
    milestones: 5,
    completedMilestones: 3,
  },
  {
    id: "ESC-003",
    title: "Marketplace Order #4521",
    amount: "890.00",
    status: "completed" as const,
    timeRemaining: "Completed",
    yield: null,
    yieldEnabled: false,
    progress: 100,
    milestones: 1,
    completedMilestones: 1,
  },
  {
    id: "ESC-004",
    title: "Vehicle Purchase Deposit",
    amount: "15,000.00",
    status: "locked" as const,
    timeRemaining: "30 days",
    yield: "+45.20",
    yieldEnabled: true,
    progress: 0,
    milestones: 2,
    completedMilestones: 0,
  },
]

const statusConfig = {
  locked: { label: "Locked", className: "bg-[#d4a843]/10 text-[#d4a843] border-[#d4a843]/20" },
  partial: { label: "Partial Release", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  completed: { label: "Completed", className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
}

export function DashboardSection() {
  const { ref, isVisible } = useSectionReveal()
  const [selectedEscrow, setSelectedEscrow] = useState<string | null>(null)

  const totalLocked = escrows.filter((e) => e.status !== "completed").reduce((sum, e) => sum + Number.parseFloat(e.amount.replace(",", "")), 0)
  const totalYield = escrows.reduce((sum, e) => sum + (e.yield ? Number.parseFloat(e.yield) : 0), 0)

  return (
    <section id="dashboard" className="relative py-28" ref={ref}>
      <div className={cn(
        "mx-auto max-w-7xl px-6 section-reveal",
        isVisible && "is-visible"
      )}>
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-[#d4a843]">
            Dashboard
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl text-balance">
            Manage Your Escrows
          </h2>
          <p className="mx-auto max-w-2xl font-medium text-muted-foreground text-pretty">
            Track active escrows, monitor fund status, and manage releases from a single view.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active Escrows", value: escrows.filter((e) => e.status !== "completed").length.toString(), suffix: "" },
            { label: "Total Locked", value: `$${totalLocked.toLocaleString()}`, suffix: "USDC" },
            { label: "Total Yield", value: `+$${totalYield.toFixed(2)}`, suffix: "earned" },
            { label: "Completed", value: escrows.filter((e) => e.status === "completed").length.toString(), suffix: "escrows" },
          ].map((stat, idx) => (
            <div
              key={stat.label}
              className="section-reveal-child rounded-2xl border border-border/20 bg-card/40 p-5 backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-500 hover:border-[#b0c4de]/20 hover:shadow-[0_4px_20px_rgba(176,196,222,0.06),0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]"
              style={{ transitionDelay: isVisible ? `${idx * 100}ms` : "0ms" }}
            >
              <p className="text-xs font-semibold text-muted-foreground">{stat.label}</p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                {stat.suffix && <span className="text-xs font-medium text-muted-foreground">{stat.suffix}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* Escrow List */}
        <div className="flex flex-col gap-3">
          {escrows.map((escrow, idx) => (
            <div
              key={escrow.id}
              className={cn(
                "section-reveal-child group rounded-2xl border border-border/20 bg-card/40 p-5 backdrop-blur-sm transition-all duration-500",
                "shadow-[0_4px_16px_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]",
                "hover:border-[#b0c4de]/15 hover:shadow-[0_4px_20px_rgba(176,196,222,0.06),0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]",
                selectedEscrow === escrow.id && "border-[#d4a843]/15 bg-card/45",
              )}
              style={{ transitionDelay: isVisible ? `${400 + idx * 100}ms` : "0ms" }}
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-bold text-foreground">{escrow.title}</h3>
                    <Badge variant="outline" className={cn("text-xs font-semibold", statusConfig[escrow.status].className)}>
                      {statusConfig[escrow.status].label}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-muted-foreground">{escrow.id}</p>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Amount</p>
                    <p className="text-sm font-bold text-foreground">${escrow.amount} <span className="text-xs font-medium text-muted-foreground">USDC</span></p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground">Time</p>
                    <p className="text-sm font-medium text-foreground">{escrow.timeRemaining}</p>
                  </div>
                  {escrow.yieldEnabled && escrow.yield && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground">Yield</p>
                      <p className="text-sm font-semibold text-emerald-400">{escrow.yield} USDC</p>
                    </div>
                  )}
                  <div className="hidden lg:block">
                    <p className="text-xs font-semibold text-muted-foreground">Progress</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            escrow.status === "completed" ? "bg-emerald-400" : "bg-[#d4a843]"
                          )}
                          style={{ width: `${escrow.progress}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{escrow.completedMilestones}/{escrow.milestones}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEscrow(selectedEscrow === escrow.id ? null : escrow.id)}
                      className="text-xs font-semibold text-muted-foreground hover:text-[#b0c4de] hover:bg-[#b0c4de]/10"
                    >
                      View
                    </Button>
                    {escrow.status !== "completed" && (
                      <Button
                        size="sm"
                        className="rounded-full bg-[#d4a843] text-xs font-semibold text-background shadow-[0_2px_8px_rgba(212,168,67,0.2),0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-[#b0c4de] hover:text-background hover:shadow-[0_2px_12px_rgba(176,196,222,0.3),0_1px_2px_rgba(0,0,0,0.4)] transition-all duration-400"
                      >
                        Release
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {selectedEscrow === escrow.id && (
                <div className="mt-4 border-t border-border/10 pt-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl bg-card/20 p-4 border border-border/10">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Milestones</p>
                      <div className="flex flex-col gap-2">
                        {Array.from({ length: escrow.milestones }, (_, i) => (
                          <div key={`milestone-${escrow.id}-${i}`} className="flex items-center gap-2">
                            <div className={cn(
                              "h-2 w-2 rounded-full",
                              i < escrow.completedMilestones ? "bg-emerald-400" : "bg-muted-foreground/30"
                            )} />
                            <span className="text-xs font-medium text-muted-foreground">
                              Milestone {i + 1} {i < escrow.completedMilestones ? "(Completed)" : "(Pending)"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-xl bg-card/20 p-4 border border-border/10">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Conditions</p>
                      <p className="text-xs font-medium text-muted-foreground">
                        Funds are released based on verified milestone completion. All parties must confirm before each release stage.
                      </p>
                    </div>
                    <div className="rounded-xl bg-card/20 p-4 border border-border/10">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Contract</p>
                      <p className="text-xs font-mono font-medium text-muted-foreground">
                        GBXK...7F2D
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted-foreground">Stellar Network</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
