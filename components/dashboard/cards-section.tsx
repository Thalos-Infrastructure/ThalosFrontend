"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import {
  CreditCard,
  Plus,
  ChevronRight,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
  Shield,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface CardProvider {
  id: string
  name: string
  logo: string
  description: string
  features: string[]
  comingSoon?: boolean
}

const cardProviders: CardProvider[] = [
  {
    id: "visa",
    name: "Visa Card",
    logo: "/visa-logo.svg",
    description: "Virtual and physical Visa cards for online and in-store payments",
    features: ["No FX fees", "Instant top-up", "Global acceptance"],
    comingSoon: true,
  },
  {
    id: "mastercard",
    name: "Mastercard",
    logo: "/mastercard-logo.svg",
    description: "Premium Mastercard with cashback rewards on all purchases",
    features: ["2% cashback", "Travel insurance", "Lounge access"],
    comingSoon: true,
  },
  {
    id: "apple-pay",
    name: "Apple Pay",
    logo: "/apple-pay-logo.svg",
    description: "Add your Thalos card to Apple Wallet for contactless payments",
    features: ["Touch/Face ID", "Secure Element", "Transit mode"],
    comingSoon: true,
  },
  {
    id: "google-pay",
    name: "Google Pay",
    logo: "/google-pay-logo.svg",
    description: "Use Google Pay with your Thalos balance on Android devices",
    features: ["NFC payments", "In-app purchases", "Peer-to-peer"],
    comingSoon: true,
  },
  {
    id: "mercado-pago",
    name: "Mercado Pago",
    logo: "/mercadopago-logo.svg",
    description: "Connect with Mercado Pago for payments across Latin America",
    features: ["QR payments", "Installments", "Wide acceptance"],
    comingSoon: true,
  },
]

interface CardsSectionProps {
  className?: string
  onRequestCard?: (providerId: string) => void
}

export function CardsSection({ className, onRequestCard }: CardsSectionProps) {
  const { t } = useLanguage()
  const [showCardDetails, setShowCardDetails] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">
          {t("cards.title") || "Cards & Payments"}
        </h2>
        <p className="text-sm text-white/50 mt-1">
          {t("cards.subtitle") || "Spend your balance anywhere with virtual and physical cards"}
        </p>
      </div>

      {/* Active cards section (placeholder) */}
      <div className="rounded-2xl border border-white/6 bg-[#0c1220]/60 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            {t("cards.yourCards") || "Your Cards"}
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-white/10 bg-white/5 text-xs text-white hover:bg-white/10"
            disabled
          >
            <Plus className="h-3 w-3 mr-1.5" />
            {t("cards.addCard") || "Add Card"}
          </Button>
        </div>

        {/* No cards placeholder */}
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="relative mb-4">
            <div className="h-24 w-40 rounded-xl bg-gradient-to-br from-[#1a2a42] to-[#0c1220] border border-white/10 flex items-center justify-center">
              <CreditCard className="h-10 w-10 text-white/20" />
            </div>
            <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-[#f0b400]/10 flex items-center justify-center">
              <Lock className="h-4 w-4 text-[#f0b400]" />
            </div>
          </div>
          <p className="text-sm font-medium text-white/60 mb-1">
            {t("cards.noCards") || "No cards yet"}
          </p>
          <p className="text-xs text-white/30 max-w-xs">
            {t("cards.noCardsDescription") || "Request your Thalos card to start spending your balance worldwide"}
          </p>
        </div>
      </div>

      {/* Available providers */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
          {t("cards.availableProviders") || "Available Providers"}
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {cardProviders.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              disabled={provider.comingSoon}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-[#0c1220]/60 p-5 text-left transition-all duration-200",
                provider.comingSoon 
                  ? "border-white/6 opacity-60 cursor-not-allowed" 
                  : "border-white/6 hover:border-white/15 hover:bg-[#0c1220]/80"
              )}
            >
              {provider.comingSoon && (
                <span className="absolute top-3 right-3 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
                  {t("common.comingSoon") || "Coming Soon"}
                </span>
              )}
              <div className="h-10 w-16 mb-4 flex items-center">
                {/* Logo placeholder with text */}
                <div className="text-lg font-bold text-white/80">{provider.name.split(' ')[0]}</div>
              </div>
              <p className="text-sm font-medium text-white mb-1">{provider.name}</p>
              <p className="text-xs text-white/40 mb-3 line-clamp-2">{provider.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {provider.features.map((feature, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/50"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="rounded-2xl border border-white/6 bg-gradient-to-br from-[#f0b400]/5 to-transparent p-6">
        <h3 className="text-sm font-semibold text-white mb-4">
          {t("cards.whyThalosCards") || "Why Thalos Cards?"}
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#f0b400]/10 p-2">
              <Smartphone className="h-5 w-5 text-[#f0b400]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {t("cards.instantTopup") || "Instant Top-up"}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                {t("cards.instantTopupDesc") || "Fund your card instantly from your Thalos balance"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#f0b400]/10 p-2">
              <Shield className="h-5 w-5 text-[#f0b400]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {t("cards.securePayments") || "Secure Payments"}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                {t("cards.securePaymentsDesc") || "Bank-grade security with instant freeze controls"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#f0b400]/10 p-2">
              <CreditCard className="h-5 w-5 text-[#f0b400]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {t("cards.globalAcceptance") || "Global Acceptance"}
              </p>
              <p className="text-xs text-white/40 mt-0.5">
                {t("cards.globalAcceptanceDesc") || "Accepted at millions of merchants worldwide"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
