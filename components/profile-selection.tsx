"use client"

import { cn } from "@/lib/utils"
import { useSectionReveal } from "@/hooks/use-section-reveal"
import { useTypewriter } from "@/hooks/use-typewriter"
import { useLanguage } from "@/lib/i18n"

export function ProfileSelection({ onNavigate }: { onNavigate: (section: string) => void }) {
  const { t } = useLanguage()
  const { ref, isVisible } = useSectionReveal()
  const { displayed: twText, isTyping: twActive } = useTypewriter(t("profiles.tag"), isVisible, { typeSpeed: 100, deleteSpeed: 50, pauseBeforeDelete: 3000, pauseBeforeType: 800 })

  return (
    <section id="profiles" className="relative py-28" ref={ref}>
      <div className={cn("mx-auto max-w-7xl px-6 section-reveal", isVisible && "is-visible")}>
        <div className="text-center">
          <p className="mb-3 text-base font-bold uppercase tracking-wider text-[#f0b400] md:text-lg">
            <span>{twText}</span>
            <span className={cn("ml-0.5 inline-block h-4 w-0.5 bg-[#f0b400] align-middle", twActive ? "animate-pulse" : "opacity-0")} />
          </p>
          <p className="mx-auto max-w-3xl text-lg font-medium text-muted-foreground leading-relaxed text-pretty md:text-xl">
            {t("profiles.desc")}
          </p>
        </div>
      </div>
    </section>
  )
}
