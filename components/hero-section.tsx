"use client"

import { Button } from "@/components/ui/button"
import { useEffect, useState, useRef, useCallback } from "react"
import { useLanguage } from "@/lib/i18n"
import { ChevronLeft, ChevronRight, Shield, CheckCircle2, ArrowRight } from "lucide-react"

interface HeroSectionProps {
  onNavigate: (section: string) => void
  onIntroComplete?: () => void
}

const LETTERS = ["T", "h", "a", "l", "o", "s"]

// YouTube video ID
const YOUTUBE_VIDEO_ID = "pKIizFs0dO4"

// Content translations
const HERO_CONTENT = {
  en: {
    tagline: "Digital Agreement Platform",
    headline1: "Clear agreements.",
    headline2: "Secure payments.",
    description: "Thalos is a platform where parties define conditions for a transaction and payments are only released when those conditions are verified.",
    features: [
      "Define clear conditions between parties",
      "Funds held securely until conditions met",
      "Transparent verification process",
      "Instant release when approved"
    ],
    cta: "Create Agreement",
    ctaSecondary: "See how it works",
    trustLine: "Trust at every step",
    trustSub: "Every transaction protected. Every agreement honored.",
    slides: [
      { label: "Login", caption: "Start in seconds" },
      { label: "Dashboard", caption: "Manage agreements" },
      { label: "Demo", caption: "See it in action" }
    ]
  },
  es: {
    tagline: "Plataforma de Acuerdos Digitales",
    headline1: "Acuerdos claros.",
    headline2: "Pagos seguros.",
    description: "Thalos es una plataforma donde las partes definen condiciones para una transaccion y los pagos solo se liberan cuando se verifican.",
    features: [
      "Define condiciones claras entre partes",
      "Fondos retenidos hasta cumplir condiciones",
      "Proceso de verificacion transparente",
      "Liberacion instantanea al aprobar"
    ],
    cta: "Crear Acuerdo",
    ctaSecondary: "Ver como funciona",
    trustLine: "Confianza en cada paso",
    trustSub: "Cada transaccion protegida. Cada acuerdo cumplido.",
    slides: [
      { label: "Inicio", caption: "Empieza en segundos" },
      { label: "Panel", caption: "Gestiona acuerdos" },
      { label: "Demo", caption: "Mira como funciona" }
    ]
  }
}

// Slides data
const SLIDES = [
  { type: "image", src: "/images/hero-login.png", alt: "Thalos Login" },
  { type: "image", src: "/images/hero-dashboard.png", alt: "Thalos Dashboard" },
  { type: "video", videoId: YOUTUBE_VIDEO_ID }
]

// Typewriter hook
function useTypewriter(text: string, delay: number = 80) {
  const [displayText, setDisplayText] = useState("")
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    setDisplayText("")
    setIsComplete(false)
    let currentIndex = 0
    
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex))
        currentIndex++
      } else {
        setIsComplete(true)
        clearInterval(interval)
      }
    }, delay)

    return () => clearInterval(interval)
  }, [text, delay])

  return { displayText, isComplete }
}

