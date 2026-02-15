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
    <span className="text-[#f0b400] inline-block min-w-[280px] md:min-w-[400px] text-left">
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
  const [showSection2, setShowSection2] = useState(false)
  const section2Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t1 = setTimeout(() => {
      setIntroReady(true)
      onIntroComplete?.()
    }, 3000)
    return () => clearTimeout(t1)
  }, [onIntroComplete])

  useEffect(() => {
    if (!section2Ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShowSection2(true) },
      { threshold: 0.15 }
    )
    obs.observe(section2Ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <section id="hero" className="relative overflow-hidden">
      {/* Subtle accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f0b400]/20 to-transparent" aria-hidden="true" />

      {/* === SECTION 1: Main hero with vertical THALOS === */}
      <div className="relative z-10 flex min-h-screen items-center px-6 lg:px-16">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-8 lg:gap-16">

          {/* Vertical THALOS */}
          <div className="hidden md:flex flex-col items-center select-none">
            {"THALOS".split("").map((letter, i) => (
              <span
                key={i}
                className="animate-fade-in-up text-7xl lg:text-8xl xl:text-9xl font-black tracking-tighter text-[#f0b400] leading-[0.85] drop-shadow-[0_2px_8px_rgba(240,180,0,0.3)]"
                style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}
              >
                {letter}
              </span>
            ))}
          </div>

          {/* Content right of THALOS */}
          <div className="flex-1">
            {/* Mobile THALOS */}
            <div className="flex md:hidden justify-center mb-6">
              {"THALOS".split("").map((letter, i) => (
                <span
                  key={i}
                  className="animate-fade-in-up text-5xl font-black tracking-tight text-[#f0b400] drop-shadow-[0_2px_8px_rgba(240,180,0,0.3)]"
                  style={{ animationDelay: `${i * 120}ms`, animationFillMode: "both" }}
                >
                  {letter}
                </span>
              ))}
            </div>

            <h1 className="animate-fade-in-up animation-delay-200 text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl text-balance">
              Secure Payments
            </h1>
            <p className="mt-2 animate-fade-in-up animation-delay-400 text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl">
              with <TypewriterEscrows />
            </p>

            <div className="mt-8 max-w-xl animate-fade-in-up animation-delay-600">
              <p className="text-lg font-medium leading-relaxed text-white/75 text-pretty">
                <span className="text-[#f0b400] font-bold">{"<We are>"}</span>{" "}
                a decentralized escrow and trust infrastructure built on Stellar that enables secure, programmable, milestone-based payments between individuals, entrepreneurs, and businesses across multiple industries without relying on traditional intermediaries.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* === SECTION 2: Light-toned info panel with ocean collage bg === */}
      <div
        ref={section2Ref}
        className="relative z-10 min-h-screen"
      >
        {/* Background: ocean images collage with white/light tone */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-1 opacity-25">
            <div className="col-span-1 row-span-2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1280&q=80&auto=format&fit=crop')" }} />
            <div className="col-span-1 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1280&q=80&auto=format&fit=crop')" }} />
            <div className="col-span-1 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1280&q=80&auto=format&fit=crop')" }} />
            <div className="col-span-2 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476673160081-cf065607f449?w=1280&q=80&auto=format&fit=crop')" }} />
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.06] via-white/[0.04] to-background/80" />
          <div className="absolute inset-0 bg-background/70" />
        </div>

        {/* Divider line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 lg:px-16 py-24">
          <div
            className="max-w-4xl transition-all duration-[1400ms] ease-out"
            style={{
              opacity: showSection2 ? 1 : 0,
              transform: showSection2 ? "translateY(0)" : "translateY(50px)",
            }}
          >
            <p className="mb-8 text-sm font-bold uppercase tracking-[0.2em] text-[#f0b400]">The Trust Layer</p>

            <div className="space-y-6 text-lg font-medium leading-relaxed text-white/70 text-pretty">
              <p>
                Thalos solves the trust problem in digital and high-value transactions by locking funds on-chain until predefined conditions are met. It combines smart-contract-based escrow, wallet-based identity, and transparent agreement tracking to reduce fraud, disputes, payment delays, and counterparty risk.
              </p>
              <p>
                Unlike traditional platforms that extract high fees, impose custodial control, or limit flexibility, Thalos is <span className="text-white font-semibold">non-custodial, transparent, and programmable</span>, making it adaptable to freelance services, commerce, real estate, agriculture, event management, enterprise procurement, and many other sectors.
              </p>
              <p>
                If you want to start a business and you are unsure how to securely receive payments from new clients or partners, Thalos provides a reliable integration layer that ensures funds are protected, conditions are enforced, and transactions are executed transparently.
              </p>
              <p className="text-[#f0b400] font-bold text-xl">
                Thalos is not just a payment tool; it is programmable trust infrastructure.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div
            className="mt-16 flex flex-col items-center gap-4 sm:flex-row transition-all duration-1000"
            style={{
              opacity: showSection2 ? 1 : 0,
              transform: showSection2 ? "translateY(0)" : "translateY(30px)",
              transitionDelay: "400ms",
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
