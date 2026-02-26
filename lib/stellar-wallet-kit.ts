/**
 * Inicialización client-only del Stellar Wallets Kit.
 * Uso: getKit() desde el navegador para abrir el modal "Connect Wallet" y firmar.
 *
 * Explicitly loads all Stellar-native wallet modules (Freighter, xBull, Albedo,
 * Rabet, LOBSTR, Hana) instead of allowAllModules() to avoid loading the
 * MetaMask bridge module that causes "Failed to connect to MetaMask" errors.
 */

import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit"

let kitInstance: StellarWalletsKit | null = null

export async function getKit(): Promise<StellarWalletsKit | null> {
  if (typeof window === "undefined") return null
  if (kitInstance) return kitInstance
  try {
    const mod = await import("@creit.tech/stellar-wallets-kit")
    const {
      StellarWalletsKit: Kit,
      WalletNetwork,
      FreighterModule,
      xBullModule,
      LobstrModule,
      HanaModule,
      AlbedoModule,
      RabetModule,
      FREIGHTER_ID,
    } = mod as any

    // Build module list, gracefully skip any that fail to construct
    const moduleDefs = [
      FreighterModule,
      xBullModule,
      AlbedoModule,
      RabetModule,
      LobstrModule,
      HanaModule,
    ]
    const modules: InstanceType<any>[] = []
    for (const Mod of moduleDefs) {
      if (!Mod) continue
      try { modules.push(new Mod()) } catch { /* skip unavailable */ }
    }

    kitInstance = new Kit({
      network: WalletNetwork.PUBLIC,
      selectedWalletId: FREIGHTER_ID,
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
