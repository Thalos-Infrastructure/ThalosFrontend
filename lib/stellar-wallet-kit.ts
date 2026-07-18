/**
 * Inicialización client-only del Stellar Wallets Kit.
 * Uso: getKit() desde el navegador para abrir el modal "Connect Wallet" y firmar.
 */

import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit"

let kitInstance: StellarWalletsKit | null = null

/**
 * Wait for Freighter to be available in window
 * Freighter injects its API asynchronously, so we need to wait for it
 */
async function waitForFreighter(maxWaitMs = 3000): Promise<boolean> {
  if (typeof window === "undefined") return false
  
  const startTime = Date.now()
  
  // Check if Freighter is already available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).freighter) {
    return true
  }
  
  // Poll for Freighter every 100ms
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((window as any).freighter) {
        clearInterval(checkInterval)
        resolve(true)
      } else if (Date.now() - startTime > maxWaitMs) {
        clearInterval(checkInterval)
        resolve(false)
      }
    }, 100)
  })
}

export async function getKit(): Promise<StellarWalletsKit | null> {
  if (typeof window === "undefined") return null
  if (kitInstance) return kitInstance
  
  try {
    // Wait for Freighter to inject its API (up to 3 seconds)
    await waitForFreighter(3000)
    
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

/**
 * Check if Freighter is installed and available
 */
export function isFreighterAvailable(): boolean {
  if (typeof window === "undefined") return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(window as any).freighter
}
