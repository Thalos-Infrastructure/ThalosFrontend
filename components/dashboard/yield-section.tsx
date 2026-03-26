"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import {
  TrendingUp,
  Shield,
  Clock,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Percent,
  Wallet,
  ArrowRight,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface VaultOption {
  id: string
  name: string
  apy: string
  tvl: string
  risk: "low" | "medium" | "high"
  protocol: string
  description: string
  minDeposit: string
}

const testnetVaults: VaultOption[] = [
  {
    id: "vault-usdc-1",
    name: "USDC Stable Vault",
    apy: "4.2%",
    tvl: "$1.2M",
    risk: "low",
    protocol: "DeFindex",
    description: "Earn yield on idle USDC with automatic rebalancing across lending protocols",
    minDeposit: "10 USDC",
  },
  {
    id: "vault-xlm-1",
    name: "XLM Liquidity Vault",
    apy: "6.8%",
    tvl: "$850K",
    risk: "medium",
    protocol: "DeFindex",
    description: "Provide liquidity to XLM pairs and earn trading fees plus rewards",
    minDeposit: "100 XLM",
  },
]

interface YieldSectionProps {
  availableBalance: string
  currentYield: string
  onDeposit: (vaultId: string, amount: string) => void
  onWithdraw: (vaultId: string) => void
  className?: string
}

export function YieldSection({
  availableBalance,
  currentYield,
  onDeposit,
  onWithdraw,
  className,
}: YieldSectionProps) {
  const { t } = useLanguage()
  const [selectedVault, setSelectedVault] = useState<string | null>(null)
  const [depositAmount, setDepositAmount] = useState("")
  const [isDepositing, setIsDepositing] = useState(false)

  const handleDeposit = async (vaultId: string) => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return
    setIsDepositing(true)
    try {
      await onDeposit(vaultId, depositAmount)
      setDepositAmount("")
      setSelectedVault(null)
    } finally {
      setIsDepositing(false)
    }
  }

  const riskColors = {
    low: { text: "text-emerald-400", bg: "bg-emerald-400/10", label: "Low Risk" },
    medium: { text: "text-amber-400", bg: "bg-amber-400/10", label: "Medium Risk" },
    high: { text: "text-rose-400", bg: "bg-rose-400/10", label: "High Risk" },
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {t("yield.title") || "Generate Yield"}
          </h2>
          <p className="text-sm text-white/50 mt-1">
            {t("yield.subtitle") || "Earn passive income on your idle funds"}
          </p>
        </div>
        <a
          href="https://docs.defindex.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          {t("yield.learnMore") || "Learn more"}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-white/6 bg-[#0c1220]/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-white/40" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              {t("yield.available") || "Available"}
            </span>
          </div>
          <p className="text-lg font-semibold text-white">{availableBalance} USDC</p>
        </div>
        <div className="rounded-xl border border-white/6 bg-[#0c1220]/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              {t("yield.earned") || "Total Earned"}
            </span>
          </div>
          <p className="text-lg font-semibold text-emerald-400">+{currentYield} USDC</p>
        </div>
        <div className="rounded-xl border border-white/6 bg-[#0c1220]/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Percent className="h-4 w-4 text-[#f0b400]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              {t("yield.avgApy") || "Avg APY"}
            </span>
          </div>
          <p className="text-lg font-semibold text-[#f0b400]">5.5%</p>
        </div>
        <div className="rounded-xl border border-white/6 bg-[#0c1220]/60 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-sky-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              {t("yield.deposited") || "Deposited"}
            </span>
          </div>
          <p className="text-lg font-semibold text-white">0 USDC</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-sky-400/20 bg-sky-400/5 p-4">
        <Info className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-sky-400">
            {t("yield.testnetInfo") || "Testnet Mode"}
          </p>
          <p className="text-xs text-white/50 mt-1">
            {t("yield.testnetDescription") || "You're using DeFindex on Stellar Testnet. Yields are simulated for testing purposes. Switch to mainnet for real returns."}
          </p>
        </div>
      </div>

      {/* Vault options */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          {t("yield.availableVaults") || "Available Vaults"}
        </h3>
        {testnetVaults.map((vault) => {
          const risk = riskColors[vault.risk]
          const isSelected = selectedVault === vault.id

          return (
            <div
              key={vault.id}
              className={cn(
                "rounded-2xl border bg-[#0c1220]/60 overflow-hidden transition-all duration-200",
                isSelected ? "border-[#f0b400]/30" : "border-white/6 hover:border-white/15"
              )}
            >
              {/* Vault header */}
              <button
                onClick={() => setSelectedVault(isSelected ? null : vault.id)}
                className="flex w-full items-center justify-between p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#f0b400]/20 to-[#f0b400]/5 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-[#f0b400]" />
                  </div>
                  <div className="text-left">
                    <p className="text-base font-semibold text-white">{vault.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{vault.protocol}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-lg font-bold text-emerald-400">{vault.apy}</p>
                    <p className="text-[10px] text-white/40 uppercase">APY</p>
                  </div>
                  <div className={cn("rounded-full px-2.5 py-1", risk.bg)}>
                    <span className={cn("text-[10px] font-bold uppercase", risk.text)}>
                      {risk.label}
                    </span>
                  </div>
                  <ChevronRight className={cn("h-5 w-5 text-white/30 transition-transform", isSelected && "rotate-90")} />
                </div>
              </button>

              {/* Expanded content */}
              {isSelected && (
                <div className="border-t border-white/6 p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="text-sm text-white/60 mb-4">{vault.description}</p>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-[10px] text-white/40 uppercase mb-1">TVL</p>
                      <p className="text-sm font-medium text-white">{vault.tvl}</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-3">
                      <p className="text-[10px] text-white/40 uppercase mb-1">Min. Deposit</p>
                      <p className="text-sm font-medium text-white">{vault.minDeposit}</p>
                    </div>
                  </div>

                  {/* Deposit form */}
                  <div className="flex gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full h-12 rounded-xl border border-white/10 bg-[#0c1220] pl-4 pr-16 text-white placeholder:text-white/30 focus:border-[#f0b400]/30 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/10"
                      />
                      <button
                        onClick={() => setDepositAmount(availableBalance)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#f0b400] hover:text-[#f0b400]/80"
                      >
                        MAX
                      </button>
                    </div>
                    <Button
                      onClick={() => handleDeposit(vault.id)}
                      disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isDepositing}
                      className="h-12 px-6 rounded-xl bg-[#f0b400] text-[#0c1220] font-semibold hover:bg-[#e5ab00] disabled:opacity-50"
                    >
                      {isDepositing ? "..." : t("yield.deposit") || "Deposit"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
