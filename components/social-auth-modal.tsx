"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n"
import { useRouter } from "next/navigation"
// Commented with the render below while Accesly is unmounted (see layout.tsx).
// import { AcceslyAuthModal } from "@/components/accesly-auth-modal";
import { PollarLoginOptions } from "@/components/auth/pollar-login-options"
import { dashboardPathFor } from "@/lib/dashboard-path"
import Image from "next/image"

interface SocialAuthModalProps {
  open: boolean
  onClose: () => void
}

/**
 * There is no login/signup split any more: every provider here signs an
 * existing user in or creates the account on the spot, so the old `mode` prop
 * had nothing left to switch.
 */
export function SocialAuthModal({ open, onClose }: SocialAuthModalProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const [accountType, setAccountType] = useState<"personal" | "enterprise">("personal")
  const [showAccesly, setShowAccesly] = useState(false)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal - Split layout with image on left */}
      <div
        className="relative z-10 flex w-full max-w-[820px] overflow-hidden rounded-2xl border border-white/10 bg-[#0c1220] shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left side - Image */}
        <div className="hidden md:block relative w-[380px] overflow-hidden">
          <Image src="/earth-space.jpg" alt="" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0c1220]/80" />
          <div className="absolute bottom-8 left-8 right-8">
            <p className="text-lg font-semibold text-white mb-1">Secure Digital Agreements</p>
            <p className="text-sm text-white/50 leading-relaxed">
              Protected payments until conditions are verified. Trust built into every transaction.
            </p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="flex-1 p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-1">Welcome to Thalos</h2>
          <p className="text-sm text-white/50 mb-6">Sign in to your account to continue</p>

          {/* Account Type Switch */}
          <div className="mb-6">
            <div className="flex rounded-xl bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setAccountType("personal")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  accountType === "personal"
                    ? "bg-[#f0b400] text-[#0c1220]"
                    : "text-white/50 hover:text-white/70"
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                Personal
              </button>
              <button
                type="button"
                onClick={() => setAccountType("enterprise")}
                className={`flex-1 flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                  accountType === "enterprise"
                    ? "bg-[#f0b400] text-[#0c1220]"
                    : "text-white/50 hover:text-white/70"
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4v18" />
                  <path d="M19 21V11l-6-4" />
                </svg>
                Enterprise
              </button>
            </div>
          </div>

          {/* Every provider goes through Pollar and is driven from here, so
              Pollar's own modal never opens. */}
          <PollarLoginOptions
            accountType={accountType}
            onAuthenticated={(_address, profile) => {
              onClose()
              router.push(dashboardPathFor(profile, accountType))
            }}
            divider={
              <div className="my-2 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-white/30">
                  {t("signin.or")}
                </span>
                <div className="h-px flex-1 bg-white/10" />
              </div>
            }
          >
            {/* Accesly (#109) is hidden, not removed: the passkey login is a
                separate auth system and its own PR owns it. Restore by
                uncommenting — the modal below and its state stay wired.
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAccesly(true)}
              className="h-11 w-full gap-3 rounded-xl border-[#f0b400]/25 bg-transparent text-sm font-medium text-white hover:bg-[#f0b400]/5 hover:border-[#f0b400]/40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5">
                <path d="M12 1a5 5 0 0 0-5 5v4h10V6a5 5 0 0 0-5-5z" />
                <rect x="4" y="10" width="16" height="12" rx="2" />
                <circle cx="12" cy="16" r="1.5" fill="#f0b400" />
              </svg>
              Continue with Accesly (Passkey)
            </Button>
            */}
          </PollarLoginOptions>
        </div>
      </div>

      {/* Accesly passkey login (#109). Unmounted along with the layout's
          ThalosAcceslyProvider: it calls useAccesly(), which throws without
          the provider even while closed. Uncomment together with the provider.
      <AcceslyAuthModal open={showAccesly} onClose={() => setShowAccesly(false)} />
      */}
    </div>
  )
}
