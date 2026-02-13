"use client"

import Image from "next/image"
import Link from "next/link"
import { useLanguage, LanguageToggle } from "@/lib/i18n"

const founders = [
  { name: "Leandro Masotti", role: "Co-Founder", github: "https://github.com/leandromasotti", avatar: "https://github.com/leandromasotti.png" },
  { name: "Franco Kalchaqui", role: "Co-Founder", github: "https://github.com/Kalchaqui", avatar: "https://github.com/Kalchaqui.png" },
  { name: "Manuel JG", role: "Co-Founder", github: "https://github.com/ManuelJG1999", avatar: "https://github.com/ManuelJG1999.png" },
]

const features = [
  { title: "Smart Contract Escrow", desc: "Funds locked until conditions are met. Milestone-based release. Non-custodial wallet interaction." },
  { title: "On-Chain Reputation", desc: "Reputation score linked to wallet. Historical transparency. Trust signals for counterparties." },
  { title: "Role-Based Dashboards", desc: "Personal and Enterprise views with active contracts, escrow status, milestone progress and payment history." },
  { title: "Wallet Authentication", desc: "Sign-in with Stellar wallet. No email dependency. Cryptographic identity verification." },
  { title: "Dispute Resolution", desc: "Optional neutral arbitrator logic. Multi-signature resolution flows. Escrow freeze and review." },
  { title: "Crypto Abstraction", desc: "Users interact with secure payments and locked funds, not blockchain jargon. Intuitive UX for everyone." },
]

const techStack = [
  { category: "Frontend", items: ["Next.js (App Router)", "TypeScript", "TailwindCSS", "ShadCN UI"] },
  { category: "Blockchain", items: ["Stellar Network", "Soroban Smart Contracts", "Freighter Wallet"] },
  { category: "Backend", items: ["Node.js", "API Routes (Next.js)", "PostgreSQL"] },
  { category: "Infrastructure", items: ["Vercel Deployment", "Stellar RPC", "Wallet Abstraction Layer"] },
]

