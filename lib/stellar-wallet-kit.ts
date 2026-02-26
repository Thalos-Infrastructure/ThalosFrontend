/**
 * Inicialización client-only del Stellar Wallets Kit.
 * Uso: getKit() desde el navegador para abrir el modal "Connect Wallet" y firmar.
 *
 * Only loads Freighter, xBull, LOBSTR and Hana modules to avoid MetaMask/WalletConnect errors.
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
      FREIGHTER_ID,
    } = mod
    kitInstance = new Kit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: [
        new FreighterModule(),
        new xBullModule(),
        new LobstrModule(),
        new HanaModule(),
      ],
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
