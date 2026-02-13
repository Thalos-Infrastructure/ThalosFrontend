"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"

interface SignInPanelProps {
  open: boolean
  onClose: () => void
}

export function SignInPanel({ open, onClose }: SignInPanelProps) {
  const { t } = useLanguage()
  const [profileType, setProfileType] = useState<"personal" | "business">("personal")
  const dashboardHref = profileType === "personal" ? "/dashboard/personal" : "/dashboard/business"

  useEffect(() => {
    if (open) { document.body.style.overflow = "hidden" } else { document.body.style.overflow = "" }
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex" onClick={onClose}>
      {/* Left: Video side */}
      <div className="relative hidden flex-1 items-center justify-center overflow-hidden bg-background lg:flex" onClick={(e) => e.stopPropagation()}>
        {/* Subtle Thalos watermark pattern */}
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-16 p-16 opacity-[0.03]" aria-hidden="true">
          {Array.from({ length: 16 }).map((_, i) => (
            <Image key={i} src="/thalos-icon.png" alt="" width={80} height={80} className="h-full w-full object-contain opacity-50" />
          ))}
        </div>
        <div className="relative z-10 w-full max-w-md px-12">
          <video
            src="/thalos-promo.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full rounded-2xl shadow-[0_20px_80px_rgba(0,0,0,0.5)]"
          />
          <p className="mt-6 text-center text-sm font-medium text-muted-foreground/50">
            Protected agreements, powered by Stellar
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="hidden w-px bg-white/6 lg:block" aria-hidden="true" />

      {/* Right: Sign In Form */}
      <div
        className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-background px-6 lg:w-[460px] lg:shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle watermark on mobile (visible when no video) */}
        <div className="absolute inset-0 opacity-[0.02] lg:opacity-[0.015]" aria-hidden="true">
          <div className="grid h-full grid-cols-3 grid-rows-3 gap-12 p-12">
            {Array.from({ length: 9 }).map((_, i) => (
              <Image key={i} src="/thalos-icon.png" alt="" width={60} height={60} className="h-full w-full object-contain opacity-50" />
            ))}
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-muted-foreground/60 transition-all duration-300 hover:bg-white/10 hover:text-foreground"
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div className="relative z-10 w-full max-w-sm">
          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Image src="/thalos-icon.png" alt="Thalos" width={80} height={80} className="h-16 w-auto object-contain" />
          </div>

          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("signin.welcome")}</h2>
            <p className="mt-2 text-sm text-muted-foreground/70">{t("signin.desc")}</p>
          </div>

          {/* Profile type */}
          <div className="mb-7">
            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{t("signin.accountType")}</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "personal" as const, label: t("signin.personal"), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                { id: "business" as const, label: t("signin.enterprise"), icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg> },
              ]).map((type) => (
                <button
                  key={type.id}
                  onClick={() => setProfileType(type.id)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300",
                    profileType === type.id
                      ? "border-[#f0b400]/30 bg-[#f0b400]/8 text-[#f0b400]"
                      : "border-border/20 bg-card/20 text-muted-foreground hover:border-white/20 hover:text-white"
                  )}
                >
                  {type.icon}
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Auth buttons */}
          <div className="flex flex-col gap-2.5">
            <Link href={dashboardHref} onClick={onClose}>
              <Button variant="outline" className="h-11 w-full gap-3 rounded-xl border-border/20 bg-card/20 text-sm text-foreground font-semibold hover:bg-white/10 hover:text-white hover:border-white/25 transition-all duration-300">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {t("signin.google")}
              </Button>
            </Link>
            <Link href={dashboardHref} onClick={onClose}>
              <Button variant="outline" className="h-11 w-full gap-3 rounded-xl border-border/20 bg-card/20 text-sm text-foreground font-semibold hover:bg-white/10 hover:text-white hover:border-white/25 transition-all duration-300">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                {t("signin.email")}
              </Button>
            </Link>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/6" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/30">{t("signin.or")}</span>
            <div className="h-px flex-1 bg-white/6" />
          </div>

          <Link href={dashboardHref} onClick={onClose}>
            <Button variant="outline" className="h-11 w-full gap-3 rounded-xl border-border/20 bg-card/20 text-sm text-foreground font-semibold hover:bg-white/10 hover:text-white hover:border-white/25 transition-all duration-300">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><path d="M1 10h22"/></svg>
              {t("signin.wallet")}
            </Button>
          </Link>

          {/* Footer links */}
          <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4">
            <Link href="/admin" onClick={onClose}>
              <button className="flex items-center gap-2 text-xs font-medium text-muted-foreground/40 hover:text-[#f0b400] transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                {t("signin.admin")}
              </button>
            </Link>
            <p className="text-[10px] text-muted-foreground/20">{t("signin.secured")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
