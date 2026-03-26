"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import {
  Smartphone,
  Zap,
  Droplets,
  Wifi,
  Tv,
  Car,
  GraduationCap,
  Heart,
  Building,
  ChevronRight,
  Search,
  MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface ServiceCategory {
  id: string
  name: string
  nameKey: string
  icon: React.ReactNode
  color: string
  bgColor: string
  services: string[]
  comingSoon?: boolean
}

const serviceCategories: ServiceCategory[] = [
  {
    id: "phone",
    name: "Mobile Top-up",
    nameKey: "services.mobileTopup",
    icon: <Smartphone className="h-6 w-6" />,
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
    services: ["Movistar", "Claro", "Personal", "Tuenti"],
    comingSoon: true,
  },
  {
    id: "electricity",
    name: "Electricity",
    nameKey: "services.electricity",
    icon: <Zap className="h-6 w-6" />,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    services: ["Edenor", "Edesur", "EDELAP"],
    comingSoon: true,
  },
  {
    id: "water",
    name: "Water",
    nameKey: "services.water",
    icon: <Droplets className="h-6 w-6" />,
    color: "text-cyan-400",
    bgColor: "bg-cyan-400/10",
    services: ["AySA", "ABSA"],
    comingSoon: true,
  },
  {
    id: "internet",
    name: "Internet & TV",
    nameKey: "services.internet",
    icon: <Wifi className="h-6 w-6" />,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
    services: ["Fibertel", "Telecentro", "Flow"],
    comingSoon: true,
  },
  {
    id: "streaming",
    name: "Streaming",
    nameKey: "services.streaming",
    icon: <Tv className="h-6 w-6" />,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    services: ["Netflix", "Spotify", "Disney+", "HBO Max"],
    comingSoon: true,
  },
  {
    id: "transport",
    name: "Transport",
    nameKey: "services.transport",
    icon: <Car className="h-6 w-6" />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    services: ["SUBE", "Autopistas"],
    comingSoon: true,
  },
  {
    id: "education",
    name: "Education",
    nameKey: "services.education",
    icon: <GraduationCap className="h-6 w-6" />,
    color: "text-indigo-400",
    bgColor: "bg-indigo-400/10",
    services: ["Universities", "Courses"],
    comingSoon: true,
  },
  {
    id: "health",
    name: "Health",
    nameKey: "services.health",
    icon: <Heart className="h-6 w-6" />,
    color: "text-pink-400",
    bgColor: "bg-pink-400/10",
    services: ["OSDE", "Swiss Medical", "Galeno"],
    comingSoon: true,
  },
  {
    id: "taxes",
    name: "Taxes & Government",
    nameKey: "services.taxes",
    icon: <Building className="h-6 w-6" />,
    color: "text-white/60",
    bgColor: "bg-white/10",
    services: ["AFIP", "ARBA", "Municipio"],
    comingSoon: true,
  },
]

interface PayServicesSectionProps {
  className?: string
  userCountry?: string
  onPayService?: (serviceId: string) => void
}

export function PayServicesSection({ 
  className, 
  userCountry = "Argentina",
  onPayService 
}: PayServicesSectionProps) {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredCategories = serviceCategories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.services.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {t("services.title") || "Pay Services"}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            {t("services.subtitle") || "Pay your bills and services directly with your balance"}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 border border-white/10">
          <MapPin className="h-4 w-4 text-white/40" />
          <span className="text-xs font-medium text-white/60">{userCountry}</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
        <input
          type="text"
          placeholder={t("services.searchPlaceholder") || "Search services..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 rounded-xl border border-white/10 bg-[#0c1220]/60 pl-12 pr-4 text-white placeholder:text-white/30 focus:border-[#f0b400]/30 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/10"
        />
      </div>

      {/* Categories grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {filteredCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            disabled={category.comingSoon}
            className={cn(
              "relative group flex flex-col items-center rounded-2xl border bg-[#0c1220]/60 p-5 text-center transition-all duration-200",
              category.comingSoon
                ? "border-white/6 opacity-60 cursor-not-allowed"
                : "border-white/6 hover:border-white/15 hover:bg-[#0c1220]/80"
            )}
          >
            {category.comingSoon && (
              <span className="absolute top-2 right-2 rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white/50">
                Soon
              </span>
            )}
            <div className={cn("rounded-xl p-3 mb-3", category.bgColor)}>
              <div className={category.color}>{category.icon}</div>
            </div>
            <p className="text-sm font-medium text-white mb-1">
              {t(category.nameKey) || category.name}
            </p>
            <p className="text-[10px] text-white/30 line-clamp-1">
              {category.services.slice(0, 3).join(", ")}
            </p>
          </button>
        ))}
      </div>

      {/* Info section */}
      <div className="rounded-2xl border border-white/6 bg-[#0c1220]/60 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-2">
              {t("services.poweredBy") || "Powered by Local Partners"}
            </h3>
            <p className="text-xs text-white/50">
              {t("services.poweredByDescription") || `We partner with local on/off ramp providers in ${userCountry} to enable seamless bill payments. Your payments are processed through regulated financial institutions.`}
            </p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 h-10 rounded-lg border-white/10 bg-white/5 text-sm text-white hover:bg-white/10"
            disabled
          >
            {t("services.viewPartners") || "View Partners"}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Recent payments (placeholder) */}
      <div className="rounded-2xl border border-white/6 bg-[#0c1220]/60 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
          {t("services.recentPayments") || "Recent Payments"}
        </h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-white/5 p-3 mb-3">
            <Building className="h-6 w-6 text-white/20" />
          </div>
          <p className="text-sm text-white/50">
            {t("services.noRecentPayments") || "No recent payments"}
          </p>
          <p className="text-xs text-white/30 mt-1">
            {t("services.paymentsWillAppear") || "Your payment history will appear here"}
          </p>
        </div>
      </div>
    </div>
  )
}
