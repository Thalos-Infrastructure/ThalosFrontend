"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef, useCallback } from "react"
import { useLanguage } from "@/lib/i18n"
import { Play, ChevronDown } from "lucide-react"

interface HeroSectionProps {
  onNavigate: (section: string) => void
  onIntroComplete?: () => void
}

const LETTERS = ["T", "h", "a", "l", "o", "s"]

// YouTube video ID
const YOUTUBE_VIDEO_ID = "pKIizFs0dO4"

// Story pages content
const STORY_PAGES = {
  en: [
    { 
      id: 1, 
      type: "intro",
      headline: "Clear agreements.",
      headline2: "Secure payments.",
      subheadline: "Define conditions between parties and ensure payments are only released when they are met.",
      poweredBy: "Powered by secure and transparent technology"
    },
    { 
      id: 2, 
      type: "image",
      image: "/images/hero-login.png",
      caption: "Start in seconds",
      alt: "Thalos login screen"
    },
    { 
      id: 3, 
      type: "image",
      image: "/images/hero-dashboard.png",
      caption: "Manage your agreements",
      alt: "Thalos agreements dashboard"
    },
    { 
      id: 4, 
      type: "video",
      caption: "Conditions are met. Payments are released."
    },
    { 
      id: 5, 
      type: "final",
      headline: "Trust at every step",
      subheadline: "Every transaction protected. Every agreement honored.",
      cta: "Get Started"
    }
  ],
  es: [
    { 
      id: 1, 
      type: "intro",
      headline: "Acuerdos claros.",
      headline2: "Pagos seguros.",
      subheadline: "Define condiciones entre partes y asegura que el pago solo se libere cuando se cumplan.",
      poweredBy: "Impulsado por tecnología segura y transparente"
    },
    { 
      id: 2, 
      type: "image",
      image: "/images/hero-login.png",
      caption: "Empieza en segundos",
      alt: "Pantalla de inicio de Thalos"
    },
    { 
      id: 3, 
      type: "image",
      image: "/images/hero-dashboard.png",
      caption: "Gestiona tus acuerdos",
      alt: "Panel de acuerdos de Thalos"
    },
    { 
      id: 4, 
      type: "video",
      caption: "Se cumplen las condiciones. Se libera el pago."
    },
    { 
      id: 5, 
      type: "final",
      headline: "Confianza en cada paso",
      subheadline: "Cada transacción protegida. Cada acuerdo cumplido.",
      cta: "Comenzar ahora"
    }
  ]
}

