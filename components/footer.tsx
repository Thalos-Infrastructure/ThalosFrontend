"use client"

import Image from "next/image"
import { useLanguage } from "@/lib/i18n"

export function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="border-t border-white/5 bg-background/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: Logo + description + partners */}
          <div className="flex max-w-md flex-col gap-5">
            <div className="flex items-start gap-4">
              <Image src="/thalos-icon.png" alt="Thalos" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
              <p className="text-sm font-medium leading-relaxed text-muted-foreground/60">
                Payments and escrow infrastructure on Stellar. Protected funds, staged payments, and productive capital while retained.
              </p>
            </div>
            {/* Partners */}
            <div className="flex items-center gap-5">
              <a href="https://stellar.org/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Built on</span>
                <Image src="/stellar-full.png" alt="Stellar" width={24} height={24} className="h-5 w-5 shrink-0 object-contain opacity-60" />
              </a>
              <div className="h-3.5 w-px bg-white/10" aria-hidden="true" />
              <a href="https://www.trustlesswork.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Escrows by</span>
                <Image src="/trustless-logo.png" alt="Trustless Work" width={20} height={20} className="h-4 w-auto object-contain opacity-60" />
              </a>
            </div>
          </div>

          {/* Right: Links */}
          <div className="grid grid-cols-3 gap-10">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/50">{t("footer.platform")}</p>
              <ul className="flex flex-col gap-2.5">
                <li><a href="#how-it-works" className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground">{t("nav.howItWorks")}</a></li>
                <li><a href="#profiles" className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground">{t("nav.solutions")}</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/50">{t("footer.resources")}</p>
              <ul className="flex flex-col gap-2.5">
                <li><a href="https://www.trustlesswork.com/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground">Trustless Work</a></li>
                <li><a href="https://stellar.org/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground">Stellar Network</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/50">{t("footer.contact")}</p>
              <ul className="flex flex-col gap-2.5">
                <li><a href="mailto:thalosinfrastructure@gmail.com" className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground">{t("footer.emailUs")}</a></li>
                <li><a href="https://x.com/Thalos_infra" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground">{t("footer.followOnX")}</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright centered, no separate bottom bar */}
        <p className="mt-8 text-center text-xs text-muted-foreground/30">&copy; {new Date().getFullYear()} Thalos Infrastructure. {t("footer.rights")}</p>
      </div>
    </footer>
  )
}
