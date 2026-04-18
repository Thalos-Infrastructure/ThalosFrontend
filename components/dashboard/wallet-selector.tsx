"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/auth-store"
import { useStellarWallet } from "@/lib/stellar-wallet"
import { getWalletsWithBalances, type WalletWithBalance } from "@/lib/api/wallets"

interface WalletSelectorProps {
  selectedWallet: string | null
  onWalletChange: (wallet: string | null) => void
  className?: string
}

export function WalletSelector({ selectedWallet, onWalletChange, className }: WalletSelectorProps) {
  const { token } = useAuthStore()
  const { address: connectedWallet } = useStellarWallet()
  const [wallets, setWallets] = useState<WalletWithBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (token) {
      loadWallets()
    }
  }, [token])

  const loadWallets = async () => {
    if (!token) return
    setIsLoading(true)
    try {
      const result = await getWalletsWithBalances(token)
      if (result.success && result.data) {
        setWallets(result.data)
      }
    } catch (err) {
      console.error("Failed to load wallets:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const truncateAddress = (addr: string) => {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#f0b400] border-t-transparent" />
        <span className="text-xs text-muted-foreground">Loading wallets...</span>
      </div>
    )
  }

  if (wallets.length <= 1) {
    return null // Don't show selector if only one wallet
  }

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <span className="text-xs text-muted-foreground mr-1">Filter by wallet:</span>
      
      <button
        onClick={() => onWalletChange(null)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
          selectedWallet === null
            ? "bg-[#f0b400] text-black"
            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        All Wallets
      </button>

      {wallets.map((wallet) => {
        const isSelected = selectedWallet === wallet.wallet_address
        const isConnected = connectedWallet === wallet.wallet_address
        
        return (
          <button
            key={wallet.id}
            onClick={() => onWalletChange(wallet.wallet_address)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              isSelected
                ? "bg-[#f0b400] text-black"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {wallet.is_primary && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
            <span className="font-mono">{truncateAddress(wallet.wallet_address)}</span>
            {isConnected && (
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            )}
          </button>
        )
      })}
    </div>
  )
}