export default function AboutPage() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0c]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/thalos-icon.png" alt="Thalos" width={40} height={40} className="h-10 w-10 object-contain" />
            <span className="text-sm font-bold text-foreground/80">Thalos</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground">
              {t("nav.howItWorks")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16">
        {/* Vision & Mission */}
        <section className="mb-20">
          <div className="mb-4 inline-block rounded-full border border-[#f0b400]/20 bg-[#f0b400]/5 px-4 py-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-[#f0b400]">Vision & Mission</span>
          </div>

          <div className="grid gap-10 md:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-8">
              <h2 className="mb-4 text-2xl font-bold text-[#f0b400]">Vision</h2>
              <p className="mb-4 text-sm leading-relaxed text-foreground/70">
                To become the foundational trust infrastructure for digital commerce, enabling secure, programmable agreements between anyone in the world without centralized control.
              </p>
              <p className="text-sm leading-relaxed text-foreground/50">
                Thalos aims to redefine online work and digital transactions by making trust programmable, transparent, and globally accessible.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-8">
              <h2 className="mb-4 text-2xl font-bold text-[#f0b400]">Mission</h2>
              <p className="mb-4 text-sm leading-relaxed text-foreground/70">
                To remove trust barriers in peer-to-peer commerce by providing decentralized escrow, on-chain reputation, and frictionless crypto-native payment infrastructure.
              </p>
              <p className="text-sm leading-relaxed text-foreground/50">
                We empower freelancers, creators, and businesses to transact securely without platform dependency, excessive fees, or custodial risk.
              </p>
            </div>
          </div>
        </section>

        {/* What is Thalos */}
        <section className="mb-20">
          <div className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">About</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold">What is Thalos?</h2>
          <p className="mb-4 text-sm leading-relaxed text-foreground/70">
            Thalos is a decentralized escrow and trust infrastructure built on Stellar that enables secure, milestone-based payments between freelancers, creators, and businesses without relying on traditional intermediaries.
          </p>
          <p className="mb-4 text-sm leading-relaxed text-foreground/60">
            Thalos solves the trust problem in digital transactions by locking funds on-chain until predefined conditions are met. It combines smart-contract-based escrow, identity verification, and on-chain reputation to reduce fraud, disputes, and payment delays.
          </p>
          <p className="text-sm leading-relaxed text-foreground/50">
            Unlike traditional freelance platforms that extract high fees and control user data, Thalos is non-custodial, transparent, and programmable.
          </p>
        </section>

        {/* Product Objective */}
        <section className="mb-20">
          <div className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Objective</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold">Product Objective</h2>
          <p className="mb-6 text-sm leading-relaxed text-foreground/70">
            Eliminate trust friction in peer-to-peer digital commerce by replacing centralized intermediaries with programmable escrow contracts on Stellar.
          </p>
          <ul className="flex flex-col gap-3">
            {[
              "Prevent payment fraud and non-payment in freelance and service agreements.",
              "Enable milestone-based conditional payments.",
              "Provide verifiable on-chain reputation.",
              "Reduce fees compared to centralized platforms.",
              "Make crypto-native payments intuitive for non-crypto users.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground/60">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f0b400]" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Features */}
        <section className="mb-20">
          <div className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Features</span>
          </div>
          <h2 className="mb-6 text-3xl font-bold">Product Features</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {features.map((f, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-6">
                <h3 className="mb-2 text-sm font-bold text-foreground/90">{f.title}</h3>
                <p className="text-xs leading-relaxed text-foreground/50">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack */}
        <section className="mb-20">
          <div className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Tech Stack</span>
          </div>
          <h2 className="mb-6 text-3xl font-bold">Technology</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {techStack.map((cat, i) => (
              <div key={i} className="rounded-xl border border-white/8 bg-white/[0.02] p-6">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-[#f0b400]">{cat.category}</h3>
                <ul className="flex flex-col gap-2">
                  {cat.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-foreground/60">
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="mb-20">
          <div className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Team</span>
          </div>
          <h2 className="mb-6 text-3xl font-bold">Founders</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {founders.map((f, i) => (
              <a key={i} href={f.github} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-8 transition-all duration-300 hover:border-[#f0b400]/20 hover:bg-[#f0b400]/5">
                <Image src={f.avatar} alt={f.name} width={80} height={80} className="h-20 w-20 rounded-full border-2 border-white/10 object-cover transition-all duration-300 group-hover:border-[#f0b400]/30" unoptimized />
                <div className="text-center">
                  <p className="text-sm font-bold text-foreground/90">{f.name}</p>
                  <p className="text-xs text-foreground/40">{f.role}</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-foreground/30 transition-colors group-hover:text-[#f0b400]/60">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  GitHub
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Partners */}
        <section className="mb-10">
          <div className="mb-4 inline-block rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Partners</span>
          </div>
          <h2 className="mb-6 text-3xl font-bold">Built With</h2>
          <div className="flex flex-wrap gap-4">
            <a href="https://stellar.org/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-6 py-4 transition-all hover:border-white/15 hover:bg-white/[0.04]">
              <Image src="/stellar-full.png" alt="Stellar" width={28} height={28} className="h-7 w-7 object-contain" />
              <span className="text-sm font-semibold text-foreground/70">Stellar Network</span>
            </a>
            <a href="https://www.trustlesswork.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-6 py-4 transition-all hover:border-white/15 hover:bg-white/[0.04]">
              <Image src="/trustless-logo.png" alt="Trustless Work" width={28} height={28} className="h-7 w-7 object-contain" />
              <span className="text-sm font-semibold text-foreground/70">Trustless Work</span>
            </a>
            <a href="https://github.com/Thalos-Infrastructure" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.02] px-6 py-4 transition-all hover:border-white/15 hover:bg-white/[0.04]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-foreground/60"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              <span className="text-sm font-semibold text-foreground/70">GitHub</span>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0a0a0c] py-6">
        <p className="text-center text-xs text-muted-foreground/30">&copy; {new Date().getFullYear()} Thalos Infrastructure. All rights reserved.</p>
      </footer>
    </div>
  )
}
