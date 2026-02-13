"use client"

import React from "react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"

interface SignInPanelProps { open: boolean; onClose: () => void }

export function SignInPanel({ open, onClose }: SignInPanelProps) {
  const { t } = useLanguage()
  const [profileType, setProfileType] = useState<"personal" | "business">("personal")
  const dashboardHref = profileType === "personal" ? "/dashboard/personal" : "/dashboard/business"

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 flex w-full max-w-4xl overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0a0c] shadow-[0_40px_120px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh" }}
      >
        {/* Left - Video */}
        <div className="relative hidden w-[400px] shrink-0 overflow-hidden md:block">
          <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover"
            src="https://cdn.pixabay.com/video/2024/02/20/201243-915266492_large.mp4" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a0a0c]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0c]/90 via-transparent to-[#0a0a0c]/50" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <p className="text-lg font-bold text-white/90 leading-snug text-balance">Protected payments. Productive capital.</p>
            <p className="mt-2 text-xs text-white/40">Escrow infrastructure on Stellar</p>
          </div>
        </div>

        {/* Right - Form */}
        <div className="relative flex flex-1 flex-col justify-center overflow-y-auto px-8 py-10 md:px-10">
          <button onClick={onClose} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-white/30 hover:bg-white/8 hover:text-white transition-colors" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("signin.welcome")}</h2>
            <p className="mt-2 text-sm text-white/35">{t("signin.desc")}</p>
          </div>

          <div className="mb-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/25">{t("signin.accountType")}</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "personal" as const, label: t("signin.personal"), icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                { id: "business" as const, label: t("signin.enterprise"), icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg> },
              ]).map((type) => (
                <button key={type.id} onClick={() => setProfileType(type.id)}
                  className={cn("flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300",
                    profileType === type.id ? "border-[#f0b400]/30 bg-[#f0b400]/8 text-[#f0b400]" : "border-white/[0.06] bg-white/[0.02] text-white/40 hover:border-white/12 hover:text-white/70"
                  )}>{type.icon}{type.label}</button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Link href={dashboardHref} onClick={onClose}>
              <Button variant="outline" className="h-11 w-full gap-3 rounded-xl border-white/[0.06] bg-white/[0.02] text-sm text-foreground font-semibold hover:bg-white/[0.06] hover:text-white transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {t("signin.google")}
              </Button>
            </Link>
            <Link href={dashboardHref} onClick={onClose}>
              <Button variant="outline" className="h-11 w-full gap-3 rounded-xl border-white/[0.06] bg-white/[0.02] text-sm text-foreground font-semibold hover:bg-white/[0.06] hover:text-white transition-all">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                {t("signin.email")}
              </Button>
            </Link>
          </div>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/[0.05]" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/20">{t("signin.or")}</span>
            <div className="h-px flex-1 bg-white/[0.05]" />
          </div>

          <Link href={dashboardHref} onClick={onClose}>
            <Button variant="outline" className="h-11 w-full gap-3 rounded-xl border-white/[0.06] bg-white/[0.02] text-sm text-foreground font-semibold hover:bg-white/[0.06] hover:text-white transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
              {t("signin.wallet")}
            </Button>
          </Link>

          <div className="mt-7 flex items-center justify-between border-t border-white/[0.04] pt-4">
            <Link href="/admin" onClick={onClose}>
              <button className="flex items-center gap-2 text-xs font-medium text-white/25 hover:text-[#f0b400] transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                {t("signin.admin")}
              </button>
            </Link>
            <p className="text-[10px] text-white/15">{t("signin.secured")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