export function HeroSection({ onNavigate, onIntroComplete }: HeroSectionProps) {
  const { language } = useLanguage()
  const content = HERO_CONTENT[language as keyof typeof HERO_CONTENT] || HERO_CONTENT.en
  
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [letterOpacities, setLetterOpacities] = useState<number[]>([1, 1, 1, 1, 1, 1])
  const containerRef = useRef<HTMLDivElement>(null)
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null)

  const { displayText, isComplete } = useTypewriter(content.headline2, 70)

  // Auto-advance slides (magazine effect - left to right)
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % SLIDES.length)
      }, 4000)
    }
    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current)
    }
  }, [isAutoPlaying])

  // Intro complete callback
  useEffect(() => {
    const t = setTimeout(() => onIntroComplete?.(), 1500)
    return () => clearTimeout(t)
  }, [onIntroComplete])

  // Scroll effect for THALOS letters
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const vh = window.innerHeight
      
      const newOpacities = LETTERS.map((_, i) => {
        const fadeStart = vh * 0.1 + i * vh * 0.05
        const fadeEnd = fadeStart + vh * 0.15
        if (scrollY < fadeStart) return 1
        if (scrollY > fadeEnd) return 0
        return 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart)
      })
      setLetterOpacities(newOpacities)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 8000)
  }

  const nextSlide = () => goToSlide((currentSlide + 1) % SLIDES.length)
  const prevSlide = () => goToSlide((currentSlide - 1 + SLIDES.length) % SLIDES.length)

  return (
    <section id="hero" ref={containerRef} className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/95" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(240,180,0,0.06),transparent_50%)]" />
      
      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '80px 80px'
      }} />

      {/* Vertical THALOS - positioned at bottom half */}
      <div
        className="pointer-events-none absolute right-2 top-[50%] bottom-[10%] z-20 hidden select-none lg:flex lg:flex-col lg:items-end lg:justify-start xl:right-6"
        aria-hidden="true"
      >
        {LETTERS.map((letter, i) => (
          <span
            key={i}
            className="text-[3rem] xl:text-[4rem] 2xl:text-[5rem] font-black tracking-tight leading-[0.8] text-white/[0.03]"
            style={{ opacity: letterOpacities[i], transition: "opacity 150ms ease-out" }}
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Main content - split layout */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="min-h-screen flex items-center py-20 lg:py-0">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center w-full">
            
            {/* Left side - Content */}
            <div className="order-2 lg:order-1 text-center lg:text-left">
              {/* Tagline badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f0b400]/30 bg-[#f0b400]/10 px-4 py-1.5 mb-6 lg:mb-8">
                <Shield className="h-4 w-4 text-[#f0b400]" />
                <span className="text-xs sm:text-sm font-medium text-[#f0b400]">{content.tagline}</span>
              </div>

              {/* Headlines with spacing */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-white leading-[1.1]">
                {content.headline1}
              </h1>
              
              {/* Typewriter headline - more spacing */}
              <div className="mt-3 sm:mt-4 md:mt-5 min-h-[1.2em]">
                <p className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-bold text-[#f0b400]">
                  [{displayText}
                  <span className={`${isComplete ? 'animate-pulse' : ''} opacity-80`}>|</span>]
                </p>
              </div>

              {/* Description - more spacing */}
              <p className="mt-6 sm:mt-8 text-base sm:text-lg text-white/70 leading-relaxed max-w-xl mx-auto lg:mx-0">
                {content.description}
              </p>

              {/* Features list */}
              <ul className="mt-6 sm:mt-8 space-y-2 sm:space-y-3 max-w-xl mx-auto lg:mx-0">
                {content.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80 justify-center lg:justify-start">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-[#f0b400] shrink-0" />
                    <span className="text-sm sm:text-base">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Button
                  onClick={() => onNavigate("sign-in")}
                  className="bg-[#f0b400] text-background hover:bg-[#d4a000] px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold rounded-full shadow-[0_4px_20px_rgba(240,180,0,0.3)] transition-all"
                >
                  {content.cta}
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onNavigate("how-it-works")}
                  className="border-white/20 text-white hover:bg-white/10 px-6 sm:px-8 py-3 text-sm sm:text-base rounded-full"
                >
                  {content.ctaSecondary}
                </Button>
              </div>
            </div>

            {/* Right side - Magazine carousel */}
            <div className="order-1 lg:order-2">
              <div className="relative max-w-lg mx-auto lg:max-w-none">
                {/* Glow effect */}
                <div className="absolute -inset-4 sm:-inset-6 bg-[#f0b400]/8 blur-3xl rounded-3xl" />
                
                {/* Carousel container - horizontal video size */}
                <div className="relative rounded-xl sm:rounded-2xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur-sm shadow-2xl">
                  {/* Slides - horizontal aspect ratio */}
                  <div className="relative aspect-[16/10] sm:aspect-[16/9] overflow-hidden">
                    {SLIDES.map((slide, index) => (
                      <div
                        key={index}
                        className="absolute inset-0 transition-all duration-700 ease-out"
                        style={{
                          transform: `translateX(${(index - currentSlide) * 100}%)`,
                          opacity: index === currentSlide ? 1 : 0,
                        }}
                      >
                        {slide.type === "image" ? (
                          <img
                            src={slide.src}
                            alt={slide.alt}
                            className="w-full h-full object-cover object-center"
                          />
                        ) : (
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${slide.videoId}?autoplay=${currentSlide === index ? 1 : 0}&mute=1&loop=1&playlist=${slide.videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&vq=hd1080`}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            title="Thalos Demo"
                            style={{ border: 0 }}
                          />
                        )}
                      </div>
                    ))}

                    {/* Navigation arrows */}
                    <button
                      onClick={prevSlide}
                      className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-all z-10"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-1.5 sm:p-2 rounded-full bg-black/50 hover:bg-black/70 text-white/80 hover:text-white transition-all z-10"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>

                  {/* Slide indicators with labels */}
                  <div className="flex items-center justify-center gap-2 sm:gap-3 py-3 sm:py-4 bg-black/60">
                    {content.slides.map((slide, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-medium transition-all ${
                          index === currentSlide
                            ? "bg-[#f0b400] text-background"
                            : "bg-white/10 text-white/60 hover:bg-white/20"
                        }`}
                      >
                        <span className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${index === currentSlide ? 'bg-background' : 'bg-white/40'}`} />
                        {slide.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Caption below carousel */}
                <p className="mt-3 sm:mt-4 text-center text-sm sm:text-base text-white/60">
                  {content.slides[currentSlide].caption}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust section - with generous spacing */}
      <div className="relative z-10 py-20 sm:py-24 lg:py-32 border-t border-white/5">
        <div className="mx-auto max-w-3xl px-4 text-center">
          {/* Checkmark icon */}
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#f0b400]/10 border border-[#f0b400]/30 mb-6 sm:mb-8">
            <CheckCircle2 className="h-7 w-7 sm:h-8 sm:w-8 text-[#f0b400]" />
          </div>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            {content.trustLine}
          </h2>
          
          <p className="text-base sm:text-lg md:text-xl text-white/60">
            {content.trustSub}
          </p>
          
          <div className="mt-4 sm:mt-6 h-1 w-16 sm:w-20 mx-auto bg-gradient-to-r from-transparent via-[#f0b400] to-transparent rounded-full" />
        </div>
      </div>

      {/* Bottom spacing before next section */}
      <div className="h-16 sm:h-20 lg:h-24" />
    </section>
  )
}
