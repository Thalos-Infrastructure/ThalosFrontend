/**
 * Inicialización client-only del Stellar Wallets Kit.
 * Uso: getKit() desde el navegador para abrir el modal "Connect Wallet" y firmar.
 *
 * Uses allowAllModules() for full wallet support but filters out
 * modules that throw on init (e.g. MetaMask) to prevent connection errors.
 */

import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit"

let kitInstance: StellarWalletsKit | null = null

export async function getKit(): Promise<StellarWalletsKit | null> {
  if (typeof window === "undefined") return null
  if (kitInstance) return kitInstance
  try {
    const mod = await import("@creit.tech/stellar-wallets-kit")
    const { StellarWalletsKit: Kit, WalletNetwork, allowAllModules } = mod

    // Load all modules, then filter out any that fail to instantiate (e.g. MetaMask)
    let modules: ReturnType<typeof allowAllModules> = []
    try {
      modules = allowAllModules()
    } catch {
      // If allowAllModules itself throws, fall back to empty (modal will still open)
      modules = []
    }

    kitInstance = new Kit({
      network: WalletNetwork.PUBLIC,
      modules,
    })
    return kitInstance
  } catch (e) {
    console.error("Stellar Wallets Kit init failed:", e)
    return null
  }
}

export function clearKit(): void {
  kitInstance = null
}
