"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

// Simplified anchor list for inline use
const QUICK_ANCHORS = [
  { id: "moneygram", name: "MoneyGram", currencies: ["USD"], fees: "1.5%", icon: "M" },
  { id: "anclap", name: "Anclap", currencies: ["USD", "ARS"], fees: "0.5%", icon: "A" },
  { id: "mykobo", name: "MyKobo", currencies: ["EUR"], fees: "0.5%", icon: "K" },
];

interface InlineOnrampProps {
  targetAmount: number;
  targetCurrency?: string;
  walletAddress: string | null;
  onComplete?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function InlineOnramp({ 
  targetAmount, 
  targetCurrency = "USDC",
  walletAddress,
  onComplete,
  onCancel,
  className 
}: InlineOnrampProps) {
  const { t } = useLanguage();
  const [step, setStep] = useState<"prompt" | "select" | "processing" | "done">("prompt");
  const [selectedAnchor, setSelectedAnchor] = useState<typeof QUICK_ANCHORS[0] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectAnchor = async (anchor: typeof QUICK_ANCHORS[0]) => {
    setSelectedAnchor(anchor);
    setIsProcessing(true);
    setStep("processing");

    // Simulate SEP-24 flow - in production this opens the anchor's KYC interface
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setStep("done");
    
    // Auto-complete after showing success
    setTimeout(() => {
      onComplete?.();
    }, 1500);
  };

  if (step === "prompt") {
    return (
      <div className={cn(
        "rounded-xl border border-[#f0b400]/20 bg-[#f0b400]/5 p-4",
        className
      )}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0b400]/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5">
              <path d="M12 2v20M17 7l-5-5-5 5"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Need to add funds?</p>
            <p className="mt-0.5 text-xs text-white/50">
              Deposit {targetAmount.toFixed(2)} {targetCurrency} from your bank account using a regulated Stellar anchor.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setStep("select")}
                className="h-8 rounded-lg bg-[#f0b400] px-4 text-xs font-semibold text-[#0c1220] hover:bg-[#d4a000]"
              >
                Deposit Fiat
              </Button>
              {onCancel && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onCancel}
                  className="h-8 rounded-lg px-3 text-xs text-white/50 hover:text-white hover:bg-white/5"
                >
                  I already have {targetCurrency}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === "select") {
    return (
      <div className={cn(
        "rounded-xl border border-white/10 bg-[#0c1220] p-4",
        className
      )}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-white">Select payment method</p>
          <button 
            onClick={() => setStep("prompt")}
            className="text-xs text-white/40 hover:text-white"
          >
            Cancel
          </button>
        </div>
        <p className="text-xs text-white/40 mb-3">
          Deposit {targetAmount.toFixed(2)} USDC via:
        </p>
        <div className="flex flex-col gap-2">
          {QUICK_ANCHORS.map((anchor) => (
            <button
              key={anchor.id}
              onClick={() => handleSelectAnchor(anchor)}
              className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-left transition-all hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-white/70">
                {anchor.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">{anchor.name}</p>
                <p className="text-[10px] text-white/40">{anchor.currencies.join(", ")} - Fee: {anchor.fees}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/30">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-white/30 text-center">
          Anchors are regulated financial institutions
        </p>
      </div>
    );
  }

  if (step === "processing") {
    return (
      <div className={cn(
        "rounded-xl border border-white/10 bg-[#0c1220] p-6 text-center",
        className
      )}>
        <div className="flex justify-center mb-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#f0b400]/20 border-t-[#f0b400]" />
        </div>
        <p className="text-sm font-semibold text-white">Connecting to {selectedAnchor?.name}</p>
        <p className="mt-1 text-xs text-white/40">
          Complete the verification in the popup window...
        </p>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className={cn(
        "rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-400">Deposit initiated</p>
            <p className="text-xs text-white/40">Funds will arrive in your wallet shortly</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Compact version for small spaces
export function CompactOnrampButton({ 
  onClick, 
  className 
}: { 
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border border-[#f0b400]/20 bg-[#f0b400]/5 px-2.5 py-1.5 text-xs font-medium text-[#f0b400] transition-all hover:bg-[#f0b400]/10",
        className
      )}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v20M17 7l-5-5-5 5"/>
      </svg>
      Add funds
    </button>
  );
}
