"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef } from "react"
import { useLanguage } from "@/lib/i18n"

function TypewriterEscrows() {
  const word = "[Escrows]"
  const [displayText, setDisplayText] = useState("")
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting" | "wait">("typing")
  const indexRef = useRef(0)

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (phase === "typing") {
      if (indexRef.current < word.length) {
        timer = setTimeout(() => {
          indexRef.current++
          setDisplayText(word.substring(0, indexRef.current))
        }, 180)
      } else {
        timer = setTimeout(() => setPhase("pause"), 3500)
      }
    } else if (phase === "pause") {
      timer = setTimeout(() => setPhase("deleting"), 100)
    } else if (phase === "deleting") {
      if (indexRef.current > 0) {
        timer = setTimeout(() => {
          indexRef.current--
          setDisplayText(word.substring(0, indexRef.current))
        }, 90)
      } else {
        timer = setTimeout(() => setPhase("wait"), 1000)
      }
    } else if (phase === "wait") {
      timer = setTimeout(() => setPhase("typing"), 100)
    }

    return () => clearTimeout(timer)
  }, [displayText, phase])

  return (
    <span className="text-[#f0b400]">
      {displayText}
      <span
        className="ml-0.5 inline-block h-[0.85em] w-[3px] bg-[#f0b400] align-middle"
        style={{ animation: "typewriter-cursor 0.8s ease-in-out infinite" }}
      />
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
  const [showDescription, setShowDescription] = useState(false)
  const descRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t1 = setTimeout(() => {
      setIntroReady(true)
      onIntroComplete?.()
    }, 3000)
    return () => clearTimeout(t1)
  }, [onIntroComplete])

  useEffect(() => {
    if (!descRef.current) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShowDescription(true)
      },
      { threshold: 0.2 }
    )
    obs.observe(descRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="hero" className="relative overflow-hidden">
      {/* Subtle accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f0b400]/20 to-transparent" aria-hidden="true" />

      {/* Hero viewport -- full screen */}
      <div className="relative z-10 flex min-h-screen flex-col justify-center px-6 lg:px-16">
        {/* "Thalos:" left-aligned, very large */}
        <p className="animate-fade-in-up w-full text-left text-6xl font-bold tracking-tight text-[#f0b400] md:text-8xl lg:text-9xl drop-shadow-[0_2px_4px_rgba(240,180,0,0.2)]">
          Thalos:
        </p>

        {/* "Secure Payments" centered */}
        <h1 className="mt-2 animate-fade-in-up animation-delay-200 text-center text-5xl font-bold tracking-tight text-white md:text-7xl lg:text-8xl text-balance">
          Secure Payments
        </h1>

        {/* "with [Escrows]" centered */}
        <p className="mt-2 animate-fade-in-up animation-delay-400 text-center text-5xl font-bold tracking-tight text-white md:text-7xl lg:text-8xl">
          with <TypewriterEscrows />
        </p>

        {/* Description slides in from right */}
        <div ref={descRef} className="mt-10">
          <div className="flex justify-center">
            <div
              className="max-w-2xl text-center transition-all duration-[1200ms] ease-out"
              style={{
                opacity: showDescription ? 1 : 0,
                transform: showDescription ? "translateX(0)" : "translateX(60px)",
              }}
            >
              <p className="text-lg font-medium leading-relaxed text-white/80 text-pretty">
                <span className="text-[#f0b400] font-bold">{"<We are>"}</span>{" "}
                a payments and escrow infrastructure on Stellar that enables businesses and merchants to create their own secure payment platforms, with protected funds, staged payments, and productive capital while retained.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons at bottom of hero */}
        <div
          className="mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center transition-all duration-1000 delay-500"
          style={{
            opacity: introReady ? 1 : 0,
            transform: introReady ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <Button
            size="lg"
            onClick={() => onNavigate("builder")}
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
    </section>
  )
}
