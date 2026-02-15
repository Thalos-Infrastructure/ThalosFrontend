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
        <div className="text-center mb-14">
          <p className="mb-3 text-base font-bold uppercase tracking-wider text-[#f0b400] md:text-lg">
            <span>{twText}</span>
            <span className={cn("ml-0.5 inline-block h-4 w-0.5 bg-[#f0b400] align-middle", twActive ? "animate-pulse" : "opacity-0")} />
          </p>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
            {t("profiles.title")}
          </h2>
          <p className="mx-auto max-w-3xl text-base font-medium text-muted-foreground leading-relaxed text-pretty">
            {t("profiles.desc")}
          </p>
        </div>

        {/* Industry cards grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>, label: t("profiles.commerce") },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>, label: t("profiles.realEstate") },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>, label: t("profiles.freelance") },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>, label: t("profiles.tourism") },
            { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>, label: t("profiles.enterprise") },
          ].map((item, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate("use-cases")}
              className="section-reveal-child group flex flex-col items-center gap-3 rounded-2xl border border-border/20 bg-card/30 p-5 backdrop-blur-sm transition-all duration-500 hover:border-[#f0b400]/25 hover:bg-card/50"
              style={{ transitionDelay: isVisible ? `${idx * 80}ms` : "0ms" }}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f0b400]/10 text-[#f0b400] transition-colors group-hover:bg-[#f0b400]/15">
                {item.icon}
              </div>
              <span className="text-xs font-semibold text-foreground/70 text-center group-hover:text-foreground transition-colors">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
