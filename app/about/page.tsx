"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState, useCallback } from "react"
import { useLanguage, LanguageToggle, ThemeToggle } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { ThalosLoader } from "@/components/thalos-loader"

/* ── THALOS vertical letters ── */
const THALOS_LETTERS = ["T", "h", "a", "l", "o", "s"]

/* ── Tech stack data (matching pasted content) ── */
const TECH_STACK = [
  { letter: "T", key: "T" },
  { letter: "h", key: "h" },
  { letter: "a", key: "a" },
  { letter: "l", key: "l" },
  { letter: "o", key: "o" },
  { letter: "s", key: "s" },
]

/* ── Team ── */
const TEAM = [
  {
    nameKey: "team.leandro",
    roleKey: "team.leandroRole",
    github: "https://github.com/leandromasotti",
    ghUser: "leandromasotti",
  },
  {
    nameKey: "team.diego",
    roleKey: "team.diegoRole",
    github: "https://github.com/Kalchaqui",
    ghUser: "Kalchaqui",
  },
  {
    nameKey: "team.manuel",
    roleKey: "team.manuelRole",
    github: "https://github.com/ManuelJG1999",
    ghUser: "ManuelJG1999",
  },
]

/* ── Section reveal hook (bidirectional) ── */
function useSectionReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold, rootMargin: "-30px" }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function RevealBlock({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, visible } = useSectionReveal(0.1)
  return (
    <div
      ref={ref}
      className={cn("transition-all duration-700 ease-out", className)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
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
  const [letterOpacities, setLetterOpacities] = useState<number[]>([1, 1, 1, 1, 1, 1])

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  /* Scroll-based effects: darken overlay + THALOS letter opacity + word reveals */
  const onScroll = useCallback(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0
    setScrollDarken(progress)

    const scrollY = window.scrollY
    const vh = window.innerHeight

    // Per-letter fade (same logic as main page hero)
    const newOpacities = THALOS_LETTERS.map((_, i) => {
      const fadeStart = vh * 0.08 + i * vh * 0.08
      const fadeEnd = fadeStart + vh * 0.22
      if (scrollY < fadeStart) return 1
      if (scrollY > fadeEnd) return 0
      const raw = 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart)
      return raw * raw
    })
    setLetterOpacities(newOpacities)
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
      {/* Ocean collage background */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0 opacity-50">
          <div className="col-span-2 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&q=80&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=80&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476673160081-cf065607f449?w=1920&q=80&auto=format&fit=crop')" }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/15 via-background/35 to-background/75" />
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-background"
        style={{ opacity: overlayOpacity, transition: "opacity 150ms linear" }}
        aria-hidden="true"
      />

      {/* ── THALOS Vertical LEFT ── */}
      <div
        className="pointer-events-none fixed left-0 top-0 bottom-0 z-20 hidden select-none md:flex md:flex-col md:items-start md:justify-center lg:left-4 xl:left-8"
        aria-hidden="true"
      >
        {THALOS_LETTERS.map((letter, i) => (
          <span
            key={i}
            className="block font-black leading-[0.72] text-foreground"
            style={{
              opacity: letterOpacities[i],
              transition: "opacity 120ms cubic-bezier(0.25, 0.1, 0.25, 1)",
              fontSize: "clamp(10rem, 19vh, 24rem)",
              letterSpacing: "-0.04em",
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Top nav - same style as main page navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0c]/70 backdrop-blur-xl shadow-[0_2px_16px_rgba(0,0,0,0.25)]">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center">
            <Image src="/thalos-icon.png" alt="Thalos" width={72} height={72} className="h-16 w-16 object-contain" priority />
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </nav>
      </header>

      {/* Main content - centered */}
      <main className="relative z-10 pt-24">

        {/* ═══════ HERO ═══════ */}
        <section className="flex min-h-[50vh] items-center justify-center px-6 py-20 lg:px-16">
          <div className="mx-auto max-w-4xl text-center">
            <RevealBlock>
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#f0b400]">
                {t("vision.tag")}
              </p>
            </RevealBlock>
            <RevealBlock delay={100}>
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance leading-tight">
                {t("vision.title")}
              </h1>
            </RevealBlock>
            <RevealBlock delay={200}>
              <p className="text-lg font-medium leading-relaxed text-muted-foreground mx-auto max-w-2xl text-pretty">
                {t("vision.visionText")}
              </p>
            </RevealBlock>
          </div>
        </section>

        {/* ═══════ VISION ═══════ */}
        <section className="px-6 pb-24 lg:px-16">
          <div className="mx-auto max-w-4xl text-center">
            <RevealBlock>
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0b400]/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
                <h2 className="text-3xl font-bold text-foreground">{t("vision.vision")}</h2>
              </div>
            </RevealBlock>
            <RevealBlock delay={80}>
              <p className="text-lg font-medium leading-relaxed text-muted-foreground">
                {t("vision.visionText")}
              </p>
            </RevealBlock>
            <RevealBlock delay={160}>
              <p className="mt-6 text-base font-medium leading-relaxed text-muted-foreground/80">
                {t("vision.visionExtended")}
              </p>
            </RevealBlock>
          </div>
        </section>

        {/* ═══════ MISSION ═══════ */}
        <section className="px-6 pb-24 lg:px-16">
          <div className="mx-auto max-w-4xl text-center">
            <RevealBlock>
              <div className="flex items-center justify-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0b400]/10">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                </div>
                <h2 className="text-3xl font-bold text-foreground">{t("vision.mission")}</h2>
              </div>
            </RevealBlock>
            <RevealBlock delay={80}>
              <p className="text-lg font-medium leading-relaxed text-muted-foreground">
                {t("vision.missionText")}
              </p>
            </RevealBlock>
            <RevealBlock delay={160}>
              <p className="mt-6 text-base font-medium leading-relaxed text-muted-foreground/80">
                {t("vision.missionExtended")}
              </p>
            </RevealBlock>
          </div>
        </section>

        {/* ═══════ SEPARATOR ═══════ */}
        <div className="mx-auto mb-24 h-px max-w-4xl bg-gradient-to-r from-transparent via-[#f0b400]/15 to-transparent" />

        {/* ═══════ CORE TECHNOLOGY STACK ═══════ */}
        <section className="px-6 pb-24 lg:px-16">
          <div className="mx-auto max-w-4xl">
            <RevealBlock>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#f0b400] text-center">
                {t("vision.techTitle")}
              </p>
              <p className="mb-12 text-base font-medium text-muted-foreground leading-relaxed text-center">
                {t("vision.techDesc")}
              </p>
            </RevealBlock>

            <div className="flex flex-col gap-1">
              {TECH_STACK.map(({ letter, key }, idx) => (
                <RevealBlock key={key} delay={idx * 60}>
                  <div className="flex items-start gap-5 py-5 md:gap-8">
                    <span className="shrink-0 text-5xl font-black text-[#f0b400] leading-none md:text-6xl" style={{ minWidth: "2.5rem" }}>
                      {letter}
                    </span>
                    <div className="flex-1 min-w-0 pt-1">
                      <h3 className="text-xl font-bold text-foreground md:text-2xl leading-tight">
                        {t(`vision.${key}`)}
                      </h3>
                      <p className="mt-2 text-base font-medium leading-relaxed text-muted-foreground">
                        {t(`vision.${key}Desc`)}
                      </p>
                    </div>
                  </div>
                  {idx < TECH_STACK.length - 1 && (
                    <div className="ml-16 h-px bg-border/15 md:ml-20" />
                  )}
                </RevealBlock>
              ))}


            </div>
          </div>
        </section>

        {/* ═══════ SEPARATOR ═══════ */}
        <div className="mx-auto mb-24 h-px max-w-4xl bg-gradient-to-r from-transparent via-border/15 to-transparent" />

        {/* ═══════ TEAM ═══════ */}
        <section className="px-6 pb-24 lg:px-16">
          <div className="mx-auto max-w-4xl">
            <RevealBlock>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#f0b400] text-center">
                {t("team.title")}
              </p>
              <p className="mb-12 text-base font-medium text-muted-foreground leading-relaxed text-center">
                {t("team.desc")}
              </p>
            </RevealBlock>

            <div className="grid gap-6 sm:grid-cols-3">
              {TEAM.map((member, idx) => (
                <RevealBlock key={member.nameKey} delay={idx * 100}>
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center rounded-2xl border border-border/15 bg-card/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-[#f0b400]/20 hover:bg-card/60"
                  >
                    {/* GitHub Avatar */}
                    <div className="relative mb-4 h-20 w-20 overflow-hidden rounded-full border-2 border-border/20 transition-all duration-300 group-hover:border-[#f0b400]/30">
                      <Image
                        src={`https://github.com/${member.ghUser}.png`}
                        alt={t(member.nameKey)}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="text-base font-bold text-foreground text-center">{t(member.nameKey)}</h3>
                    <p className="mt-1 text-sm font-semibold text-[#f0b400] text-center">{t(member.roleKey)}</p>
                    {/* GitHub link */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                      {member.ghUser}
                    </div>
                  </a>
                </RevealBlock>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════ SEPARATOR ═══════ */}
        <div className="mx-auto mb-24 h-px max-w-4xl bg-gradient-to-r from-transparent via-border/15 to-transparent" />

        {/* ═══════ GET INVOLVED ═══════ */}
        <section className="px-6 pb-24 lg:px-16">
          <div className="mx-auto max-w-4xl text-center">
            <RevealBlock>
              <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-[#f0b400]">
                {t("getInvolved.title")}
              </p>
              <p className="mb-8 text-lg font-medium text-muted-foreground leading-relaxed">
                {t("getInvolved.desc")}
              </p>
            </RevealBlock>
            <RevealBlock delay={80}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-6">
                <a
                  href="mailto:thalosinfrastructure@gmail.com"
                  className="inline-flex items-center gap-2 rounded-full border border-[#f0b400]/20 bg-[#f0b400]/5 px-6 py-3 text-sm font-bold text-[#f0b400] transition-all duration-300 hover:bg-[#f0b400]/10 hover:border-[#f0b400]/30"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  {t("getInvolved.email")}
                </a>
                <a
                  href="https://github.com/Thalos-Infrastructure"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-border/20 bg-secondary/30 px-6 py-3 text-sm font-bold text-foreground transition-all duration-300 hover:bg-secondary/60 hover:border-border/40"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  {t("getInvolved.repo")}
                </a>
              </div>
            </RevealBlock>
          </div>
        </section>

        {/* ═══════ PARTNERS ═══════ */}
        <section className="px-6 pb-16 lg:px-16">
          <RevealBlock>
            <div className="flex items-center justify-center gap-8 mx-auto max-w-4xl">
              <a href="https://stellar.org/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{t("partners.builtOn")}</span>
                <Image src="/stellar-full.png" alt="Stellar" width={24} height={24} className="h-5 w-5 shrink-0 object-contain opacity-50" />
              </a>
              <div className="h-4 w-px bg-border/30" aria-hidden="true" />
              <a href="https://www.trustlesswork.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">{t("partners.escrowsBy")}</span>
                <Image src="/trustless-logo.png" alt="Trustless Work" width={20} height={20} className="h-4 w-auto object-contain opacity-50" />
              </a>
            </div>
          </RevealBlock>
        </section>

        {/* ═══════ FOOTER ═══════ */}
        <footer className="border-t border-white/10 bg-[#0a0a0c]/60 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
              {/* Left: Logo + description + partners */}
              <div className="flex max-w-md flex-col gap-5">
                <div className="flex items-start gap-4">
                  <Image src="/thalos-icon.png" alt="Thalos" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
                  <p className="text-sm font-medium leading-relaxed text-white/60">
                    Payments and escrow platform on Stellar. Protected funds, staged payments, and productive capital while retained.
                  </p>
                </div>
                
                {/* Partners */}
                <div className="flex items-center gap-5">
                  <a href="https://stellar.org/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Built on</span>
                    <Image src="/stellar-full.png" alt="Stellar" width={24} height={24} className="h-5 w-5 shrink-0 object-contain opacity-50" />
                  </a>
                  <div className="h-3.5 w-px bg-white/10" aria-hidden="true" />
                  <a href="https://www.trustlesswork.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Escrows by</span>
                    <Image src="/trustless-logo.png" alt="Trustless Work" width={20} height={20} className="h-4 w-auto object-contain opacity-50" />
                  </a>
                </div>
              </div>

              {/* Right: Links in 3 columns */}
              <div className="grid grid-cols-3 gap-10">
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#f0b400]">{t("footer.platform")}</p>
                  <ul className="flex flex-col gap-2.5">
                    <li><Link href="/#how-it-works" className="text-sm font-medium text-white/60 transition-colors hover:text-white">{t("nav.howItWorks")}</Link></li>
                    <li><Link href="/#profiles" className="text-sm font-medium text-white/60 transition-colors hover:text-white">{t("nav.solutions")}</Link></li>
                  </ul>
                </div>
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#f0b400]">{t("footer.resources")}</p>
                  <ul className="flex flex-col gap-2.5">
                    <li><a href="https://www.trustlesswork.com/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/60 transition-colors hover:text-white">Trustless Work</a></li>
                    <li><a href="https://stellar.org/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/60 transition-colors hover:text-white">Stellar Network</a></li>
                    <li><a href="https://thalos.gitbook.io/thalos-docs" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/60 transition-colors hover:text-white">{t("footer.documentation")}</a></li>
                  </ul>
                </div>
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#f0b400]">{t("footer.contact")}</p>
                  {/* Vertical social icons */}
                  <div className="flex flex-col gap-2">
                    <a 
                      href="mailto:thalosinfrastructure@gmail.com" 
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all hover:border-[#f0b400]/40 hover:bg-[#f0b400]/10 hover:text-[#f0b400]"
                      aria-label="Email"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </a>
                    <a 
                      href="https://x.com/Thalos_infra" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all hover:border-[#f0b400]/40 hover:bg-[#f0b400]/10 hover:text-[#f0b400]"
                      aria-label="X (Twitter)"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                    </a>
                    <a 
                      href="https://www.instagram.com/thalos_platform/" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all hover:border-[#f0b400]/40 hover:bg-[#f0b400]/10 hover:text-[#f0b400]"
                      aria-label="Instagram"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                    </a>
                    <a 
                      href="https://github.com/Thalos-Infrastructure" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all hover:border-[#f0b400]/40 hover:bg-[#f0b400]/10 hover:text-[#f0b400]"
                      aria-label="GitHub"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Copyright */}
            <p className="mt-10 text-center text-xs text-white/30">&copy; {new Date().getFullYear()} Thalos Platform. {t("footer.rights")}</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
