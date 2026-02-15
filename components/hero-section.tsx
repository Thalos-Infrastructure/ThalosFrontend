"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { useLanguage } from "@/lib/i18n"

/* ── Typewriter for [Escrows] ── */
function TypewriterEscrows() {
  const word = "[Escrows]"
  const [displayText, setDisplayText] = useState("")
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting" | "wait">("typing")
  const indexRef = useRef(0)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (phase === "typing") {
      if (indexRef.current < word.length) {
        timer = setTimeout(() => { indexRef.current++; setDisplayText(word.substring(0, indexRef.current)) }, 180)
      } else {
        timer = setTimeout(() => setPhase("pause"), 3500)
      }
    } else if (phase === "pause") {
      timer = setTimeout(() => setPhase("deleting"), 100)
    } else if (phase === "deleting") {
      if (indexRef.current > 0) {
        timer = setTimeout(() => { indexRef.current--; setDisplayText(word.substring(0, indexRef.current)) }, 90)
      } else {
        timer = setTimeout(() => setPhase("wait"), 1000)
      }
    } else if (phase === "wait") {
      timer = setTimeout(() => setPhase("typing"), 100)
    }
    return () => clearTimeout(timer)
  }, [displayText, phase])

  return (
    <span className="text-[#f0b400] inline-block min-w-[200px] md:min-w-[340px] text-left">
      {displayText}
      <span className="ml-0.5 inline-block h-[0.85em] w-[3px] bg-[#f0b400] align-middle" style={{ animation: "typewriter-cursor 0.8s ease-in-out infinite" }} />
    </span>
  )
}

/* ── Typewriter for [One Platform, Many Solutions] ── */
function TypewriterPlatform() {
  const word = "[One Platform, Many Solutions]"
  const [displayText, setDisplayText] = useState("")
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting" | "wait">("typing")
  const indexRef = useRef(0)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (phase === "typing") {
      if (indexRef.current < word.length) {
        timer = setTimeout(() => { indexRef.current++; setDisplayText(word.substring(0, indexRef.current)) }, 100)
      } else {
        timer = setTimeout(() => setPhase("pause"), 4000)
      }
    } else if (phase === "pause") {
      timer = setTimeout(() => setPhase("deleting"), 100)
    } else if (phase === "deleting") {
      if (indexRef.current > 0) {
        timer = setTimeout(() => { indexRef.current--; setDisplayText(word.substring(0, indexRef.current)) }, 50)
      } else {
        timer = setTimeout(() => setPhase("wait"), 800)
      }
    } else if (phase === "wait") {
      timer = setTimeout(() => setPhase("typing"), 100)
    }
    return () => clearTimeout(timer)
  }, [displayText, phase])

  return (
    <span className="text-[#f0b400] font-bold text-xl md:text-2xl">
      {displayText}
      <span className="ml-0.5 inline-block h-[0.85em] w-[3px] bg-[#f0b400] align-middle" style={{ animation: "typewriter-cursor 0.8s ease-in-out infinite" }} />
    </span>
  )
}

interface HeroSectionProps {
  onNavigate: (section: string) => void
  onIntroComplete?: () => void
}

