"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useLanguage, LanguageToggle, ThemeToggle } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { ThalosLoader } from "@/components/thalos-loader"

const LETTERS = ["T", "h", "a", "l", "o", "s"]
const TECH_KEYS = ["T", "h", "a", "l", "o", "s"]

function RevealSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-[900ms] ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  )
}

export default function AboutPage() {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [scrollDarken, setScrollDarken] = useState(0)
  const [letterOpacities, setLetterOpacities] = useState<number[]>([1, 1, 1, 1, 1, 1])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    function onScroll() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0
      setScrollDarken(progress)

      const vh = window.innerHeight
      const scrollY = window.scrollY
      const newOpacities = LETTERS.map((_, i) => {
        const fadeStart = vh * 0.15 + i * vh * 0.12
        const fadeEnd = fadeStart + vh * 0.35
        if (scrollY < fadeStart) return 1
        if (scrollY > fadeEnd) return 0
        return 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart)
      })
      setLetterOpacities(newOpacities)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

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

      {/* Vertical THALOS - right side, subtle watermark */}
      <div
        className="pointer-events-none fixed right-0 top-0 bottom-0 z-20 hidden select-none md:flex md:flex-col md:items-center md:justify-center lg:right-4 xl:right-8"
        aria-hidden="true"
      >
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            className="block font-black lowercase leading-[0.72] text-foreground"
            style={{
              opacity: letterOpacities[i] * 0.06,
              transition: "opacity 180ms cubic-bezier(0.25, 0.1, 0.25, 1)",
              fontSize: "clamp(9rem, 17.5vh, 20rem)",
              letterSpacing: "-0.05em",
            }}
          >
            {letter}
          </span>
        ))}
      </div>

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
        {/* Hero */}
        <section className="flex min-h-[60vh] items-center px-6 py-24 lg:px-16">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#f0b400]">
              {t("vision.tag")}
            </p>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
              {t("vision.title")}
            </h1>
          </div>
        </section>

        {/* Vision & Mission cards */}
        <section className="px-6 pb-24 lg:px-16">
          <div className="mx-auto max-w-5xl grid gap-8 md:grid-cols-2">
            <RevealSection>
              <div className="h-full rounded-2xl border border-border/20 bg-card/40 p-8 backdrop-blur-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0b400]/10">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{t("vision.vision")}</h2>
                </div>
                <p className="text-base font-medium leading-relaxed text-muted-foreground">
                  {t("vision.visionText")}
                </p>
              </div>
            </RevealSection>

            <RevealSection>
              <div className="h-full rounded-2xl border border-border/20 bg-card/40 p-8 backdrop-blur-sm">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0b400]/10">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{t("vision.mission")}</h2>
                </div>
                <p className="text-base font-medium leading-relaxed text-muted-foreground">
                  {t("vision.missionText")}
                </p>
              </div>
            </RevealSection>
          </div>
        </section>

        {/* Separator */}
        <div className="mx-auto mb-6 h-px w-32 bg-gradient-to-r from-transparent via-[#f0b400]/30 to-transparent" />

        {/* Technology Stack - THALOS vertical mapping */}
        <section className="px-6 py-24 lg:px-16">
          <div className="mx-auto max-w-5xl">
            <RevealSection className="mb-14 text-center">
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#f0b400]">
                {t("vision.techTitle")}
              </p>
              <p className="mx-auto max-w-2xl text-base font-medium text-muted-foreground leading-relaxed">
                {t("vision.techDesc")}
              </p>
            </RevealSection>

            {/* THALOS letter rows */}
            <div className="flex flex-col gap-3">
              {TECH_KEYS.map((key, idx) => (
                <RevealSection key={key}>
                  <div
                    className="group flex items-center gap-5 rounded-2xl border border-border/15 bg-card/30 p-4 backdrop-blur-sm transition-all duration-500 hover:border-[#f0b400]/20 hover:bg-card/50 md:gap-6 md:p-5"
                  >
                    {/* Large letter */}
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center md:h-20 md:w-20">
                      <span className="text-5xl font-black lowercase text-[#f0b400] leading-none md:text-6xl">
                        {key}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-foreground md:text-lg leading-tight">
                        {t(`vision.${key}`)}
                      </h3>
                      <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground line-clamp-2">
                        {t(`vision.${key}Desc`)}
                      </p>
                    </div>
                  </div>
                </RevealSection>
              ))}

              {/* Trustless Work - accent row */}
              <RevealSection>
                <div className="group flex items-center gap-5 rounded-2xl border border-[#f0b400]/15 bg-[#f0b400]/[0.03] p-4 backdrop-blur-sm transition-all duration-500 hover:border-[#f0b400]/30 hover:bg-[#f0b400]/[0.06] md:gap-6 md:p-5">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center md:h-20 md:w-20">
                    <Image src="/trustless-logo.png" alt="Trustless Work" width={48} height={48} className="h-10 w-10 object-contain md:h-12 md:w-12 opacity-80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-foreground md:text-lg leading-tight">
                      {t("vision.trustlessWork")}
                    </h3>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-muted-foreground line-clamp-2">
                      {t("vision.trustlessWorkDesc")}
                    </p>
                  </div>
                </div>
              </RevealSection>
            </div>

            {/* Partners */}
            <div className="mt-16 flex items-center justify-center gap-8">
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
