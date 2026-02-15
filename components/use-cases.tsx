"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useSectionReveal } from "@/hooks/use-section-reveal"
import { useTypewriter } from "@/hooks/use-typewriter"

const useCases = [
  {
    icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
    title: "Real Estate Sale",
    buyer: "I want to reserve the house, but I don't feel safe wiring the full deposit upfront.",
    seller: "Let's use Thalos. The funds stay locked until the legal documents are signed.",
    result: "Funds are secured on-chain. Released only when ownership transfer is confirmed.",
    buyerLabel: "Buyer",
    sellerLabel: "Seller",
  },
  {
    icon: "M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z",
    title: "Agriculture Pre-Sale",
    buyer: "I'll buy your harvest, but I need guarantee of delivery.",
    seller: "Lock the payment in Thalos. Once delivery is confirmed, the funds are released.",
    result: "Farmer gets payment assurance. Distributor reduces supply risk.",
    buyerLabel: "Distributor",
    sellerLabel: "Farmer",
  },
  {
    icon: "M3 4h18v4H3zM3 10h18v4H3zM3 16h18v4H3z",
    title: "Event Management",
    buyer: "I don't want to pay everything before the event.",
    seller: "We'll split it into milestones using Thalos.",
    result: "Deposit locked, venue confirmed, partial release, event completed, final release.",
    buyerLabel: "Client",
    sellerLabel: "Organizer",
  },
  {
    icon: "M5 17h14M2 9h20l-2.5-5H4.5L2 9zM7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    title: "Car Dealership",
    buyer: "I want to secure the car, but only release funds once ownership transfer is processed.",
    seller: "We use Thalos escrow for secure transfers.",
    result: "Trust without relying purely on dealership reputation.",
    buyerLabel: "Buyer",
    sellerLabel: "Dealer",
  },
  {
    icon: "M2 3h20v14H2zM8 21h8M12 17v4",
    title: "Software Development",
    buyer: "We'll pay in 3 milestones -- design, backend, deployment.",
    seller: "Let's structure it on Thalos.",
    result: "Clear execution. Reduced dispute risk.",
    buyerLabel: "Startup Founder",
    sellerLabel: "Developer",
  },
  {
    icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10A15 15 0 0 1 12 2z",
    title: "Import / Export",
    buyer: "I'll release payment once shipment clears customs.",
    seller: "Use Thalos to lock funds until tracking confirms delivery.",
    result: "Cross-border trust minimized.",
    buyerLabel: "Importer",
    sellerLabel: "Exporter",
  },
  {
    icon: "M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c0 2 6 3 6 3s6-1 6-3v-5",
    title: "Online Coaching",
    buyer: "Can I pay per module?",
    seller: "Yes, funds unlock after each session milestone.",
    result: "Predictable structured learning payments.",
    buyerLabel: "Student",
    sellerLabel: "Coach",
  },
]

export function UseCases() {
  const { ref, isVisible } = useSectionReveal()
  const { displayed: twText, isTyping: twActive } = useTypewriter("[Use Cases]", isVisible, { typeSpeed: 120, deleteSpeed: 60, pauseBeforeDelete: 2500, pauseBeforeType: 800 })

  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  // Auto-advance every 5s
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % useCases.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [isPaused])

  const goTo = useCallback((idx: number) => {
    setCurrent(idx)
    setIsPaused(true)
    // resume auto after 10s
    setTimeout(() => setIsPaused(false), 10000)
  }, [])

  const next = useCallback(() => goTo((current + 1) % useCases.length), [current, goTo])
  const prev = useCallback(() => goTo((current - 1 + useCases.length) % useCases.length), [current, goTo])

  const uc = useCases[current]

  return (
    <section id="use-cases" className="relative py-28" ref={ref}>
      <div className={cn("mx-auto max-w-7xl px-6 section-reveal", isVisible && "is-visible")}>
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-base font-bold uppercase tracking-wider text-[#f0b400] md:text-lg">
            <span>{twText}</span>
            <span className={cn("ml-0.5 inline-block h-4 w-0.5 bg-[#f0b400] align-middle", twActive ? "animate-pulse" : "opacity-0")} />
          </p>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-6xl text-balance">
            Real-World Scenarios
          </h2>
          <p className="mx-auto max-w-2xl text-base font-medium text-white/55 leading-relaxed text-pretty">
            A programmable trust layer for structured payments. Anywhere two parties need conditional value exchange -- Thalos fits.
          </p>
        </div>

        {/* Carousel card */}
        <div className="relative mx-auto max-w-3xl" ref={trackRef}>
          {/* Navigation arrows */}
          <button
            onClick={prev}
            className="absolute -left-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-background/80 text-white/60 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white md:-left-14"
            aria-label="Previous"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            onClick={next}
            className="absolute -right-4 top-1/2 z-20 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-background/80 text-white/60 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white md:-right-14"
            aria-label="Next"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>

          {/* Card */}
          <div
            key={current}
            className="rounded-2xl border border-white/10 bg-card/50 p-8 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)] animate-fade-in-up"
          >
            {/* Title row */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0b400]/10 text-[#f0b400]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d={uc.icon} />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-foreground">{uc.title}</h3>
              <span className="ml-auto text-xs font-bold text-white/20">{current + 1}/{useCases.length}</span>
            </div>

            {/* Conversation */}
            <div className="flex flex-col gap-4 mb-6">
              {/* Buyer */}
              <div className="flex gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f0b400]/10 text-xs font-bold text-[#f0b400]">
                  {uc.buyerLabel.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-[#f0b400] mb-1">{uc.buyerLabel}</p>
                  <p className="text-sm font-medium leading-relaxed text-white/70 italic">{'"'}{uc.buyer}{'"'}</p>
                </div>
              </div>
              {/* Seller */}
              <div className="flex gap-3">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/60">
                  {uc.sellerLabel.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-bold text-white/50 mb-1">{uc.sellerLabel}</p>
                  <p className="text-sm font-medium leading-relaxed text-white/70 italic">{'"'}{uc.seller}{'"'}</p>
                </div>
              </div>
            </div>

            {/* Result */}
            <div className="rounded-xl border border-[#f0b400]/15 bg-[#f0b400]/[0.04] px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[#f0b400] mb-1">Result</p>
              <p className="text-sm font-medium leading-relaxed text-white/65">{uc.result}</p>
            </div>
          </div>

          {/* Dots */}
          <div className="mt-6 flex items-center justify-center gap-2">
            {useCases.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  idx === current ? "w-6 bg-[#f0b400]" : "w-2 bg-white/20 hover:bg-white/40"
                )}
                aria-label={`Go to use case ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
