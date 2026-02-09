"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useSectionReveal } from "@/hooks/use-section-reveal"

const useCases = [
  {
    id: "freelancer",
    label: "Freelancer",
    description: "Milestone-based payments for project deliverables",
    steps: [
      { label: "Client", icon: "user", detail: "Initiates project contract" },
      { label: "Fiat Payment", icon: "dollar", detail: "Pays in local currency" },
      { label: "USDC on Stellar", icon: "coin", detail: "Converted to USDC" },
      { label: "Escrow Contract", icon: "lock", detail: "Funds locked by milestones" },
      { label: "Milestone Release", icon: "check", detail: "Released per deliverable" },
      { label: "Freelancer", icon: "user-check", detail: "Receives payment" },
    ],
  },
  {
    id: "travel",
    label: "Travel Agency",
    description: "Accumulative payments for travel packages",
    steps: [
      { label: "Traveler", icon: "user", detail: "Books travel package" },
      { label: "Fiat Payment", icon: "dollar", detail: "Monthly installments" },
      { label: "USDC on Stellar", icon: "coin", detail: "Converted to USDC" },
      { label: "Escrow Contract", icon: "lock", detail: "Accumulates until target" },
      { label: "Full Release", icon: "check", detail: "Released upon completion" },
      { label: "Travel Agency", icon: "user-check", detail: "Receives full amount" },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    description: "Protected transactions between buyers and sellers",
    steps: [
      { label: "Buyer", icon: "user", detail: "Places order" },
      { label: "Fiat Payment", icon: "dollar", detail: "Pays for goods" },
      { label: "USDC on Stellar", icon: "coin", detail: "Converted to USDC" },
      { label: "Escrow Contract", icon: "lock", detail: "Held until delivery" },
      { label: "Conditional Release", icon: "check", detail: "On delivery confirmation" },
      { label: "Seller", icon: "user-check", detail: "Receives payment" },
    ],
  },
  {
    id: "vehicle",
    label: "Vehicle Sale",
    description: "Staged releases for large transactions",
    steps: [
      { label: "Buyer", icon: "user", detail: "Initiates purchase" },
      { label: "Fiat Payment", icon: "dollar", detail: "Deposit + final payment" },
      { label: "USDC on Stellar", icon: "coin", detail: "Converted to USDC" },
      { label: "Escrow Contract", icon: "lock", detail: "Partial release stages" },
      { label: "Staged Release", icon: "check", detail: "Inspection + transfer" },
      { label: "Seller", icon: "user-check", detail: "Full amount released" },
    ],
  },
]

const icons: Record<string, React.ReactNode> = {
  user: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  ),
  dollar: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
  ),
  coin: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v12"/><path d="M15.5 9.5h-5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5h-5"/></svg>
  ),
  lock: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  ),
  check: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
  ),
  "user-check": (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
  ),
}

function FlowDiagram({ steps }: { steps: typeof useCases[0]["steps"] }) {
  const [activeStep, setActiveStep] = useState(-1)
  const intervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    setActiveStep(-1)
    let step = -1
    intervalRef.current = setInterval(() => {
      step++
      if (step >= steps.length) step = 0
      setActiveStep(step)
    }, 1200)
    return () => clearInterval(intervalRef.current)
  }, [steps])

  return (
    <div className="relative flex flex-col items-center gap-4 py-8 md:flex-row md:justify-between md:gap-0">
      <div className="absolute top-1/2 left-[8%] right-[8%] hidden h-px bg-border/30 md:block" aria-hidden="true">
        <div
          className="h-full bg-[#f0b400] transition-all duration-700 ease-out"
          style={{ width: `${Math.max(0, (activeStep / (steps.length - 1)) * 100)}%` }}
        />
      </div>

      <div className="absolute top-[8%] bottom-[8%] left-1/2 w-px -translate-x-1/2 bg-border/30 md:hidden" aria-hidden="true">
        <div
          className="w-full bg-[#f0b400] transition-all duration-700 ease-out"
          style={{ height: `${Math.max(0, (activeStep / (steps.length - 1)) * 100)}%` }}
        />
      </div>

      {steps.map((step, i) => (
        <div
          key={step.label}
          className={cn(
            "relative z-10 flex flex-row items-center gap-4 transition-all duration-500 md:flex-col md:gap-3",
            i <= activeStep ? "opacity-100" : "opacity-30"
          )}
        >
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-all duration-500",
              i <= activeStep
                ? "border-[#f0b400]/30 bg-[#f0b400]/10 text-[#f0b400] shadow-[0_4px_20px_rgba(240,180,0,0.15)]"
                : "border-border/30 bg-card/30 text-muted-foreground"
            )}
          >
            {icons[step.icon]}
          </div>
          <div className="text-left md:text-center">
            <p className={cn(
              "text-sm font-semibold transition-colors",
              i <= activeStep ? "text-foreground" : "text-muted-foreground"
            )}>
              {step.label}
            </p>
            <p className="text-xs text-muted-foreground">{step.detail}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function HowItWorks() {
  const { ref, isVisible } = useSectionReveal()
  const [activeUseCase, setActiveUseCase] = useState("freelancer")
  const current = useCases.find((uc) => uc.id === activeUseCase) ?? useCases[0]

  return (
    <section id="how-it-works" className="relative py-28" ref={ref}>
      <div className={cn(
        "mx-auto max-w-7xl px-6 section-reveal",
        isVisible && "is-visible"
      )}>
        <div className="mb-14 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-[#f0b400]">
            How It Works
          </p>
          <h2 className="mb-4 text-5xl font-bold tracking-tight text-foreground md:text-6xl text-balance">
            Modular Payment Infrastructure
          </h2>
          <p className="mx-auto max-w-2xl text-base font-medium text-white/55 leading-relaxed text-pretty">
            See how Thalos connects fiat payments, USDC conversion, and smart contract escrows into a seamless flow tailored to your use case.
          </p>
        </div>

        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          {useCases.map((uc) => (
            <button
              key={uc.id}
              onClick={() => setActiveUseCase(uc.id)}
              className={cn(
                "rounded-full border px-5 py-2.5 text-sm font-semibold transition-all duration-400",
                activeUseCase === uc.id
                  ? "border-[#f0b400]/30 bg-[#f0b400]/10 text-[#f0b400] shadow-[0_2px_10px_rgba(240,180,0,0.15),inset_0_1px_0_rgba(255,255,255,0.06)]"
                  : "border-border/20 bg-card/30 text-muted-foreground shadow-[0_1px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[#b0c4de]/30 hover:text-[#b0c4de]"
              )}
            >
              {uc.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl border border-border/20 bg-card/40 p-6 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] md:p-10">
          <div className="mb-4 text-center">
            <p className="text-sm font-medium text-muted-foreground">{current.description}</p>
          </div>
          <FlowDiagram key={current.id} steps={current.steps} />
        </div>
      </div>
    </section>
  )
}
