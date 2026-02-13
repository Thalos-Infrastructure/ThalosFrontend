"use client"

import React from "react"
import Image from "next/image"
import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { SignInPanel } from "@/components/sign-in-panel"

export function BottomBar({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [showQR, setShowQR] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showSignIn, setShowSignIn] = useState(false)
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
    const timer = setTimeout(() => setIsVisible(true), 2500)
    return () => clearTimeout(timer)
  }, [])

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
    const newX = Math.max(0, Math.min(window.innerWidth - 380, dragStart.current.px + dx))
    const newY = Math.max(40, Math.min(window.innerHeight - 56, dragStart.current.py + dy))
    setPos({ x: newX, y: newY })
  }, [dragging])

  const onPointerUp = useCallback(() => setDragging(false), [])

  return (
    <>
      <SignInPanel open={showSignIn} onClose={() => setShowSignIn(false)} />

      {/* QR Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/80 backdrop-blur-xl" onClick={() => setShowQR(false)}>
          <div className="relative mx-4 w-full max-w-sm rounded-2xl border border-border/20 bg-card p-10 shadow-[0_24px_80px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.06)]" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <p className="mb-6 text-center text-sm font-bold text-foreground">Scan to access Thalos Mobile</p>
            <div className="mx-auto flex h-52 w-52 items-center justify-center rounded-xl bg-white p-3">
              <Image
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent("https://thalos.app/mobile")}&bgcolor=FFFFFF&color=000000&qzone=2&format=png`}
                alt="QR Code to Thalos Mobile"
                width={200}
                height={200}
                className="h-full w-full object-contain"
                unoptimized
              />
            </div>
            <p className="mt-5 text-center text-xs font-semibold text-muted-foreground">thalos.app/mobile</p>
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
        {/* Professional Menu Popup */}
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute bottom-full left-0 mb-3 w-64 overflow-hidden rounded-2xl border border-white/15 shadow-[0_20px_60px_rgba(0,0,0,0.5),0_4px_16px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.12)]"
          >
            {/* Water bg layer */}
            <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('/ocean-bg.png')" }} aria-hidden="true" />
            <div className="absolute inset-0 bg-background/85 backdrop-blur-2xl" aria-hidden="true" />

            <div className="relative z-10 p-3">
              {/* Header */}
              <div className="mb-2 px-3 pt-1 pb-2 border-b border-white/8">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Navigation</p>
              </div>

              {/* Menu items */}
              <div className="flex flex-col gap-0.5 py-1">
                <button
                  onClick={() => { setShowSignIn(true); setShowMenu(false) }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-foreground/80 transition-all duration-300 hover:bg-white/10 hover:text-white shadow-[inset_0_0_0_0_rgba(255,255,255,0)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_3px_rgba(0,0,0,0.2)] active:scale-[0.97]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  Sign In
                </button>

                <button
                  onClick={() => { onNavigate("how-it-works"); setShowMenu(false) }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-foreground/80 transition-all duration-300 hover:bg-white/10 hover:text-white shadow-[inset_0_0_0_0_rgba(255,255,255,0)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_3px_rgba(0,0,0,0.2)] active:scale-[0.97]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
                  </svg>
                  How It Works
                </button>

                <button
                  onClick={() => { onNavigate("profiles"); setShowMenu(false) }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-foreground/80 transition-all duration-300 hover:bg-white/10 hover:text-white shadow-[inset_0_0_0_0_rgba(255,255,255,0)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_3px_rgba(0,0,0,0.2)] active:scale-[0.97]"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                  </svg>
                  Solutions
                </button>
              </div>

              {/* Divider */}
              <div className="my-2 border-t border-white/8" />

              {/* Contact */}
              <a
                href="mailto:thalosinfrastructure@gmail.com"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-foreground/80 transition-all duration-300 hover:bg-white/10 hover:text-white shadow-[inset_0_0_0_0_rgba(255,255,255,0)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_3px_rgba(0,0,0,0.2)] active:scale-[0.97]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/>
                </svg>
                Contact Us
              </a>
            </div>
          </div>
        )}

        {/* The bar itself */}
        <div className="relative flex h-18 items-center gap-4 rounded-full border border-white/15 px-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] overflow-hidden">
          {/* Ocean background visible through */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: "url('/ocean-bg.png')" }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" aria-hidden="true" />

          {/* Menu button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={cn(
              "relative z-10 flex items-center gap-3 rounded-full px-5 py-3 text-base font-bold transition-all duration-300 active:scale-95 shadow-[0_3px_0_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.1)]",
              showMenu
                ? "bg-white/15 text-white"
                : "text-foreground/80 hover:bg-white/8 hover:text-white"
            )}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
            Menu
          </button>

          {/* Separator */}
          <div className="relative z-10 h-6 w-px bg-white/15" aria-hidden="true" />

          {/* THALOS logo -- bigger */}
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
              className="h-16 w-auto object-contain"
            />
          </button>
        </div>
      </div>
    </>
  )
}
