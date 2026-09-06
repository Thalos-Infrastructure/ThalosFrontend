"use client"

import { useStellarWallet } from "@/lib/stellar-wallet"
import { useHasSigningWallet } from "@/lib/use-current-address"
import { usePollarWallet } from "@/lib/pollar-wallet"
import { useAuthStore } from "@/lib/auth-store"
import { useSignOut } from "@/lib/use-sign-out"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface WalletGuardProps {
  children: React.ReactNode
  message?: string
  className?: string
}

export function WalletGuard({ children, message, className }: WalletGuardProps) {
  // "Can this wallet sign?", not "is it external?". Those were the same thing
  // when the Kit was the only wallet; since #110 they are not.
  if (useHasSigningWallet()) {
    return <>{children}</>
  }

  return <WalletPrompt message={message} className={className} />
}

/**
 * True when the account has a wallet and it is the Pollar session behind it
 * that has lapsed — not the same thing as having no wallet, and it needs a
 * different fix.
 */
function useSessionLapsed(): boolean {
  const { hasSession } = usePollarWallet()
  const { user, token } = useAuthStore()

  return (
    !hasSession &&
    Boolean(token) &&
    Boolean(user?.wallet?.publicKey) &&
    user?.wallet?.provider !== "accesly"
  )
}

/**
 * Shown when the wallet is fine but the session that signs for it has lapsed.
 * The action signs out on purpose: the Thalos JWT is still valid for days, so
 * leaving it in place would drop the user straight back into this state.
 */
function SessionLapsedPrompt({
  onSignIn,
  className,
}: {
  onSignIn: () => void
  className?: string
}) {
  const { storageDegraded } = usePollarWallet()

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-xl border border-[#f0b400]/20 bg-[#f0b400]/5 p-8 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0b400]/10">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f0b400"
          strokeWidth="1.5"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-[#f0b400]">Session expired</p>
        <p className="mt-1 text-sm text-white/60 max-w-sm">
          Your wallet is still here, but the session that signs for it has ended. Sign in again to
          operate escrow agreements.
        </p>
        {storageDegraded && (
          <p className="mt-2 text-xs text-white/40 max-w-sm">
            This browser is blocking storage for this site, so the session cannot be kept between
            reloads.
          </p>
        )}
      </div>
      <Button
        onClick={onSignIn}
        className="rounded-full bg-[#f0b400] px-6 text-sm font-semibold text-background hover:bg-[#f0b400]/90"
      >
        Sign in again
      </Button>
    </div>
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
  const signOut = useSignOut()
  const sessionLapsed = useSessionLapsed()
  const handleConnect = onConnect || (() => openWalletModal())

  // Branching here rather than in WalletGuard because the dashboards render
  // WalletPrompt directly; putting it in the guard would have fixed one of the
  // four places this shows up.
  if (sessionLapsed) {
    return <SessionLapsedPrompt onSignIn={signOut} className={className} />
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-xl border border-[#f0b400]/20 bg-[#f0b400]/5 p-8 text-center",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0b400]/10">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f0b400"
          strokeWidth="1.5"
        >
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
