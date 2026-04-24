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

// Typewriter text with brackets
const TYPEWRITER_TEXT = {
  en: "[Secure payments]",
  es: "[Pagos seguros]"
}

// Story pages content
const STORY_PAGES = {
  en: [
    { 
      id: 1, 
      type: "intro",
      headline: "Clear agreements.",
      subheadline: "Define conditions between parties and ensure payments are only released when they are met."
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
      subheadline: "Every transaction protected. Every agreement honored."
    }
  ],
  es: [
    { 
      id: 1, 
      type: "intro",
      headline: "Acuerdos claros.",
      subheadline: "Define condiciones entre partes y asegura que el pago solo se libere cuando se cumplan."
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
      subheadline: "Cada transacción protegida. Cada acuerdo cumplido."
    }
  ]
}

// Typewriter hook
function useTypewriter(text: string, isActive: boolean) {
  const [displayText, setDisplayText] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setDisplayText("")
      return
    }

    setIsTyping(true)
    let currentIndex = 0
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex))
        currentIndex++
      } else {
        setIsTyping(false)
        clearInterval(interval)
      }
    }, 80)

    return () => clearInterval(interval)
  }, [text, isActive])

  return { displayText, isTyping }
}

export function HeroSection({ onNavigate, onIntroComplete }: HeroSectionProps) {
  const { language } = useLanguage()
  const [currentPage, setCurrentPage] = useState(0)
  const [letterOpacities, setLetterOpacities] = useState<number[]>([1, 1, 1, 1, 1, 1])
  const [isHeroVisible, setIsHeroVisible] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const totalPages = 5

  const pages = STORY_PAGES[language as keyof typeof STORY_PAGES] || STORY_PAGES.en
  const typewriterText = TYPEWRITER_TEXT[language as keyof typeof TYPEWRITER_TEXT] || TYPEWRITER_TEXT.en
  const { displayText, isTyping } = useTypewriter(typewriterText, currentPage === 0)

  useEffect(() => {
    const t1 = setTimeout(() => { onIntroComplete?.() }, 2000)
    return () => clearTimeout(t1)
  }, [onIntroComplete])

  // Scroll-based page transitions - faster scroll (0.7vh per page instead of 1vh)
  const onScroll = useCallback(() => {
    if (!containerRef.current) return
    
    const scrollY = window.scrollY
    const vh = window.innerHeight
    const scrollPerPage = vh * 0.7 // Faster scroll - 70% of viewport per page
    const heroHeight = scrollPerPage * totalPages
    
    // Hide fixed content when scrolled past hero
    setIsHeroVisible(scrollY < heroHeight - scrollPerPage * 0.5)
    
    // Calculate current page based on scroll position
    const progress = Math.min(scrollY / heroHeight, 1)
    const pageIndex = Math.min(Math.floor(progress * totalPages), totalPages - 1)
    setCurrentPage(pageIndex)

    // Letter fade effect (only on first page)
    const newOpacities = LETTERS.map((_, i) => {
      const fadeStart = vh * 0.03 + i * vh * 0.04
      const fadeEnd = fadeStart + vh * 0.1
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
    const scrollPerPage = vh * 0.7
    const targetScroll = (currentPage + 1) * scrollPerPage
    window.scrollTo({ top: targetScroll, behavior: "smooth" })
  }

  // Calculate hero height - shorter for faster scroll
  const heroHeightVh = totalPages * 70 // 70vh per page instead of 100vh

  return (
    <section id="hero" ref={containerRef} className="relative" style={{ height: `${heroHeightVh}vh` }}>
      {/* Subtle top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f0b400]/20 to-transparent" aria-hidden="true" />

      {/* Vertical THALOS letters - desktop only, fades on scroll */}
      <div
        className={`pointer-events-none fixed right-0 top-0 bottom-0 z-20 hidden select-none md:flex md:flex-col md:items-end md:justify-center lg:right-4 xl:right-8 transition-opacity duration-300 ${isHeroVisible ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
      >
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            className="thalos-letter block font-black leading-[0.72] text-white"
            style={{
              opacity: letterOpacities[i],
              transition: "opacity 100ms ease-out",
              fontSize: "clamp(10rem, 19vh, 24rem)",
              letterSpacing: "-0.04em",
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Fixed viewport container for story pages */}
      <div className={`fixed inset-0 z-10 overflow-hidden transition-opacity duration-300 ${isHeroVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Page 1: Intro */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:px-16 transition-all duration-500 ease-out"
          style={{
            opacity: currentPage === 0 ? 1 : 0,
            transform: currentPage === 0 ? "translateY(0) scale(1)" : "translateY(-20px) scale(0.98)",
            pointerEvents: currentPage === 0 ? "auto" : "none",
          }}
        >
          <div className="max-w-4xl mx-auto text-center">
            {/* Mobile THALOS */}
            <div className="flex md:hidden justify-center mb-6 gap-0.5">
              {LETTERS.map((letter, i) => (
                <span
                  key={i}
                  className="thalos-letter animate-fade-in-up text-5xl sm:text-6xl font-black text-white/90"
                  style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                >
                  {letter}
                </span>
              ))}
            </div>

            <h1 className="animate-fade-in-up text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white text-balance">
              {pages[0].headline}
            </h1>
            
            {/* Typewriter effect with brackets - more spacing */}
            <div className="mt-4 md:mt-6 min-h-[1.3em] animate-fade-in-up animation-delay-200">
              <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-[#f0b400] font-mono">
                {displayText}
                {isTyping && <span className="animate-pulse ml-0.5">|</span>}
              </p>
            </div>
            
            <p className="mt-8 md:mt-10 max-w-xl md:max-w-2xl mx-auto animate-fade-in-up animation-delay-400 text-base sm:text-lg md:text-xl text-white/70 text-pretty leading-relaxed px-2">
              {pages[0].subheadline}
            </p>

            {/* CTAs */}
            <div className="mt-8 md:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 animate-fade-in-up animation-delay-600">
              <Button
                size="lg"
                onClick={() => onNavigate("sign-in")}
                className="w-full sm:w-auto h-12 rounded-lg bg-[#f0b400] px-8 text-sm font-bold text-[#0c1220] hover:bg-[#d9a300] active:scale-[0.98] transition-all duration-200 shadow-[0_0_30px_rgba(240,180,0,0.3)]"
              >
                {language === "es" ? "Crear acuerdo" : "Create Agreement"}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={() => onNavigate("how-it-works")}
                className="w-full sm:w-auto h-12 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-8 text-sm font-bold text-white hover:bg-white/10 hover:border-white/30 active:scale-[0.98] transition-all duration-200"
              >
                {language === "es" ? "Ver cómo funciona" : "See how it works"}
              </Button>
            </div>

            {/* Scroll indicator */}
            <button 
              onClick={scrollToNextPage}
              className="mt-10 md:mt-12 animate-bounce text-white/40 hover:text-white/60 transition-colors"
              aria-label="Scroll to next section"
            >
              <ChevronDown className="h-6 w-6 sm:h-8 sm:w-8" />
            </button>
          </div>
        </div>

        {/* Page 2: Login Image */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:px-16 transition-all duration-500 ease-out"
          style={{
            opacity: currentPage === 1 ? 1 : 0,
            transform: currentPage === 1 ? "translateY(0) scale(1)" : currentPage < 1 ? "translateY(40px) scale(0.95)" : "translateY(-40px) scale(0.95)",
            pointerEvents: currentPage === 1 ? "auto" : "none",
          }}
        >
          <div className="text-center">
            {/* Phone mockup with glow */}
            <div className="relative inline-block">
              <div className="absolute -inset-6 sm:-inset-8 bg-[#f0b400]/10 blur-2xl sm:blur-3xl rounded-full" />
              <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                <img 
                  src="/images/hero-login.png" 
                  alt={pages[1].alt}
                  className="w-[220px] sm:w-[260px] md:w-[300px] lg:w-[340px] h-auto"
                />
              </div>
            </div>
            
            <p className="mt-6 sm:mt-8 text-xl sm:text-2xl md:text-3xl font-semibold text-white">
              {pages[1].caption}
            </p>
            <div className="mt-2 h-1 w-12 sm:w-16 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
          </div>
        </div>

        {/* Page 3: Dashboard Image */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:px-16 transition-all duration-500 ease-out"
          style={{
            opacity: currentPage === 2 ? 1 : 0,
            transform: currentPage === 2 ? "translateY(0) scale(1)" : currentPage < 2 ? "translateY(40px) scale(0.95)" : "translateY(-40px) scale(0.95)",
            pointerEvents: currentPage === 2 ? "auto" : "none",
          }}
        >
          <div className="text-center">
            {/* Phone mockup with glow */}
            <div className="relative inline-block">
              <div className="absolute -inset-6 sm:-inset-8 bg-[#f0b400]/10 blur-2xl sm:blur-3xl rounded-full" />
              <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
                <img 
                  src="/images/hero-dashboard.png" 
                  alt={pages[2].alt}
                  className="w-[220px] sm:w-[260px] md:w-[300px] lg:w-[340px] h-auto"
                />
              </div>
            </div>
            
            <p className="mt-6 sm:mt-8 text-xl sm:text-2xl md:text-3xl font-semibold text-white">
              {pages[2].caption}
            </p>
            <div className="mt-2 h-1 w-12 sm:w-16 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
          </div>
        </div>

        {/* Page 4: Video - proportional phone size */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:px-16 transition-all duration-500 ease-out"
          style={{
            opacity: currentPage === 3 ? 1 : 0,
            transform: currentPage === 3 ? "translateY(0) scale(1)" : currentPage < 3 ? "translateY(40px) scale(0.95)" : "translateY(-40px) scale(0.95)",
            pointerEvents: currentPage === 3 ? "auto" : "none",
          }}
        >
          <div className="text-center">
            {/* Video in phone frame - same size as other mockups */}
            <div className="relative inline-block">
              <div className="absolute -inset-6 sm:-inset-8 bg-[#f0b400]/10 blur-2xl sm:blur-3xl rounded-full" />
              <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/10 bg-black">
                {currentPage >= 2 ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&vq=hd1080&hd=1`}
                    className="w-[220px] sm:w-[260px] md:w-[300px] lg:w-[340px] aspect-[9/16] pointer-events-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title="Thalos Demo Video"
                    style={{ border: 0 }}
                  />
                ) : (
                  <div className="w-[220px] sm:w-[260px] md:w-[300px] lg:w-[340px] aspect-[9/16] bg-black/80 flex items-center justify-center">
                    <Play className="h-12 w-12 sm:h-16 sm:w-16 text-white/30" />
                  </div>
                )}
              </div>
            </div>
            
            <p className="mt-6 sm:mt-8 text-xl sm:text-2xl md:text-3xl font-semibold text-white">
              {pages[3].caption}
            </p>
            <div className="mt-2 h-1 w-12 sm:w-16 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
          </div>
        </div>

        {/* Page 5: Final - Trust message */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 lg:px-16 transition-all duration-500 ease-out"
          style={{
            opacity: currentPage === 4 ? 1 : 0,
            transform: currentPage === 4 ? "translateY(0) scale(1)" : currentPage < 4 ? "translateY(40px) scale(0.95)" : "translateY(-40px) scale(0.95)",
            pointerEvents: currentPage === 4 ? "auto" : "none",
          }}
        >
          <div className="max-w-3xl mx-auto text-center">
            {/* Checkmark icon with glow */}
            <div className="relative inline-flex items-center justify-center mb-6 sm:mb-8">
              <div className="absolute inset-0 bg-[#f0b400]/20 blur-2xl rounded-full scale-150" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#f0b400]/10 border border-[#f0b400]/30 flex items-center justify-center">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-[#f0b400]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
              {pages[4].headline}
            </h2>
            
            <p className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-xl mx-auto">
              {pages[4].subheadline}
            </p>
            
            <div className="mt-3 sm:mt-4 h-1 w-20 sm:w-24 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
          </div>
        </div>

        {/* Page indicators */}
        <div className={`fixed bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 sm:gap-2 transition-opacity duration-300 ${isHeroVisible ? 'opacity-100' : 'opacity-0'}`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <button
              key={i}
              onClick={() => {
                const scrollPerPage = window.innerHeight * 0.7
                window.scrollTo({ top: i * scrollPerPage, behavior: "smooth" })
              }}
              className={`transition-all duration-300 rounded-full ${
                currentPage === i 
                  ? "w-6 sm:w-8 h-1.5 sm:h-2 bg-[#f0b400]" 
                  : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
