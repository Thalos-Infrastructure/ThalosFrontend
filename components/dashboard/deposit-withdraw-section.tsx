"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Building,
  Wallet,
  ChevronRight,
  ExternalLink,
  Shield,
  Clock,
  AlertCircle,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

type TabType = "deposit" | "withdraw"

interface DepositMethod {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  processingTime: string
  fee: string
  minAmount: string
}

const depositMethods: DepositMethod[] = [
  {
    id: "bank",
    name: "Bank Account",
    description: "Connect your bank account for direct deposits",
    icon: <Building className="h-6 w-6" />,
    processingTime: "1-2 business days",
    fee: "Free",
    minAmount: "$10",
  },
  {
    id: "stellar",
    name: "Stellar Network",
    description: "Send USDC directly from any Stellar wallet",
    icon: <Wallet className="h-6 w-6" />,
    processingTime: "< 5 seconds",
    fee: "< $0.01",
    minAmount: "$1",
  },
]

const withdrawMethods: DepositMethod[] = [
  {
    id: "bank",
    name: "Bank Account",
    description: "Withdraw to your connected bank account",
    icon: <Building className="h-6 w-6" />,
    processingTime: "1-3 business days",
    fee: "$2.50",
    minAmount: "$20",
  },
  {
    id: "stellar",
    name: "Stellar Wallet",
    description: "Send USDC to any Stellar address",
    icon: <Wallet className="h-6 w-6" />,
    processingTime: "< 5 seconds",
    fee: "< $0.01",
    minAmount: "$1",
  },
]

interface DepositWithdrawSectionProps {
  walletAddress: string | null
  availableBalance: string
  onDeposit: (method: string, amount: string) => void
  onWithdraw: (method: string, amount: string, destination: string) => void
  className?: string
}

