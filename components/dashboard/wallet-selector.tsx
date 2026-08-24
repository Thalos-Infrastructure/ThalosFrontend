"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/lib/auth-store"
import { useStellarWallet } from "@/lib/stellar-wallet"
import { useCurrentAddress } from "@/lib/use-current-address"
import { getWalletsWithAgreements, type WalletWithAgreements } from "@/lib/api/wallets"

interface WalletSelectorProps {
  selectedWallet: string | null
  onWalletChange: (wallet: string | null) => void
  walletsData?: WalletWithAgreements[]
  className?: string
}

function connectedWalletFallback(address: string): WalletWithAgreements {
  return {
    wallet_address: address,
    wallet_type: "other",
    label: "Connected Wallet",
    is_primary: true,
    is_verified: false,
    agreements: [],
    agreements_count: 0,
  }
}

export function WalletSelector({ selectedWallet, onWalletChange, walletsData: propsWalletsData, className }: WalletSelectorProps) {
  const { token } = useAuthStore()
  const { address: connectedWallet } = useStellarWallet()
  const currentAddress = useCurrentAddress()
  const [internalWallets, setInternalWallets] = useState<WalletWithAgreements[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const wallets = propsWalletsData ?? internalWallets

  useEffect(() => {
    if (propsWalletsData !== undefined) return
       let isMounted = true
    async function load() {
      setIsLoading(true)

      if (!token) {
        if (currentAddress && isMounted) {
          setInternalWallets([connectedWalletFallback(currentAddress)])
        }
        if (isMounted) setIsLoading(false)
        return
      }

      try {
        const result = await getWalletsWithBalances(token)

        if (isMounted && result.success && result.data && result.data.length > 0) {
          setWallets(result.data)
        } else if (isMounted && currentAddress) {
          setWallets([{
            id: "connected",
            user_id: "",
            wallet_address: currentAddress,
            wallet_type: "external" as const,
            label: truncateAddress(currentAddress),
            is_primary: true,
            created_at: new Date().toISOString(),
            balance: { xlm: "0", usdc: "0" },
            agreements_count: 0,
          }])
        }
      } catch (err) {
        console.error("Failed to load wallets:", err)
        if (isMounted) setError("Could not load wallets")

        if (isMounted && currentAddress) {
          setWallets([{
            id: "connected",
            user_id: "",
            wallet_address: currentAddress,
            wallet_type: "external" as const,
            label: truncateAddress(currentAddress),
            is_primary: true,
            created_at: new Date().toISOString(),
            balance: { xlm: "0", usdc: "0" },
            agreements_count: 0,
          }])
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    load()

    return () => {
      isMounted = false
    }

  const truncateAddress = (addr: string) => {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  if (isLoading && !wallets.length) {
    return null
  }

  if (wallets.length === 0) return null

  const totalAgreementsCount = wallets.reduce(
    (sum, w) => sum + (w.agreements_count ?? w.agreements?.length ?? 0),
    0
  )

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <span className="text-xs text-muted-foreground mr-1">Filter by wallet:</span>

      {wallets.length > 1 && (
        <button
          type="button"
          onClick={() => onWalletChange(null)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            selectedWallet === null || selectedWallet === "all" || selectedWallet === "All"
              ? "bg-[#f0b400] text-black"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <span>All Wallets</span>
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
              selectedWallet === null || selectedWallet === "all" || selectedWallet === "All"
                ? "bg-black/20 text-black"
                : "bg-white/10 text-white/70"
            )}
          >
            {totalAgreementsCount}
          </span>
        </button>
      )}

      {wallets.map((wallet) => {
        const isSelected = selectedWallet === wallet.wallet_address
        const isConnected = connectedWallet === wallet.wallet_address
        const count = wallet.agreements_count ?? wallet.agreements?.length ?? 0

        return (
          <button
            key={wallet.id ?? wallet.wallet_address}
            type="button"
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
            <span className="font-mono">
              {wallet.label?.trim() || truncateAddress(wallet.wallet_address)}
            </span>
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                isSelected
                  ? "bg-black/20 text-black"
                  : "bg-white/10 text-white/70"
              )}
            >
              {count}
            </span>
            {isConnected && (
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" title="Connected" />
            )}
          </button>
        )
      })}
    </div>
  )
}