export function HeroSection({ onNavigate, onIntroComplete }: HeroSectionProps) {
  const { t } = useLanguage()
  const [introReady, setIntroReady] = useState(false)
  const [section2Progress, setSection2Progress] = useState(0)
  const section2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t1 = setTimeout(() => { setIntroReady(true); onIntroComplete?.() }, 3000)
    return () => clearTimeout(t1)
  }, [onIntroComplete])

  /* Scroll-driven reveal for section 2 */
  useEffect(() => {
    function onScroll() {
      if (!section2Ref.current) return
      const rect = section2Ref.current.getBoundingClientRect()
      const vh = window.innerHeight
      // progress: 0 when top is at bottom of viewport, 1 when top is at 30% from top
      const raw = 1 - (rect.top - vh * 0.3) / (vh * 0.7)
      setSection2Progress(Math.max(0, Math.min(1, raw)))
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <section id="hero" className="relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f0b400]/20 to-transparent" aria-hidden="true" />

      {/* Vertical "thalos" spanning both sections -- right side, absolutely positioned */}
      <div className="pointer-events-none absolute right-4 top-0 bottom-0 z-20 hidden select-none md:flex md:flex-col md:items-center md:justify-center lg:right-8 xl:right-12" aria-hidden="true">
        {"thalos".split("").map((letter, i) => (
          <span
            key={i}
            className="animate-fade-in-up block font-black lowercase leading-[0.78] text-white/90"
            style={{
              animationDelay: `${i * 120}ms`,
              animationFillMode: "both",
              fontSize: "clamp(6rem, 14vh, 12rem)",
              textShadow: "0 2px 40px rgba(255,255,255,0.05)",
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* === SECTION 1: Main hero === */}
      <div className="relative z-10 flex min-h-[100dvh] items-center px-6 lg:px-16 xl:px-20 py-32">
        <div className="mx-auto w-full max-w-7xl">
          {/* Mobile THALOS horizontal */}
          <div className="flex md:hidden justify-center mb-10 gap-1">
            {"thalos".split("").map((letter, i) => (
              <span
                key={i}
                className="animate-fade-in-up text-6xl font-black lowercase text-white/90"
                style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}
              >
                {letter}
              </span>
            ))}
          </div>

          <div className="max-w-3xl">
            <h1 className="animate-fade-in-up animation-delay-200 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl xl:text-7xl text-balance">
              Secure Payments
            </h1>
            <p className="mt-3 animate-fade-in-up animation-delay-400 text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl xl:text-7xl">
              with <TypewriterEscrows />
            </p>

            <div className="mt-16 max-w-2xl animate-fade-in-up animation-delay-600 text-center">
              <p className="text-lg md:text-xl font-medium leading-relaxed text-white/65 text-pretty">
                <span className="text-[#f0b400] font-bold">{"<We are>"}</span>{" "}
                {t("hero.weAre")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* === SECTION 2: Trust layer - scroll reveal with white bg === */}
      <div ref={section2Ref} className="relative z-10 min-h-[100dvh] overflow-hidden">
        {/* White/light bg with collage showing through */}
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: section2Progress }}
        >
          <div className="absolute inset-0 bg-white/[0.06] backdrop-blur-sm" />
          <div className="absolute inset-0 border-y border-white/10" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6 lg:px-16 py-24">
          <div
            className="mx-auto max-w-3xl transition-all duration-[1200ms] ease-out"
            style={{
              opacity: section2Progress,
              transform: `translateY(${(1 - section2Progress) * 60}px)`,
            }}
          >
            <p className="mb-10 text-sm font-bold uppercase tracking-[0.2em] text-[#f0b400] text-center">
              {t("hero.trustLayer")}
            </p>

            <div className="space-y-8 text-lg font-medium leading-relaxed text-white/60 text-left max-w-2xl mx-auto">
              <p>
                {t("hero.trust1")}
              </p>
              <p>
                {t("hero.trust2a")} <span className="text-white font-semibold">{t("hero.trust2highlight")}</span>{t("hero.trust2b")}
              </p>
              <p>
                {t("hero.trust3")}
              </p>
              <div className="pt-6 text-center">
                <TypewriterPlatform />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div
            className="mt-16 flex flex-col items-center gap-4 sm:flex-row transition-all duration-[1200ms] ease-out"
            style={{
              opacity: Math.max(0, section2Progress - 0.3) / 0.7,
              transform: `translateY(${Math.max(0, (1 - section2Progress) * 30)}px)`,
            }}
          >
            <Button
              size="lg"
              onClick={() => onNavigate("profiles")}
              className="h-14 rounded-full bg-[#f0b400] px-12 text-base font-bold text-background shadow-[0_6px_0_rgba(180,130,0,0.6),0_8px_24px_rgba(240,180,0,0.25),inset_0_1px_0_rgba(255,255,255,0.3)] hover:bg-[#f0b400]/90 hover:shadow-[0_4px_0_rgba(180,130,0,0.6),0_6px_20px_rgba(240,180,0,0.3)] hover:translate-y-[2px] active:shadow-[0_1px_0_rgba(180,130,0,0.6),0_2px_8px_rgba(240,180,0,0.2)] active:translate-y-[4px] transition-all duration-200"
            >
              {t("hero.cta1")}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate("how-it-works")}
              className="h-14 rounded-full border-white/30 bg-white/5 px-12 text-base font-bold text-white shadow-[0_6px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-white/10 hover:shadow-[0_4px_0_rgba(255,255,255,0.08),0_6px_20px_rgba(0,0,0,0.4)] hover:translate-y-[2px] active:shadow-[0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.3)] active:translate-y-[4px] transition-all duration-200"
            >
              {t("hero.cta2")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
