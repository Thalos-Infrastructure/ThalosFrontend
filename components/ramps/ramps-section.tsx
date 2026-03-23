"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import Image from "next/image";

// Stellar Anchors list - real anchors on testnet/mainnet
const ANCHORS = [
  {
    id: "moneygram",
    name: "MoneyGram",
    description: "Global money transfer service",
    logo: "/anchors/moneygram.svg",
    region: "Global",
    currencies: ["USD", "EUR", "MXN"],
    fees: "1.5% - 3%",
    minDeposit: 10,
    maxDeposit: 10000,
    sepUrl: "https://stellar.moneygram.com/.well-known/stellar.toml",
    supported: true,
  },
  {
    id: "anclap",
    name: "Anclap",
    description: "LATAM crypto on/off ramp",
    logo: "/anchors/anclap.svg",
    region: "Latin America",
    currencies: ["ARS", "USD"],
    fees: "0.5% - 2%",
    minDeposit: 5,
    maxDeposit: 50000,
    sepUrl: "https://api.anclap.com/.well-known/stellar.toml",
    supported: true,
  },
  {
    id: "mykobo",
    name: "MyKobo",
    description: "European anchor for EUR",
    logo: "/anchors/mykobo.svg",
    region: "Europe",
    currencies: ["EUR"],
    fees: "0.5%",
    minDeposit: 10,
    maxDeposit: 15000,
    sepUrl: "https://mykobo.co/.well-known/stellar.toml",
    supported: true,
  },
  {
    id: "clickpesa",
    name: "ClickPesa",
    description: "East African payments",
    logo: "/anchors/clickpesa.svg",
    region: "Africa",
    currencies: ["TZS", "KES", "UGX"],
    fees: "1%",
    minDeposit: 1,
    maxDeposit: 5000,
    sepUrl: "https://stellar.clickpesa.com/.well-known/stellar.toml",
    supported: false, // Coming soon
  },
];

type RampType = "deposit" | "withdraw";
type Step = "select-type" | "select-anchor" | "enter-amount" | "processing" | "complete";

interface RampsSectionProps {
  walletAddress: string | null;
  onOpenWalletModal: () => void;
}

