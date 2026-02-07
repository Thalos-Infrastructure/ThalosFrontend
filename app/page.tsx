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
      {/* Ocean background -- lighter at top, progressively darker */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.04]"
        style={{ backgroundImage: "url('/ocean-bg.png')" }}
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
          <div ref={setRef("how-it-works")}>
            <HowItWorks />
          </div>

          <div ref={setRef("profiles")}>
            <ProfileSelection onNavigate={handleNavigate} />
          </div>

          <div ref={setRef("builder")}>
            <PlatformBuilder />
          </div>

          <div ref={setRef("dashboard")}>
            <DashboardSection />
          </div>

          <div className="pb-20">
            <Footer />
          </div>
        </div>
      </main>

      <BottomBar onNavigate={handleNavigate} />
    </div>
  )
}
