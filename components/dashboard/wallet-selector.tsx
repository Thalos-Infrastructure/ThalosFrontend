"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/auth-store"
import { useStellarWallet } from "@/lib/stellar-wallet"
import { useCurrentAddress } from "@/lib/use-current-address"
import { getWalletsWithBalances, type WalletWithBalance } from "@/lib/api/wallets"

interface WalletSelectorProps {
  selectedWallet: string | null
  onWalletChange: (wallet: string | null) => void
  className?: string
}

function connectedWalletFallback(address: string): WalletWithBalance {
  const timestamp = new Date().toISOString()
  return {
    id: "connected",
    user_id: "",
    wallet_address: address,
    wallet_type: "other",
    label: "Connected Wallet",
    is_primary: true,
    is_verified: false,
    verified_at: null,
    created_at: timestamp,
    updated_at: timestamp,
    balance: { xlm: "0", usdc: "0" },
    agreements_count: 0,
  }
}

export function WalletSelector({ selectedWallet, onWalletChange, className }: WalletSelectorProps) {
  const { token } = useAuthStore()
  const { address: connectedWallet } = useStellarWallet()
  const currentAddress = useCurrentAddress()
  const [wallets, setWallets] = useState<WalletWithBalance[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWallets()
  }, [token, currentAddress])

  const loadWallets = async () => {
    setIsLoading(true)
    setError(null)
    
    // If no token, try to use connected wallet directly
    if (!token) {
      if (currentAddress) {
        // Create a mock wallet entry for the connected wallet
        setWallets([connectedWalletFallback(currentAddress)])
      }
      setIsLoading(false)
      return
    }
    
    try {
      const result = await getWalletsWithBalances(token)
      if (result.success && result.data && result.data.length > 0) {
        setWallets(result.data)
      } else if (currentAddress) {
        // Fallback to connected wallet if no wallets from API
        setWallets([connectedWalletFallback(currentAddress)])
      }
    } catch (err) {
      console.error("Failed to load wallets:", err)
      setError("Could not load wallets")
      // Fallback to connected wallet on error
      if (currentAddress) {
        setWallets([connectedWalletFallback(currentAddress)])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const truncateAddress = (addr: string) => {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const formatBalance = (value: string) => {
    const amount = Number(value)
    return Number.isFinite(amount)
      ? amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : "0"
  }

  // Don't show loading forever - show nothing if taking too long
  if (isLoading) {
    return null
  }

  if (wallets.length === 0) return null

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <span className="text-xs text-muted-foreground mr-1">Filter by wallet:</span>
      
      {wallets.length > 1 && (
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
      )}

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
            <span className="text-[10px] opacity-70">
              {formatBalance(wallet.balance.xlm)} XLM · {formatBalance(wallet.balance.usdc)} USDC
            </span>
            {isConnected && (
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            )}
          </button>
        )
      })}
    </div>
  )
}
