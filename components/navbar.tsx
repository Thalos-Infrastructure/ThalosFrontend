"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export function Navbar({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [profileType, setProfileType] = useState<"personal" | "business">("personal")
  const [visible, setVisible] = useState(true)
  const lastScrollY = useRef(0)
  const modalRef = useRef<HTMLDivElement>(null)

  const navLinks = [
    { label: "How It Works", section: "how-it-works" },
    { label: "Solutions", section: "profiles" },
    { label: "Create Your Platform", section: "builder" },
  ]

  const dashboardHref = profileType === "personal" ? "/dashboard/personal" : "/dashboard/business"

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

  // Close modal on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowSignIn(false)
      }
    }
    if (showSignIn) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showSignIn])

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 bg-background/40 backdrop-blur-2xl transition-transform duration-500",
          visible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <nav className="mx-auto flex h-24 max-w-7xl items-center justify-between px-6">
          <button
            onClick={() => onNavigate("hero")}
            className="flex items-center"
            aria-label="Go to homepage"
          >
            <Image
              src="/thalos-icon.png"
              alt="Thalos"
              width={250}
              height={250}
              className="h-36 w-auto object-contain"
              priority
            />
          </button>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((item) => (
              <button
                key={item.section}
                onClick={() => onNavigate(item.section)}
                className="text-sm font-semibold text-muted-foreground transition-all duration-300 hover:text-[#b0c4de]"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <Button
              size="sm"
              onClick={() => setShowSignIn(true)}
              className="rounded-full bg-white px-6 text-background font-semibold shadow-[0_2px_12px_rgba(255,255,255,0.15),0_1px_2px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.4)] hover:bg-[#b0c4de] hover:text-background hover:shadow-[0_2px_20px_rgba(176,196,222,0.35),0_1px_2px_rgba(0,0,0,0.3)] transition-all duration-400"
            >
              Sign In
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
                  className="rounded-lg px-4 py-3 text-left text-sm font-semibold text-muted-foreground transition-colors hover:bg-[#b0c4de]/10 hover:text-[#b0c4de]"
                >
                  {item.label}
                </button>
              ))}
              <Button
                size="sm"
                onClick={() => { setShowSignIn(true); setMobileOpen(false) }}
                className="mt-2 rounded-full bg-white text-background font-semibold shadow-[0_2px_12px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.3)] hover:bg-[#b0c4de] hover:text-background"
              >
                Sign In
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Sign In Modal */}
      {showSignIn && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/70 backdrop-blur-xl">
          <div
            ref={modalRef}
            className="relative mx-4 w-full max-w-md rounded-2xl border border-border/20 bg-card/95 p-8 backdrop-blur-sm shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]"
          >
            <button
              onClick={() => setShowSignIn(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>

            <div className="mb-8 text-center">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-[#d4a843]">Get Started</p>
              <h3 className="text-2xl font-bold text-foreground">Sign In to Build</h3>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Choose your profile type and start assembling your payment platform.
              </p>
            </div>

            <div className="mb-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Profile Type</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "personal" as const, label: "Personal / Retail" },
                  { id: "business" as const, label: "Business / Enterprise" },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setProfileType(type.id)}
                    className={cn(
                      "rounded-xl border p-3 text-sm font-semibold transition-all duration-400 shadow-[0_2px_6px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]",
                      profileType === type.id
                        ? "border-[#d4a843]/25 bg-[#d4a843]/10 text-[#d4a843]"
                        : "border-border/20 bg-card/30 text-muted-foreground hover:border-[#b0c4de]/30 hover:text-[#b0c4de]"
                    )}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link href={dashboardHref} onClick={() => setShowSignIn(false)}>
                <Button
                  variant="outline"
                  className="h-11 w-full gap-3 rounded-xl border-border/20 bg-card/30 text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-[#b0c4de]/10 hover:text-[#b0c4de] hover:border-[#b0c4de]/30 transition-all duration-400"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>
              </Link>
              <Link href={dashboardHref} onClick={() => setShowSignIn(false)}>
                <Button
                  variant="outline"
                  className="h-11 w-full gap-3 rounded-xl border-border/20 bg-card/30 text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-[#b0c4de]/10 hover:text-[#b0c4de] hover:border-[#b0c4de]/30 transition-all duration-400"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                  Continue with Email
                </Button>
              </Link>
            </div>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-border/15" />
              <span className="text-xs font-medium text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border/15" />
            </div>

            <Link href={dashboardHref} onClick={() => setShowSignIn(false)}>
              <Button
                variant="outline"
                className="h-11 w-full gap-3 rounded-xl border-border/20 bg-card/30 text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-[#b0c4de]/10 hover:text-[#b0c4de] hover:border-[#b0c4de]/30 transition-all duration-400"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <path d="M1 10h22"/>
                </svg>
                Connect Stellar Wallet
              </Button>
            </Link>
            <p className="mt-3 text-center text-xs font-medium text-muted-foreground">
              Securely connect your wallet to access escrow features.
            </p>
          </div>
        </div>
      )}
    </>
  )
}
