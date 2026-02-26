"use client"

import dynamic from "next/dynamic"
import { useCallback, useRef, useState, useEffect } from "react"
import { useLanguage } from "@/lib/i18n"
import { ThalosLoader } from "@/components/thalos-loader"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"


// Lazy load below-the-fold sections for faster initial paint
const HowItWorks = dynamic(() => import("@/components/how-it-works").then(m => ({ default: m.HowItWorks })), { ssr: false })
const ProfileSelection = dynamic(() => import("@/components/profile-selection").then(m => ({ default: m.ProfileSelection })), { ssr: false })
const UseCases = dynamic(() => import("@/components/use-cases").then(m => ({ default: m.UseCases })), { ssr: false })
const DashboardSection = dynamic(() => import("@/components/dashboard-section").then(m => ({ default: m.DashboardSection })), { ssr: false })
const FAQ = dynamic(() => import("@/components/faq").then(m => ({ default: m.FAQ })), { ssr: false })
const Footer = dynamic(() => import("@/components/footer").then(m => ({ default: m.Footer })), { ssr: false })
const BottomBar = dynamic(() => import("@/components/bottom-bar").then(m => ({ default: m.BottomBar })), { ssr: false })

export default function Home() {
  const { t } = useLanguage()
  const sectionsRef = useRef<Record<string, HTMLElement | null>>({})
  const [loading, setLoading] = useState(true)
  const [introComplete, setIntroComplete] = useState(false)
  const [scrollDarken, setScrollDarken] = useState(0)

  // Brief brand flash then render
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 400)
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
      {/* Ocean collage background - lower quality for performance */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0 opacity-35">
          <div className="col-span-2 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=1280&q=60&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-2 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1280&q=60&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1280&q=60&auto=format&fit=crop')" }} />
          <div className="col-span-1 row-span-1 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1476673160081-cf065607f449?w=1280&q=60&auto=format&fit=crop')" }} />
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
          <div ref={setRef("how-it-works")} className="mt-12">
            <HowItWorks />
          </div>

          <div ref={setRef("profiles")} className="mt-16">
            <ProfileSelection onNavigate={handleNavigate} />
          </div>

          <div ref={setRef("use-cases")} className="mt-16">
            <UseCases />
          </div>

          <div ref={setRef("dashboard")} className="mt-16">
            <DashboardSection />
          </div>

          <div className="mt-16">
            <FAQ />
          </div>

          <div className="mt-14 pb-24">
            <Footer />
          </div>
        </div>
      </main>

      <BottomBar onNavigate={handleNavigate} />
    </div>
  )
}
