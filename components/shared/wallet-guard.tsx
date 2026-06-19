"use client"

import { useStellarWallet } from "@/lib/stellar-wallet"
import { useWalletType } from "@/lib/use-current-address"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface WalletGuardProps {
  children: React.ReactNode
  message?: string
  className?: string
}

export function WalletGuard({ children, message, className }: WalletGuardProps) {
  const { openWalletModal } = useStellarWallet()
  const walletType = useWalletType()

  if (walletType === "external") {
    return <>{children}</>
  }

  return (
    <WalletPrompt
      onConnect={() => openWalletModal()}
      message={message}
      className={className}
    />
  )
}

export function WalletPrompt({
  onConnect,
  message,
  className,
}: {
  onConnect?: () => void
  message?: string
  className?: string
}) {
  const { openWalletModal } = useStellarWallet()
  const handleConnect = onConnect || (() => openWalletModal())

  return (
    <div className={cn("flex flex-col items-center gap-4 rounded-xl border border-[#f0b400]/20 bg-[#f0b400]/5 p-8 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0b400]/10">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f0b400" strokeWidth="1.5">
          <rect x="1" y="4" width="22" height="16" rx="2" />
          <path d="M1 10h22" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-[#f0b400]">Wallet Required</p>
        <p className="mt-1 text-sm text-white/60 max-w-sm">
          {message || "Connect and verify a wallet to operate escrow agreements on Thalos."}
        </p>
      </div>
      <Button
        onClick={handleConnect}
        className="rounded-full bg-[#f0b400] px-6 text-sm font-semibold text-background hover:bg-[#f0b400]/90"
      >
        Connect Wallet
      </Button>
    </div>
  )
}
