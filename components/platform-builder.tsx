"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSectionReveal } from "@/hooks/use-section-reveal"
import { useTypewriter } from "@/hooks/use-typewriter"

const steps = ["Select Services", "Identity & Roles", "Payment Logic", "Review"]

const services = [
  { id: "onramp", label: "Fiat to USDC On-ramp", description: "Convert local currencies to USDC via integrated partners.", icon: "arrow-up-right" },
  { id: "escrow", label: "Escrow (Protected Funds)", description: "Lock funds in a smart contract until conditions are met.", icon: "lock" },
  { id: "milestones", label: "Staged Payments", description: "Release funds progressively based on milestone completion.", icon: "layers" },
  { id: "accumulative", label: "Accumulative Payments", description: "Collect installments toward a target amount over time.", icon: "trending-up" },
  { id: "yield", label: "Yield on Idle Funds", description: "Earn returns on escrowed funds while they are held.", icon: "sparkles", optional: true },
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

const serviceIcons: Record<string, React.ReactNode> = {
  "arrow-up-right": <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>,
  lock: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  layers: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  "trending-up": <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  sparkles: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3z"/></svg>,
}

export function PlatformBuilder() {
  const { ref, isVisible } = useSectionReveal()
  const { displayed: twText, isTyping: twActive } = useTypewriter("[Platform Builder]", isVisible, { typeSpeed: 120, deleteSpeed: 60, pauseBeforeDelete: 2500, pauseBeforeType: 800 })
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set(["onramp", "escrow"]))
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set(["sender", "receiver"]))
  const [selectedLogic, setSelectedLogic] = useState("milestones")

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

  return (
    <section id="builder" className="relative py-28" ref={ref}>
      <div className={cn(
        "mx-auto max-w-4xl px-6 section-reveal",
        isVisible && "is-visible"
      )}>
        <div className="mb-14 text-center">
          <p className="mb-3 text-base font-bold uppercase tracking-wider text-[#f0b400] md:text-lg">
            <span>{twText}</span>
            <span className={cn("ml-0.5 inline-block h-4 w-0.5 bg-[#f0b400] align-middle", twActive ? "animate-pulse" : "opacity-0")} />
          </p>
          <h2 className="mb-4 text-5xl font-bold tracking-tight text-foreground md:text-6xl text-balance">
            Build Your Agreement Flow
          </h2>
          <p className="mx-auto max-w-2xl text-base font-medium text-white/55 leading-relaxed text-pretty">
            Select the services and roles that match your use case. Thalos assembles the agreement infrastructure for you.
          </p>
        </div>

        {/* Step Indicators */}
        <div className="mb-10 flex flex-wrap items-center justify-center gap-2">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-400 sm:px-4 sm:py-2.5 sm:text-sm",
                  i === currentStep
                    ? "bg-[#f0b400] text-background shadow-[0_4px_20px_rgba(240,180,0,0.3)]"
                    : i < currentStep
                      ? "bg-[#f0b400]/15 text-[#f0b400]"
                      : "bg-card/30 text-muted-foreground"
                )}
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full text-xs">
                  {i < currentStep ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className="hidden sm:inline">{step}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={cn("h-px w-6", i < currentStep ? "bg-[#f0b400]" : "bg-border/30")} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="rounded-2xl border border-border/20 bg-card/40 p-6 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] md:p-10">
          {currentStep === 0 && (
            <div className="flex flex-col gap-4">
              <h3 className="mb-2 text-lg font-bold text-foreground">Select Services</h3>
              <p className="mb-4 text-sm font-medium text-muted-foreground">Choose the building blocks for your payment platform.</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-center lg:gap-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => toggleService(service.id)}
                    className={cn(
                      "flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-all duration-400 sm:p-5 lg:max-w-[280px]",
                      selectedServices.has(service.id)
                        ? "border-[#f0b400]/25 bg-[#f0b400]/8 shadow-[0_4px_16px_rgba(240,180,0,0.12),0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "border-border/20 bg-card/30 shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[#b0c4de]/30 hover:shadow-[0_4px_16px_rgba(176,196,222,0.08),inset_0_1px_0_rgba(255,255,255,0.04)]"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                      selectedServices.has(service.id) ? "bg-[#f0b400]/15 text-[#f0b400]" : "bg-card/40 text-muted-foreground"
                    )}>
                      {serviceIcons[service.icon]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{service.label}</p>
                        {service.optional && (
                          <span className="rounded-full bg-card/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">Optional</span>
                        )}
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
              <h3 className="mb-2 text-lg font-bold text-foreground">Identity & Roles</h3>
              <p className="mb-4 text-sm font-medium text-muted-foreground">Define the participants in your payment flow.</p>
              <div className="flex flex-col gap-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => toggleRole(role.id)}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border p-5 text-left transition-all duration-400",
                      selectedRoles.has(role.id)
                        ? "border-[#f0b400]/25 bg-[#f0b400]/8 shadow-[0_4px_16px_rgba(240,180,0,0.12),0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "border-border/20 bg-card/30 shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[#b0c4de]/30 hover:shadow-[0_4px_16px_rgba(176,196,222,0.08),inset_0_1px_0_rgba(255,255,255,0.04)]"
                    )}
                  >
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
                      selectedRoles.has(role.id) ? "bg-[#f0b400]/15 text-[#f0b400]" : "bg-card/40 text-muted-foreground"
                    )}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{role.label}</p>
                        {role.optional && (
                          <span className="rounded-full bg-card/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">Optional</span>
                        )}
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
              <h3 className="mb-2 text-lg font-bold text-foreground">Payment Logic</h3>
              <p className="mb-4 text-sm font-medium text-muted-foreground">Choose how funds are released in your escrow flow.</p>
              <div className="flex flex-col gap-3">
                {paymentLogic.map((logic) => (
                  <button
                    key={logic.id}
                    onClick={() => setSelectedLogic(logic.id)}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border p-5 text-left transition-all duration-400",
                      selectedLogic === logic.id
                        ? "border-[#f0b400]/25 bg-[#f0b400]/8 shadow-[0_4px_16px_rgba(240,180,0,0.12),0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]"
                        : "border-border/20 bg-card/30 shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[#b0c4de]/30 hover:shadow-[0_4px_16px_rgba(176,196,222,0.08),inset_0_1px_0_rgba(255,255,255,0.04)]"
                    )}
                  >
                    <div className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      selectedLogic === logic.id ? "border-[#f0b400]" : "border-muted-foreground/40"
                    )}>
                      {selectedLogic === logic.id && <div className="h-2.5 w-2.5 rounded-full bg-[#f0b400]" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{logic.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{logic.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col gap-6">
              <h3 className="mb-2 text-lg font-bold text-foreground">Review Your Configuration</h3>
              <div className="flex flex-col gap-4">
                {[
                  { title: "Services", items: services.filter((s) => selectedServices.has(s.id)).map((s) => s.label) },
                  { title: "Roles", items: roles.filter((r) => selectedRoles.has(r.id)).map((r) => r.label) },
                  { title: "Payment Logic", items: [paymentLogic.find((l) => l.id === selectedLogic)?.label ?? ""] },
                ].map((group) => (
                  <div key={group.title} className="rounded-xl border border-border/10 bg-card/20 p-5">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">{group.title}</p>
                    <div className="flex flex-wrap gap-2">
                      {group.items.map((item) => (
                        <span key={item} className="rounded-full bg-[#f0b400]/10 px-3 py-1 text-xs font-semibold text-[#f0b400]">{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border/10 bg-card/20 p-5">
                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Flow Preview</p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  {["Sender", "Fiat On-ramp", "USDC", "Escrow", selectedLogic === "milestones" ? "Milestone Release" : selectedLogic === "accumulation" ? "Accumulation" : "Single Release", "Receiver"].map((node, i, arr) => (
                    <div key={node} className="flex items-center gap-3">
                      <span className="rounded-lg bg-[#f0b400]/10 px-3 py-1.5 text-xs font-semibold text-[#f0b400]">{node}</span>
                      {i < arr.length - 1 && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#f0b400]/30">
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
              className="rounded-full border-border/30 bg-card/20 text-foreground font-semibold hover:bg-[#b0c4de]/10 hover:text-[#b0c4de] hover:border-[#b0c4de]/30 hover:shadow-[0_0_20px_rgba(176,196,222,0.08)] transition-all duration-400"
            >
              Back
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button
                onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                className="rounded-full bg-[#f0b400] text-background font-semibold shadow-[0_4px_16px_rgba(240,180,0,0.25),0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-[#b0c4de] hover:text-background hover:shadow-[0_4px_20px_rgba(176,196,222,0.35),0_1px_3px_rgba(0,0,0,0.4)] transition-all duration-400"
              >
                Next Step
              </Button>
            ) : (
              <Button className="rounded-full bg-[#f0b400] text-background font-semibold shadow-[0_4px_16px_rgba(240,180,0,0.25),0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-[#b0c4de] hover:text-background hover:shadow-[0_4px_20px_rgba(176,196,222,0.35),0_1px_3px_rgba(0,0,0,0.4)] transition-all duration-400">
                Create Payment Flow
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
