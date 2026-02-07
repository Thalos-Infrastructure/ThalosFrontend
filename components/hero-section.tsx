"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

function TypewriterEscrows({ onComplete }: { onComplete: () => void }) {
  const word = "[Escrows]"
  const [displayText, setDisplayText] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) return
    const delay = setTimeout(() => {
      if (displayText.length < word.length) {
        setDisplayText(word.substring(0, displayText.length + 1))
      } else {
        setDone(true)
        // Notify parent intro is done after a short pause
        setTimeout(() => onComplete(), 600)
      }
    }, displayText.length === 0 ? 1400 : 200)
    return () => clearTimeout(delay)
  }, [displayText, done, onComplete])

  return (
    <span className="text-[#e6b800]">
      {displayText}
      {!done && (
        <span
          className="ml-0.5 inline-block h-[0.85em] w-[3px] bg-[#e6b800] align-middle"
          style={{ animation: "typewriter-cursor 0.8s ease-in-out infinite" }}
        />
      )}
    </span>
  )
}

interface HeroSectionProps {
  onNavigate: (section: string) => void
  onIntroComplete?: () => void
}

export function HeroSection({ onNavigate, onIntroComplete }: HeroSectionProps) {
  const [introReady, setIntroReady] = useState(false)

  const handleTypewriterDone = () => {
    setIntroReady(true)
    onIntroComplete?.()
  }

  return (
    <section id="hero" className="relative flex min-h-screen items-center overflow-hidden">
      {/* Brighter overlay that fades once intro is done */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] transition-opacity duration-[2500ms]"
        style={{ opacity: introReady ? 0 : 1 }}
        aria-hidden="true"
      >
        <div className="h-full w-full bg-gradient-to-b from-background/20 via-background/50 to-background/80" />
      </div>

      {/* Standard overlay that stays */}
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-background/40 via-background/70 to-background" aria-hidden="true" />

      <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-[#e6b800]/5 blur-3xl animate-pulse-glow" aria-hidden="true" />
      <div className="absolute bottom-20 right-1/4 h-96 w-96 rounded-full bg-[#e6b800]/3 blur-3xl animate-pulse-glow animation-delay-400" aria-hidden="true" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-32">
        <div className="flex flex-col items-center text-center">
          <h1 className="mb-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-foreground animate-fade-in-up md:text-6xl md:leading-tight text-balance">
            Thalos: Secure Payments{" "}
            <br className="hidden md:block" />
            with <TypewriterEscrows onComplete={handleTypewriterDone} />
          </h1>

          <p
            className="mb-10 max-w-2xl text-lg font-medium leading-relaxed text-muted-foreground text-pretty transition-all duration-1000"
            style={{
              opacity: introReady ? 1 : 0,
              transform: introReady ? "translateY(0)" : "translateY(16px)",
            }}
          >
            We are a payments and escrow infrastructure on Stellar that enables businesses and merchants to create their own secure payment platforms, with protected funds, staged payments, and productive capital while retained.
          </p>

          <div
            className="flex flex-col gap-4 sm:flex-row transition-all duration-1000 delay-200"
            style={{
              opacity: introReady ? 1 : 0,
              transform: introReady ? "translateY(0)" : "translateY(16px)",
            }}
          >
            <Button
              size="lg"
              onClick={() => onNavigate("builder")}
              className="h-13 rounded-full bg-[#e6b800] px-8 text-background font-semibold shadow-[0_4px_20px_rgba(230,184,0,0.3),0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-[#b0c4de] hover:text-background hover:shadow-[0_4px_24px_rgba(176,196,222,0.35),0_2px_4px_rgba(0,0,0,0.5)] transition-all duration-400"
            >
              Create Your Platform
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate("how-it-works")}
              className="h-13 rounded-full border-[#e6b800]/30 bg-transparent px-8 text-[#e6b800] font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] hover:bg-[#b0c4de]/15 hover:text-[#b0c4de] hover:border-[#b0c4de]/40 transition-all duration-400"
            >
              See How It Works
            </Button>
          </div>

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
                className="rounded-2xl border border-[#e6b800]/15 bg-card/50 p-6 backdrop-blur-sm shadow-[0_6px_24px_rgba(0,0,0,0.35),0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-400 hover:border-[#b0c4de]/30 hover:shadow-[0_6px_28px_rgba(176,196,222,0.1),0_2px_4px_rgba(0,0,0,0.4)]"
              >
                <p className="text-sm font-semibold text-[#e6b800]">{stat.label}</p>
                <p className="mt-1 font-semibold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
