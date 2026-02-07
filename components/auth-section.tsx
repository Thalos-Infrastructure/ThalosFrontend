"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSectionReveal } from "@/hooks/use-section-reveal"

export function AuthSection() {
  const { ref, isVisible } = useSectionReveal()
  const [profileType, setProfileType] = useState<"personal" | "business">("personal")

  const dashboardHref = profileType === "personal" ? "/dashboard/personal" : "/dashboard/business"

  return (
    <section id="auth" className="relative py-28" ref={ref}>
      <div className={cn(
        "mx-auto max-w-md px-6 section-reveal",
        isVisible && "is-visible"
      )}>
        <div className="mb-10 text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-wider text-[#e6b800]">
            Get Started
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground text-balance">
            Sign In to Build
          </h2>
          <p className="font-medium text-muted-foreground text-pretty">
            Choose your profile type and start assembling your payment platform.
          </p>
        </div>

        <div className="rounded-2xl border border-border/20 bg-card/40 p-8 backdrop-blur-sm shadow-[0_8px_40px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]">
          {/* Profile Type Selector */}
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
                    "rounded-xl border p-3 text-sm font-semibold transition-all duration-400",
                    profileType === type.id
                      ? "border-[#e6b800]/25 bg-[#e6b800]/10 text-[#e6b800] shadow-[0_2px_12px_rgba(230,184,0,0.12),inset_0_1px_0_rgba(255,255,255,0.06)]"
                      : "border-border/20 bg-card/30 text-muted-foreground shadow-[0_1px_4px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[#b0c4de]/30 hover:text-[#b0c4de]"
                  )}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Social Login */}
          <div className="flex flex-col gap-3">
            <Link href={dashboardHref}>
              <Button
                variant="outline"
                className="h-11 w-full gap-3 rounded-xl border-border/20 bg-card/30 text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-[#b0c4de]/10 hover:text-[#b0c4de] hover:border-[#b0c4de]/30 transition-all duration-400"
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
            <Link href={dashboardHref}>
              <Button
                variant="outline"
                className="h-11 w-full gap-3 rounded-xl border-border/20 bg-card/30 text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-[#b0c4de]/10 hover:text-[#b0c4de] hover:border-[#b0c4de]/30 transition-all duration-400"
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

          <Link href={dashboardHref}>
            <Button
              variant="outline"
              className="h-11 w-full gap-3 rounded-xl border-border/20 bg-card/30 text-foreground font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)] hover:bg-[#b0c4de]/10 hover:text-[#b0c4de] hover:border-[#b0c4de]/30 transition-all duration-400"
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
    </section>
  )
}
