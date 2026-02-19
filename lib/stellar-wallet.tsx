"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { getKit, clearKit } from "@/lib/stellar-wallet-kit"

const STELLAR_WALLET_KEY = "thalos_stellar_address"

type StellarWalletContextValue = {
  address: string | null
  isConnecting: boolean
  walletError: string | null
  /** Abre el modal "Connect Wallet" del Stellar Wallets Kit (xBull, Ledger, Freighter, LOBSTR, etc.) */
  openWalletModal: (onConnected?: (address: string) => void) => Promise<void>
  disconnect: () => void
  signTransaction: (xdr: string, networkPassphrase: string) => Promise<{ signedTxXdr: string } | null>
}

const StellarWalletContext = createContext<StellarWalletContextValue | null>(null)

export function StellarWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = sessionStorage.getItem(STELLAR_WALLET_KEY)
    if (stored) setAddress(stored)
  }, [])

  const openWalletModal = useCallback(
    async (onConnected?: (address: string) => void) => {
      setIsConnecting(true)
      setWalletError(null)
      try {
        const kit = await getKit()
        if (!kit) {
          setWalletError("Stellar Wallets Kit no disponible.")
          return
        }
        await kit.openModal({
          modalTitle: "Connect Wallet",
          onWalletSelected: async (option) => {
            try {
              kit.setWallet(option.id)
              const { address: addr } = await kit.getAddress()
              setAddress(addr)
              if (typeof window !== "undefined") sessionStorage.setItem(STELLAR_WALLET_KEY, addr)
              onConnected?.(addr)
            } catch (e) {
              const msg = e instanceof Error ? e.message : "No se pudo obtener la dirección."
              setWalletError(msg)
            } finally {
              setIsConnecting(false)
            }
          },
          onClosed: () => {
            setIsConnecting(false)
          },
        })
      } catch (e) {
        const message = e instanceof Error ? e.message : "Error al abrir el modal de billeteras."
        setWalletError(message)
      } finally {
        setIsConnecting(false)
      }
    },
    []
  )

  const disconnect = useCallback(async () => {
    try {
      const kit = await getKit()
      if (kit) await kit.disconnect()
    } catch {
      // ignore
    }
    clearKit()
    setAddress(null)
    setWalletError(null)
    if (typeof window !== "undefined") sessionStorage.removeItem(STELLAR_WALLET_KEY)
  }, [])

  const signTransaction = useCallback(
    async (xdr: string, networkPassphrase: string): Promise<{ signedTxXdr: string } | null> => {
      if (!address) return null
      try {
        const kit = await getKit()
        if (!kit) return null
        const result = await kit.signTransaction(xdr, { networkPassphrase, address })
        return result?.signedTxXdr ? { signedTxXdr: result.signedTxXdr } : null
      } catch {
        return null
      }
    },
    [address]
  )

  const value: StellarWalletContextValue = {
    address,
    isConnecting,
    walletError,
    openWalletModal,
    disconnect,
    signTransaction,
  }

  return (
    <StellarWalletContext.Provider value={value}>
      {children}
    </StellarWalletContext.Provider>
  )
}

export function useStellarWallet() {
  const ctx = useContext(StellarWalletContext)
  if (!ctx) throw new Error("useStellarWallet must be used within StellarWalletProvider")
  return ctx
}
