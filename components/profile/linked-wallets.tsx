"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useStellarWallet } from "@/lib/stellar-wallet"
import { useAuthStore } from "@/lib/auth-store"

interface LinkedWallet {
  id: string
  wallet_address: string
  wallet_type: "custodial" | "freighter" | "albedo" | "rabet" | "other"
  label: string | null
  is_primary: boolean
  created_at: string
}

const walletTypeLabels: Record<string, { label: string; icon: JSX.Element }> = {
  custodial: {
    label: "Email Wallet",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 7L2 7" /></svg>,
  },
  freighter: {
    label: "Freighter",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>,
  },
  albedo: {
    label: "Albedo",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 2v20M2 12h20" /></svg>,
  },
  rabet: {
    label: "Rabet",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /></svg>,
  },
  other: {
    label: "External Wallet",
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>,
  },
}

interface LinkedWalletsProps {
  userId?: string
  onWalletSelect?: (walletAddress: string) => void
  selectedWallet?: string | null
}

export function LinkedWallets({ userId, onWalletSelect, selectedWallet }: LinkedWalletsProps) {
  const { address: connectedWallet, openWalletModal } = useStellarWallet()
  const { user } = useAuthStore()
  const [wallets, setWallets] = useState<LinkedWallet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get user_id from auth store if not provided
  const effectiveUserId = userId || user?.id

  useEffect(() => {
    if (effectiveUserId) {
      loadWallets()
    }
  }, [effectiveUserId])

  const loadWallets = async () => {
    if (!effectiveUserId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/wallets/linked?userId=${effectiveUserId}`)
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        setWallets(data.wallets || [])
      }
    } catch (err) {
      setError("Failed to load wallets")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLinkWallet = async () => {
    if (!connectedWallet || !effectiveUserId) return
    
    // Check if already linked
    if (wallets.some(w => w.wallet_address === connectedWallet)) {
      setError("This wallet is already linked")
      return
    }
    
    setIsLinking(true)
    setError(null)
    
    try {
      const response = await fetch("/api/wallets/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: effectiveUserId,
          walletAddress: connectedWallet,
          walletType: "freighter",
        }),
      })
      
      const data = await response.json()
      
      if (data.error) {
        setError(data.error)
      } else {
        await loadWallets()
      }
    } catch (err) {
      setError("Failed to link wallet")
    } finally {
      setIsLinking(false)
    }
  }

  const handleSetPrimary = async (walletId: string) => {
    try {
      const response = await fetch("/api/wallets/set-primary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: effectiveUserId, walletId }),
      })
      
      const data = await response.json()
      
      if (!data.error) {
        await loadWallets()
      }
    } catch (err) {
      console.error("Failed to set primary wallet:", err)
    }
  }

  const handleRemoveWallet = async (walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId)
    if (wallet?.is_primary) {
      setError("Cannot remove primary wallet")
      return
    }
    
    try {
      const response = await fetch("/api/wallets/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: effectiveUserId, walletId }),
      })
      
      const data = await response.json()
      
      if (!data.error) {
        await loadWallets()
      }
    } catch (err) {
      console.error("Failed to remove wallet:", err)
    }
  }

  const truncateAddress = (addr: string) => {
    if (!addr) return ""
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
          <h3 className="text-lg font-semibold text-foreground">Linked Wallets</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#f0b400] border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
          <h3 className="text-lg font-semibold text-foreground">Linked Wallets</h3>
        </div>
        <span className="text-xs text-muted-foreground">{wallets.length} wallet{wallets.length !== 1 ? "s" : ""}</span>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        View agreements from all your linked wallets in one place. Connect multiple wallets to consolidate your activity.
      </p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Wallets List */}
      <div className="space-y-3 mb-6">
        {wallets.map((wallet) => {
          const typeInfo = walletTypeLabels[wallet.wallet_type] || walletTypeLabels.other
          const isSelected = selectedWallet === wallet.wallet_address
          const isConnected = connectedWallet === wallet.wallet_address
          
          return (
            <div
              key={wallet.id}
              onClick={() => onWalletSelect?.(wallet.wallet_address)}
              className={cn(
                "group flex items-center justify-between rounded-xl border p-4 transition-all",
                isSelected
                  ? "border-[#f0b400]/50 bg-[#f0b400]/10"
                  : "border-border/40 bg-background/50 hover:border-border/60",
                onWalletSelect && "cursor-pointer"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  wallet.is_primary ? "bg-[#f0b400]/20 text-[#f0b400]" : "bg-muted/50 text-muted-foreground"
                )}>
                  {typeInfo.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {wallet.label || typeInfo.label}
                    </span>
                    {wallet.is_primary && (
                      <span className="rounded-full bg-[#f0b400]/20 px-2 py-0.5 text-[10px] font-medium text-[#f0b400]">
                        PRIMARY
                      </span>
                    )}
                    {isConnected && (
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
                        CONNECTED
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {truncateAddress(wallet.wallet_address)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {!wallet.is_primary && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetPrimary(wallet.id)
                      }}
                      className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Set Primary
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveWallet(wallet.id)
                      }}
                      className="h-8 px-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      Remove
                    </Button>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {wallets.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/40 p-6 text-center">
            <p className="text-sm text-muted-foreground">No wallets linked yet</p>
          </div>
        )}
      </div>

      {/* Link New Wallet Button */}
      {connectedWallet && !wallets.some(w => w.wallet_address === connectedWallet) ? (
        <Button
          onClick={handleLinkWallet}
          disabled={isLinking}
          className="w-full bg-[#f0b400] text-black hover:bg-[#f0b400]/90"
        >
          {isLinking ? "Linking..." : `Link Connected Wallet (${truncateAddress(connectedWallet)})`}
        </Button>
      ) : !connectedWallet ? (
        <Button
          onClick={() => openWalletModal()}
          variant="outline"
          className="w-full border-[#f0b400]/30 text-[#f0b400] hover:bg-[#f0b400]/10"
        >
          Connect Wallet to Link
        </Button>
      ) : null}
    </div>
  )
}
