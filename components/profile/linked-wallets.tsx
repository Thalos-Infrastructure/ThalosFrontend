"use client"

import { useState, useEffect, useCallback, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import { useStellarWallet } from "@/lib/stellar-wallet"
import { Wallet } from "lucide-react"

type LinkedWalletRow = {
  id: string
  wallet_address: string
  wallet_type: string
  label: string | null
  is_primary: boolean
  linked_at: string
}

const walletTypeLabels: Record<string, { label: string; icon: ReactNode }> = {
  custodial: {
    label: "Email Wallet",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M22 7l-10 7L2 7" />
      </svg>
    ),
  },
  freighter: {
    label: "Freighter",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <path d="M1 10h22" />
      </svg>
    ),
  },
  lobstr: {
    label: "LOBSTR",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  xbull: {
    label: "xBull",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
      </svg>
    ),
  },
  albedo: {
    label: "Albedo",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2v20M2 12h20" />
      </svg>
    ),
  },
  other: {
    label: "External Wallet",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <path d="M1 10h22" />
      </svg>
    ),
  },
}

interface LinkedWalletsProps {
  userId: string
  onWalletSelect?: (walletAddress: string) => void
  selectedWallet?: string | null
}

export function LinkedWallets({
  userId,
  onWalletSelect,
  selectedWallet,
}: LinkedWalletsProps) {
  const { t } = useLanguage()
  const { address: connectedWallet, openWalletModal } = useStellarWallet()
  const [wallets, setWallets] = useState<LinkedWalletRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLinking, setIsLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadWallets = useCallback(async () => {
    if (!userId) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/wallets/linked?userId=${encodeURIComponent(userId)}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t("linkedWallets.loadError"))
        setWallets([])
        return
      }

      setWallets(data.wallets || [])
    } catch {
      setError(t("linkedWallets.loadError"))
      setWallets([])
    } finally {
      setIsLoading(false)
    }
  }, [userId, t])

  useEffect(() => {
    loadWallets()
  }, [loadWallets])

  useEffect(() => {
    if (connectedWallet) {
      loadWallets()
    }
  }, [connectedWallet, loadWallets])

  const linkWalletAddress = async (walletAddress: string) => {
    if (!userId) return false

    if (wallets.some((w) => w.wallet_address === walletAddress)) {
      setError(t("linkedWallets.alreadyLinked"))
      return false
    }

    setIsLinking(true)
    setError(null)

    try {
      const res = await fetch("/api/wallets/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          walletAddress,
          walletType: "freighter",
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || t("linkedWallets.linkError"))
        return false
      }

      await loadWallets()
      return true
    } catch {
      setError(t("linkedWallets.linkError"))
      return false
    } finally {
      setIsLinking(false)
    }
  }

  const handleConnectWallet = () => {
    openWalletModal(async (addr) => {
      await linkWalletAddress(addr)
    })
  }

  const handleLinkWallet = async () => {
    if (!connectedWallet) return
    await linkWalletAddress(connectedWallet)
  }

  const handleSetPrimary = async (walletId: string) => {
    try {
      const res = await fetch("/api/wallets/set-primary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, walletId }),
      })
      if (res.ok) await loadWallets()
    } catch (err) {
      console.error("Failed to set operating wallet:", err)
    }
  }

  const handleRemoveWallet = async (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId)
    if (wallet?.is_primary) {
      setError(t("linkedWallets.cannotRemovePrimary"))
      return
    }

    try {
      const res = await fetch("/api/wallets/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, walletId }),
      })
      if (res.ok) await loadWallets()
    } catch (err) {
      console.error("Failed to remove wallet:", err)
    }
  }

  const truncateAddress = (addr: string) => {
    if (!addr) return ""
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`
  }

  const hasOperatingWallet = wallets.some((w) => w.is_primary)
  const connectedIsLinked = connectedWallet
    ? wallets.some((w) => w.wallet_address === connectedWallet)
    : false

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Wallet className="h-[18px] w-[18px] text-foreground" />
          <h3 className="text-lg font-semibold text-foreground">{t("linkedWallets.title")}</h3>
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
          <Wallet className="h-[18px] w-[18px] text-foreground" />
          <h3 className="text-lg font-semibold text-foreground">{t("linkedWallets.title")}</h3>
        </div>
        {wallets.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {t("linkedWallets.walletCount").replace("{count}", String(wallets.length))}
          </span>
        )}
      </div>

      <p className="text-sm text-muted-foreground mb-6">{t("linkedWallets.description")}</p>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 text-red-300 hover:text-red-200">
            ×
          </button>
        </div>
      )}

      {wallets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/50 bg-background/40 px-6 py-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0b400]/10 text-[#f0b400]">
            <Wallet className="h-7 w-7" />
          </div>
          <h4 className="text-base font-semibold text-foreground">{t("linkedWallets.noOperatingWallet")}</h4>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            {t("linkedWallets.noOperatingWalletDesc")}
          </p>
          {!connectedWallet ? (
            <Button
              onClick={handleConnectWallet}
              className="mt-6 bg-[#f0b400] text-black hover:bg-[#f0b400]/90"
            >
              {t("linkedWallets.connectWallet")}
            </Button>
          ) : (
            <div className="mt-6 space-y-3">
              <p className="font-mono text-xs text-muted-foreground">{truncateAddress(connectedWallet)}</p>
              <Button
                onClick={handleLinkWallet}
                disabled={isLinking}
                className="bg-[#f0b400] text-black hover:bg-[#f0b400]/90"
              >
                {isLinking ? t("linkedWallets.linking") : t("linkedWallets.linkConnected")}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {wallets.map((wallet) => {
              const typeInfo = walletTypeLabels[wallet.wallet_type] || walletTypeLabels.other
              const isSelected = selectedWallet === wallet.wallet_address
              const isConnected = connectedWallet === wallet.wallet_address
              const isVerified = isConnected

              return (
                <div
                  key={wallet.id}
                  onClick={() => onWalletSelect?.(wallet.wallet_address)}
                  className={cn(
                    "group rounded-xl border p-4 transition-all",
                    isSelected
                      ? "border-[#f0b400]/50 bg-[#f0b400]/10"
                      : "border-border/40 bg-background/50 hover:border-border/60",
                    onWalletSelect && "cursor-pointer"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          wallet.is_primary
                            ? "bg-[#f0b400]/20 text-[#f0b400]"
                            : "bg-muted/50 text-muted-foreground"
                        )}
                      >
                        {typeInfo.icon}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-foreground">
                            {wallet.label || typeInfo.label}
                          </span>
                          {wallet.is_primary && (
                            <span className="rounded-full bg-[#f0b400]/20 px-2 py-0.5 text-[10px] font-medium text-[#f0b400]">
                              {t("linkedWallets.operatingWallet")}
                            </span>
                          )}
                          {isVerified && (
                            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                              {t("linkedWallets.verified")}
                            </span>
                          )}
                          {isConnected && (
                            <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-[10px] font-medium text-green-400">
                              {t("linkedWallets.connected")}
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
                            {t("linkedWallets.setOperating")}
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
                            {t("linkedWallets.remove")}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {connectedWallet && !connectedIsLinked && (
            <Button
              onClick={handleLinkWallet}
              disabled={isLinking}
              className="w-full bg-[#f0b400] text-black hover:bg-[#f0b400]/90"
            >
              {isLinking
                ? t("linkedWallets.linking")
                : `${t("linkedWallets.linkConnected")} (${truncateAddress(connectedWallet)})`}
            </Button>
          )}
        </>
      )}

      {!hasOperatingWallet && wallets.length > 0 && (
        <p className="mt-4 text-xs text-amber-400/90">
          {t("linkedWallets.noOperatingWalletDesc")}
        </p>
      )}
    </div>
  )
}
