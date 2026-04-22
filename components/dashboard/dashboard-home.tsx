"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import { useCurrentAddress } from "@/lib/use-current-address"
import { useAuthStore } from "@/lib/auth-store"
import { getProfileByWallet, type Profile } from "@/lib/actions/profile"
import { WalletAddress } from "@/components/ui/wallet-address"
import { BalanceCard } from "./balance-card"
import { QuickActions, type QuickActionId } from "./quick-actions"
import { 
  FilePlus, 
  FileText, 
  TrendingUp, 
  Wallet,
  Bell,
  HelpCircle,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

interface PendingAction {
  id: string
  type: "approve" | "fund" | "submit" | "review"
  title: string
  description: string
  agreementId: string
  createdAt: string
}

interface DashboardHomeProps {
  onNavigate: (section: string) => void
  onCreateAgreement: () => void
  agreements?: Array<{
    id: string
    title: string
    status: string
    receiver?: string
  }>
  className?: string
}

export function DashboardHome({ 
  onNavigate, 
  onCreateAgreement,
  agreements = [],
  className 
}: DashboardHomeProps) {
  const { t } = useLanguage()
  const currentAddress = useCurrentAddress()
  const { user } = useAuthStore()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Mock data - replace with real data from API
  const [balanceData] = useState({
    totalBalance: "0.00",
    availableBalance: "0.00",
    lockedInEscrow: "0.00",
    yieldEarned: "0.00",
  })

  useEffect(() => {
    if (currentAddress) {
      loadProfile()
    }
  }, [currentAddress])

  const loadProfile = async () => {
    if (!currentAddress) return
    setIsLoading(true)
    try {
      const p = await getProfileByWallet(currentAddress)
      setProfile(p)
    } catch (err) {
      console.error("Failed to load profile:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return t("dashboard.goodMorning") || "Good morning"
    if (hour < 18) return t("dashboard.goodAfternoon") || "Good afternoon"
    return t("dashboard.goodEvening") || "Good evening"
  }

  const displayName = profile?.display_name || user?.name || "User"

  // Calculate pending actions from agreements
  const pendingActions: PendingAction[] = agreements
    .filter(a => a.status === "pending" || a.status === "awaiting_funding")
    .slice(0, 5)
    .map(a => ({
      id: a.id,
      type: a.status === "awaiting_funding" ? "fund" : "review",
      title: a.title,
      description: a.status === "awaiting_funding" 
        ? "Waiting for funds to be deposited" 
        : "Requires your attention",
      agreementId: a.id,
      createdAt: new Date().toISOString(),
    }))

  const handleQuickAction = (actionId: QuickActionId) => {
    switch (actionId) {
      case "new-agreement":
        onCreateAgreement()
        break
      case "yield":
        onNavigate("yield")
        break
      case "deposit":
      case "withdraw":
        onNavigate("ramps")
        break
      default:
        onNavigate(actionId)
    }
  }

  // Quick action cards like in the image
  const mainActions = [
    { id: "new-agreement", label: t("quickActions.newAgreement") || "New Agreement", icon: FilePlus, color: "text-[#f0b400]", bg: "bg-[#f0b400]/10" },
    { id: "agreements", label: t("sidebar.agreements") || "Agreements", icon: FileText, color: "text-sky-400", bg: "bg-sky-400/10" },
    { id: "yield", label: t("quickActions.generateYield") || "Investments", icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { id: "wallets", label: t("sidebar.wallets") || "My Wallet", icon: Wallet, color: "text-amber-400", bg: "bg-amber-400/10" },
  ]

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with greeting and profile */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Profile image */}
          <div className="relative">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[#f0b400]/20 to-[#f0b400]/5 border border-white/10 overflow-hidden">
              {profile?.avatar_url ? (
                <Image 
                  src={profile.avatar_url} 
                  alt={displayName} 
                  fill 
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xl font-bold text-[#f0b400]">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-background bg-emerald-500" />
          </div>
          
          {/* Greeting and wallet */}
          <div>
            <p className="text-lg text-white">
              {getGreeting()}, <span className="font-semibold text-[#f0b400]">{displayName}</span>
            </p>
            {currentAddress && (
              <WalletAddress 
                address={currentAddress} 
                showCopy 
                className="text-sm text-white/40"
              />
            )}
          </div>
        </div>

        {/* Header actions */}
        <div className="flex items-center gap-2">
          <button className="relative p-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
            <Bell className="h-5 w-5 text-white/60" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#f0b400]" />
          </button>
          <button className="p-2.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
            <HelpCircle className="h-5 w-5 text-white/60" />
          </button>
        </div>
      </div>

      {/* Balance Card */}
      <BalanceCard
        totalBalance={balanceData.totalBalance}
        availableBalance={balanceData.availableBalance}
        lockedInEscrow={balanceData.lockedInEscrow}
        yieldEarned={balanceData.yieldEarned}
        onDeposit={() => onNavigate("ramps")}
        onWithdraw={() => onNavigate("ramps")}
      />

      {/* Quick Action Cards */}
      <div className="grid grid-cols-4 gap-3">
        {mainActions.map((action) => (
          <button
            key={action.id}
            onClick={() => action.id === "new-agreement" ? onCreateAgreement() : onNavigate(action.id)}
            className={cn(
              "group flex flex-col items-center gap-3 rounded-2xl border border-white/6 bg-[#0c1220]/60 p-5 transition-all duration-200",
              "hover:border-white/15 hover:bg-[#0c1220]/80 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]",
              "active:scale-[0.98]"
            )}
          >
            <div className={cn("rounded-xl p-3", action.bg)}>
              <action.icon className={cn("h-6 w-6", action.color)} />
            </div>
            <span className="text-xs font-medium text-white/60 text-center group-hover:text-white/80 transition-colors">
              {action.label}
            </span>
          </button>
        ))}
      </div>

      {/* Pending Actions */}
      <div className="rounded-2xl border border-white/6 bg-[#0c1220]/60 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">
            {t("dashboard.pendingActions") || "Pending Actions"}
          </h3>
          {pendingActions.length > 0 && (
            <button 
              onClick={() => onNavigate("agreements")}
              className="text-xs text-[#f0b400] hover:underline flex items-center gap-1"
            >
              {t("dashboard.viewAll") || "View all"}
              <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>

        {pendingActions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500/40 mb-3" />
            <p className="text-sm text-white/40">
              {t("dashboard.noPendingActions") || "No pending actions"}
            </p>
            <p className="text-xs text-white/25 mt-1">
              {t("dashboard.allCaughtUp") || "You're all caught up!"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onNavigate("agreements")}
                className="w-full flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.02] p-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className={cn(
                  "rounded-lg p-2",
                  action.type === "fund" ? "bg-amber-500/10" : "bg-sky-500/10"
                )}>
                  {action.type === "fund" ? (
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Clock className="h-4 w-4 text-sky-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{action.title}</p>
                  <p className="text-xs text-white/40 truncate">{action.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/30" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
