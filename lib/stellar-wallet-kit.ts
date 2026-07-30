/**
 * Inicialización client-only del Stellar Wallets Kit 2.x.
 * Uso: getKit() desde el navegador para abrir el modal "Connect Wallet" y firmar.
 *
 * Cambios reales de 1.x a 2.x (verificados contra el paquete 2.5.0):
 * - El Kit dejó de instanciarse: `new StellarWalletsKit({...})` ya no acepta argumentos.
 *   Se configura una sola vez con el estático `StellarWalletsKit.init({ modules, network })`.
 * - `allowAllModules()` ya no existe; ahora es `defaultModules()`, y vive en su propio
 *   subpath (`/modules/utils`), no en la raíz ni en `/sdk`.
 * - `WalletNetwork` ya no existe; el enum es `Networks` y vive en `/types`.
 *
 * Por eso getKit() devuelve la clase misma y no un objeto.
 */

import { STELLAR_NETWORK } from "@/lib/config"

/** El Kit 2.x expone todo como estáticos, así que "el kit" es la propia clase. */
type Kit = typeof import("@creit.tech/stellar-wallets-kit/sdk").StellarWalletsKit

let kitPromise: Promise<Kit | null> | null = null

/**
 * Wait for Freighter to be available in window
 * Freighter injects its API asynchronously, so we need to wait for it
 */
async function waitForFreighter(maxWaitMs = 3000): Promise<boolean> {
  if (typeof window === "undefined") return false

  const startTime = Date.now()

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

async function initKit(): Promise<Kit> {
  // Wait for Freighter to inject its API (up to 3 seconds)
  await waitForFreighter(3000)

  const [{ StellarWalletsKit }, { defaultModules }, { Networks }] = await Promise.all([
    import("@creit.tech/stellar-wallets-kit/sdk"),
    import("@creit.tech/stellar-wallets-kit/modules/utils"),
    import("@creit.tech/stellar-wallets-kit/types"),
  ])

  // La red sale de config.ts, que es la fuente única.
  const network = STELLAR_NETWORK === "MAINNET" ? Networks.PUBLIC : Networks.TESTNET

  StellarWalletsKit.init({
    modules: defaultModules(),
    network,
  })

  return StellarWalletsKit
}

export async function getKit(): Promise<Kit | null> {
  if (typeof window === "undefined") return null

  if (!kitPromise) {
    kitPromise = initKit().catch((e) => {
      console.error("Stellar Wallets Kit init failed:", e)
      // Descartamos la promesa fallida para que el siguiente intento reinicialice.
      kitPromise = null
      return null
    })
  }

  return kitPromise
}

/** Fuerza que el siguiente getKit() vuelva a inicializar el Kit. */
export function clearKit(): void {
  kitPromise = null
}

/**
 * Check if Freighter is installed and available
 */
export function isFreighterAvailable(): boolean {
  if (typeof window === "undefined") return false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return !!(window as any).freighter
}
