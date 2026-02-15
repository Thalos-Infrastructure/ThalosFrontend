"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useSectionReveal } from "@/hooks/use-section-reveal"
import { useTypewriter } from "@/hooks/use-typewriter"

const categories = [
  {
    id: "digital",
    label: "Digital Economy",
    items: ["Freelancers", "Agencies", "Remote teams", "Creators", "Developers"],
  },
  {
    id: "commerce",
    label: "Commerce & Trade",
    items: ["Import / Export", "Wholesale suppliers", "Distributors", "E-commerce merchants", "Marketplace operators"],
  },
  {
    id: "realestate",
    label: "Real Estate",
    items: ["Property sales", "Rental agreements", "Short-term leasing", "Property management"],
  },
  {
    id: "automotive",
    label: "Automotive",
    items: ["Car dealerships", "Peer-to-peer vehicle sales", "Car rental businesses"],
  },
  {
    id: "events",
    label: "Events & Services",
    items: ["Event planners", "Wedding organizers", "Conference producers", "Catering services", "Production agencies"],
  },
  {
    id: "education",
    label: "Education",
    items: ["Online academies", "Course creators", "Coaching programs", "Private tutors"],
  },
  {
    id: "agriculture",
    label: "Agriculture",
    items: ["Crop pre-sales", "Farming contracts", "Equipment leasing", "Produce distribution"],
  },
  {
    id: "construction",
    label: "Construction",
    items: ["Contractor agreements", "Milestone-based construction", "Subcontractor management"],
  },
  {
    id: "tourism",
    label: "Tourism & Hospitality",
    items: ["Travel agencies", "Vacation rentals", "Tour operators"],
  },
  {
    id: "enterprise",
    label: "Enterprise Procurement",
    items: ["Vendor agreements", "Supplier contracts", "Milestone-based B2B services"],
  },
]

export function ProfileSelection({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [activeCategory, setActiveCategory] = useState("digital")
  const { ref, isVisible } = useSectionReveal()
  const { displayed: twText, isTyping: twActive } = useTypewriter("[Who Benefits]", isVisible, { typeSpeed: 120, deleteSpeed: 60, pauseBeforeDelete: 2500, pauseBeforeType: 800 })

  const active = categories.find((c) => c.id === activeCategory)!

  return (
    <section id="profiles" className="relative py-28" ref={ref}>
      <div className={cn("mx-auto max-w-7xl px-6 section-reveal", isVisible && "is-visible")}>
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-base font-bold uppercase tracking-wider text-[#f0b400] md:text-lg">
            <span>{twText}</span>
            <span className={cn("ml-0.5 inline-block h-4 w-0.5 bg-[#f0b400] align-middle", twActive ? "animate-pulse" : "opacity-0")} />
          </p>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-6xl text-balance">
            Solutions by Industry
          </h2>
          <p className="mx-auto max-w-2xl text-base font-medium text-white/55 leading-relaxed text-pretty">
            Anywhere there is counterparty risk, payment uncertainty, milestone delivery, high-value exchange, or cross-border friction — Thalos can apply.
          </p>
        </div>

        {/* Category tabs */}
        <div className="mb-10 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold transition-all duration-300",
                activeCategory === cat.id
                  ? "bg-[#f0b400] text-background shadow-[0_4px_16px_rgba(240,180,0,0.25)]"
                  : "border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
              )}
            >
              <span className="whitespace-nowrap">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Active category */}
        <div className="rounded-2xl border border-white/10 bg-card/40 p-8 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]">
          <h3 className="text-xl font-bold text-foreground mb-5">{active.label}</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {active.items.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3.5 transition-all duration-300 hover:border-[#f0b400]/20 hover:bg-[#f0b400]/[0.04]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#f0b400]">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm font-medium text-white/70">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
