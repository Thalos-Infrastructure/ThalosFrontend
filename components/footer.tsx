"use client"

import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n"
import { useSectionReveal } from "@/hooks/use-section-reveal"
import { cn } from "@/lib/utils"

export function Footer({ onNavigate }: { onNavigate?: (section: string) => void }) {
  const { t } = useLanguage()
  const { ref, isVisible } = useSectionReveal(0.05)
  
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, section: string) => {
    e.preventDefault()
    if (onNavigate) {
      onNavigate(section)
    } else {
      const el = document.getElementById(section)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }
  return (
    <footer ref={ref}>
      <div className={cn("mx-auto max-w-7xl px-6 py-12 section-reveal", isVisible && "is-visible")}>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: Logo + description + partners */}
          <div className="flex max-w-md flex-col gap-4">
            <div className="flex items-start gap-4">
              <Image src="/thalos-icon.png" alt="Thalos" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
              <p className="text-sm font-medium leading-relaxed text-white/60">
                Payments and escrow platform on Stellar. Protected funds, staged payments, and productive capital while retained.
              </p>
            </div>
            {/* Partners - below description, centered */}
            <div className="flex items-center justify-center gap-5 pl-[72px]">
              <a href="https://stellar.org/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Built on</span>
                <Image src="/stellar-full.png" alt="Stellar" width={48} height={48} className="h-6 w-6 shrink-0 object-contain opacity-60" />
              </a>
              <div className="h-4 w-px bg-white/10" aria-hidden="true" />
              <a href="https://www.trustlesswork.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">Escrows by</span>
                <Image src="/trustless-logo.png" alt="Trustless Work" width={40} height={40} className="h-5 w-auto object-contain opacity-60" />
              </a>
            </div>
          </div>

          {/* Right: Links in 3 columns */}
          <div className="grid grid-cols-3 gap-10">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#f0b400]">{t("footer.platform")}</p>
              <ul className="flex flex-col gap-2.5">
                <li><a href="#how-it-works" onClick={(e) => handleNavClick(e, "how-it-works")} className="text-sm font-medium text-white/60 transition-colors hover:text-white cursor-pointer">{t("nav.howItWorks")}</a></li>
                <li><a href="#profiles" onClick={(e) => handleNavClick(e, "profiles")} className="text-sm font-medium text-white/60 transition-colors hover:text-white cursor-pointer">{t("nav.solutions")}</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#f0b400]">{t("footer.resources")}</p>
              <ul className="flex flex-col gap-2.5">
                <li><a href="https://www.trustlesswork.com/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/60 transition-colors hover:text-white">Trustless Work</a></li>
                <li><a href="https://stellar.org/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/60 transition-colors hover:text-white">Stellar Network</a></li>
                <li><Link href="/about" className="text-sm font-medium text-white/60 transition-colors hover:text-white">{t("footer.visionTeam")}</Link></li>
                <li><a href="https://thalos.gitbook.io/thalos-docs" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/60 transition-colors hover:text-white">{t("footer.documentation")}</a></li>
              </ul>
            </div>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#f0b400]">{t("footer.contact")}</p>
              <ul className="flex flex-col gap-2.5">
                <li><a href="mailto:thalosinfrastructure@gmail.com" className="text-sm font-medium text-white/60 transition-colors hover:text-white">{t("footer.emailUs")}</a></li>
                <li><a href="https://x.com/Thalos_infra" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/60 transition-colors hover:text-white">{t("footer.followOnX")}</a></li>
                <li><a href="https://www.linkedin.com/company/thalos-platform/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/60 transition-colors hover:text-white">LinkedIn</a></li>
                <li><a href="https://www.instagram.com/thalos_platform/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/60 transition-colors hover:text-white">Instagram</a></li>
                <li><a href="https://github.com/Thalos-Infrastructure" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-white/60 transition-colors hover:text-white">GitHub</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <p className="mt-10 text-center text-xs text-white/30">&copy; {new Date().getFullYear()} Thalos Platform. {t("footer.rights")}</p>
      </div>
    </footer>
  )
}
