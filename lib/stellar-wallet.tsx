"use client"

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react"
import {
  getKit,
  clearKit,
  detectFreighter,
  prewarmWalletDetection,
} from "@/lib/stellar-wallet-kit"
import {
  signTransaction as unifiedSign,
  signMessage as unifiedSignMessage,
} from "@/lib/signing"
import {
  getOrCreateProfile,
  type Profile,
} from "@/lib/actions/profile"
import { useAuthStore } from "@/lib/auth-store"
import { linkWallet } from "@/lib/api/wallets"

import { STELLAR_WALLET_KEY } from "@/lib/signing/session"

const STELLAR_PROFILE_KEY = "thalos_profile"

/**
 * El Kit rechaza con `IKitError` — un objeto plano, no una instancia de Error — así
 * que un `e instanceof Error` se traga el mensaje real. El código -1 significa que
 * el usuario cerró el modal, que no es un fallo que haya que mostrarle.
 */
type KitError = {
  code?: number
  message?: string
}

const KIT_ERROR_USER_CLOSED_MODAL = -1

function asKitError(e: unknown): KitError | null {
  return typeof e === "object" && e !== null
    ? (e as KitError)
    : null
}

function isUserClosedModal(e: unknown): boolean {
  return asKitError(e)?.code === KIT_ERROR_USER_CLOSED_MODAL
}

function errorMessage(
  e: unknown,
  fallback: string,
): string {
  if (e instanceof Error) return e.message

  const message = asKitError(e)?.message

  return typeof message === "string" && message
    ? message
    : fallback
}

type StellarWalletContextValue = {
  address: string | null
  profile: Profile | null
  isConnecting: boolean
  walletError: string | null

  /** Abre el modal "Connect Wallet" del Stellar Wallets Kit (xBull, Ledger, Freighter, LOBSTR, etc.) */
  openWalletModal: (
    onConnected?: (address: string) => void,
    accountType?: "personal" | "enterprise",
  ) => Promise<void>

  disconnect: () => void

  signTransaction: (
    xdr: string,
    networkPassphrase: string,
  ) => Promise<{ signedTxXdr: string } | null>

  signMessage: (
    message: string,
  ) => Promise<{
    signedMessage: string
    signerAddress: string
  } | null>

  refreshProfile: () => Promise<void>
}

const StellarWalletContext =
  createContext<StellarWalletContextValue | null>(null)

