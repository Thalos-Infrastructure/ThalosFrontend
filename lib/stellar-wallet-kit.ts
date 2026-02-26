/**
 * Inicialización client-only del Stellar Wallets Kit.
 * Uso: getKit() desde el navegador para abrir el modal "Connect Wallet" y firmar.
 */

import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit"

let kitInstance: StellarWalletsKit | null = null

export async function getKit(): Promise<StellarWalletsKit | null> {
  if (typeof window === "undefined") return null
  if (kitInstance) return kitInstance
  try {
    const mod = await import("@creit.tech/stellar-wallets-kit")
    const { StellarWalletsKit: Kit, WalletNetwork, allowAllModules } = mod
    kitInstance = new Kit({
      network: WalletNetwork.PUBLIC,
      modules: allowAllModules(),
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
