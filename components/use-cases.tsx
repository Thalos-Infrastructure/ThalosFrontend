"use client"

import { cn } from "@/lib/utils"
import { useSectionReveal } from "@/hooks/use-section-reveal"
import { useTypewriter } from "@/hooks/use-typewriter"
import { useLanguage } from "@/lib/i18n"

const useCases = [
  {
    title: "Real Estate Sale",
    buyer: "I want to reserve the house, but I don't feel safe wiring the full deposit upfront.",
    seller: "Let's use Thalos. The funds stay locked until the legal documents are signed.",
    result: "Funds are secured on-chain. Released only when ownership transfer is confirmed.",
    buyerLabel: "Buyer",
    sellerLabel: "Seller",
    color: "#f0b400",
  },
  {
    title: "Agriculture Pre-Sale",
    buyer: "I'll buy your harvest, but I need guarantee of delivery.",
    seller: "Lock the payment in Thalos. Once delivery is confirmed, the funds are released.",
    result: "Farmer gets payment assurance. Distributor reduces supply risk.",
    buyerLabel: "Distributor",
    sellerLabel: "Farmer",
    color: "#4ade80",
  },
  {
    title: "Event Management",
    buyer: "I don't want to pay everything before the event.",
    seller: "We'll split it into milestones using Thalos.",
    result: "Deposit locked, venue confirmed, partial release, event completed, final release.",
    buyerLabel: "Client",
    sellerLabel: "Organizer",
    color: "#60a5fa",
  },
  {
    title: "Car Dealership",
    buyer: "I want to secure the car, but only release funds once ownership transfer is processed.",
    seller: "We use Thalos escrow for secure transfers.",
    result: "Trust without relying purely on dealership reputation.",
    buyerLabel: "Buyer",
    sellerLabel: "Dealer",
    color: "#f97316",
  },
  {
    title: "Software Development",
    buyer: "We'll pay in 3 milestones — design, backend, deployment.",
    seller: "Let's structure it on Thalos.",
    result: "Clear execution. Reduced dispute risk.",
    buyerLabel: "Startup Founder",
    sellerLabel: "Developer",
    color: "#a78bfa",
  },
  {
    title: "Import / Export",
    buyer: "I'll release payment once shipment clears customs.",
    seller: "Use Thalos to lock funds until tracking confirms delivery.",
    result: "Cross-border trust minimized.",
    buyerLabel: "Importer",
    sellerLabel: "Exporter",
    color: "#f472b6",
  },
  {
    title: "Online Coaching",
    buyer: "Can I pay per module?",
    seller: "Yes, funds unlock after each session milestone.",
    result: "Predictable structured learning payments.",
    buyerLabel: "Student",
    sellerLabel: "Coach",
    color: "#2dd4bf",
  },
]

// Duplicate for seamless loop
const marqueeItems = [...useCases, ...useCases]

function UseCaseCard({ uc }: { uc: typeof useCases[number] }) {
  return (
    <div className="w-[340px] shrink-0 rounded-2xl border border-border/20 bg-card/50 p-6 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.1)] md:w-[380px]">
      {/* Title */}
      <div className="mb-4 flex items-center gap-3">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: uc.color }} />
        <h3 className="text-lg font-bold text-foreground">{uc.title}</h3>
      </div>

      {/* Conversation */}
      <div className="flex flex-col gap-3 mb-4">
        <div>
          <p className="text-xs font-bold mb-1" style={{ color: uc.color }}>{uc.buyerLabel}</p>
          <p className="text-sm leading-relaxed text-muted-foreground italic">{'"'}{uc.buyer}{'"'}</p>
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground/60 mb-1">{uc.sellerLabel}</p>
          <p className="text-sm leading-relaxed text-muted-foreground italic">{'"'}{uc.seller}{'"'}</p>
        </div>
      </div>

      {/* Result */}
      <div className="rounded-xl border border-border/10 bg-secondary/30 px-4 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#f0b400] mb-1">Result</p>
        <p className="text-xs font-medium leading-relaxed text-muted-foreground">{uc.result}</p>
      </div>
    </div>
  )
}

export function UseCases() {
  const { t } = useLanguage()
  const { ref, isVisible } = useSectionReveal()
  const { displayed: twText, isTyping: twActive } = useTypewriter(t("useCases.tag"), isVisible, { typeSpeed: 120, deleteSpeed: 60, pauseBeforeDelete: 2500, pauseBeforeType: 800 })

  return (
    <section id="use-cases" className="relative py-28 overflow-hidden" ref={ref}>
      <div className={cn("section-reveal", isVisible && "is-visible")}>
        {/* Header */}
        <div className="mx-auto max-w-7xl px-6 mb-14 text-center">
          <p className="mb-3 text-base font-bold uppercase tracking-wider text-[#f0b400] md:text-lg">
            <span>{twText}</span>
            <span className={cn("ml-0.5 inline-block h-4 w-0.5 bg-[#f0b400] align-middle", twActive ? "animate-pulse" : "opacity-0")} />
          </p>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-6xl text-balance">
            {t("useCases.title")}
          </h2>
          <p className="mx-auto max-w-3xl text-base font-medium text-muted-foreground leading-relaxed text-pretty">
            {t("useCases.desc")}
          </p>
        </div>

        {/* Infinite marquee */}
        <div className="relative">
          {/* Fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-background to-transparent" />

          <div className="flex gap-6 animate-marquee hover:[animation-play-state:paused]">
            {marqueeItems.map((uc, idx) => (
              <UseCaseCard key={`${uc.title}-${idx}`} uc={uc} />
            ))}
          </div>
        </div>
      </div>

      {/* Marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
          width: max-content;
        }
      `}</style>
    </section>
  )
}
