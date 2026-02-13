"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useLanguage, LanguageToggle } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Footer } from "@/components/footer"

const founders = [
  { name: "Leandro Masotti", role: "Co-Founder & CEO", github: "https://github.com/leandromasotti", avatar: "https://github.com/leandromasotti.png" },
  { name: "Franco Kalchaqui", role: "Co-Founder & CTO", github: "https://github.com/Kalchaqui", avatar: "https://github.com/Kalchaqui.png" },
  { name: "Manuel JG", role: "Co-Founder & CPO", github: "https://github.com/ManuelJG1999", avatar: "https://github.com/ManuelJG1999.png" },
]

const techStack = [
  { category: "Frontend", items: ["Next.js (App Router)", "TypeScript", "TailwindCSS", "ShadCN UI"] },
  { category: "Blockchain", items: ["Stellar Network", "Soroban Smart Contracts", "Freighter Wallet"] },
  { category: "Backend", items: ["Node.js", "API Routes (Next.js)", "PostgreSQL"] },
  { category: "Infrastructure", items: ["Vercel Deployment", "Stellar RPC", "Wallet Abstraction Layer"] },
]

function RevealSection({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.15 }
    )
    obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-[900ms] ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  )
}

export default function AboutPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=2560&q=90&auto=format&fit=crop')" }} />
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Header - same as landing */}
      <header className={cn(
        "sticky top-0 z-50 border-b border-white/[0.06]",
        "bg-gradient-to-b from-[#111113] via-[#0e0e10] to-[#0a0a0c]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_4px_20px_rgba(0,0,0,0.5)]"
      )}>
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center">
            <Image src="/thalos-icon.png" alt="Thalos" width={72} height={72} className="h-16 w-16 object-contain" />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button size="sm" className="rounded-full bg-white px-7 py-2 text-base text-background font-bold shadow-[0_2px_12px_rgba(255,255,255,0.12)] hover:bg-[#b0c4de] hover:text-background transition-all duration-400">
                Home
              </Button>
            </Link>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-6 py-20">

        {/* Vision & Mission */}
        <RevealSection className="mb-24">
          <div className="grid gap-12 md:grid-cols-2">
            <div>
              <h2 className="mb-6 text-4xl font-bold text-[#f0b400] md:text-5xl">Vision</h2>
              <p className="mb-4 text-base leading-relaxed text-white/70">
                To become the foundational trust infrastructure for digital commerce, enabling secure, programmable agreements between anyone in the world without centralized control.
              </p>
              <p className="text-sm leading-relaxed text-white/45">
                Thalos aims to redefine online work and digital transactions by making trust programmable, transparent, and globally accessible.
              </p>
            </div>
            <div>
              <h2 className="mb-6 text-4xl font-bold text-[#f0b400] md:text-5xl">Mission</h2>
              <p className="mb-4 text-base leading-relaxed text-white/70">
                To remove trust barriers in peer-to-peer commerce by providing decentralized escrow, on-chain reputation, and frictionless crypto-native payment infrastructure.
              </p>
              <p className="text-sm leading-relaxed text-white/45">
                We empower freelancers, creators, and businesses to transact securely without platform dependency, excessive fees, or custodial risk.
              </p>
            </div>
          </div>
        </RevealSection>

        {/* Separator */}
        <div className="mx-auto mb-24 h-px w-32 bg-gradient-to-r from-transparent via-[#f0b400]/30 to-transparent" />

        {/* What is Thalos */}
        <RevealSection className="mb-24">
          <h2 className="mb-6 text-4xl font-bold md:text-5xl">What is Thalos?</h2>
          <p className="mb-6 text-base leading-relaxed text-white/70">
            A decentralized escrow and trust infrastructure built on Stellar that enables secure, milestone-based payments between freelancers, creators, and businesses without relying on traditional intermediaries.
          </p>
          <p className="mb-6 text-sm leading-relaxed text-white/50">
            Thalos solves the trust problem in digital transactions by locking funds on-chain until predefined conditions are met. It combines smart-contract-based escrow, identity verification, and on-chain reputation to reduce fraud, disputes, and payment delays.
          </p>
          <p className="text-sm leading-relaxed text-white/40">
            Unlike traditional freelance platforms that extract high fees and control user data, Thalos is non-custodial, transparent, and programmable.
          </p>
        </RevealSection>

        {/* Separator */}
        <div className="mx-auto mb-24 h-px w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Product Objective */}
        <RevealSection className="mb-24">
          <h2 className="mb-6 text-4xl font-bold md:text-5xl">Product Objective</h2>
          <p className="mb-8 text-base leading-relaxed text-white/70">
            Eliminate trust friction in peer-to-peer digital commerce by replacing centralized intermediaries with programmable escrow contracts on Stellar.
          </p>
          <ul className="flex flex-col gap-4">
            {[
              "Prevent payment fraud and non-payment in freelance and service agreements.",
              "Enable milestone-based conditional payments.",
              "Provide verifiable on-chain reputation.",
              "Reduce fees compared to centralized platforms.",
              "Make crypto-native payments intuitive for non-crypto users.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-4 text-sm text-white/55">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#f0b400]" />
                {item}
              </li>
            ))}
          </ul>
        </RevealSection>

        {/* Separator */}
        <div className="mx-auto mb-24 h-px w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Key Capabilities */}
        <RevealSection className="mb-24">
          <h2 className="mb-6 text-4xl font-bold md:text-5xl">Key Capabilities</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { title: "Smart Contract Escrow", desc: "Funds locked until conditions are met. Milestone-based release. Non-custodial wallet interaction." },
              { title: "On-Chain Reputation", desc: "Reputation score linked to wallet. Historical transparency. Trust signals for counterparties." },
              { title: "Role-Based Dashboards", desc: "Personal and Enterprise views with active contracts, escrow status, milestone progress and payment history." },
              { title: "Wallet Authentication", desc: "Sign-in with Stellar wallet. No email dependency. Cryptographic identity verification." },
              { title: "Dispute Resolution", desc: "Optional neutral arbitrator logic. Multi-signature resolution flows. Escrow freeze and review." },
              { title: "Crypto Abstraction", desc: "Users interact with secure payments and locked funds, not blockchain jargon. Intuitive UX for everyone." },
            ].map((f, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/[0.03] p-6">
                <h3 className="mb-2 text-sm font-bold text-white/90">{f.title}</h3>
                <p className="text-xs leading-relaxed text-white/45">{f.desc}</p>
              </div>
            ))}
          </div>
        </RevealSection>

        {/* Separator */}
        <div className="mx-auto mb-24 h-px w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Technology */}
        <RevealSection className="mb-24">
          <h2 className="mb-6 text-4xl font-bold md:text-5xl">Technology</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {techStack.map((cat, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/[0.03] p-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#f0b400]">{cat.category}</h3>
                <ul className="flex flex-col gap-2">
                  {cat.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-white/55">
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </RevealSection>

        {/* Separator */}
        <div className="mx-auto mb-24 h-px w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Founders */}
        <RevealSection className="mb-24">
          <h2 className="mb-8 text-4xl font-bold md:text-5xl">Founders</h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {founders.map((f, i) => (
              <a key={i} href={f.github} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-8 transition-all duration-300 hover:border-[#f0b400]/20 hover:bg-[#f0b400]/5">
                <Image src={f.avatar} alt={f.name} width={80} height={80} className="h-20 w-20 rounded-full border-2 border-white/10 object-cover transition-all duration-300 group-hover:border-[#f0b400]/30" unoptimized />
                <div className="text-center">
                  <p className="text-sm font-bold text-white/90">{f.name}</p>
                  <p className="text-xs text-white/40">{f.role}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-white/25 transition-colors group-hover:text-[#f0b400]/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  GitHub
                </div>
              </a>
            ))}
          </div>
        </RevealSection>

        {/* Separator */}
        <div className="mx-auto mb-24 h-px w-32 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Built With */}
        <RevealSection className="mb-10">
          <h2 className="mb-8 text-4xl font-bold md:text-5xl">Built With</h2>
          <div className="flex flex-wrap gap-4">
            <a href="https://stellar.org/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-6 py-4 transition-all hover:border-white/15 hover:bg-white/[0.06]">
              <Image src="/stellar-full.png" alt="Stellar" width={28} height={28} className="h-7 w-7 object-contain" />
              <span className="text-sm font-semibold text-white/70">Stellar Network</span>
            </a>
            <a href="https://www.trustlesswork.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-6 py-4 transition-all hover:border-white/15 hover:bg-white/[0.06]">
              <Image src="/trustless-logo.png" alt="Trustless Work" width={28} height={28} className="h-7 w-7 object-contain" />
              <span className="text-sm font-semibold text-white/70">Trustless Work</span>
            </a>
            <a href="https://github.com/Thalos-Infrastructure" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-6 py-4 transition-all hover:border-white/15 hover:bg-white/[0.06]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-white/60"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              <span className="text-sm font-semibold text-white/70">GitHub</span>
            </a>
          </div>
        </RevealSection>

      </main>

      {/* Footer - reuse main footer */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  )
}
