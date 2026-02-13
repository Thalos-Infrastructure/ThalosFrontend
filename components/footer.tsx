"use client"

import Image from "next/image"
import { useLanguage } from "@/lib/i18n"

export function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="border-t border-white/5 bg-background/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Top row: Thalos left, Resources right */}
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: Logo + tagline + partners */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Image src="/thalos-icon.png" alt="Thalos" width={44} height={44} className="h-9 w-9 shrink-0 object-contain brightness-0 invert" />
              <span className="text-lg font-bold text-foreground tracking-tight">Thalos</span>
            </div>
            <p className="max-w-sm text-sm font-medium leading-relaxed text-muted-foreground/60">
              Payments and escrow infrastructure on Stellar. Protected funds, staged payments, and productive capital while retained.
            </p>
            {/* Partners row below tagline */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Built on</span>
                <Image src="/stellar-full.png" alt="Stellar" width={80} height={20} className="h-4 w-auto object-contain brightness-0 invert opacity-50" />
              </div>
              <div className="h-3.5 w-px bg-white/10" aria-hidden="true" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">Escrows by</span>
                <Image src="/trustless-logo.png" alt="Trustless Work" width={20} height={20} className="h-4 w-auto object-contain opacity-60" />
              </div>
            </div>
          </div>

          {/* Right: Resources */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/50">{t("footer.platform")}</p>
              <ul className="flex flex-col gap-2.5">
                <li><a href="#how-it-works" className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground">{t("nav.howItWorks")}</a></li>
                <li><a href="#profiles" className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground">{t("nav.solutions")}</a></li>
                <li><a href="#builder" className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground">{t("nav.buildFlow")}</a></li>
                <li><a href="#dashboard" className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground">{t("dash.tag")}</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/50">{t("footer.resources")}</p>
              <ul className="flex flex-col gap-2.5">
                <li><a href="https://trustlesswork.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground">Trustless Work</a></li>
                <li><a href="https://stellar.org" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground">Stellar Network</a></li>
                <li><a href="https://x.com/Thalos_infra" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground">{t("footer.followOnX")}</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/50">{t("footer.contact")}</p>
              <ul className="flex flex-col gap-2.5">
                <li><a href="mailto:thalosinfrastructure@gmail.com" className="text-sm font-medium text-muted-foreground/60 transition-colors hover:text-foreground">{t("footer.emailUs")}</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom: socials + copyright */}
        <div className="mt-10 flex items-center justify-between border-t border-white/5 pt-6">
          <div className="flex items-center gap-4">
            <a href="https://x.com/Thalos_infra" target="_blank" rel="noopener noreferrer" className="text-muted-foreground/40 transition-colors hover:text-foreground" aria-label="Follow us on X">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="mailto:thalosinfrastructure@gmail.com" className="text-muted-foreground/40 transition-colors hover:text-foreground" aria-label="Email us">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </a>
          </div>
          <p className="text-xs text-muted-foreground/30">&copy; {new Date().getFullYear()} Thalos Infrastructure. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  )
}