export function DepositWithdrawSection({
  walletAddress,
  availableBalance,
  onDeposit,
  onWithdraw,
  className,
}: DepositWithdrawSectionProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<TabType>("deposit")
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [amount, setAmount] = useState("")
  const [destination, setDestination] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const methods = activeTab === "deposit" ? depositMethods : withdrawMethods

  const handleSubmit = async () => {
    if (!selectedMethod || !amount || parseFloat(amount) <= 0) return
    
    setIsProcessing(true)
    try {
      if (activeTab === "deposit") {
        await onDeposit(selectedMethod, amount)
      } else {
        await onWithdraw(selectedMethod, amount, destination)
      }
      setAmount("")
      setDestination("")
      setSelectedMethod(null)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-white">
          {t("ramps.title") || "Deposit & Withdraw"}
        </h2>
        <p className="text-sm text-white/50 mt-1">
          {t("ramps.subtitle") || "Add or withdraw funds from your Thalos account"}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-white/5 p-1">
        <button
          onClick={() => { setActiveTab("deposit"); setSelectedMethod(null) }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all",
            activeTab === "deposit"
              ? "bg-[#f0b400] text-[#0c1220]"
              : "text-white/60 hover:text-white"
          )}
        >
          <ArrowDownToLine className="h-4 w-4" />
          {t("ramps.deposit") || "Deposit"}
        </button>
        <button
          onClick={() => { setActiveTab("withdraw"); setSelectedMethod(null) }}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium transition-all",
            activeTab === "withdraw"
              ? "bg-[#f0b400] text-[#0c1220]"
              : "text-white/60 hover:text-white"
          )}
        >
          <ArrowUpFromLine className="h-4 w-4" />
          {t("ramps.withdraw") || "Withdraw"}
        </button>
      </div>

      {/* Balance card */}
      <div className="rounded-xl border border-white/6 bg-[#0c1220]/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40">
              {activeTab === "deposit" 
                ? (t("ramps.yourAddress") || "Your Deposit Address") 
                : (t("ramps.availableToWithdraw") || "Available to Withdraw")}
            </p>
            {activeTab === "deposit" && walletAddress ? (
              <p className="text-sm font-mono text-white mt-1 truncate max-w-[200px] md:max-w-none">
                {walletAddress}
              </p>
            ) : (
              <p className="text-xl font-semibold text-white mt-1">
                {availableBalance} <span className="text-sm text-white/40">USDC</span>
              </p>
            )}
          </div>
          {activeTab === "deposit" && walletAddress && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 rounded-lg border-white/10 bg-white/5 text-xs text-white hover:bg-white/10"
              onClick={() => navigator.clipboard.writeText(walletAddress)}
            >
              Copy
            </Button>
          )}
        </div>
      </div>

      {/* Methods */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">
          {activeTab === "deposit" 
            ? (t("ramps.depositMethods") || "Deposit Methods") 
            : (t("ramps.withdrawMethods") || "Withdraw To")}
        </h3>
        {methods.map((method) => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.id === selectedMethod ? null : method.id)}
            className={cn(
              "w-full rounded-2xl border bg-[#0c1220]/60 p-5 text-left transition-all duration-200",
              selectedMethod === method.id
                ? "border-[#f0b400]/30 bg-[#0c1220]/80"
                : "border-white/6 hover:border-white/15"
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn(
                "rounded-xl p-3",
                selectedMethod === method.id ? "bg-[#f0b400]/10 text-[#f0b400]" : "bg-white/5 text-white/60"
              )}>
                {method.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{method.name}</p>
                <p className="text-xs text-white/40 mt-0.5">{method.description}</p>
              </div>
              <ChevronRight className={cn(
                "h-5 w-5 text-white/30 transition-transform",
                selectedMethod === method.id && "rotate-90"
              )} />
            </div>

            {/* Expanded details */}
            {selectedMethod === method.id && (
              <div className="mt-4 pt-4 border-t border-white/6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] text-white/30 uppercase mb-1">Processing</p>
                    <p className="text-xs font-medium text-white flex items-center gap-1">
                      <Clock className="h-3 w-3 text-white/40" />
                      {method.processingTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase mb-1">Fee</p>
                    <p className="text-xs font-medium text-white">{method.fee}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-white/30 uppercase mb-1">Minimum</p>
                    <p className="text-xs font-medium text-white">{method.minAmount}</p>
                  </div>
                </div>

                {/* Amount input */}
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full h-12 rounded-xl border border-white/10 bg-[#0c1220] pl-4 pr-20 text-white placeholder:text-white/30 focus:border-[#f0b400]/30 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/10"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <span className="text-xs text-white/40">USDC</span>
                      {activeTab === "withdraw" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setAmount(availableBalance) }}
                          className="text-xs font-bold text-[#f0b400] hover:text-[#f0b400]/80"
                        >
                          MAX
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Destination for withdraw to stellar */}
                  {activeTab === "withdraw" && method.id === "stellar" && (
                    <input
                      type="text"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="Stellar address (G...)"
                      className="w-full h-12 rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white placeholder:text-white/30 focus:border-[#f0b400]/30 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/10 font-mono text-sm"
                    />
                  )}

                  <Button
                    onClick={(e) => { e.stopPropagation(); handleSubmit() }}
                    disabled={!amount || parseFloat(amount) <= 0 || isProcessing || (activeTab === "withdraw" && method.id === "stellar" && !destination)}
                    className="w-full h-12 rounded-xl bg-[#f0b400] text-[#0c1220] font-semibold hover:bg-[#e5ab00] disabled:opacity-50"
                  >
                    {isProcessing ? "Processing..." : activeTab === "deposit" ? "Continue to Deposit" : "Withdraw Funds"}
                  </Button>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
        <Shield className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-emerald-400">
            {t("ramps.secureTransfers") || "Secure Transfers"}
          </p>
          <p className="text-xs text-white/50 mt-1">
            {t("ramps.secureTransfersDesc") || "All deposits and withdrawals are processed through Stellar anchors, ensuring your funds are secure and compliant with local regulations."}
          </p>
        </div>
      </div>
    </div>
  )
}
