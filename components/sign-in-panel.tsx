"use client"

/**
 * The bottom-bar front door. Same login options as the navbar modal — both
 * render <PollarLoginOptions>, which is the point: they used to carry
 * copy-pasted button blocks and had drifted apart (this one never grew the
 * GitHub button the modal had).
 */

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import { PollarLoginOptions } from "@/components/auth/pollar-login-options"
import { dashboardPathFor } from "@/lib/dashboard-path"

interface SignInPanelProps { open: boolean; onClose: () => void }

export function SignInPanel({ open, onClose }: SignInPanelProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [profileType, setProfileType] = useState<"personal" | "business">("personal")

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
        className="relative z-10 flex w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-[#0c1220]/95 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.5),0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh" }}
      >
        {/* Left - Image */}
        <div className="relative hidden w-[45%] md:block">
          <Image
            src="/earth-space.png"
            alt="Earth from space"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0c1220]/90" />
        </div>

        {/* Right - Options */}
        <div className="relative flex flex-1 flex-col justify-center overflow-y-auto px-8 py-10 md:px-10">
          <button onClick={onClose} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-white/30 hover:bg-white/8 hover:text-white transition-colors" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-white">{t("signin.welcome")}</h2>
            <p className="mt-1 text-sm text-white/50">{t("signin.desc")}</p>
          </div>

          <div className="mb-6">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">{t("signin.accountType")}</p>
            <div className="grid grid-cols-2 gap-2">
              {([
                { id: "personal" as const, label: t("signin.personal"), icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                { id: "business" as const, label: t("signin.enterprise"), icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg> },
              ]).map((type) => (
                <button key={type.id} onClick={() => setProfileType(type.id)}
                  className={cn("flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300",
                    profileType === type.id ? "border-[#f0b400]/30 bg-[#f0b400]/10 text-[#f0b400]" : "border-white/15 bg-white/5 text-white/70 hover:border-white/25 hover:text-white"
                  )}>{type.icon}{type.label}</button>
              ))}
            </div>
          </div>

          <PollarLoginOptions
            accountType={profileType === "business" ? "enterprise" : "personal"}
            onAuthenticated={(_address, profile) => {
              onClose()
              router.push(
                dashboardPathFor(profile, profileType === "business" ? "enterprise" : "personal"),
              )
            }}
            divider={
              <div className="my-2 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{t("signin.or")}</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            }
          />

          <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4">
            <Link href="/admin" onClick={onClose}>
              <button className="flex items-center gap-2 text-xs font-medium text-white/40 hover:text-[#f0b400] transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                {t("signin.admin")}
              </button>
            </Link>
            <p className="text-[10px] text-white/25">{t("signin.secured")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
