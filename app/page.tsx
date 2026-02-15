"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { useLanguage } from "@/lib/i18n"
import { ThalosLoader } from "@/components/thalos-loader"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { HowItWorks } from "@/components/how-it-works"
import { ProfileSelection } from "@/components/profile-selection"
import { UseCases } from "@/components/use-cases"
import { WhoCanUse } from "@/components/who-can-use"
import { DashboardSection } from "@/components/dashboard-section"
import { FAQ } from "@/components/faq"
import { Footer } from "@/components/footer"
import { BottomBar } from "@/components/bottom-bar"

export default function Home() {
  const { t } = useLanguage()
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({})
  const [loading, setLoading] = useState(true)
  const [introComplete, setIntroComplete] = useState(false)
  const [scrollDarken, setScrollDarken] = useState(0)

  // Page loading spinner
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1800)
    return () => clearTimeout(timer)
  }, [])

  // Progressive darkening based on scroll position
  useEffect(() => {
    function onScroll() {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0
      setScrollDarken(progress)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const handleNavigate = useCallback((section: string) => {
    const el = sectionsRef.current[section] || document.getElementById(section)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])

  const setRef = useCallback((section: string) => (el: HTMLDivElement | null) => {
    sectionsRef.current[section] = el
  }, [])

  // Overlay opacity: starts at 0.40 (slightly visible), goes to 0.94 at footer
  const overlayOpacity = 0.35 + scrollDarken * 0.50

  if (loading) return <ThalosLoader />

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {/* Ocean collage background */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0 opacity-35">
          <div className="col-span-2 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1920&q=85&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1920&q=85&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476673160081-cf065607f449?w=1920&q=85&auto=format&fit=crop')" }} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-background/25 via-background/45 to-background/85" />
      </div>
      {/* Dynamic darkening overlay based on scroll -- seamless transition */}
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-background"
        style={{ opacity: overlayOpacity, transition: "opacity 150ms linear" }}
        aria-hidden="true"
      />

      <Navbar onNavigate={handleNavigate} />

      <main className="relative z-10">
        <div ref={setRef("hero")}>
          <HeroSection onNavigate={handleNavigate} onIntroComplete={() => setIntroComplete(true)} />
        </div>

        {/* Content below hero */}
        <div
          className="transition-all duration-[2000ms] ease-out"
          style={{
            opacity: introComplete ? 1 : 0,
            transform: introComplete ? "translateY(0)" : "translateY(40px)",
          }}
        >
          {/* Stat cards */}
          <section className="relative z-10 px-6 py-12 lg:px-16">
            <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 md:grid-cols-3">
              {[
                { label: t("stat.protectedFunds"), value: t("stat.protectedFundsValue") },
                { label: t("stat.fastSettlement"), value: t("stat.fastSettlementValue") },
                { label: t("stat.programmable"), value: t("stat.programmableValue") },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="section-reveal rounded-2xl border border-white/10 bg-card/50 p-6 backdrop-blur-sm shadow-[0_6px_0_rgba(0,0,0,0.15),0_8px_24px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.08)] transition-all duration-400 hover:border-[#b0c4de]/25"
                >
                  <p className="text-sm font-semibold text-[#f0b400]">{stat.label}</p>
                  <p className="mt-1 font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </section>

          <div ref={setRef("how-it-works")} className="mt-16">
            <HowItWorks />
          </div>

          <div ref={setRef("profiles")} className="mt-24">
            <ProfileSelection onNavigate={handleNavigate} />
          </div>

          <div ref={setRef("use-cases")} className="mt-24">
            <UseCases />
          </div>

          <div ref={setRef("who-can-use")} className="mt-24">
            <WhoCanUse />
          </div>

          <div ref={setRef("dashboard")} className="mt-24">
            <DashboardSection />
          </div>

          <div className="mt-24">
            <FAQ />
          </div>

          <div className="mt-20 pb-24">
            <Footer />
          </div>
        </div>
      </main>

      <BottomBar onNavigate={handleNavigate} />
    </div>
  )
}
