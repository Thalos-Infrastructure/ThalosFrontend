"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef, useCallback } from "react"
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

const LETTERS_DATA = [
  { letter: "T", word: "Trust" },
  { letter: "h", word: "Hybrid" },
  { letter: "a", word: "Agreement" },
  { letter: "l", word: "Locked" },
  { letter: "o", word: "On-chain" },
  { letter: "s", word: "Stellar" },
]

export function HeroSection({ onNavigate, onIntroComplete }: HeroSectionProps) {
  const { t } = useLanguage()
  const [introReady, setIntroReady] = useState(false)
  const [section2Visible, setSection2Visible] = useState(false)
  const [letterOpacities, setLetterOpacities] = useState<number[]>([1, 1, 1, 1, 1, 1])
  const section2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t1 = setTimeout(() => { setIntroReady(true); onIntroComplete?.() }, 3000)
    return () => clearTimeout(t1)
  }, [onIntroComplete])

  /* Per-letter fade on scroll: each letter has its own threshold - smooth & fast */
  const onScroll = useCallback(() => {
    const scrollY = window.scrollY
    const vh = window.innerHeight

    // Tighter stagger for faster, more fluid cascade effect
    const newOpacities = LETTERS_DATA.map((_, i) => {
      const fadeStart = vh * 0.08 + i * vh * 0.08
      const fadeEnd = fadeStart + vh * 0.22
      if (scrollY < fadeStart) return 1
      if (scrollY > fadeEnd) return 0
      // Smooth ease-out curve for fluid feel
      const raw = 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart)
      return raw * raw
    })
    setLetterOpacities(newOpacities)

    // Section 2 block reveal
    if (section2Ref.current) {
      const rect = section2Ref.current.getBoundingClientRect()
      setSection2Visible(rect.top < vh * 0.65)
    }
  }, [])

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [onScroll])

  return (
    <section id="hero" className="relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f0b400]/20 to-transparent" aria-hidden="true" />

      {/* Vertical "thalos" -- very large, right side, per-letter fade with word reveal on hover */}
      <div
        className="pointer-events-auto fixed right-0 top-0 bottom-0 z-20 hidden select-none md:flex md:flex-col md:items-end md:justify-center lg:right-4 xl:right-8"
        aria-hidden="true"
      >
        {LETTERS_DATA.map(({ letter, word }, i) => (
          <div key={i} className="group relative flex items-center justify-end">
            {/* Word reveal - appears on hover */}
            <span
              className="absolute right-full mr-4 whitespace-nowrap text-sm font-bold uppercase tracking-[0.15em] text-[#f0b400] opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 pointer-events-none"
              style={{ opacity: undefined }}
            >
              {word}
            </span>
            <span
              className="block font-black leading-[0.72] text-foreground transition-colors duration-300 group-hover:text-[#f0b400]"
              style={{
                opacity: letterOpacities[i],
                transition: "opacity 120ms cubic-bezier(0.25, 0.1, 0.25, 1), color 300ms ease",
                fontSize: "clamp(10rem, 19vh, 24rem)",
                letterSpacing: "-0.04em",
              }}
            >
              {letter}
            </span>
          </div>
        ))}
      </div>

      {/* === SECTION 1: Main hero === */}
      <div className="relative z-10 flex min-h-[100dvh] items-center px-6 lg:px-16 xl:px-20 py-32">
        <div className="mx-auto w-full max-w-7xl">
          {/* Mobile THALOS horizontal */}
          <div className="flex md:hidden justify-center mb-10 gap-0.5">
            {LETTERS_DATA.map(({ letter }, i) => (
              <span
                key={i}
                className="animate-fade-in-up text-7xl font-black text-foreground/90"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: "both" }}
              >
                {letter}
              </span>
            ))}
          </div>

          <div className="max-w-3xl mx-auto text-center">
            <h1 className="animate-fade-in-up animation-delay-200 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl xl:text-7xl text-balance">
              Secure Payments
            </h1>
            <p className="mt-3 animate-fade-in-up animation-delay-400 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl xl:text-7xl">
              with <TypewriterEscrows />
            </p>

            <div className="mt-16 max-w-2xl mx-auto animate-fade-in-up animation-delay-600">
              <p className="text-lg md:text-xl font-medium leading-relaxed text-muted-foreground text-pretty">
                <span className="text-[#f0b400] font-bold">{"<We are>"}</span>{" "}
                {t("hero.weAre")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* === SECTION 2: Trust layer - block reveal === */}
      <div ref={section2Ref} className="relative z-10 min-h-[100dvh] overflow-hidden">
        {/* Light frosted overlay */}
        <div
          className="absolute inset-0 transition-all duration-700 ease-out"
          style={{ opacity: section2Visible ? 1 : 0 }}
        >
          <div className="absolute inset-0 bg-white/[0.07] backdrop-blur-sm" />
          <div className="absolute inset-0 border-y border-white/[0.08]" />
        </div>

        {/* Content - block transition (appears/disappears as complete block) */}
        <div
          className="relative z-10 flex min-h-[100dvh] flex-col items-center justify-center px-6 lg:px-16 py-24"
          style={{
            opacity: section2Visible ? 1 : 0,
            transform: section2Visible ? "translateY(0)" : "translateY(50px)",
            transition: "opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1), transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div className="mx-auto max-w-3xl">
            <p className="mb-10 text-sm font-bold uppercase tracking-[0.2em] text-[#f0b400] text-center">
              {t("hero.trustLayer")}
            </p>

            <div className="space-y-8 text-lg font-medium leading-relaxed text-muted-foreground text-left max-w-2xl mx-auto">
              <p>{t("hero.trust1")}</p>
              <p>
                {t("hero.trust2a")} <span className="text-foreground font-semibold">{t("hero.trust2highlight")}</span>{t("hero.trust2b")}
              </p>
              <p>{t("hero.trust3")}</p>
              <div className="pt-6 text-center">
                <TypewriterPlatform />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-16 flex flex-col items-center gap-4 sm:flex-row">
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
              className="h-14 rounded-full border-border/40 bg-secondary/50 px-12 text-base font-bold text-foreground shadow-[0_6px_0_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.15)] hover:bg-secondary hover:shadow-[0_4px_0_rgba(0,0,0,0.08),0_6px_20px_rgba(0,0,0,0.15)] hover:translate-y-[2px] active:shadow-[0_1px_0_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.1)] active:translate-y-[4px] transition-all duration-200"
            >
              {t("hero.cta2")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
