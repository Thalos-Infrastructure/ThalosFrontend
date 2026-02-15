"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useSectionReveal } from "@/hooks/use-section-reveal"
import { useTypewriter } from "@/hooks/use-typewriter"

const faqs = [
  {
    q: "What is Thalos?",
    a: "Thalos is a decentralized escrow and trust infrastructure built on the Stellar network. It enables secure, programmable, milestone-based payments between individuals, entrepreneurs, and businesses without relying on traditional intermediaries.",
  },
  {
    q: "How does the escrow work?",
    a: "When an agreement is created, funds are locked in a Stellar smart contract. They are only released when predefined conditions are met, such as milestone completion, delivery confirmation, or mutual approval between parties.",
  },
  {
    q: "What is USDC and why does Thalos use it?",
    a: "USDC is a dollar-pegged stablecoin. Thalos uses USDC on Stellar for fast, low-cost settlements with price stability, eliminating the volatility risk associated with other cryptocurrencies.",
  },
  {
    q: "Do I need a crypto wallet to use Thalos?",
    a: "Yes. Thalos integrates with Stellar wallets like Freighter or Albedo. You can connect your existing wallet or create one during the onboarding process.",
  },
  {
    q: "Is Thalos safe?",
    a: "Funds are secured by Stellar smart contracts and are never held by Thalos itself. The escrow logic is trustless, meaning no single party can unilaterally move funds without meeting the agreed conditions.",
  },
  {
    q: "What industries can use Thalos?",
    a: "Thalos applies to any scenario with counterparty risk: real estate, freelancing, import/export, agriculture, events, software development, automotive sales, education, construction, and more.",
  },
  {
    q: "How fast are settlements?",
    a: "Stellar settles transactions in approximately 5 seconds with near-zero fees, making Thalos significantly faster and cheaper than traditional escrow or wire transfers.",
  },
  {
    q: "Can businesses integrate Thalos into their platforms?",
    a: "Yes. Thalos offers API access for businesses and marketplaces to embed programmable escrow directly into their workflows, creating custom payment flows at scale.",
  },
]

function FAQItem({ q, a, open, toggle }: { q: string; a: string; open: boolean; toggle: () => void }) {
  return (
    <div className="border-b border-white/8">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between py-5 text-left transition-colors"
      >
        <span className="text-base font-semibold text-foreground pr-4">{q}</span>
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={cn("shrink-0 text-[#f0b400] transition-transform duration-300", open && "rotate-45")}
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
      <div
        className="overflow-hidden transition-all duration-400"
        style={{ maxHeight: open ? "300px" : "0px", opacity: open ? 1 : 0 }}
      >
        <p className="pb-5 text-sm font-medium leading-relaxed text-white/50">{a}</p>
      </div>
    </div>
  )
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const { ref, isVisible } = useSectionReveal()
  const { displayed: twText, isTyping: twActive } = useTypewriter("[FAQ]", isVisible, { typeSpeed: 120, deleteSpeed: 60, pauseBeforeDelete: 2500, pauseBeforeType: 800 })

  return (
    <section className="relative py-28" ref={ref}>
      <div className={cn("mx-auto max-w-3xl px-6 section-reveal", isVisible && "is-visible")}>
        {/* Header */}
        <div className="mb-14 text-center">
          <p className="mb-3 text-base font-bold uppercase tracking-wider text-[#f0b400] md:text-lg">
            <span>{twText}</span>
            <span className={cn("ml-0.5 inline-block h-4 w-0.5 bg-[#f0b400] align-middle", twActive ? "animate-pulse" : "opacity-0")} />
          </p>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl text-balance">
            Frequently Asked Questions
          </h2>
        </div>

        {/* FAQ accordion */}
        <div className="rounded-2xl border border-white/8 bg-card/30 px-6 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.04)]">
          {faqs.map((faq, i) => (
            <FAQItem
              key={faq.q}
              q={faq.q}
              a={faq.a}
              open={openIndex === i}
              toggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
