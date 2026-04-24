"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef, useCallback } from "react"
import { useLanguage } from "@/lib/i18n"
import { ChevronDown } from "lucide-react"

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
    headline: "Thalos protects your",
    headlineHighlight: "transactions",
    description: "We are the bridge between trust and payments. Create secure digital agreements where funds are protected until conditions are met, with clear milestones, instant release when approved, and dispute resolution included.",
    cta: "Create Agreement",
    ctaSecondary: "See how it works",
    imageCaption1: "Start in seconds",
    imageCaption2: "Manage your agreements",
    videoCaption: "See it in action",
    finalHeadline: "Trust at every step",
    finalSubheadline: "Every transaction protected. Every agreement honored.",
  },
  es: {
    headline: "Thalos protege tus",
    headlineHighlight: "transacciones",
    description: "Somos el puente entre la confianza y los pagos. Crea acuerdos digitales seguros donde los fondos estan protegidos hasta cumplir condiciones, con hitos claros, liberacion instantanea al aprobar, y resolucion de disputas incluida.",
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
    const scrollPerPage = vh * 0.55 // Faster scroll
    const heroHeight = scrollPerPage * totalPages
    
    // Hide fixed content when scrolled past hero
    setIsHeroVisible(scrollY < heroHeight - scrollPerPage * 1.5)
    
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
    const scrollPerPage = vh * 0.55
    const targetScroll = (currentPage + 1) * scrollPerPage
    window.scrollTo({ top: targetScroll, behavior: "smooth" })
  }

  // Hero height
  const heroHeightVh = totalPages * 55 + 15 // Extra space at end

  return (
    <section id="hero" ref={containerRef} className="relative" style={{ height: `${heroHeightVh}vh` }}>
      {/* Subtle top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#f0b400]/20 to-transparent" aria-hidden="true" />

      {/* Vertical THALOS letters - desktop only, original size */}
      <div
        className={`pointer-events-none fixed right-0 top-1/2 -translate-y-1/2 z-20 hidden select-none md:flex md:flex-col md:items-end lg:right-4 xl:right-8 transition-opacity duration-300 ${isHeroVisible ? 'opacity-100' : 'opacity-0'}`}
        aria-hidden="true"
      >
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            className="thalos-letter block font-black leading-[0.72] text-white"
            style={{
              opacity: letterOpacities[i],
              transition: "opacity 100ms ease-out",
              fontSize: "clamp(8rem, 19vh, 20rem)",
              letterSpacing: "-0.04em",
            }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Fixed viewport container for story pages */}
      <div className={`fixed inset-0 z-10 overflow-hidden transition-opacity duration-300 ${isHeroVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Page 1: Intro - Text centered/left without images */}
        <div 
          className="absolute inset-0 flex items-center transition-all duration-500 ease-out"
          style={{
            opacity: currentPage === 0 ? 1 : 0,
            transform: currentPage === 0 ? "translateY(0)" : "translateY(-30px)",
            pointerEvents: currentPage === 0 ? "auto" : "none",
          }}
        >
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="text-center md:text-left md:max-w-2xl">
              {/* Mobile THALOS */}
              <div className="flex md:hidden justify-center mb-6 gap-0.5">
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
              <h1 className="animate-fade-in-up text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-white leading-tight">
                {content.headline}
              </h1>
              
              {/* Typewriter effect */}
              <div className="mt-3 sm:mt-4 min-h-[1.3em] animate-fade-in-up animation-delay-200">
                <p className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight text-[#f0b400] font-mono">
                  {displayText}
                  {isTyping && <span className="animate-pulse ml-0.5">|</span>}
                </p>
              </div>
              
              {/* Description - now includes features inline */}
              <p className="mt-8 sm:mt-10 text-lg sm:text-xl text-white/70 leading-relaxed animate-fade-in-up animation-delay-300 max-w-xl mx-auto md:mx-0">
                {content.description}
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col sm:flex-row justify-center md:justify-start gap-4 animate-fade-in-up animation-delay-500">
                <Button
                  size="lg"
                  onClick={() => onNavigate("sign-in")}
                  className="h-14 rounded-xl bg-[#f0b400] px-10 text-base font-bold text-[#0c1220] hover:bg-[#d9a300] active:scale-[0.98] transition-all duration-200 shadow-[0_0_40px_rgba(240,180,0,0.3)]"
                >
                  {content.cta}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => onNavigate("how-it-works")}
                  className="h-14 rounded-xl border border-white/20 bg-white/5 backdrop-blur-sm px-10 text-base font-bold text-white hover:bg-white/10 hover:border-white/30 active:scale-[0.98] transition-all duration-200"
                >
                  {content.ctaSecondary}
                </Button>
              </div>

              {/* Scroll indicator */}
              <button 
                onClick={scrollToNextPage}
                className="mt-12 animate-bounce text-white/40 hover:text-white/60 transition-colors mx-auto md:mx-0 block"
                aria-label="Scroll to next section"
              >
                <ChevronDown className="h-8 w-8" />
              </button>
            </div>
          </div>
        </div>

        {/* Page 2: Login Image - Floating effect, bigger */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-4 transition-all duration-500 ease-out"
          style={{
            opacity: currentPage === 1 ? 1 : 0,
            transform: currentPage === 1 ? "translateY(0) scale(1)" : currentPage < 1 ? "translateY(50px) scale(0.9)" : "translateY(-50px) scale(0.9)",
            pointerEvents: currentPage === 1 ? "auto" : "none",
          }}
        >
          <div className="text-center">
            {/* Floating phone mockup - bigger */}
            <div 
              className="relative inline-block animate-float"
              style={{ 
                filter: "drop-shadow(0 50px 100px rgba(0,0,0,0.7)) drop-shadow(0 20px 40px rgba(240,180,0,0.15))",
              }}
            >
              <div className="relative rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden border-2 border-white/10 bg-black/30 backdrop-blur-sm transform hover:scale-[1.02] transition-transform duration-500">
                <img 
                  src="/images/hero-login.png" 
                  alt="Thalos login screen"
                  className="w-[280px] sm:w-[340px] md:w-[400px] lg:w-[440px] h-auto"
                />
              </div>
            </div>
            
            <p className="mt-10 text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
              {content.imageCaption1}
            </p>
            <div className="mt-3 h-1 w-20 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
          </div>
        </div>

        {/* Page 3: Dashboard Image - Floating effect, bigger */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-4 transition-all duration-500 ease-out"
          style={{
            opacity: currentPage === 2 ? 1 : 0,
            transform: currentPage === 2 ? "translateY(0) scale(1)" : currentPage < 2 ? "translateY(50px) scale(0.9)" : "translateY(-50px) scale(0.9)",
            pointerEvents: currentPage === 2 ? "auto" : "none",
          }}
        >
          <div className="text-center">
            {/* Floating phone mockup - bigger */}
            <div 
              className="relative inline-block animate-float"
              style={{ 
                filter: "drop-shadow(0 50px 100px rgba(0,0,0,0.7)) drop-shadow(0 20px 40px rgba(240,180,0,0.15))",
                animationDelay: "0.5s"
              }}
            >
              <div className="relative rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden border-2 border-white/10 bg-black/30 backdrop-blur-sm transform hover:scale-[1.02] transition-transform duration-500">
                <img 
                  src="/images/hero-dashboard.png" 
                  alt="Thalos agreements dashboard"
                  className="w-[280px] sm:w-[340px] md:w-[400px] lg:w-[440px] h-auto"
                />
              </div>
            </div>
            
            <p className="mt-10 text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
              {content.imageCaption2}
            </p>
            <div className="mt-3 h-1 w-20 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
          </div>
        </div>

        {/* Page 4: Video - Horizontal, medium size */}
        <div 
          className="absolute inset-0 flex items-center justify-center px-4 sm:px-6 transition-all duration-500 ease-out"
          style={{
            opacity: currentPage === 3 ? 1 : 0,
            transform: currentPage === 3 ? "translateY(0) scale(1)" : currentPage < 3 ? "translateY(50px) scale(0.9)" : "translateY(-50px) scale(0.9)",
            pointerEvents: currentPage === 3 ? "auto" : "none",
          }}
        >
          <div className="text-center w-full max-w-2xl mx-auto">
            {/* Video container - horizontal 16:9, medium size */}
            <div 
              className="relative inline-block w-full"
              style={{ 
                filter: "drop-shadow(0 50px 100px rgba(0,0,0,0.7)) drop-shadow(0 20px 40px rgba(240,180,0,0.15))",
              }}
            >
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-white/10 bg-black">
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
            
            <p className="mt-10 text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
              {content.videoCaption}
            </p>
            <div className="mt-3 h-1 w-20 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
          </div>
        </div>

        {/* Page 5: Final - Trust message */}
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
            <div className="relative inline-flex items-center justify-center mb-10">
              <div className="absolute inset-0 bg-[#f0b400]/20 blur-3xl rounded-full scale-150" />
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#f0b400]/10 border-2 border-[#f0b400]/30 flex items-center justify-center">
                <svg className="w-12 h-12 sm:w-14 sm:h-14 text-[#f0b400]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight">
              {content.finalHeadline}
            </h2>
            <p className="mt-6 text-xl sm:text-2xl text-white/60 font-medium">
              {content.finalSubheadline}
            </p>
          </div>
        </div>

        {/* Page indicators */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => {
                const vh = window.innerHeight
                const scrollPerPage = vh * 0.55
                window.scrollTo({ top: i * scrollPerPage, behavior: "smooth" })
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                currentPage === i 
                  ? "bg-[#f0b400] w-6" 
                  : "bg-white/20 hover:bg-white/40"
              }`}
              aria-label={`Go to page ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Spacer at the end to prevent collision */}
      <div className="absolute bottom-0 left-0 right-0 h-40" />

      {/* CSS for floating animation */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
      `}</style>
    </section>
  )
}
