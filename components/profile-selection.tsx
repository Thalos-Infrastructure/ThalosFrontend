"use client"

import { cn } from "@/lib/utils"
import { useSectionReveal } from "@/hooks/use-section-reveal"
import { useTypewriter } from "@/hooks/use-typewriter"

export function ProfileSelection({ onNavigate }: { onNavigate: (section: string) => void }) {
  const { ref, isVisible } = useSectionReveal()
  const { displayed: twText, isTyping: twActive } = useTypewriter("[Who Benefits]", isVisible, { typeSpeed: 120, deleteSpeed: 60, pauseBeforeDelete: 2500, pauseBeforeType: 800 })

  return (
    <section id="profiles" className="relative py-20" ref={ref}>
      <div className={cn("mx-auto max-w-4xl px-6 text-center section-reveal", isVisible && "is-visible")}>
        <p className="mb-3 text-base font-bold uppercase tracking-wider text-[#f0b400] md:text-lg">
          <span>{twText}</span>
          <span className={cn("ml-0.5 inline-block h-4 w-0.5 bg-[#f0b400] align-middle", twActive ? "animate-pulse" : "opacity-0")} />
        </p>
        <p className="mx-auto max-w-3xl text-xl font-medium text-white/60 leading-relaxed text-pretty">
          Anywhere there is <span className="text-white font-semibold">counterparty risk</span>, <span className="text-white font-semibold">payment uncertainty</span>, <span className="text-white font-semibold">milestone delivery</span>, <span className="text-white font-semibold">high-value exchange</span>, or <span className="text-white font-semibold">cross-border friction</span> — Thalos can apply.
        </p>
      </div>
    </section>
  )
}
