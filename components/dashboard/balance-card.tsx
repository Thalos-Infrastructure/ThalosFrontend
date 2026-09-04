"use client"

import { useState } from "react"
import {
  Eye,
  EyeOff,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"

interface BalanceCardProps {
  totalBalance: string
  lockedInEscrow: string
  availableBalance: string
  yieldEarned?: string
  currency?: string
  onDeposit: () => void
  onWithdraw: () => void
  className?: string
  /** Show a loading skeleton while balances are being fetched. */
  isLoading?: boolean
  /** Show an error state instead of 0.00 when the fetch failed. */
  isError?: boolean
  /** Hide the yield stat (no backend source). */
  hideYield?: boolean
  /** Hide the in-escrow stat (no backend source). */
  hideEscrow?: boolean
}

export function BalanceCard({
  totalBalance,
  lockedInEscrow,
  availableBalance,
  yieldEarned = "0.00",
  currency = "USDC",
  onDeposit,
  onWithdraw,
  className,
  isLoading = false,
  isError = false,
  hideYield = false,
  hideEscrow = false,
}: BalanceCardProps) {
  const { t } = useLanguage()
  const [showBalance, setShowBalance] = useState(true)

  const formatBalance = (value: string) => {
    if (isLoading) return "——"
    if (!showBalance) return "••••••"
    return value
  }

  // How many stats columns are visible
  const visibleStats = [true, !hideEscrow, !hideYield].filter(Boolean).length
  const statsGridClass =
    visibleStats === 3 ? "grid-cols-3" : visibleStats === 2 ? "grid-cols-2" : "grid-cols-1"

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0c1220] to-[#0a0f1a] p-6",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]",
        className,
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#f0b400]/10 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-[#f0b400]/5 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-widest text-white/40">
            {t("dashboard.totalBalance") || "Total Balance"}
          </p>
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-white/40 animate-spin" />
          ) : (
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              aria-label={showBalance ? "Hide balance" : "Show balance"}
            >
              {showBalance ? (
                <Eye className="h-4 w-4 text-white/40" />
              ) : (
                <EyeOff className="h-4 w-4 text-white/40" />
              )}
            </button>
          )}
        </div>

        {/* Error state */}
        {isError ? (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
            <p className="text-sm text-red-400">
              {t("dashboard.balanceFetchError") || "Could not load balance. Please try again."}
            </p>
          </div>
        ) : (
          <>
            {/* Main balance */}
            <div className="mb-6">
              <p
                className={cn(
                  "text-3xl font-bold text-white",
                  isLoading && "animate-pulse text-white/40",
                )}
              >
                {formatBalance(totalBalance)}{" "}
                <span className="text-lg font-normal text-white/40">{currency}</span>
              </p>
            </div>

            {/* Stats row — only renders visible columns */}
            <div className={cn("grid gap-4 mb-6", statsGridClass)}>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-1">
                  {t("dashboard.available") || "Available"}
                </p>
                <p
                  className={cn(
                    "text-sm font-semibold text-white",
                    isLoading && "animate-pulse text-white/40",
                  )}
                >
                  {formatBalance(availableBalance)}
                </p>
              </div>
              {!hideEscrow && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-1">
                    {t("dashboard.inEscrow") || "In Escrow"}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold text-[#f0b400]",
                      isLoading && "animate-pulse text-[#f0b400]/40",
                    )}
                  >
                    {formatBalance(lockedInEscrow)}
                  </p>
                </div>
              )}
              {!hideYield && (
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-1">
                    {t("dashboard.yieldEarned") || "Yield"}
                  </p>
                  <p
                    className={cn(
                      "text-sm font-semibold text-emerald-400 flex items-center gap-1",
                      isLoading && "animate-pulse text-emerald-400/40",
                    )}
                  >
                    <TrendingUp className="h-3 w-3" />+{formatBalance(yieldEarned)}
                  </p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onDeposit}
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#f0b400] py-3.5 text-sm font-semibold text-[#0c1220] hover:bg-[#e5ab00] transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownToLine className="h-4 w-4" />
            {t("dashboard.deposit") || "Deposit"}
          </button>
          <button
            onClick={onWithdraw}
            disabled={isLoading}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpFromLine className="h-4 w-4" />
            {t("dashboard.withdraw") || "Withdraw"}
          </button>
        </div>
      </div>
    </div>
  )
}
