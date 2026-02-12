"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSectionReveal } from "@/hooks/use-section-reveal"
import { useTypewriter } from "@/hooks/use-typewriter"

const profiles = [
  {
    id: "personal",
    title: "Personal / Retail",
    description: "Freelancers and individual buyers looking for secure payments and planned installment structures.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    features: ["Freelancer escrows", "Planned payment schedules", "Individual buyer protection", "Yield on idle funds"],
  },
  {
    id: "business",
    title: "Business / Enterprise",
    description: "Companies, marketplaces, and agencies that need to create custom payment platforms at scale.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    features: ["Multi-party escrows", "Travel & marketplace solutions", "API access & integrations", "Custom payment flows"],
  },
]

export function ProfileSelection({ onNavigate }: { onNavigate: (section: string) => void }) {
  const { ref, isVisible } = useSectionReveal()
  const { displayed: twText, isTyping: twActive } = useTypewriter("[Choose Your Path]", isVisible, { typeSpeed: 120, deleteSpeed: 60, pauseBeforeDelete: 2500, pauseBeforeType: 800 })

  return (
    <section id="profiles" className="relative py-28" ref={ref}>
      <div className={cn(
        "mx-auto max-w-7xl px-6 section-reveal",
        isVisible && "is-visible"
      )}>
        <div className="mb-14 text-center">
          <p className="mb-3 text-base font-bold uppercase tracking-wider text-[#f0b400] md:text-lg">
            <span>{twText}</span>
            <span className={cn("ml-0.5 inline-block h-4 w-0.5 bg-[#f0b400] align-middle", twActive ? "animate-pulse" : "opacity-0")} />
          </p>
          <h2 className="mb-4 text-5xl font-bold tracking-tight text-foreground md:text-6xl text-balance">
            Select Your Profile
          </h2>
          <p className="mx-auto max-w-2xl text-base font-medium text-white/55 leading-relaxed text-pretty">
            Whether you are an individual or a business, Thalos adapts to your needs with the right tools and services.
          </p>
        </div>

        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
          {profiles.map((profile, idx) => (
            <div
              key={profile.id}
              className="section-reveal-child group relative flex flex-col rounded-2xl border border-border/20 bg-card/40 p-8 backdrop-blur-sm shadow-[0_8px_32px_rgba(0,0,0,0.3),0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-500 hover:border-[#b0c4de]/25 hover:shadow-[0_8px_36px_rgba(176,196,222,0.08),0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]"
              style={{ transitionDelay: isVisible ? `${idx * 200}ms` : "0ms" }}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0b400]/10 text-[#f0b400]">
                {profile.icon}
              </div>
              <h3 className="mb-2 text-xl font-bold text-foreground">
                {profile.title}
              </h3>
              <p className="mb-6 text-sm font-medium leading-relaxed text-muted-foreground">
                {profile.description}
              </p>
              <ul className="mb-8 flex flex-col gap-2.5">
                {profile.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-[#f0b400]">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Button
                  onClick={() => onNavigate("auth")}
                  className="w-full rounded-full bg-[#f0b400] text-background font-semibold shadow-[0_4px_16px_rgba(240,180,0,0.25),0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-[#b0c4de] hover:text-background hover:shadow-[0_4px_20px_rgba(176,196,222,0.35),0_1px_3px_rgba(0,0,0,0.4)] transition-all duration-400"
                >
                  Get Started
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
