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
    icon: <FilePlus className="h-5 w-5" />,
    color: "text-[#f0b400]",
    bgColor: "bg-[#f0b400]/15",
  },
  {
    id: "share-link",
    labelKey: "quickActions.shareLink",
    icon: <Share2 className="h-5 w-5" />,
    color: "text-sky-400",
    bgColor: "bg-sky-400/15",
  },
  {
    id: "yield",
    labelKey: "quickActions.generateYield",
    icon: <TrendingUp className="h-5 w-5" />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/15",
  },
  {
    id: "bounty",
    labelKey: "quickActions.bounty",
    icon: <Trophy className="h-5 w-5" />,
    color: "text-amber-400",
    bgColor: "bg-amber-400/15",
  },
]

interface QuickActionsProps {
  onAction: (actionId: QuickActionId) => void
  className?: string
}

export function QuickActions({ onAction, className }: QuickActionsProps) {
  const { t } = useLanguage()

  return (
    <div className={cn("grid grid-cols-4 gap-3", className)}>
      {quickActions.map((action) => (
        <button
          key={action.id}
          onClick={() => onAction(action.id)}
          className={cn(
            "group flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-[#0c1220] p-4 transition-all duration-200",
            "hover:border-white/20 hover:bg-[#0c1220]/90",
            "active:scale-[0.98]"
          )}
        >
          <div className={cn("rounded-lg p-2", action.bgColor)}>
            <div className={action.color}>{action.icon}</div>
          </div>
          <span className="text-xs font-medium text-white/60 text-center leading-tight group-hover:text-white/80 transition-colors">
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
