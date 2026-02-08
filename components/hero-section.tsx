"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef, useCallback } from "react"

function TypewriterEscrows() {
  const word = "[Escrows]"
  const [displayText, setDisplayText] = useState("")
  const [phase, setPhase] = useState<"typing" | "pause" | "deleting">("typing")
  const indexRef = useRef(0)

  useEffect(() => {
    let timer: NodeJS.Timeout

    if (phase === "typing") {
      if (indexRef.current < word.length) {
        timer = setTimeout(() => {
          indexRef.current++
          setDisplayText(word.substring(0, indexRef.current))
        }, 160)
      } else {
        timer = setTimeout(() => setPhase("pause"), 2500)
      }
    } else if (phase === "pause") {
      timer = setTimeout(() => setPhase("deleting"), 100)
    } else if (phase === "deleting") {
      if (indexRef.current > 0) {
        timer = setTimeout(() => {
          indexRef.current--
          setDisplayText(word.substring(0, indexRef.current))
        }, 80)
      } else {
        timer = setTimeout(() => setPhase("typing"), 600)
      }
    }

    return () => clearTimeout(timer)
  }, [displayText, phase])

  return (
    <span className="text-[#d4a843]">
      {displayText}
      <span
        className="ml-0.5 inline-block h-[0.85em] w-[3px] bg-[#d4a843] align-middle"
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

  // Intro reveal after a delay
  useEffect(() => {
    const t1 = setTimeout(() => {
      setIntroReady(true)
      onIntroComplete?.()
    }, 3200)
    return () => clearTimeout(t1)
  }, [onIntroComplete])

  // Show description on scroll via IntersectionObserver
  useEffect(() => {
    if (!descRef.current) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShowDescription(true)
      },
      { threshold: 0.3 }
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
        <div className="h-full w-full bg-gradient-to-b from-background/10 via-background/40 to-background/70" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/30 via-background/60 to-background" aria-hidden="true" />

      {/* Subtle glow orbs */}
      <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-[#d4a843]/5 blur-3xl animate-pulse-glow" aria-hidden="true" />
      <div className="absolute bottom-20 right-1/4 h-96 w-96 rounded-full bg-[#d4a843]/3 blur-3xl animate-pulse-glow animation-delay-400" aria-hidden="true" />

      {/* Main hero -- full viewport */}
      <div className="relative z-10 flex min-h-screen items-center">
        <div className="mx-auto w-full max-w-7xl px-6 py-32">
          <div className="flex flex-col items-center text-center">
            <h1 className="mb-6 max-w-4xl animate-fade-in-up text-balance">
              <span className="block text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
                Thalos: Secure Payments
              </span>
              <span className="block text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
                with <TypewriterEscrows />
              </span>
            </h1>

            {/* Buttons below the title */}
            <div
              className="mt-8 flex flex-col gap-4 sm:flex-row transition-all duration-1000 delay-200"
              style={{
                opacity: introReady ? 1 : 0,
                transform: introReady ? "translateY(0)" : "translateY(16px)",
              }}
            >
              <Button
                size="lg"
                onClick={() => onNavigate("builder")}
                className="h-13 rounded-full bg-[#d4a843] px-8 text-background font-semibold shadow-[0_4px_20px_rgba(212,168,67,0.25),0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-[#b0c4de] hover:text-background hover:shadow-[0_4px_24px_rgba(176,196,222,0.35),0_2px_4px_rgba(0,0,0,0.5)] transition-all duration-400"
              >
                Get Started
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onNavigate("how-it-works")}
                className="h-13 rounded-full border-white/25 bg-transparent px-8 text-white font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-[#b0c4de]/15 hover:text-[#b0c4de] hover:border-[#b0c4de]/40 transition-all duration-400"
              >
                How It Works
              </Button>
            </div>

            {/* Stat cards */}
            <div
              className="mt-20 grid w-full max-w-3xl grid-cols-1 gap-6 md:grid-cols-3 transition-all duration-1000 delay-500"
              style={{
                opacity: introReady ? 1 : 0,
                transform: introReady ? "translateY(0)" : "translateY(20px)",
              }}
            >
              {[
                { label: "Protected Funds", value: "Escrow Smart Contracts" },
                { label: "Fast Settlement", value: "5 seconds on Stellar" },
                { label: "Programmable", value: "Custom payment logic" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-card/50 p-6 backdrop-blur-sm shadow-[0_6px_24px_rgba(0,0,0,0.35),0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-400 hover:border-[#b0c4de]/25 hover:shadow-[0_6px_28px_rgba(176,196,222,0.08),0_2px_4px_rgba(0,0,0,0.4)]"
                >
                  <p className="text-sm font-semibold text-[#d4a843]">{stat.label}</p>
                  <p className="mt-1 font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Description block -- appears to the right as you scroll past hero */}
      <div
        ref={descRef}
        className="relative z-10 mx-auto max-w-7xl px-6 pb-28"
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
              <span className="text-[#d4a843] font-bold">{"<We are>"}</span>{" "}
              a payments and escrow infrastructure on Stellar that enables businesses and merchants to create their own secure payment platforms, with protected funds, staged payments, and productive capital while retained.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
