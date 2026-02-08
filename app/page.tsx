"use client"

import { useCallback, useRef, useState } from "react"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { HowItWorks } from "@/components/how-it-works"
import { ProfileSelection } from "@/components/profile-selection"
import { PlatformBuilder } from "@/components/platform-builder"
import { DashboardSection } from "@/components/dashboard-section"
import { Footer } from "@/components/footer"
import { BottomBar } from "@/components/bottom-bar"

export default function Home() {
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({})
  const [introComplete, setIntroComplete] = useState(false)

  const handleNavigate = useCallback((section: string) => {
    const el = sectionsRef.current[section] || document.getElementById(section)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  const setRef = useCallback((section: string) => (el: HTMLDivElement | null) => {
    sectionsRef.current[section] = el
  }, [])

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Ocean background -- lighter at top, gets darker progressively */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/ocean-bg.png')" }}
        aria-hidden="true"
      />
      {/* Progressive darkening overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-b from-background/70 via-background/85 to-background/98"
        aria-hidden="true"
      />

      <Navbar onNavigate={handleNavigate} />

      <main className="relative z-10">
        <div ref={setRef("hero")}>
          <HeroSection onNavigate={handleNavigate} onIntroComplete={() => setIntroComplete(true)} />
        </div>

        {/* Content below hero -- fades in after intro completes */}
        <div
          className="transition-all duration-[2000ms] ease-out"
          style={{
            opacity: introComplete ? 1 : 0,
            transform: introComplete ? "translateY(0)" : "translateY(40px)",
          }}
        >
          {/* Stat cards -- outside hero, full width */}
          <section className="relative z-10 px-6 py-12 lg:px-16">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { label: "Protected Funds", value: "Escrow Smart Contracts" },
                { label: "Fast Settlement", value: "5 seconds on Stellar" },
                { label: "Programmable", value: "Custom payment logic" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="section-reveal rounded-2xl border border-white/10 bg-card/50 p-6 backdrop-blur-sm shadow-[0_6px_24px_rgba(0,0,0,0.35),0_2px_4px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-400 hover:border-[#b0c4de]/25 hover:shadow-[0_6px_28px_rgba(176,196,222,0.08),0_2px_4px_rgba(0,0,0,0.4)]"
                >
                  <p className="text-sm font-semibold text-[#f0b400]">{stat.label}</p>
                  <p className="mt-1 font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </section>

          <div ref={setRef("how-it-works")} className="mt-12">
            <HowItWorks />
          </div>

          <div ref={setRef("profiles")} className="mt-20">
            <ProfileSelection onNavigate={handleNavigate} />
          </div>

          <div ref={setRef("builder")} className="mt-20">
            <PlatformBuilder />
          </div>

          <div ref={setRef("dashboard")} className="mt-20">
            <DashboardSection />
          </div>

          <div className="mt-16 pb-24">
            <Footer />
          </div>
        </div>
      </main>

      <BottomBar onNavigate={handleNavigate} />
    </div>
  )
}
