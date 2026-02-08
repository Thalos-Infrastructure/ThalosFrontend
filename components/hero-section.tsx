"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef, useCallback } from "react"

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
      {/* Brighter overlay during intro */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-[2500ms]"
        style={{ opacity: introReady ? 0 : 1 }}
        aria-hidden="true"
      >
        <div className="h-full w-full bg-gradient-to-b from-background/5 via-background/30 to-background/60" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/20 via-background/50 to-background" aria-hidden="true" />

      {/* Subtle glow */}
      <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-[#f0b400]/5 blur-3xl animate-pulse-glow" aria-hidden="true" />
      <div className="absolute bottom-20 right-1/4 h-96 w-96 rounded-full bg-[#f0b400]/3 blur-3xl animate-pulse-glow animation-delay-400" aria-hidden="true" />

      {/* Title area -- full viewport height */}
      <div className="relative z-10 flex min-h-screen flex-col justify-center px-6 lg:px-16">
        <div className="w-full">
          {/* "Thalos:" left-aligned, very large */}
          <p className="animate-fade-in-up text-left text-6xl font-bold tracking-tight text-white md:text-8xl lg:text-9xl">
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
        </div>

        {/* Buttons at the bottom of hero */}
        <div
          className="mt-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-center transition-all duration-1000 delay-500"
          style={{
            opacity: introReady ? 1 : 0,
            transform: introReady ? "translateY(0)" : "translateY(20px)",
          }}
        >
          <Button
            size="lg"
            onClick={() => onNavigate("builder")}
            className="h-13 rounded-full bg-[#f0b400] px-10 text-background font-semibold shadow-[0_4px_20px_rgba(240,180,0,0.25),0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-[#b0c4de] hover:text-background hover:shadow-[0_4px_24px_rgba(176,196,222,0.35),0_2px_4px_rgba(0,0,0,0.5)] transition-all duration-400"
          >
            Get Started
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate("how-it-works")}
            className="h-13 rounded-full border-white/25 bg-transparent px-10 text-white font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-[#b0c4de]/15 hover:text-[#b0c4de] hover:border-[#b0c4de]/40 transition-all duration-400"
          >
            How It Works
          </Button>
        </div>
      </div>

      {/* Description slides in from the right as you scroll */}
      <div
        ref={descRef}
        className="relative z-10 px-6 pb-24 lg:px-16"
      >
        <div className="flex justify-end">
          <div
            className="max-w-xl text-right transition-all duration-[1200ms] ease-out"
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
    </section>
  )
}