export function RampsSection({ walletAddress, onOpenWalletModal }: RampsSectionProps) {
  const { t } = useLanguage();
  const [rampType, setRampType] = useState<RampType>("deposit");
  const [step, setStep] = useState<Step>("select-type");
  const [selectedAnchor, setSelectedAnchor] = useState<typeof ANCHORS[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectAnchor = (anchor: typeof ANCHORS[0]) => {
    if (!anchor.supported) return;
    setSelectedAnchor(anchor);
    setSelectedCurrency(anchor.currencies[0]);
    setStep("enter-amount");
  };

  const handleStartRamp = async () => {
    if (!selectedAnchor || !amount || !walletAddress) return;
    
    setIsProcessing(true);
    setStep("processing");
    
    // In production, this would:
    // 1. Fetch the anchor's TOML file
    // 2. Get SEP-24 interactive URL
    // 3. Open popup/iframe with anchor's KYC flow
    // For now, simulate the flow
    
    setTimeout(() => {
      setIsProcessing(false);
      setStep("complete");
    }, 2000);
  };

  const handleReset = () => {
    setStep("select-type");
    setSelectedAnchor(null);
    setAmount("");
    setSelectedCurrency("USD");
  };

  // Not connected
  if (!walletAddress) {
    return (
      <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0c1220] py-20 px-6 text-center shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#f0b400]/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#f0b400]">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">{t("ramps.connectWalletTitle")}</h2>
          <p className="text-sm text-white/50 mb-6 max-w-sm">{t("ramps.connectWalletDesc")}</p>
          <Button 
            onClick={onOpenWalletModal}
            className="rounded-full bg-[#f0b400] px-8 py-2.5 text-sm font-semibold text-[#0c1220] hover:bg-[#d4a000] shadow-[0_4px_16px_rgba(240,180,0,0.25)]"
          >
            {t("ramps.connectWallet")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white mb-2">{t("ramps.title")}</h1>
        <p className="text-sm text-white/50">{t("ramps.subtitle")}</p>
      </div>

      {/* Main Content */}
      <div className="rounded-2xl border border-white/10 bg-[#0c1220] shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden">
        
        {/* Step 1: Select Type */}
        {step === "select-type" && (
          <div className="p-8">
            {/* Type Selector */}
            <div className="flex items-center gap-2 p-1.5 bg-white/[0.03] rounded-xl mb-8 max-w-xs mx-auto">
              <button
                onClick={() => setRampType("deposit")}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all",
                  rampType === "deposit"
                    ? "bg-[#f0b400] text-[#0c1220] shadow-md"
                    : "text-white/50 hover:text-white/70"
                )}
              >
                {t("ramps.deposit")}
              </button>
              <button
                onClick={() => setRampType("withdraw")}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all",
                  rampType === "withdraw"
                    ? "bg-[#f0b400] text-[#0c1220] shadow-md"
                    : "text-white/50 hover:text-white/70"
                )}
              >
                {t("ramps.withdraw")}
              </button>
            </div>

            {/* Description */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#f0b400]/10 mb-4">
                {rampType === "deposit" ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#f0b400]">
                    <path d="M12 2v20M17 7l-5-5-5 5" />
                  </svg>
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#f0b400]">
                    <path d="M12 22V2M7 17l5 5 5-5" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {rampType === "deposit" ? t("ramps.depositTitle") : t("ramps.withdrawTitle")}
              </h3>
              <p className="text-sm text-white/50 max-w-md mx-auto">
                {rampType === "deposit" ? t("ramps.depositDesc") : t("ramps.withdrawDesc")}
              </p>
            </div>

            {/* Anchors Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ANCHORS.map((anchor) => (
                <button
                  key={anchor.id}
                  onClick={() => handleSelectAnchor(anchor)}
                  disabled={!anchor.supported}
                  className={cn(
                    "relative flex items-start gap-4 p-5 rounded-xl border transition-all text-left group",
                    anchor.supported
                      ? "border-white/10 bg-white/[0.02] hover:border-[#f0b400]/30 hover:bg-white/[0.04]"
                      : "border-white/5 bg-white/[0.01] opacity-50 cursor-not-allowed"
                  )}
                >
                  {/* Logo placeholder */}
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-white/60">{anchor.name[0]}</span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-white">{anchor.name}</h4>
                      {!anchor.supported && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/40">
                          Coming Soon
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/40 mb-2">{anchor.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {anchor.currencies.map((curr) => (
                        <span key={curr} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f0b400]/10 text-[#f0b400]">
                          {curr}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">{anchor.region}</p>
                    <p className="text-xs text-white/50">Fees: {anchor.fees}</p>
                  </div>

                  {anchor.supported && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#f0b400]">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Info Banner */}
            <div className="mt-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/10">
              <div className="flex items-start gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-blue-400 mt-0.5 flex-shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <div>
                  <p className="text-xs text-white/60">
                    {t("ramps.anchorInfo")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Enter Amount */}
        {step === "enter-amount" && selectedAnchor && (
          <div className="p-8">
            {/* Back button */}
            <button
              onClick={() => setStep("select-type")}
              className="flex items-center gap-2 text-sm text-white/50 hover:text-white/70 transition-colors mb-6"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              {t("ramps.back")}
            </button>

            {/* Selected Anchor */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 mb-8">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="text-lg font-bold text-white/60">{selectedAnchor.name[0]}</span>
              </div>
              <div>
                <h4 className="font-semibold text-white">{selectedAnchor.name}</h4>
                <p className="text-xs text-white/40">{selectedAnchor.region} • Fees: {selectedAnchor.fees}</p>
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-white/70 mb-2">{t("ramps.amount")}</label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min={selectedAnchor.minDeposit}
                  max={selectedAnchor.maxDeposit}
                  className="w-full h-14 rounded-xl border border-white/15 bg-[#0a0a0c]/50 pl-5 pr-24 text-2xl font-semibold text-white placeholder:text-white/20 focus:border-[#f0b400]/40 focus:outline-none focus:ring-1 focus:ring-[#f0b400]/15 transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="h-8 rounded-lg bg-[#f0b400]/10 px-3 text-sm font-semibold text-[#f0b400] border-none focus:outline-none cursor-pointer"
                  >
                    {selectedAnchor.currencies.map((curr) => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="mt-2 text-xs text-white/40">
                Min: ${selectedAnchor.minDeposit} • Max: ${selectedAnchor.maxDeposit.toLocaleString()}
              </p>
            </div>

            {/* Summary */}
            {amount && (
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white/50">{t("ramps.youSend")}</span>
                  <span className="text-sm font-semibold text-white">{amount} {selectedCurrency}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white/50">{t("ramps.fee")}</span>
                  <span className="text-sm text-white/70">~{selectedAnchor.fees}</span>
                </div>
                <div className="border-t border-white/10 pt-2 mt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-white/70">{t("ramps.youReceive")}</span>
                    <span className="text-lg font-bold text-[#f0b400]">~{(parseFloat(amount) * 0.98).toFixed(2)} USDC</span>
                  </div>
                </div>
              </div>
            )}

            {/* Continue Button */}
            <Button
              onClick={handleStartRamp}
              disabled={!amount || parseFloat(amount) < selectedAnchor.minDeposit}
              className="w-full h-12 rounded-xl bg-[#f0b400] text-sm font-semibold text-[#0c1220] hover:bg-[#d4a000] shadow-[0_4px_16px_rgba(240,180,0,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rampType === "deposit" ? t("ramps.continueDeposit") : t("ramps.continueWithdraw")}
            </Button>
          </div>
        )}

        {/* Step 3: Processing */}
        {step === "processing" && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 rounded-full border-4 border-[#f0b400]/20 border-t-[#f0b400] animate-spin mb-6" />
            <h3 className="text-lg font-semibold text-white mb-2">{t("ramps.processing")}</h3>
            <p className="text-sm text-white/50 text-center max-w-sm">
              {t("ramps.processingDesc")}
            </p>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === "complete" && (
          <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">{t("ramps.complete")}</h3>
            <p className="text-sm text-white/50 text-center max-w-sm mb-6">
              {t("ramps.completeDesc")}
            </p>
            <Button
              onClick={handleReset}
              className="rounded-full bg-[#f0b400] px-8 py-2.5 text-sm font-semibold text-[#0c1220] hover:bg-[#d4a000] shadow-[0_4px_16px_rgba(240,180,0,0.25)]"
            >
              {t("ramps.newTransaction")}
            </Button>
          </div>
        )}
      </div>

      {/* Trust Indicators */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs text-white/30">
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span>{t("ramps.secureTransactions")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>{t("ramps.regulatedAnchors")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          <span>{t("ramps.fastSettlement")}</span>
        </div>
      </div>
    </div>
  );
}
