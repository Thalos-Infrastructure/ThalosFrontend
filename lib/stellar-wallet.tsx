"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"

const STELLAR_WALLET_KEY = "thalos_stellar_address"

type StellarWalletContextValue = {
  address: string | null
  isConnecting: boolean
  walletError: string | null
  connect: () => Promise<boolean>
  disconnect: () => void
  isFreighterAvailable: boolean | null
}

const StellarWalletContext = createContext<StellarWalletContextValue | null>(null)

export function StellarWalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [isFreighterAvailable, setIsFreighterAvailable] = useState<boolean | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = sessionStorage.getItem(STELLAR_WALLET_KEY)
    if (stored) setAddress(stored)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    import("@stellar/freighter-api")
      .then(({ isConnected }) => isConnected())
      .then((res) => setIsFreighterAvailable(Boolean(res?.isConnected)))
      .catch(() => setIsFreighterAvailable(false))
  }, [])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setWalletError(null)
    try {
      const { requestAccess } = await import("@stellar/freighter-api")
      const result = await requestAccess()
      if (result.error) {
        setWalletError(typeof result.error === "string" ? result.error : result.error.message ?? "Access denied")
        return false
      }
      if (result.address) {
        setAddress(result.address)
        if (typeof window !== "undefined") sessionStorage.setItem(STELLAR_WALLET_KEY, result.address)
        return true
      }
      setWalletError("Could not get wallet address")
      return false
    } catch (e) {
      const message = e instanceof Error ? e.message : "Freighter is not installed or not unlocked"
      setWalletError(message)
      return false
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    setAddress(null)
    setWalletError(null)
    if (typeof window !== "undefined") sessionStorage.removeItem(STELLAR_WALLET_KEY)
  }, [])

  const value: StellarWalletContextValue = {
    address,
    isConnecting,
    walletError,
    connect,
    disconnect,
    isFreighterAvailable,
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
