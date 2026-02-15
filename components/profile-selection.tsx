"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useSectionReveal } from "@/hooks/use-section-reveal"
import { useTypewriter } from "@/hooks/use-typewriter"

const categories = [
  {
    id: "digital",
    label: "Digital Economy",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" />
      </svg>
    ),
    items: ["Freelancers", "Agencies", "Remote teams", "Creators", "Developers"],
  },
  {
    id: "commerce",
    label: "Commerce & Trade",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
    items: ["Import / Export", "Wholesale suppliers", "Distributors", "E-commerce merchants", "Marketplace operators"],
  },
  {
    id: "realestate",
    label: "Real Estate",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
    items: ["Property sales", "Rental agreements", "Short-term leasing", "Property management"],
  },
  {
    id: "automotive",
    label: "Automotive",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17h14" /><path d="M2 9h20l-2.5-5H4.5L2 9z" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /><path d="M2 9v8h3" /><path d="M19 17h3V9" />
      </svg>
    ),
    items: ["Car dealerships", "Peer-to-peer vehicle sales", "Car rental businesses"],
  },
  {
    id: "events",
    label: "Events & Services",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" />
      </svg>
    ),
    items: ["Event planners", "Wedding organizers", "Conference producers", "Catering services", "Production agencies"],
  },
  {
    id: "education",
    label: "Education",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c0 2 6 3 6 3s6-1 6-3v-5" />
      </svg>
    ),
    items: ["Online academies", "Course creators", "Coaching programs", "Private tutors"],
  },
  {
    id: "agriculture",
    label: "Agriculture",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z" /><path d="M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
      </svg>
    ),
    items: ["Crop pre-sales", "Farming contracts", "Equipment leasing", "Produce distribution"],
  },
  {
    id: "construction",
    label: "Construction",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 20h20" /><path d="M5 20V8l7-5 7 5v12" /><path d="M9 20v-4h6v4" />
      </svg>
    ),
    items: ["Contractor agreements", "Milestone-based construction", "Subcontractor management"],
  },
  {
    id: "tourism",
    label: "Tourism & Hospitality",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10A15 15 0 0 1 12 2z" />
      </svg>
    ),
    items: ["Travel agencies", "Vacation rentals", "Tour operators"],
  },
  {
    id: "enterprise",
    label: "Enterprise Procurement",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </svg>
    ),
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
            Anywhere there is counterparty risk, payment uncertainty, milestone delivery, high-value exchange, or cross-border friction -- Thalos can apply.
          </p>
        </div>

        {/* Category tabs -- horizontal scroll on mobile */}
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
              {cat.icon}
              <span className="whitespace-nowrap">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Active category content */}
        <div className="rounded-2xl border border-white/10 bg-card/40 p-8 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0b400]/10 text-[#f0b400]">
              {active.icon}
            </div>
            <h3 className="text-xl font-bold text-foreground">{active.label}</h3>
          </div>
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
