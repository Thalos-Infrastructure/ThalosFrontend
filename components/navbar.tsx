"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { useLanguage, LanguageToggle, ThemeToggle } from "@/lib/i18n"
import { SocialAuthModal } from "@/components/social-auth-modal"

const useCaseCategories = {
  en: [
    { label: "Digital Economy", items: ["Freelancers", "Agencies", "Developers", "Creators"] },
    { label: "Commerce & Trade", items: ["Import/Export", "Wholesale", "Marketplaces"] },
    { label: "Real Estate", items: ["Property Sales", "Rental Agreements", "Leasing"] },
    { label: "Automotive", items: ["Dealerships", "Peer-to-Peer Sales", "Rentals"] },
    { label: "Events & Services", items: ["Event Planners", "Weddings", "Catering"] },
    { label: "Education", items: ["Online Academies", "Coaching", "Tutors"] },
    { label: "Agriculture", items: ["Crop Pre-Sales", "Equipment Leasing"] },
    { label: "Construction", items: ["Contractor Agreements", "Subcontractors"] },
    { label: "Tourism", items: ["Travel Agencies", "Vacation Rentals", "Tours"] },
    { label: "Enterprise", items: ["Vendor Agreements", "B2B Services"] },
  ],
  es: [
    { label: "Economía Digital", items: ["Freelancers", "Agencias", "Desarrolladores", "Creadores"] },
    { label: "Comercio", items: ["Importación/Exportación", "Mayoristas", "Marketplaces"] },
    { label: "Bienes Raíces", items: ["Venta de Propiedades", "Contratos de Alquiler", "Arrendamiento"] },
    { label: "Automotriz", items: ["Concesionarios", "Ventas P2P", "Alquileres"] },
    { label: "Eventos y Servicios", items: ["Organizadores", "Bodas", "Catering"] },
    { label: "Educación", items: ["Academias Online", "Coaching", "Tutores"] },
    { label: "Agricultura", items: ["Pre-venta de Cosechas", "Alquiler de Equipos"] },
    { label: "Construcción", items: ["Contratos", "Subcontratistas"] },
    { label: "Turismo", items: ["Agencias de Viaje", "Alquileres Vacacionales", "Tours"] },
    { label: "Empresas", items: ["Acuerdos con Proveedores", "Servicios B2B"] },
  ],
}

export function Navbar({ onNavigate }: { onNavigate: (section: string) => void }) {
  const { t, language } = useLanguage()
  const categories = useCaseCategories[language as keyof typeof useCaseCategories] || useCaseCategories.en
  const useCasesLabel = language === "es" ? "Casos de Uso" : "Use Cases"
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState<"login" | "signup" | null>(null)
  const [visible, setVisible] = useState(true)
  const [useCaseOpen, setUseCaseOpen] = useState(false)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const lastScrollY = useRef(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const navLinks = [
    { label: t("nav.howItWorks"), section: "how-it-works" },
    { label: t("nav.solutions"), section: "profiles" },
  ]

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setUseCaseOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      if (y < 100) {
        setVisible(true)
      } else if (y > lastScrollY.current + 8) {
        setVisible(false)
        setMobileOpen(false)
      } else if (y < lastScrollY.current - 8) {
        setVisible(true)
      }
      lastScrollY.current = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])


  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-transform duration-500",
          "bg-[#0c1220]/90 backdrop-blur-xl",
          "shadow-[0_4px_24px_rgba(0,0,0,0.3)]",
          visible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          {/* Logo - static, no rotation */}
          <button
            onClick={() => onNavigate("hero")}
            className="flex items-center"
            aria-label="Go to homepage"
          >
            <Image
              src="/thalos-icon.png"
              alt="Thalos"
              width={72}
              height={72}
              className="h-16 w-16 object-contain"
              priority
            />
          </button>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.slice(0, 2).map((item) => (
              <button
                key={item.section}
                onClick={() => onNavigate(item.section)}
                className="text-base font-bold text-white/70 transition-all duration-300 hover:text-white"
              >
                {item.label}
              </button>
            ))}

            {/* Use Cases dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setUseCaseOpen(!useCaseOpen)}
                className="flex items-center gap-1.5 text-base font-bold text-white/70 transition-all duration-300 hover:text-white"
              >
                {useCasesLabel}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform duration-200", useCaseOpen && "rotate-180")}><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {useCaseOpen && (
                <div className="absolute top-full left-1/2 z-50 mt-3 -translate-x-1/2 w-64 rounded-xl border border-white/15 bg-[#0c0c0e]/95 p-2 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.4)]" style={{ scrollbarWidth: "none" }}>
                  <div className="max-h-[460px] overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                    {categories.map((cat) => (
                      <div key={cat.label}>
                        <button
                          onClick={() => setExpandedCat(expandedCat === cat.label ? null : cat.label)}
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#f0b400]/80 transition-colors hover:bg-white/10 hover:text-[#f0b400]"
                        >
                          {cat.label}
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn("transition-transform duration-200", expandedCat === cat.label && "rotate-180")}><path d="M6 9l6 6 6-6" /></svg>
                        </button>
                        <div className={cn("overflow-hidden transition-all duration-300", expandedCat === cat.label ? "max-h-40 opacity-100" : "max-h-0 opacity-0")}>
                          <div className="flex flex-col pb-1 pl-2">
                            {cat.items.map((item) => (
                              <button
                                key={item}
                                onClick={() => { onNavigate("use-cases"); setUseCaseOpen(false); setExpandedCat(null) }}
                                className="rounded-md px-3 py-1.5 text-left text-xs font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {navLinks.slice(2).map((item) => (
              <button
                key={item.section}
                onClick={() => onNavigate(item.section)}
                className="text-base font-bold text-white/70 transition-all duration-300 hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop: solo botón Login (abre el modal con Google, GitHub, Email y Connect Stellar Wallet) */}
          <div className="hidden items-center gap-3 md:flex">
            <Button
              size="sm"
              onClick={() => setShowAuthModal("login")}
              className="rounded-full border border-[#f0b400]/40 bg-[#f0b400]/10 px-7 py-2 text-base text-[#f0b400] font-bold hover:bg-[#f0b400]/20 hover:border-[#f0b400]/60 transition-all duration-300"
            >
              Login
            </Button>
            <LanguageToggle />
            <ThemeToggle />
          </div>

          {/* Mobile hamburger */}
          <button
            className="flex flex-col gap-1.5 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-5 bg-white transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="bg-[#0c1220]/95 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-1 p-4">
              {navLinks.map((item) => (
                <button
                  key={item.section}
                  onClick={() => { onNavigate(item.section); setMobileOpen(false) }}
                  className="rounded-lg px-4 py-3 text-left text-base font-bold text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </button>
              ))}
              <div className="mt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => { setShowAuthModal("login"); setMobileOpen(false) }}
                  className="flex-1 rounded-full border border-[#f0b400]/40 bg-[#f0b400]/10 text-base font-bold text-[#f0b400] hover:bg-[#f0b400]/20 hover:border-[#f0b400]/60"
                >
                  Login
                </Button>
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </div>
          </div>
        )}
      </header>

      <SocialAuthModal
        open={showAuthModal !== null}
        mode={showAuthModal === "signup" ? "signup" : "login"}
        onClose={() => setShowAuthModal(null)}
      />
    </>
  )
}