export function HeroSection({ onNavigate, onIntroComplete }: HeroSectionProps) {
  const { language } = useLanguage()
  const [currentPage, setCurrentPage] = useState(0)
  const [letterOpacities, setLetterOpacities] = useState<number[]>([1, 1, 1, 1, 1, 1])
  const [isHeroVisible, setIsHeroVisible] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const totalPages = 5

  const pages = STORY_PAGES[language as keyof typeof STORY_PAGES] || STORY_PAGES.en

  useEffect(() => {
    const t1 = setTimeout(() => { onIntroComplete?.() }, 2000)
    return () => clearTimeout(t1)
  }, [onIntroComplete])

  // Scroll-based page transitions
  const onScroll = useCallback(() => {
    if (!containerRef.current) return
    
    const scrollY = window.scrollY
    const vh = window.innerHeight
    const heroHeight = vh * (totalPages - 0.5) // Slightly less than full height
    
    // Hide fixed content when scrolled past hero
    const heroEnd = heroHeight
    setIsHeroVisible(scrollY < heroEnd)
    
    // Calculate current page based on scroll position
    const progress = Math.min(scrollY / heroHeight, 1)
    const pageIndex = Math.min(Math.floor(progress * totalPages), totalPages - 1)
    setCurrentPage(pageIndex)

    // Letter fade effect (only on first page)
    const newOpacities = LETTERS.map((_, i) => {
      const fadeStart = vh * 0.05 + i * vh * 0.06
      const fadeEnd = fadeStart + vh * 0.15
      if (scrollY < fadeStart) return 1
      if (scrollY > fadeEnd) return 0
      const raw = 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart)
      return raw * raw
    })
    setLetterOpacities(newOpacities)
  }, [totalPages])

  useEffect(() => {
    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [onScroll])

  const scrollToNextPage = () => {
    const vh = window.innerHeight
    const targetScroll = (currentPage + 1) * vh
    window.scrollTo({ top: targetScroll, behavior: "smooth" })
  }

  return (
    <section id="hero" ref={containerRef} className="relative" style={{ height: `${(totalPages - 0.5) * 100}vh` }}>
      {/* Subtle top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f0b400]/20 to-transparent" aria-hidden="true" />

      {/* Vertical THALOS letters - desktop only, fades on scroll */}
      <div
        className={`pointer-events-none fixed right-0 top-0 bottom-0 z-20 hidden select-none md:flex md:flex-col md:items-end md:justify-center lg:right-4 xl:right-8 transition-opacity duration-500 ${isHeroVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      >
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            className="thalos-letter block font-black leading-[0.72] text-white"
            style={{
              opacity: letterOpacities[i],
              transition: "opacity 120ms cubic-bezier(0.25, 0.1, 0.25, 1)",
              fontSize: "clamp(10rem, 19vh, 24rem)",
              letterSpacing: "-0.04em",
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Fixed viewport container for story pages */}
      <div className={`fixed inset-0 z-10 overflow-hidden transition-opacity duration-500 ${isHeroVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Page 1: Intro */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-6 lg:px-16 transition-all duration-700 ease-out"
          style={{
            opacity: currentPage === 0 ? 1 : 0,
            transform: currentPage === 0 ? "translateY(0) scale(1)" : "translateY(-30px) scale(0.98)",
            pointerEvents: currentPage === 0 ? "auto" : "none",
          }}
        >
          <div className="max-w-4xl mx-auto text-center">
            {/* Mobile THALOS */}
            <div className="flex md:hidden justify-center mb-8 gap-0.5">
              {LETTERS.map((letter, i) => (
                <span
                  key={i}
                  className="thalos-letter animate-fade-in-up text-6xl font-black text-white/90"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                >
                  {letter}
                </span>
              ))}
            </div>

            <h1 className="animate-fade-in-up text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white text-balance">
              {pages[0].headline}
            </h1>
            <p className="mt-2 animate-fade-in-up animation-delay-200 text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-[#f0b400]">
              {pages[0].headline2}
            </p>
            
            <p className="mt-8 max-w-2xl mx-auto animate-fade-in-up animation-delay-400 text-lg md:text-xl text-white/70 text-pretty leading-relaxed">
              {pages[0].subheadline}
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up animation-delay-600">
              <Button
                size="lg"
                onClick={() => onNavigate("sign-in")}
                className="h-12 rounded-lg bg-[#f0b400] px-8 text-sm font-bold text-[#0c1220] hover:bg-[#d9a300] active:scale-[0.98] transition-all duration-200 shadow-[0_0_30px_rgba(240,180,0,0.3)]"
              >
                {language === "es" ? "Crear acuerdo" : "Create Agreement"}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onNavigate("how-it-works")}
                className="h-12 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-8 text-sm font-bold text-white hover:bg-white/10 hover:border-white/30 active:scale-[0.98] transition-all duration-200"
              >
                {language === "es" ? "Ver cómo funciona" : "See how it works"}
              </Button>
            </div>

            {/* Powered by */}
            <p className="mt-12 animate-fade-in-up animation-delay-800 text-xs uppercase tracking-[0.2em] text-white/40">
              {pages[0].poweredBy}
            </p>

            {/* Scroll indicator */}
            <button 
              onClick={scrollToNextPage}
              className="mt-8 animate-bounce text-white/40 hover:text-white/60 transition-colors"
              aria-label="Scroll to next section"
            >
              <ChevronDown className="h-8 w-8" />
            </button>
          </div>
        </div>

        {/* Page 2: Login Image */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-6 lg:px-16 transition-all duration-700 ease-out"
          style={{
            opacity: currentPage === 1 ? 1 : 0,
            transform: currentPage === 1 ? "translateY(0) scale(1)" : currentPage < 1 ? "translateY(50px) scale(0.95)" : "translateY(-50px) scale(0.95)",
            pointerEvents: currentPage === 1 ? "auto" : "none",
          }}
        >
          <div className="max-w-5xl mx-auto text-center">
            {/* Phone mockup with glow */}
            <div className="relative inline-block">
              <div className="absolute -inset-8 bg-[#f0b400]/10 blur-3xl rounded-full" />
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                <img 
                  src="/images/hero-login.png" 
                  alt={pages[1].alt}
                  className="w-[280px] md:w-[320px] lg:w-[360px] h-auto"
                />
              </div>
            </div>
            
            <p className="mt-10 text-2xl md:text-3xl font-semibold text-white">
              {pages[1].caption}
            </p>
            <div className="mt-2 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
          </div>
        </div>

        {/* Page 3: Dashboard Image */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-6 lg:px-16 transition-all duration-700 ease-out"
          style={{
            opacity: currentPage === 2 ? 1 : 0,
            transform: currentPage === 2 ? "translateY(0) scale(1)" : currentPage < 2 ? "translateY(50px) scale(0.95)" : "translateY(-50px) scale(0.95)",
            pointerEvents: currentPage === 2 ? "auto" : "none",
          }}
        >
          <div className="max-w-5xl mx-auto text-center">
            {/* Phone mockup with glow */}
            <div className="relative inline-block">
              <div className="absolute -inset-8 bg-[#f0b400]/10 blur-3xl rounded-full" />
              <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                <img 
                  src="/images/hero-dashboard.png" 
                  alt={pages[2].alt}
                  className="w-[280px] md:w-[320px] lg:w-[360px] h-auto"
                />
              </div>
            </div>
            
            <p className="mt-10 text-2xl md:text-3xl font-semibold text-white">
              {pages[2].caption}
            </p>
            <div className="mt-2 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
          </div>
        </div>

        {/* Page 4: Video */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-6 lg:px-16 transition-all duration-700 ease-out"
          style={{
            opacity: currentPage === 3 ? 1 : 0,
            transform: currentPage === 3 ? "translateY(0) scale(1)" : currentPage < 3 ? "translateY(50px) scale(0.95)" : "translateY(-50px) scale(0.95)",
            pointerEvents: currentPage === 3 ? "auto" : "none",
          }}
        >
          <div className="max-w-5xl w-full mx-auto text-center">
            {/* Video container with glow - clean embed without YouTube branding */}
            <div className="relative">
              <div className="absolute -inset-8 bg-[#f0b400]/8 blur-3xl rounded-3xl" />
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                {currentPage >= 2 ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&vq=hd1080`}
                    className="w-full aspect-video pointer-events-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title="Thalos Demo Video"
                    style={{ border: 0 }}
                  />
                ) : (
                  <div className="w-full aspect-video bg-black/80 flex items-center justify-center">
                    <Play className="h-16 w-16 text-white/30" />
                  </div>
                )}
              </div>
            </div>
            
            <p className="mt-8 text-2xl md:text-3xl font-semibold text-white">
              {pages[3].caption}
            </p>
            <div className="mt-2 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
          </div>
        </div>

        {/* Page 5: Final - Trust */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-6 lg:px-16 transition-all duration-700 ease-out"
          style={{
            opacity: currentPage === 4 ? 1 : 0,
            transform: currentPage === 4 ? "translateY(0) scale(1)" : "translateY(50px) scale(0.95)",
            pointerEvents: currentPage === 4 ? "auto" : "none",
          }}
        >
          <div className="max-w-3xl mx-auto text-center">
            {/* Success glow effect */}
            <div className="relative">
              <div className="absolute inset-0 -top-20 bg-gradient-radial from-[#f0b400]/20 via-transparent to-transparent blur-3xl" />
              
              <div className="relative">
                {/* Checkmark icon */}
                <div className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#f0b400]/10 border border-[#f0b400]/30">
                  <svg className="w-10 h-10 text-[#f0b400]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white">
                  {pages[4].headline}
                </h2>
                <p className="mt-4 text-xl md:text-2xl text-white/60">
                  {pages[4].subheadline}
                </p>

                {/* Final CTAs */}
                <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button
                    size="lg"
                    onClick={() => onNavigate("sign-in")}
                    className="h-12 rounded-lg bg-[#f0b400] px-8 text-sm font-bold text-[#0c1220] hover:bg-[#d9a300] active:scale-[0.98] transition-all duration-200 shadow-[0_0_30px_rgba(240,180,0,0.3)]"
                  >
                    {language === "es" ? "Comenzar ahora" : "Get Started"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page indicators */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <button
              key={i}
              onClick={() => window.scrollTo({ top: i * window.innerHeight, behavior: "smooth" })}
              className={`transition-all duration-300 rounded-full ${
                currentPage === i 
                  ? "w-8 h-2 bg-[#f0b400]" 
                  : "w-2 h-2 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
