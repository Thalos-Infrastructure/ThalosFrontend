"use client"

import { cn } from "@/lib/utils"
import { useSectionReveal } from "@/hooks/use-section-reveal"
import { useTypewriter } from "@/hooks/use-typewriter"
import { useLanguage } from "@/lib/i18n"

const personas = [
  { key: "freelancers", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { key: "entrepreneurs", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg> },
  { key: "businesses", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg> },
  { key: "marketplaces", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 8v12a2 2 0 002 2h14a2 2 0 002-2V8l-3-6z"/><line x1="3" y1="8" x2="21" y2="8"/><path d="M16 12a4 4 0 01-8 0"/></svg> },
  { key: "agencies", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg> },
  { key: "developers", icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
]

export function WhoCanUse() {
  const { t } = useLanguage()
  const { ref, isVisible } = useSectionReveal()
  const { displayed: twText, isTyping: twActive } = useTypewriter(t("whoCanUse.tag"), isVisible, { typeSpeed: 120, deleteSpeed: 60, pauseBeforeDelete: 2500, pauseBeforeType: 800 })

  return (
    <section id="who-can-use" className="relative py-28" ref={ref}>
      <div className={cn("mx-auto max-w-7xl px-6 section-reveal", isVisible && "is-visible")}>
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-base font-bold uppercase tracking-wider text-[#f0b400] md:text-lg">
            <span>{twText}</span>
            <span className={cn("ml-0.5 inline-block h-4 w-0.5 bg-[#f0b400] align-middle", twActive ? "animate-pulse" : "opacity-0")} />
          </p>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
            {t("whoCanUse.title")}
          </h2>
          <p className="mx-auto max-w-3xl text-base font-medium text-muted-foreground leading-relaxed text-pretty">
            {t("whoCanUse.desc")}
          </p>
        </div>

        {/* Persona grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona, idx) => (
            <div
              key={persona.key}
              className="section-reveal-child group rounded-2xl border border-border/20 bg-card/40 p-6 backdrop-blur-sm shadow-[0_4px_16px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-500 hover:border-[#f0b400]/20 hover:shadow-[0_4px_20px_rgba(240,180,0,0.06),inset_0_1px_0_rgba(255,255,255,0.06)]"
              style={{ transitionDelay: isVisible ? `${idx * 80}ms` : "0ms" }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f0b400]/10 text-[#f0b400] transition-colors group-hover:bg-[#f0b400]/15">
                {persona.icon}
              </div>
              <h3 className="mb-2 text-base font-bold text-foreground">
                {t(`whoCanUse.${persona.key}`)}
              </h3>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                {t(`whoCanUse.${persona.key}Desc`)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
