"use client"

import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import { AlertCircle, Clock, CheckCircle, ChevronRight, FileText } from "lucide-react"

export interface PendingAgreement {
  id: string
  title: string
  counterparty: string
  amount: string
  status: "awaiting_signature" | "awaiting_funding" | "awaiting_approval" | "dispute"
  daysAgo?: number
  type: string
}

interface PendingAgreementsProps {
  agreements: PendingAgreement[]
  onAgreementClick: (id: string) => void
  onViewAll: () => void
  className?: string
}

const statusConfig = {
  awaiting_signature: {
    label: "Awaiting Signature",
    labelKey: "agreements.awaitingSignature",
    icon: <Clock className="h-4 w-4" />,
    color: "text-amber-400",
    bgColor: "bg-amber-400/10",
    borderColor: "border-amber-400/20",
  },
  awaiting_funding: {
    label: "Awaiting Funding",
    labelKey: "agreements.awaitingFunding",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "text-sky-400",
    bgColor: "bg-sky-400/10",
    borderColor: "border-sky-400/20",
  },
  awaiting_approval: {
    label: "Awaiting Approval",
    labelKey: "agreements.awaitingApproval",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "text-emerald-400",
    bgColor: "bg-emerald-400/10",
    borderColor: "border-emerald-400/20",
  },
  dispute: {
    label: "In Dispute",
    labelKey: "agreements.inDispute",
    icon: <AlertCircle className="h-4 w-4" />,
    color: "text-rose-400",
    bgColor: "bg-rose-400/10",
    borderColor: "border-rose-400/20",
  },
}

export function PendingAgreements({
  agreements,
  onAgreementClick,
  onViewAll,
  className,
}: PendingAgreementsProps) {
  const { t } = useLanguage()

  if (agreements.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-white/6 bg-[#0c1220]/60 p-6", className)}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            {t("dashboard.pendingActions") || "Pending Actions"}
          </h3>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-white/5 p-4 mb-3">
            <CheckCircle className="h-8 w-8 text-emerald-400/60" />
          </div>
          <p className="text-sm font-medium text-white/60">
            {t("dashboard.allCaughtUp") || "All caught up!"}
          </p>
          <p className="text-xs text-white/30 mt-1">
            {t("dashboard.noPendingActions") || "No pending actions at the moment"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("rounded-2xl border border-white/6 bg-[#0c1220]/60 p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">
            {t("dashboard.pendingActions") || "Pending Actions"}
          </h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#f0b400]/10 text-[10px] font-bold text-[#f0b400]">
            {agreements.length}
          </span>
        </div>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-xs font-medium text-white/40 hover:text-white/60 transition-colors"
        >
          {t("dashboard.viewAll") || "View all"}
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Agreements list */}
      <div className="space-y-2">
        {agreements.slice(0, 4).map((agreement) => {
          const config = statusConfig[agreement.status]
          return (
            <button
              key={agreement.id}
              onClick={() => onAgreementClick(agreement.id)}
              className={cn(
                "w-full flex items-center gap-4 rounded-xl border p-4 transition-all duration-200",
                "hover:bg-white/5 active:scale-[0.99]",
                config.borderColor,
                "bg-[#0c1220]/40"
              )}
            >
              {/* Icon */}
              <div className={cn("rounded-lg p-2", config.bgColor)}>
                <FileText className={cn("h-5 w-5", config.color)} />
              </div>

              {/* Info */}
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-white truncate">{agreement.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-white/40">{agreement.counterparty}</span>
                  <span className="text-white/20">·</span>
                  <span className="text-xs font-medium text-[#f0b400]">${agreement.amount}</span>
                </div>
              </div>

              {/* Status badge */}
              <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1", config.bgColor)}>
                <span className={config.color}>{config.icon}</span>
                <span className={cn("text-[10px] font-medium", config.color)}>
                  {t(config.labelKey) || config.label}
                </span>
              </div>

              <ChevronRight className="h-4 w-4 text-white/30" />
            </button>
          )
        })}
      </div>

      {agreements.length > 4 && (
        <button
          onClick={onViewAll}
          className="w-full mt-3 rounded-xl border border-white/6 bg-white/5 py-3 text-xs font-medium text-white/50 hover:bg-white/8 hover:text-white/70 transition-colors"
        >
          {t("dashboard.viewMore") || `View ${agreements.length - 4} more`}
        </button>
      )}
    </div>
  )
}
