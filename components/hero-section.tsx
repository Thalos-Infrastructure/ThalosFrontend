"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef, useCallback } from "react"
import { useLanguage } from "@/lib/i18n"
import { ChevronDown, Shield, FileCheck, Wallet, Users } from "lucide-react"

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

// Content translations
const CONTENT = {
  en: {
    badge: "Digital Agreement Platform",
    headline: "Thalos protects your",
    headlineHighlight: "transactions",
    description: "We are the bridge between trust and payments. Create secure digital agreements where funds are only released when conditions are verified by both parties.",
    features: [
      { icon: Shield, text: "Protected funds until conditions are met" },
      { icon: FileCheck, text: "Clear milestones and deliverables" },
      { icon: Wallet, text: "Instant release when approved" },
      { icon: Users, text: "Dispute resolution included" },
    ],
    cta: "Create Agreement",
    ctaSecondary: "See how it works",
    imageCaption1: "Start in seconds",
    imageCaption2: "Manage your agreements",
    videoCaption: "See it in action",
    finalHeadline: "Trust at every step",
    finalSubheadline: "Every transaction protected. Every agreement honored.",
  },
  es: {
    badge: "Plataforma de Acuerdos Digitales",
    headline: "Thalos protege tus",
    headlineHighlight: "transacciones",
    description: "Somos el puente entre la confianza y los pagos. Crea acuerdos digitales seguros donde los fondos solo se liberan cuando las condiciones son verificadas por ambas partes.",
    features: [
      { icon: Shield, text: "Fondos protegidos hasta cumplir condiciones" },
      { icon: FileCheck, text: "Hitos y entregables claros" },
      { icon: Wallet, text: "Liberacion instantanea al aprobar" },
      { icon: Users, text: "Resolucion de disputas incluida" },
    ],
    cta: "Crear Acuerdo",
    ctaSecondary: "Ver como funciona",
    imageCaption1: "Empieza en segundos",
    imageCaption2: "Gestiona tus acuerdos",
    videoCaption: "Velo en accion",
    finalHeadline: "Confianza en cada paso",
    finalSubheadline: "Cada transaccion protegida. Cada acuerdo cumplido.",
  }
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

  const content = CONTENT[language as keyof typeof CONTENT] || CONTENT.en
  const typewriterText = TYPEWRITER_TEXT[language as keyof typeof TYPEWRITER_TEXT] || TYPEWRITER_TEXT.en
  const { displayText, isTyping } = useTypewriter(typewriterText, currentPage === 0)

  useEffect(() => {
    const t1 = setTimeout(() => { onIntroComplete?.() }, 2000)
    return () => clearTimeout(t1)
  }, [onIntroComplete])

  // Scroll-based page transitions
  const onScroll = useCallback(() => {
    if (!containerRef.current) return
    
    const scrollY = window.scrollY
    const vh = window.innerHeight
    const scrollPerPage = vh * 0.6 // 60% of viewport per page - faster scroll
    const heroHeight = scrollPerPage * totalPages
    
    // Hide fixed content when scrolled past hero
    setIsHeroVisible(scrollY < heroHeight - scrollPerPage)
    
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
    const scrollPerPage = vh * 0.6
    const targetScroll = (currentPage + 1) * scrollPerPage
    window.scrollTo({ top: targetScroll, behavior: "smooth" })
  }

  // Hero height - 60vh per page
  const heroHeightVh = totalPages * 60

  return (
    <section id="hero" ref={containerRef} className="relative" style={{ height: `${heroHeightVh}vh` }}>
      {/* Subtle top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f0b400]/20 to-transparent" aria-hidden="true" />

      {/* Vertical THALOS letters - desktop only, positioned at middle */}
      <div
        className={`pointer-events-none fixed right-0 top-[45%] -translate-y-1/2 z-20 hidden select-none md:flex md:flex-col md:items-end lg:right-4 xl:right-8 transition-opacity duration-300 ${isHeroVisible ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
      >
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            className="thalos-letter block font-black leading-[0.72] text-white"
            style={{
              opacity: letterOpacities[i],
              transition: "opacity 100ms ease-out",
              fontSize: "clamp(6rem, 12vh, 14rem)",
              letterSpacing: "-0.04em",
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Fixed viewport container for story pages */}
      <div className={`fixed inset-0 z-10 overflow-hidden transition-opacity duration-300 ${isHeroVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Page 1: Intro - Two column layout */}
        <div 
          className="absolute inset-0 flex items-center transition-all duration-500 ease-out"
          style={{
            opacity: currentPage === 0 ? 1 : 0,
            transform: currentPage === 0 ? "translateY(0)" : "translateY(-30px)",
            pointerEvents: currentPage === 0 ? "auto" : "none",
          }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left column - Text content */}
              <div className="text-left max-w-xl">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f0b400]/10 border border-[#f0b400]/20 mb-6 animate-fade-in-up">
                  <div className="w-2 h-2 rounded-full bg-[#f0b400] animate-pulse" />
                  <span className="text-xs font-medium text-[#f0b400] uppercase tracking-wider">{content.badge}</span>
                </div>

                {/* Mobile THALOS */}
                <div className="flex md:hidden mb-4 gap-0.5">
                  {LETTERS.map((letter, i) => (
                    <span
                      key={i}
                      className="thalos-letter animate-fade-in-up text-4xl sm:text-5xl font-black text-white/90"
                      style={{ animationDelay: `${i * 80}ms`, animationFillMode: "both" }}
                    >
                      {letter}
                    </span>
                  ))}
                </div>

                {/* Headlines */}
                <h1 className="animate-fade-in-up text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-white">
                  {content.headline}
                </h1>
                
                {/* Typewriter effect */}
                <div className="mt-2 min-h-[1.3em] animate-fade-in-up animation-delay-200">
                  <p className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-[#f0b400] font-mono">
                    {displayText}
                    {isTyping && <span className="animate-pulse ml-0.5">|</span>}
                  </p>
                </div>
                
                {/* Description */}
                <p className="mt-6 text-base sm:text-lg text-white/70 leading-relaxed animate-fade-in-up animation-delay-300">
                  {content.description}
                </p>

                {/* Features list */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in-up animation-delay-400">
                  {content.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                      <feature.icon className="w-4 h-4 text-[#f0b400] flex-shrink-0" />
                      <span>{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTAs */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3 animate-fade-in-up animation-delay-500">
                  <Button
                    size="lg"
                    onClick={() => onNavigate("sign-in")}
                    className="h-12 rounded-lg bg-[#f0b400] px-8 text-sm font-bold text-[#0c1220] hover:bg-[#d9a300] active:scale-[0.98] transition-all duration-200 shadow-[0_0_30px_rgba(240,180,0,0.3)]"
                  >
                    {content.cta}
                  </Button>
                  <Button
                    variant="ghost"
                    size="lg"
                    onClick={() => onNavigate("how-it-works")}
                    className="h-12 rounded-lg border border-white/20 bg-white/5 backdrop-blur-sm px-8 text-sm font-bold text-white hover:bg-white/10 hover:border-white/30 active:scale-[0.98] transition-all duration-200"
                  >
                    {content.ctaSecondary}
                  </Button>
                </div>

                {/* Scroll indicator */}
                <button 
                  onClick={scrollToNextPage}
                  className="mt-8 animate-bounce text-white/40 hover:text-white/60 transition-colors"
                  aria-label="Scroll to next section"
                >
                  <ChevronDown className="h-6 w-6" />
                </button>
              </div>

              {/* Right column - Floating images preview */}
              <div className="hidden lg:flex items-center justify-center relative">
                <div className="relative w-full max-w-md">
                  {/* Back image - dashboard */}
                  <div 
                    className="absolute top-8 right-0 transform rotate-3 transition-transform hover:rotate-1 hover:scale-105 duration-500"
                    style={{ 
                      filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.5))",
                    }}
                  >
                    <div className="rounded-[1.5rem] overflow-hidden border border-white/10 bg-black/20 backdrop-blur-sm">
                      <img 
                        src="/images/hero-dashboard.png" 
                        alt="Dashboard"
                        className="w-[200px] xl:w-[240px] h-auto"
                      />
                    </div>
                  </div>
                  
                  {/* Front image - login */}
                  <div 
                    className="relative z-10 transform -rotate-3 transition-transform hover:rotate-0 hover:scale-105 duration-500"
                    style={{ 
                      filter: "drop-shadow(0 30px 60px rgba(0,0,0,0.6))",
                    }}
                  >
                    <div className="rounded-[1.5rem] overflow-hidden border border-white/10 bg-black/20 backdrop-blur-sm">
                      <img 
                        src="/images/hero-login.png" 
                        alt="Login"
                        className="w-[220px] xl:w-[260px] h-auto"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page 2: Login Image - Floating effect */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-4 transition-all duration-500 ease-out"
          style={{
            opacity: currentPage === 1 ? 1 : 0,
            transform: currentPage === 1 ? "translateY(0) scale(1)" : currentPage < 1 ? "translateY(50px) scale(0.9)" : "translateY(-50px) scale(0.9)",
            pointerEvents: currentPage === 1 ? "auto" : "none",
          }}
        >
          <div className="text-center">
            {/* Floating phone mockup */}
            <div 
              className="relative inline-block animate-float"
              style={{ 
                filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.6)) drop-shadow(0 15px 30px rgba(240,180,0,0.1))",
              }}
            >
              <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-white/10 bg-black/20 backdrop-blur-sm transform hover:scale-[1.02] transition-transform duration-500">
                <img 
                  src="/images/hero-login.png" 
                  alt="Thalos login screen"
                  className="w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px] h-auto"
                />
              </div>
            </div>
            
            <p className="mt-8 text-xl sm:text-2xl md:text-3xl font-semibold text-white">
              {content.imageCaption1}
            </p>
            <div className="mt-2 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
          </div>
        </div>

        {/* Page 3: Dashboard Image - Floating effect */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-4 transition-all duration-500 ease-out"
          style={{
            opacity: currentPage === 2 ? 1 : 0,
            transform: currentPage === 2 ? "translateY(0) scale(1)" : currentPage < 2 ? "translateY(50px) scale(0.9)" : "translateY(-50px) scale(0.9)",
            pointerEvents: currentPage === 2 ? "auto" : "none",
          }}
        >
          <div className="text-center">
            {/* Floating phone mockup */}
            <div 
              className="relative inline-block animate-float"
              style={{ 
                filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.6)) drop-shadow(0 15px 30px rgba(240,180,0,0.1))",
                animationDelay: "0.5s"
              }}
            >
              <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-white/10 bg-black/20 backdrop-blur-sm transform hover:scale-[1.02] transition-transform duration-500">
                <img 
                  src="/images/hero-dashboard.png" 
                  alt="Thalos agreements dashboard"
                  className="w-[260px] sm:w-[300px] md:w-[340px] lg:w-[380px] h-auto"
                />
              </div>
            </div>
            
            <p className="mt-8 text-xl sm:text-2xl md:text-3xl font-semibold text-white">
              {content.imageCaption2}
            </p>
            <div className="mt-2 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
          </div>
        </div>

        {/* Page 4: Video - Horizontal, not too large */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-4 transition-all duration-500 ease-out"
          style={{
            opacity: currentPage === 3 ? 1 : 0,
            transform: currentPage === 3 ? "translateY(0) scale(1)" : currentPage < 3 ? "translateY(50px) scale(0.9)" : "translateY(-50px) scale(0.9)",
            pointerEvents: currentPage === 3 ? "auto" : "none",
          }}
        >
          <div className="text-center w-full max-w-3xl mx-auto">
            {/* Video container - horizontal 16:9 */}
            <div 
              className="relative inline-block w-full"
              style={{ 
                filter: "drop-shadow(0 40px 80px rgba(0,0,0,0.6)) drop-shadow(0 15px 30px rgba(240,180,0,0.1))",
              }}
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black">
                {currentPage >= 2 ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YOUTUBE_VIDEO_ID}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&disablekb=1&fs=0&playsinline=1&vq=hd1080&hd=1`}
                    className="w-full aspect-video pointer-events-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    title="Thalos Demo Video"
                    style={{ border: 0 }}
                  />
                ) : (
                  <div className="w-full aspect-video bg-black/80 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                      <div className="w-0 h-0 border-l-[20px] border-l-white/50 border-t-[12px] border-t-transparent border-b-[12px] border-b-transparent ml-1" />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <p className="mt-8 text-xl sm:text-2xl md:text-3xl font-semibold text-white">
              {content.videoCaption}
            </p>
            <div className="mt-2 h-1 w-16 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
          </div>
        </div>

        {/* Page 5: Final - Trust message with more spacing */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-4 transition-all duration-500 ease-out"
          style={{
            opacity: currentPage === 4 ? 1 : 0,
            transform: currentPage === 4 ? "translateY(0) scale(1)" : currentPage < 4 ? "translateY(50px) scale(0.9)" : "translateY(-50px) scale(0.9)",
            pointerEvents: currentPage === 4 ? "auto" : "none",
          }}
        >
          <div className="max-w-3xl mx-auto text-center">
            {/* Checkmark icon with glow */}
            <div className="relative inline-flex items-center justify-center mb-8">
              <div className="absolute inset-0 bg-[#f0b400]/20 blur-3xl rounded-full scale-150" />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#f0b400]/10 border border-[#f0b400]/30 flex items-center justify-center">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-[#f0b400]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              {content.finalHeadline}
            </h2>
            
            <p className="text-lg sm:text-xl md:text-2xl text-white/70 max-w-xl mx-auto">
              {content.finalSubheadline}
            </p>
            
            <div className="mt-4 h-1 w-24 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
          </div>
        </div>

        {/* Page indicators */}
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 transition-opacity duration-300 ${isHeroVisible ? 'opacity-100' : 'opacity-0'}`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <button
              key={i}
              onClick={() => {
                const scrollPerPage = window.innerHeight * 0.6
                window.scrollTo({ top: i * scrollPerPage, behavior: "smooth" })
              }}
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

      {/* Spacer to ensure no collision with next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32" />

      {/* CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
