"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState, useCallback } from "react"
import { useLanguage, LanguageToggle, ThemeToggle } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { ThalosLoader } from "@/components/thalos-loader"

const THALOS_DATA = [
  { letter: "T", key: "T" },
  { letter: "h", key: "h" },
  { letter: "a", key: "a" },
  { letter: "l", key: "l" },
  { letter: "o", key: "o" },
  { letter: "s", key: "s" },
]

function useSectionReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: "-40px" }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function RevealBlock({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useSectionReveal()
  return (
    <div
      ref={ref}
      className={cn("transition-all duration-[800ms] ease-out", className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

export default function AboutPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [scrollDarken, setScrollDarken] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  const onScroll = useCallback(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0
    setScrollDarken(progress)
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [onScroll])

  const overlayOpacity = 0.35 + scrollDarken * 0.50

  if (loading) return <ThalosLoader />

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Ocean collage background - same as main page */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0 opacity-35">
          <div className="col-span-2 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&q=85&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=85&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476673160081-cf065607f449?w=1920&q=85&auto=format&fit=crop')" }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-background/45 to-background/85" />
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-background"
        style={{ opacity: overlayOpacity, transition: "opacity 150ms linear" }}
        aria-hidden="true"
      />

      {/* Top nav */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <nav className="flex items-center justify-between px-6 py-4 lg:px-12 backdrop-blur-md bg-background/60 border-b border-border/30">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/thalos-icon.png" alt="Thalos" width={36} height={36} className="h-9 w-9 object-contain" />
            <span className="text-lg font-bold text-foreground">Thalos</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageToggle />
            <Link
              href="/"
              className="rounded-full border border-border/40 bg-secondary/50 px-4 py-1.5 text-xs font-bold text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
            >
              Home
            </Link>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="relative z-10 pt-24">

        {/* ========== HERO ========== */}
        <section className="flex min-h-[55vh] items-center px-6 py-24 lg:px-16">
          <div className="mx-auto max-w-4xl text-center">
            <RevealBlock>
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#f0b400]">
                {t("vision.tag")}
              </p>
            </RevealBlock>
            <RevealBlock delay={100}>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
                {t("vision.title")}
              </h1>
            </RevealBlock>
          </div>
        </section>

        {/* ========== VISION & MISSION - Text focused ========== */}
        <section className="px-6 pb-32 lg:px-16">
          <div className="mx-auto max-w-4xl">
            {/* Vision */}
            <RevealBlock className="mb-20">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0b400]/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <h2 className="text-3xl font-bold text-foreground">{t("vision.vision")}</h2>
              </div>
              <p className="text-lg font-medium leading-relaxed text-muted-foreground max-w-3xl">
                {t("vision.visionText")}
              </p>
              <p className="mt-6 text-base font-medium leading-relaxed text-muted-foreground/80 max-w-3xl">
                We envision a financial system where trust is not a prerequisite but a product of the system itself. Where a freelancer in Buenos Aires can work with a client in Berlin with the same certainty as a handshake between neighbors. Where every peso, dollar, and euro locked in an agreement works for everyone involved until the moment it is released.
              </p>
            </RevealBlock>

            {/* Mission */}
            <RevealBlock className="mb-20">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0b400]/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <h2 className="text-3xl font-bold text-foreground">{t("vision.mission")}</h2>
              </div>
              <p className="text-lg font-medium leading-relaxed text-muted-foreground max-w-3xl">
                {t("vision.missionText")}
              </p>
              <p className="mt-6 text-base font-medium leading-relaxed text-muted-foreground/80 max-w-3xl">
                Thalos is more than a payment platform. It is a trust infrastructure designed for the real world, where agreements are complex, parties are global, and the cost of broken promises is high. We build on Stellar because speed, low cost, and accessibility matter. We integrate Trustless Work because non-custodial escrow should be the standard, not the exception.
              </p>
            </RevealBlock>

            {/* Separator */}
            <div className="mx-auto mb-20 h-px w-48 bg-gradient-to-r from-transparent via-[#f0b400]/30 to-transparent" />

            {/* ========== THALOS TECH VERTICAL ========== */}
            <RevealBlock className="mb-10 text-center">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#f0b400]">
                {t("vision.techTitle")}
              </p>
              <p className="mx-auto max-w-2xl text-base font-medium text-muted-foreground leading-relaxed">
                {t("vision.techDesc")}
              </p>
            </RevealBlock>

            {/* THALOS letter rows with right-side vertical accent */}
            <div className="relative">
              {/* Vertical THALOS watermark on the right */}
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 hidden select-none xl:flex xl:flex-col xl:items-center xl:justify-center xl:-right-20 2xl:-right-28" aria-hidden="true">
                {"Thalos".split("").map((l, i) => (
                  <span key={i} className="block font-black text-foreground/[0.03] leading-[0.75]" style={{ fontSize: "clamp(5rem, 8vh, 10rem)" }}>{l}</span>
                ))}
              </div>

              <div className="flex flex-col gap-4">
                {THALOS_DATA.map(({ letter, key }, idx) => (
                  <RevealBlock key={key} delay={idx * 80}>
                    <div className="group flex items-start gap-5 rounded-xl py-5 px-2 transition-all duration-300 hover:bg-card/30 md:gap-8 md:px-4">
                      {/* Large letter */}
                      <span className="shrink-0 text-5xl font-black text-[#f0b400] leading-none md:text-6xl lg:text-7xl" style={{ minWidth: "3.5rem" }}>
                        {letter}
                      </span>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-1">
                        <h3 className="text-xl font-bold text-foreground md:text-2xl leading-tight">
                          {t(`vision.${key}`)}
                        </h3>
                        <p className="mt-2 text-base font-medium leading-relaxed text-muted-foreground">
                          {t(`vision.${key}Desc`)}
                        </p>
                      </div>
                    </div>

                    {/* Subtle separator between rows */}
                    {idx < THALOS_DATA.length - 1 && (
                      <div className="ml-20 h-px bg-border/10 md:ml-24" />
                    )}
                  </RevealBlock>
                ))}

                {/* Trustless Work accent row */}
                <RevealBlock delay={THALOS_DATA.length * 80}>
                  <div className="mt-2 group flex items-start gap-5 rounded-xl border border-[#f0b400]/10 bg-[#f0b400]/[0.03] py-5 px-4 transition-all duration-300 hover:border-[#f0b400]/20 hover:bg-[#f0b400]/[0.06] md:gap-8">
                    <div className="shrink-0 flex h-14 w-14 items-center justify-center md:h-16 md:w-16">
                      <Image src="/trustless-logo.png" alt="Trustless Work" width={48} height={48} className="h-10 w-10 object-contain md:h-12 md:w-12 opacity-80" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="text-xl font-bold text-foreground md:text-2xl leading-tight">
                        {t("vision.trustlessWork")}
                      </h3>
                      <p className="mt-2 text-base font-medium leading-relaxed text-muted-foreground">
                        {t("vision.trustlessWorkDesc")}
                      </p>
                    </div>
                  </div>
                </RevealBlock>
              </div>
            </div>

            {/* Partners */}
            <RevealBlock className="mt-20">
              <div className="flex items-center justify-center gap-8">
                <a href="https://stellar.org/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Built on</span>
                  <Image src="/stellar-full.png" alt="Stellar" width={24} height={24} className="h-5 w-5 shrink-0 object-contain opacity-50" />
                </a>
                <div className="h-4 w-px bg-border/30" aria-hidden="true" />
                <a href="https://www.trustlesswork.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">Escrows by</span>
                  <Image src="/trustless-logo.png" alt="Trustless Work" width={20} height={20} className="h-4 w-auto object-contain opacity-50" />
                </a>
              </div>
            </RevealBlock>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/10">
          <div className="mx-auto max-w-7xl px-6 py-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/thalos-icon.png" alt="Thalos" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Thalos Infrastructure</span>
            </div>
            <Link href="/" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              Back to Home
            </Link>
          </div>
        </footer>
      </main>
    </div>
  )
}
