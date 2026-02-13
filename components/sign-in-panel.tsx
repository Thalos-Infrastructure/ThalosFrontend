"use client"

import React from "react"
import Link from "next/link"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SignInPanelProps {
  open: boolean
  onClose: () => void
}

export function SignInPanel({ open, onClose }: SignInPanelProps) {
  const [profileType, setProfileType] = useState<"personal" | "business">("personal")
  const dashboardHref = profileType === "personal" ? "/dashboard/personal" : "/dashboard/business"

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex" onClick={onClose}>
      {/* Left: Video */}
      <div className="hidden flex-1 items-center justify-center bg-background/95 lg:flex" onClick={(e) => e.stopPropagation()}>
        <div className="relative w-full max-w-lg px-12">
          <video
            src="/thalos-promo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.5)]"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="hidden w-px bg-white/8 lg:block" aria-hidden="true" />

      {/* Right: Sign In Form */}
      <div
        className="flex w-full flex-col items-center justify-center bg-background/98 backdrop-blur-xl px-6 lg:w-[480px] lg:shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-muted-foreground/50 hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-10">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#f0b400]">Welcome</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Sign In</h2>
            <p className="mt-2 text-sm text-muted-foreground">Access your agreements and protected funds.</p>
          </div>

          {/* Profile type */}
          <div className="mb-8">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Account Type</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "personal" as const, label: "Personal" },
                { id: "business" as const, label: "Enterprise" },
              ]).map((type) => (
                <button
                  key={type.id}
                  onClick={() => setProfileType(type.id)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300",
                    profileType === type.id
                      ? "border-[#f0b400]/30 bg-[#f0b400]/8 text-[#f0b400]"
                      : "border-border/20 bg-card/20 text-muted-foreground hover:border-white/20 hover:text-white"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auth buttons */}
          <div className="flex flex-col gap-3">
            <Link href={dashboardHref} onClick={onClose}>
              <Button
                variant="outline"
                className="h-12 w-full gap-3 rounded-xl border-border/20 bg-card/20 text-sm text-foreground font-semibold hover:bg-white/10 hover:text-white hover:border-white/25 transition-all duration-300"
              >
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </Button>
            </Link>

            <Link href={dashboardHref} onClick={onClose}>
              <Button
                variant="outline"
                className="h-12 w-full gap-3 rounded-xl border-border/20 bg-card/20 text-sm text-foreground font-semibold hover:bg-white/10 hover:text-white hover:border-white/25 transition-all duration-300"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                Continue with Email
              </Button>
            </Link>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">or</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          <Link href={dashboardHref} onClick={onClose}>
            <Button
              variant="outline"
              className="h-12 w-full gap-3 rounded-xl border-border/20 bg-card/20 text-sm text-foreground font-semibold hover:bg-white/10 hover:text-white hover:border-white/25 transition-all duration-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><path d="M1 10h22"/></svg>
              Connect Stellar Wallet
            </Button>
          </Link>

          {/* Footer links */}
          <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-5">
            <Link href="/admin" onClick={onClose}>
              <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground/40 hover:text-[#f0b400] transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Admin Access
              </button>
            </Link>
            <p className="text-[10px] text-muted-foreground/25">Secured by Thalos</p>
          </div>
        </div>
      </div>
    </div>
  )
}
