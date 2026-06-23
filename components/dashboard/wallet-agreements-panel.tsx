"use client"

import { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/auth-store"
import {
  getWalletsWithAgreements,
  updateWallet,
  unlinkWallet,
  type WalletWithAgreements,
} from "@/lib/api/wallets"

const roleColors: Record<string, { bg: string; text: string }> = {
  buyer:    { bg: "bg-sky-400/10",     text: "text-sky-400" },
  seller:   { bg: "bg-violet-400/10",  text: "text-violet-400" },
  approver: { bg: "bg-amber-400/10",   text: "text-amber-400" },
}

const statusColors: Record<string, { bg: string; text: string }> = {
  pending:     { bg: "bg-amber-400/10",   text: "text-amber-400" },
  funded:      { bg: "bg-sky-400/10",     text: "text-sky-400" },
  in_progress: { bg: "bg-violet-400/10",  text: "text-violet-400" },
  released:    { bg: "bg-emerald-400/10", text: "text-emerald-400" },
  completed:   { bg: "bg-emerald-400/10", text: "text-emerald-400" },
  dispute:     { bg: "bg-rose-400/10",    text: "text-rose-400" },
}

interface WalletAgreementsPanelProps {
  onAgreementClick?: (agreementId: string) => void
  selectedWallet?: string | null
  onWalletSelect?: (walletAddress: string | null) => void
}

export function WalletAgreementsPanel({
  onAgreementClick,
  selectedWallet,
  onWalletSelect,
}: WalletAgreementsPanelProps) {
  const { token } = useAuthStore()
  const [wallets, setWallets] = useState<WalletWithAgreements[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedWallet, setExpandedWallet] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setError(null)
    const result = await getWalletsWithAgreements(token)
    if (result.success && result.data) {
      setWallets(result.data)
      if (result.data.length > 0 && !expandedWallet) {
        const top = result.data.reduce((a, b) =>
          a.agreements_count >= b.agreements_count ? a : b
        )
        setExpandedWallet(top.wallet_address)
      }
    } else {
      setError(result.error || "Could not load wallet agreements")
    }
    setIsLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => { load() }, [load])

  const handleSetPrimary = async (walletId: string) => {
    if (!token) return
    setActionLoading(walletId)
    const result = await updateWallet(walletId, { is_primary: true }, token)
    if (result.success) await load()
    setActionLoading(null)
  }

  const handleUnlink = async (walletId: string) => {
    if (!token) return
    setActionLoading(walletId)
    const result = await unlinkWallet(walletId, token)
    if (result.success) await load()
    setActionLoading(null)
  }

  const truncate = (addr: string) =>
    addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : ""

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f0b400] border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
        {error}
        <button onClick={load} className="ml-3 underline opacity-70 hover:opacity-100">
          Retry
        </button>
      </div>
    )
  }

  if (wallets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-sm text-white/40">
        No linked wallets. Link a wallet to see agreements grouped by wallet.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Filter chips */}
      {onWalletSelect && (
        <div className="flex flex-wrap items-center gap-2 pb-1">
          <span className="text-xs text-white/40">Filter by wallet:</span>
          <button
            onClick={() => onWalletSelect(null)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              selectedWallet === null
                ? "bg-[#f0b400] text-black"
                : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
            )}
          >
            All Wallets
          </button>
          {wallets.map((w) => (
            <button
              key={w.id}
              onClick={() => onWalletSelect(w.wallet_address)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
                selectedWallet === w.wallet_address
                  ? "bg-[#f0b400] text-black"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
              )}
            >
              {w.is_primary && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
              <span className="font-mono">{truncate(w.wallet_address)}</span>
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-bold">
                {w.agreements_count}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Per-wallet cards */}
      {wallets.map((wallet) => {
        const isExpanded = expandedWallet === wallet.wallet_address
        const isSelected = selectedWallet === wallet.wallet_address
        const isActing = actionLoading === wallet.id

        return (
          <div
            key={wallet.id}
            className={cn(
              "rounded-2xl border transition-all",
              isSelected
                ? "border-[#f0b400]/30 bg-[#f0b400]/5"
                : "border-white/10 bg-[#0c1220]"
            )}
          >
            {/* Wallet header */}
            <div className="flex items-center gap-2 px-5 py-4">
              <button
                onClick={() => setExpandedWallet(isExpanded ? null : wallet.wallet_address)}
                className="flex flex-1 items-center gap-3 text-left min-w-0"
              >
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    wallet.is_primary
                      ? "bg-[#f0b400]/20 text-[#f0b400]"
                      : "bg-white/5 text-white/40"
                  )}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <path d="M1 10h22" />
                  </svg>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {wallet.label || wallet.wallet_type}
                    </span>
                    {wallet.is_primary && (
                      <span className="rounded-full bg-[#f0b400]/20 px-2 py-0.5 text-[10px] font-semibold text-[#f0b400]">
                        Primary
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-white/40">{truncate(wallet.wallet_address)}</p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{wallet.agreements_count}</p>
                    <p className="text-[10px] text-white/30">agreements</p>
                  </div>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2"
                    className={cn("text-white/30 transition-transform shrink-0", isExpanded && "rotate-180")}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </button>

              {/* Wallet actions — hidden for primary */}
              {!wallet.is_primary && (
                <div className="flex items-center gap-1 border-l border-white/10 pl-3 shrink-0">
                  <button
                    onClick={() => handleSetPrimary(wallet.id)}
                    disabled={isActing}
                    className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white/50 hover:bg-white/10 hover:text-white disabled:opacity-30 transition-colors"
                  >
                    Set primary
                  </button>
                  <button
                    onClick={() => handleUnlink(wallet.id)}
                    disabled={isActing}
                    className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-red-400/70 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30 transition-colors"
                  >
                    {isActing ? "..." : "Unlink"}
                  </button>
                </div>
              )}
            </div>

            {/* Agreements list */}
            {isExpanded && wallet.agreements.length > 0 && (
              <div className="border-t border-white/[0.06] divide-y divide-white/[0.04]">
                {wallet.agreements.map((agr) => {
                  const roleStyle = roleColors[agr.role] || roleColors.buyer
                  const statusStyle = statusColors[agr.status.toLowerCase()] || statusColors.pending
                  return (
                    <button
                      key={agr.id}
                      onClick={() => onAgreementClick?.(agr.id)}
                      className="flex w-full items-center justify-between px-5 py-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">{agr.title}</p>
                        <div className="mt-0.5 flex items-center gap-2">
                          <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", roleStyle.bg, roleStyle.text)}>
                            {agr.role}
                          </span>
                          <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider", statusStyle.bg, statusStyle.text)}>
                            {agr.status.replace("_", " ")}
                          </span>
                        </div>
                      </div>
                      <p className="ml-4 shrink-0 text-sm font-semibold text-white">
                        ${agr.amount}{" "}
                        <span className="text-[10px] font-normal text-white/30">USDC</span>
                      </p>
                    </button>
                  )
                })}
              </div>
            )}

            {isExpanded && wallet.agreements.length === 0 && (
              <div className="border-t border-white/[0.06] px-5 py-6 text-center text-xs text-white/30">
                No agreements found for this wallet
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
