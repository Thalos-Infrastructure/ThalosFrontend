"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { SignInPanel } from "@/components/sign-in-panel"
import { useLanguage, LanguageToggle } from "@/lib/i18n"

export function Navbar({ onNavigate }: { onNavigate: (section: string) => void }) {
  const { t } = useLanguage()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)

  const navLinks = [
    { label: t("nav.howItWorks"), section: "how-it-works" },
    { label: t("nav.solutions"), section: "profiles" },
    { label: t("nav.buildFlow"), section: "builder" },
  ]

  // Hide on scroll down, show on scroll up
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

  // Lock body scroll when panel open
  useEffect(() => {
    if (showSignIn) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [showSignIn])

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/10 backdrop-blur-md transition-transform duration-500",
          visible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <button
            onClick={() => onNavigate("hero")}
            className="group flex items-center [perspective:800px]"
            aria-label="Go to homepage"
          >
            <Image
              src="/thalos-icon.png"
              alt="Thalos"
              width={64}
              height={64}
              className="h-14 w-14 object-contain [transform-style:preserve-3d] transition-transform duration-[1.2s] ease-[cubic-bezier(0.45,0.05,0.55,0.95)] group-hover:[transform:rotateY(360deg)]"
              priority
            />
          </button>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((item) => (
              <button
                key={item.section}
                onClick={() => onNavigate(item.section)}
                className="text-base font-bold text-white/80 transition-all duration-300 hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <LanguageToggle />
            <Button
              size="sm"
              onClick={() => setShowSignIn(true)}
              className="rounded-full bg-white px-7 py-2 text-base text-background font-bold shadow-[0_2px_12px_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] hover:bg-[#b0c4de] hover:text-background hover:shadow-[0_2px_20px_rgba(176,196,222,0.35),0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-400"
            >
              {t("nav.signIn")}
            </Button>
          </div>

          <button
            className="flex flex-col gap-1.5 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-5 bg-foreground transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-foreground transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-foreground transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </nav>

        {mobileOpen && (
          <div className="bg-background/90 backdrop-blur-2xl md:hidden">
            <div className="flex flex-col gap-1 p-4">
              {navLinks.map((item) => (
                <button
                  key={item.section}
                  onClick={() => { onNavigate(item.section); setMobileOpen(false) }}
                  className="rounded-lg px-4 py-3 text-left text-base font-bold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </button>
              ))}
              <div className="mt-2 flex items-center gap-2">
                <LanguageToggle />
                <Button
                  size="sm"
                  onClick={() => { setShowSignIn(true); setMobileOpen(false) }}
                  className="flex-1 rounded-full bg-white text-background font-semibold shadow-[0_2px_12px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:bg-[#b0c4de] hover:text-background"
                >
                  {t("nav.signIn")}
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <SignInPanel open={showSignIn} onClose={() => setShowSignIn(false)} />
    </>
  )
}
