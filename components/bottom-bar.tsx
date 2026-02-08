"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function BottomBar({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [showQR, setShowQR] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
  const [profileType, setProfileType] = useState<"personal" | "business">("personal")
  const [isVisible, setIsVisible] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Drag state
  const [dragging, setDragging] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [initialized, setInitialized] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, px: 0, py: 0 })

  useEffect(() => {
    if (!initialized && barRef.current) {
      const barW = barRef.current.offsetWidth
      setPos({ x: (window.innerWidth - barW) / 2, y: window.innerHeight - 80 })
      setInitialized(true)
    }
  }, [initialized])

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        barRef.current && !barRef.current.contains(e.target as Node)
      ) {
        setShowMenu(false)
      }
    }
    if (showMenu) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [showMenu])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return
    setDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [pos])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    const newX = Math.max(0, Math.min(window.innerWidth - 340, dragStart.current.px + dx))
    const newY = Math.max(40, Math.min(window.innerHeight - 56, dragStart.current.py + dy))
    setPos({ x: newX, y: newY })
  }, [dragging])

  const onPointerUp = useCallback(() => setDragging(false), [])

  const dashboardHref = profileType === "personal" ? "/dashboard/personal" : "/dashboard/business"

  return (
    <>
      {/* Sign In Modal */}
      {showSignIn && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/70 backdrop-blur-xl" onClick={() => setShowSignIn(false)}>
          <div
            className="relative mx-4 w-full max-w-md rounded-2xl border border-border/20 bg-card/95 p-8 backdrop-blur-sm shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setShowSignIn(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div className="mb-8 text-center">
              <p className="mb-2 text-sm font-bold uppercase tracking-wider text-[#d4a843]">Get Started</p>
              <h3 className="text-2xl font-bold text-foreground">Sign In to Build</h3>
              <p className="mt-2 text-sm font-medium text-muted-foreground">Choose your profile type and start building.</p>
            </div>
            <div className="mb-6">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Profile Type</p>
              <div className="grid grid-cols-2 gap-2">
                {([{ id: "personal", label: "Personal / Retail" }, { id: "business", label: "Business / Enterprise" }] as const).map((type) => (
                  <button key={type.id} onClick={() => setProfileType(type.id)}
                    className={cn("rounded-xl border p-3 text-sm font-semibold transition-all duration-300 shadow-[0_2px_6px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]",
                      profileType === type.id
                        ? "border-[#d4a843]/25 bg-[#d4a843]/10 text-[#d4a843]"
                        : "border-border/20 bg-card/30 text-muted-foreground hover:border-[#b0c4de]/30 hover:text-[#b0c4de]"
                    )}>
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Link href={dashboardHref} onClick={() => setShowSignIn(false)}>
                <Button variant="outline" className="h-11 w-full gap-3 rounded-xl border-border/20 bg-card/30 text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-[#b0c4de]/10 hover:text-[#b0c4de] hover:border-[#b0c4de]/30 transition-all duration-400">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Continue with Google
                </Button>
              </Link>
              <Link href={dashboardHref} onClick={() => setShowSignIn(false)}>
                <Button variant="outline" className="h-11 w-full gap-3 rounded-xl border-border/20 bg-card/30 text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-[#b0c4de]/10 hover:text-[#b0c4de] hover:border-[#b0c4de]/30 transition-all duration-400">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  Continue with Email
                </Button>
              </Link>
            </div>
            <div className="my-6 flex items-center gap-3"><div className="h-px flex-1 bg-border/15" /><span className="text-xs font-medium text-muted-foreground">or</span><div className="h-px flex-1 bg-border/15" /></div>
            <Link href={dashboardHref} onClick={() => setShowSignIn(false)}>
              <Button variant="outline" className="h-11 w-full gap-3 rounded-xl border-border/20 bg-card/30 text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.05)] hover:bg-[#b0c4de]/10 hover:text-[#b0c4de] hover:border-[#b0c4de]/30 transition-all duration-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><path d="M1 10h22"/></svg>
                Connect Stellar Wallet
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-xl" onClick={() => setShowQR(false)}>
          <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-border/20 bg-card p-10 shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <p className="mb-6 text-center text-sm font-bold text-foreground">Scan to access Thalos Mobile</p>
            <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-xl bg-foreground p-3">
              <svg viewBox="0 0 33 33" className="h-full w-full" shapeRendering="crispEdges">
                <rect fill="white" width="33" height="33"/>
                <g fill="#000">
                  <rect x="0" y="0" width="7" height="1"/><rect x="0" y="6" width="7" height="1"/><rect x="0" y="0" width="1" height="7"/><rect x="6" y="0" width="1" height="7"/><rect x="2" y="2" width="3" height="3"/>
                  <rect x="26" y="0" width="7" height="1"/><rect x="26" y="6" width="7" height="1"/><rect x="26" y="0" width="1" height="7"/><rect x="32" y="0" width="1" height="7"/><rect x="28" y="2" width="3" height="3"/>
                  <rect x="0" y="26" width="7" height="1"/><rect x="0" y="32" width="7" height="1"/><rect x="0" y="26" width="1" height="7"/><rect x="6" y="26" width="1" height="7"/><rect x="2" y="28" width="3" height="3"/>
                  <rect x="8" y="6" width="1" height="1"/><rect x="10" y="6" width="1" height="1"/><rect x="12" y="6" width="1" height="1"/><rect x="14" y="6" width="1" height="1"/><rect x="16" y="6" width="1" height="1"/><rect x="18" y="6" width="1" height="1"/><rect x="20" y="6" width="1" height="1"/><rect x="22" y="6" width="1" height="1"/><rect x="24" y="6" width="1" height="1"/>
                  <rect x="6" y="8" width="1" height="1"/><rect x="6" y="10" width="1" height="1"/><rect x="6" y="12" width="1" height="1"/><rect x="6" y="14" width="1" height="1"/><rect x="6" y="16" width="1" height="1"/><rect x="6" y="18" width="1" height="1"/><rect x="6" y="20" width="1" height="1"/><rect x="6" y="22" width="1" height="1"/><rect x="6" y="24" width="1" height="1"/>
                  {Array.from({ length: 19 }, (_, r) => Array.from({ length: 19 }, (_, c) => {
                    const x = 8 + c; const y = 8 + r
                    if (x > 32 || y > 32) return null
                    const hash = (r * 31 + c * 17 + r * c * 7) % 5
                    return hash < 2 ? <rect key={`${r}-${c}`} x={x} y={y} width="1" height="1" /> : null
                  })).flat()}
                </g>
              </svg>
            </div>
            <p className="mt-6 text-center text-xs font-semibold text-muted-foreground">thalos.app/mobile</p>
          </div>
        </div>
      )}

      {/* Floating Draggable Bottom Bar */}
      <div
        ref={barRef}
        className={cn(
          "fixed z-50 select-none transition-opacity duration-700",
          isVisible ? "opacity-100" : "opacity-0 pointer-events-none",
          dragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Professional Menu Popup (opens upward) */}
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute bottom-full left-0 mb-3 w-56 overflow-hidden rounded-2xl border border-white/10 shadow-[0_16px_64px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]"
          >
            {/* Water bg layer */}
            <div className="absolute inset-0 bg-cover bg-center opacity-30" style={{ backgroundImage: "url('/ocean-bg.png')" }} aria-hidden="true" />
            <div className="absolute inset-0 bg-background/80 backdrop-blur-2xl" aria-hidden="true" />

            <div className="relative z-10 p-2">
              <div className="mb-2 px-3 pt-2 pb-1">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Navigation</p>
              </div>
              {[
                { label: "Sign In", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2|M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8", action: () => { setShowSignIn(true); setShowMenu(false) } },
                { label: "How It Works", icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8", action: () => { onNavigate("how-it-works"); setShowMenu(false) } },
                { label: "Solutions", icon: "M12 2L2 7l10 5 10-5-10-5|M2 17l10 5 10-5|M2 12l10 5 10-5", action: () => { onNavigate("profiles"); setShowMenu(false) } },
                { label: "Contact Us", icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z|M22 6l-10 7L2 6", action: () => setShowMenu(false) },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-foreground/80 transition-all duration-300 hover:bg-white/8 hover:text-white active:scale-[0.97]"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon.split("|").map((d, i) =>
                      d.startsWith("M") ? <path key={i} d={d} /> : null
                    )}
                  </svg>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bar with visible water glass effect */}
        <div className="relative flex h-14 items-center gap-4 rounded-full border border-white/12 px-5 shadow-[0_8px_32px_rgba(0,0,0,0.35),0_2px_8px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.12)] overflow-hidden">
          {/* Ocean background visible through */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-25"
            style={{ backgroundImage: "url('/ocean-bg.png')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-background/55 backdrop-blur-xl" aria-hidden="true" />

          {/* Menu button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "relative z-10 flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold transition-all duration-300 active:scale-95 shadow-[0_1px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]",
              showMenu
                ? "bg-white/15 text-white"
                : "text-foreground/70 hover:text-white hover:bg-white/8"
            )}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            Menu
          </button>

          {/* Separator */}
          <div className="relative z-10 h-6 w-px bg-white/15" aria-hidden="true" />

          {/* THALOS logo - bigger */}
          <button
            onClick={() => setShowQR(true)}
            className="relative z-10 flex items-center transition-all duration-300 hover:opacity-80 active:scale-95"
            aria-label="Open mobile QR code"
          >
            <Image
              src="/thalos-text.png"
              alt="Thalos"
              width={200}
              height={50}
              className="h-9 w-auto object-contain"
            />
          </button>
        </div>
      </div>
    </>
  )
}
