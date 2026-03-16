"use client";

import React from "react";
import { Button } from "@/components/ui/button";

interface WalletAddressProps {
  address: string;
}

export function WalletAddress({ address }: WalletAddressProps) {
  if (!address) return null;

  const short = `${address.slice(0, 6)}…${address.slice(-4)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
    } catch {
      // ignore copy errors
    }
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-card/60 px-3 py-1.5 shadow-sm">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12l2.5 2.5L16 9" />
        </svg>
      </div>
      <span className="font-mono text-xs text-foreground">{short}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopy}
        className="h-7 rounded-full border-border/40 bg-background/60 px-2 text-[11px] text-muted-foreground hover:text-foreground"
      >
        Copy
      </Button>
    </div>
  );
}