export function StellarWalletProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [address, setAddress] = useState<string | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)

  // AuthProvider wraps StellarWalletProvider (see app/layout.tsx), so the app JWT
  // store is available here. Connecting a wallet does not mint an app JWT.

  useEffect(() => {
    if (typeof window === "undefined") return

    // Warm up wallet detection in the background: Freighter's content script can
    // take a moment to start answering, and doing this at mount means the click
    // path finds it ready instead of racing a 2s timeout.
    prewarmWalletDetection()

    const storedAddress = sessionStorage.getItem(
      STELLAR_WALLET_KEY,
    )

    const storedProfile = sessionStorage.getItem(
      STELLAR_PROFILE_KEY,
    )

    if (storedAddress) {
      setAddress(storedAddress)
    }

    if (storedProfile) {
      try {
        setProfile(JSON.parse(storedProfile))
      } catch {
        // ignore parse errors
      }
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!address) return

    const {
      profile: fetchedProfile,
    } = await getOrCreateProfile(address)

    if (fetchedProfile) {
      setProfile(fetchedProfile)

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          STELLAR_PROFILE_KEY,
          JSON.stringify(fetchedProfile),
        )
      }
    }
  }, [address])

  const openWalletModal = useCallback(
    async (
      onConnected?: (address: string) => void,
      accountType: "personal" | "enterprise" = "personal",
    ) => {
      setIsConnecting(true)
      setWalletError(null)

      try {
        /*
         * Deliberately NOT calling clearKit() here. Re-initialising on every open
         * discarded the warm channel to the extension and restarted detection from
         * cold, which is what made Freighter intermittently show up as "not
         * installed" for people who have it installed. clearKit() belongs in
         * disconnect(), where a reset is actually wanted.
         */
        const kit = await getKit()

        if (!kit) {
          setWalletError(
            "Stellar Wallets Kit no disponible.",
          )
          return
        }

        /*
         * Give Freighter's content script a second chance to answer before the
         * modal decides what to render (see detectFreighter). We ignore the result
         * on purpose: other wallets must still be selectable, and the modal
         * refreshes availability itself — this only makes that refresh find a
         * channel that is already awake.
         */
        await detectFreighter(2)

        /*
         * En 2.x el modal es una promesa: resuelve con la dirección ya pedida a la
         * wallet elegida (antes llegaba por el callback onWalletSelected) y rechaza
         * si el usuario lo cierra. Refresca por su cuenta las wallets disponibles.
         */
        const { address: addr } = await kit.authModal()

        setAddress(addr)

        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            STELLAR_WALLET_KEY,
            addr,
          )
        }

        // Create or get profile in Supabase
        const {
          profile: userProfile,
          error: profileError,
        } = await getOrCreateProfile(
          addr,
          accountType,
        )

        if (userProfile) {
          setProfile(userProfile)

          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              STELLAR_PROFILE_KEY,
              JSON.stringify(userProfile),
            )
          }
        }

        if (profileError) {
          console.error(
            "Profile error:",
            profileError,
          )
        }

        /*
         * Connecting a wallet here does NOT sign anyone in. Since #108 the only
         * way into Thalos is Pollar, and a wallet the user brings goes through
         * Pollar's Stellar Wallets Kit adapter — which makes it a Pollar session
         * like any other. Minting a JWT from a side connection would recreate
         * the second auth path that change removed, and would leave the account
         * signed in as an address it never authenticated with.
         *
         * What remains is connecting a wallet to prove it is yours (/profile →
         * Linked Wallets). That proof is a message signature, handled by
         * lib/signing/providers/kit.ts, not a login.
         */

        onConnected?.(addr)

        /*
         * Persist the Kit-connected wallet to user_wallets (non-fatal).
         *
         * This uses the existing authenticated app session. Connecting a wallet
         * does not create a new authentication session.
         */
        try {
          const {
            token: authToken,
          } = useAuthStore.getState?.() ?? {}

          if (authToken) {
            await linkWallet(
              {
                wallet_address: addr,
                wallet_type: "other",
              },
              authToken,
            )
          }
        } catch {
          // Non-fatal — wallet works for signing without persistence
        }
      } catch (e) {
        /*
         * Cerrar el modal es una cancelación normal, no un error que mostrar.
         */
        if (isUserClosedModal(e)) return

        setWalletError(
          errorMessage(
            e,
            "Error al abrir el modal de billeteras.",
          ),
        )
      } finally {
        setIsConnecting(false)
      }
    },
    [],
  )

  const disconnect = useCallback(async () => {
    try {
      const kit = await getKit()

      if (kit) {
        await kit.disconnect()
      }
    } catch {
      // ignore
    }

    clearKit()

    setAddress(null)
    setProfile(null)
    setWalletError(null)

    if (typeof window !== "undefined") {
      sessionStorage.removeItem(
        STELLAR_WALLET_KEY,
      )

      sessionStorage.removeItem(
        STELLAR_PROFILE_KEY,
      )
    }
  }, [])

  const signTransaction = useCallback(
    async (
      xdr: string,
      networkPassphrase: string,
    ): Promise<{
      signedTxXdr: string
    } | null> => {
      if (!address) return null

      // Route through the unified signer (Stellar Wallets Kit)
      return unifiedSign(
        xdr,
        networkPassphrase,
        address,
      )
    },
    [address],
  )

  /*
   * Use this for wallet ownership proof challenges.
   *
   * The caller is responsible for obtaining and preparing the exact challenge
   * string that should be signed. This function only delegates the signing to
   * the unified Stellar Wallets Kit signer.
   */
  const signMessage = useCallback(
    async (
      message: string,
    ): Promise<{
      signedMessage: string
      signerAddress: string
    } | null> => {
      if (!address) return null

      // Route through the unified signer (Stellar Wallets Kit)
      return unifiedSignMessage(
        message,
        address,
      )
    },
    [address],
  )

  const value: StellarWalletContextValue = {
    address,
    profile,
    isConnecting,
    walletError,
    openWalletModal,
    disconnect,
    signTransaction,
    signMessage,
    refreshProfile,
  }

  return (
    <StellarWalletContext.Provider value={value}>
      {children}
    </StellarWalletContext.Provider>
  )
}

export function useStellarWallet() {
  const ctx = useContext(
    StellarWalletContext,
  )

  if (!ctx) {
    throw new Error(
      "useStellarWallet must be used within StellarWalletProvider",
    )
  }

  return ctx
}