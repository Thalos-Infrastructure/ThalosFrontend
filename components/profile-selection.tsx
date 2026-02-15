"use client"

import { cn } from "@/lib/utils"
import { useSectionReveal } from "@/hooks/use-section-reveal"
import { useTypewriter } from "@/hooks/use-typewriter"

const scenarios = [
  { title: "Real Estate Sale", description: "Funds secured on-chain, released only when ownership transfer is confirmed.", color: "#f0b400" },
  { title: "Agriculture Pre-Sale", description: "Farmer gets payment assurance. Distributor reduces supply risk.", color: "#4ade80" },
  { title: "Event Management", description: "Split into milestones: deposit, venue, catering, final release.", color: "#60a5fa" },
  { title: "Car Dealership", description: "Escrow for secure vehicle transfers without relying on reputation.", color: "#f97316" },
  { title: "Software Development", description: "Pay in milestones: design, backend, deployment. Clear execution.", color: "#a78bfa" },
  { title: "Import / Export", description: "Funds released once shipment clears customs and tracking confirms.", color: "#f472b6" },
  { title: "Online Coaching", description: "Funds unlock per module completion. Structured learning payments.", color: "#2dd4bf" },
  { title: "Freelancer Projects", description: "Milestone-based escrow for project deliverables between clients and freelancers.", color: "#fbbf24" },
  { title: "Construction", description: "Contractor payments staged per build milestone: foundation, structure, finish.", color: "#fb923c" },
  { title: "Marketplace Orders", description: "Protected buyer-seller transactions with conditional release on delivery.", color: "#818cf8" },
]

export function ProfileSelection({ onNavigate }: { onNavigate: (section: string) => void }) {
  const { ref, isVisible } = useSectionReveal()
  const { displayed: twText, isTyping: twActive } = useTypewriter("[Who Benefits]", isVisible, { typeSpeed: 120, deleteSpeed: 60, pauseBeforeDelete: 2500, pauseBeforeType: 800 })

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
            Real-World Scenarios
          </h2>
          <p className="mx-auto max-w-3xl text-base font-medium text-white/55 leading-relaxed text-pretty">
            Anywhere there is counterparty risk, payment uncertainty, milestone delivery, high-value exchange, or cross-border friction — Thalos can apply.
          </p>
        </div>

        {/* Scenario cards grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {scenarios.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl border border-white/8 bg-card/40 p-5 backdrop-blur-sm transition-all duration-400 hover:border-white/15 hover:bg-card/60 shadow-[0_4px_20px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]"
            >
              <div className="mb-3 flex items-center gap-2.5">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                <h3 className="text-sm font-bold text-foreground">{s.title}</h3>
              </div>
              <p className="text-xs font-medium leading-relaxed text-white/50">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
