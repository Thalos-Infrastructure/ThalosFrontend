"use client"

import Image from "next/image"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n"
import { useSectionReveal } from "@/hooks/use-section-reveal"
import { cn } from "@/lib/utils"
import { Mail, Github } from "lucide-react"

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  )
}

export function Footer() {
  const { t } = useLanguage()
  const { ref, isVisible } = useSectionReveal(0.05)
  return (
    <footer className="border-t border-white/10 bg-[#0a0a0c]/60 backdrop-blur-xl" ref={ref}>
      <div className={cn("mx-auto max-w-7xl px-6 py-12 section-reveal", isVisible && "is-visible")}>
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          {/* Left: Logo + description + partners */}
          <div className="flex max-w-md flex-col gap-5">
            <div className="flex items-start gap-4">
              <Image src="/thalos-icon.png" alt="Thalos" width={56} height={56} className="h-14 w-14 shrink-0 object-contain" />
              <p className="text-sm font-medium leading-relaxed text-white/60">
                Payments and escrow platform on Stellar. Protected funds, staged payments, and productive capital while retained.
              </p>
            </div>
            
            {/* Partners */}
            <div className="flex items-center gap-5">
              <a href="https://stellar.org/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Built on</span>
                <Image src="/stellar-full.png" alt="Stellar" width={24} height={24} className="h-5 w-5 shrink-0 object-contain opacity-50" />
              </a>
              <div className="h-3.5 w-px bg-white/10" aria-hidden="true" />
              <a href="https://www.trustlesswork.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 transition-opacity hover:opacity-80">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Escrows by</span>
                <Image src="/trustless-logo.png" alt="Trustless Work" width={20} height={20} className="h-4 w-auto object-contain opacity-50" />
              </a>
            </div>
          </div>

          {/* Right: Links in 3 columns */}
          <div className="grid grid-cols-3 gap-10">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#f0b400]">{t("footer.platform")}</p>
              <ul className="flex flex-col gap-2.5">
                <li><a href="#how-it-works" className="text-sm font-medium text-white/60 transition-colors hover:text-white">{t("nav.howItWorks")}</a></li>
                <li><a href="#profiles" className="text-sm font-medium text-white/60 transition-colors hover:text-white">{t("nav.solutions")}</a></li>
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
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#f0b400]">Get in Touch</p>
              {/* 2x2 grid social icons */}
              <div className="grid grid-cols-2 gap-2">
                <a 
                  href="mailto:thalosinfrastructure@gmail.com" 
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all hover:border-[#f0b400]/40 hover:bg-[#f0b400]/10 hover:text-[#f0b400]"
                  aria-label="Email"
                >
                  <Mail className="h-4 w-4" />
                </a>
                <a 
                  href="https://x.com/Thalos_infra" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all hover:border-[#f0b400]/40 hover:bg-[#f0b400]/10 hover:text-[#f0b400]"
                  aria-label="X (Twitter)"
                >
                  <XIcon className="h-4 w-4" />
                </a>
                <a 
                  href="https://www.instagram.com/thalos_platform/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all hover:border-[#f0b400]/40 hover:bg-[#f0b400]/10 hover:text-[#f0b400]"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
                <a 
                  href="https://github.com/Thalos-Infrastructure" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 transition-all hover:border-[#f0b400]/40 hover:bg-[#f0b400]/10 hover:text-[#f0b400]"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <p className="mt-10 text-center text-xs text-white/30">&copy; {new Date().getFullYear()} Thalos Platform. {t("footer.rights")}</p>
      </div>
    </footer>
  )
}
