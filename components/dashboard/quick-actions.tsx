"use client"

import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import { 
  FilePlus, 
  Share2, 
  TrendingUp, 
  CalendarClock, 
  Trophy, 
  CreditCard, 
  Banknote, 
  MoreHorizontal,
  ArrowDownToLine,
  ArrowUpFromLine
} from "lucide-react"

export type QuickActionId = 
  | "new-agreement" 
  | "share-link" 
  | "yield" 
  | "schedule" 
  | "bounty" 
  | "cards" 
  | "pay-services" 
  | "more"
  | "deposit"
  | "withdraw"

interface QuickAction {
  id: QuickActionId
  labelKey: string
  icon: React.ReactNode
  color: string
  bgColor: string
  comingSoon?: boolean
}

const quickActions: QuickAction[] = [
  {
    id: "new-agreement",
    labelKey: "quickActions.newAgreement",
    icon: <FilePlus className="h-6 w-6" />,
    color: "text-[#f0b400]",
    bgColor: "bg-[#f0b400]/10",
  },
  {
    id: "share-link",
    labelKey: "quickActions.shareLink",
    icon: <Share2 className="h-6 w-6" />,
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
  },
  {
    id: "yield",
    labelKey: "quickActions.generateYield",
    icon: <TrendingUp className="h-6 w-6" />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
  },
  {
    id: "schedule",
    labelKey: "quickActions.schedule",
    icon: <CalendarClock className="h-6 w-6" />,
    color: "text-violet-400",
    bgColor: "bg-violet-400/10",
  },
  {
    id: "bounty",
    labelKey: "quickActions.bounty",
    icon: <Trophy className="h-6 w-6" />,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
  },
  {
    id: "cards",
    labelKey: "quickActions.cards",
    icon: <CreditCard className="h-6 w-6" />,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    comingSoon: true,
  },
  {
    id: "pay-services",
    labelKey: "quickActions.payServices",
    icon: <Banknote className="h-6 w-6" />,
    color: "text-teal-400",
    bgColor: "bg-teal-400/10",
    comingSoon: true,
  },
  {
    id: "more",
    labelKey: "quickActions.more",
    icon: <MoreHorizontal className="h-6 w-6" />,
    color: "text-white/60",
    bgColor: "bg-white/5",
  },
]

interface QuickActionsProps {
  onAction: (actionId: QuickActionId) => void
  className?: string
}

export function QuickActions({ onAction, className }: QuickActionsProps) {
  const { t } = useLanguage()

  return (
    <div className={cn("grid grid-cols-4 gap-3 md:grid-cols-8", className)}>
      {quickActions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          className={cn(
            "group relative flex flex-col items-center gap-2 rounded-2xl border border-white/6 bg-[#0c1220]/60 p-4 transition-all duration-200",
            "hover:border-white/15 hover:bg-[#0c1220]/80 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]",
            "active:scale-[0.98]"
          )}
        >
          {action.comingSoon && (
            <span className="absolute -top-1 -right-1 rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/50">
              Soon
            </span>
          )}
          <div className={cn("rounded-xl p-2.5", action.bgColor)}>
            <div className={action.color}>{action.icon}</div>
          </div>
          <span className="text-[10px] font-medium text-white/60 text-center leading-tight group-hover:text-white/80 transition-colors">
            {t(action.labelKey) || action.labelKey.split('.')[1]}
          </span>
        </button>
      ))}
    </div>
  )
}

// Compact version for balance card
interface BalanceActionsProps {
  onDeposit: () => void
  onWithdraw: () => void
  className?: string
}

export function BalanceActions({ onDeposit, onWithdraw, className }: BalanceActionsProps) {
  const { t } = useLanguage()

  return (
    <div className={cn("flex gap-2", className)}>
      <button
        onClick={onDeposit}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f0b400] py-3 text-sm font-semibold text-[#0c1220] hover:bg-[#e5ab00] transition-colors active:scale-[0.98]"
      >
        <ArrowDownToLine className="h-4 w-4" />
        {t("dashboard.deposit") || "Deposit"}
      </button>
      <button
        onClick={onWithdraw}
        className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors active:scale-[0.98]"
      >
        <ArrowUpFromLine className="h-4 w-4" />
        {t("dashboard.withdraw") || "Withdraw"}
      </button>
    </div>
  )
}
