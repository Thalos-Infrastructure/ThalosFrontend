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

export const FREIGHTER_ID = "freighter"

let kitPromise: Promise<Kit | null> | null = null
let prewarmed = false

async function initKit(): Promise<Kit> {
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
  prewarmed = false
}

/**
 * Synchronous fast path only.
 *
 * `@stellar/freighter-api`'s `isConnected()` short-circuits on this global, but
 * not every Freighter build sets it — so `false` here does NOT mean the extension
 * is missing. Use it for wording an error, never to decide availability; that is
 * what {@link detectFreighter} is for.
 */
export function isFreighterAvailable(): boolean {
  if (typeof window === "undefined") return false
  return !!(window as any).freighter
}

/**
 * Asks the Kit whether Freighter is actually reachable, retrying before giving up.
 *
 * Why the retry: the Kit's `FreighterModule.isAvailable()` calls `isConnected()`
 * from `@stellar/freighter-api`, which — absent the `window.freighter` fast path —
 * does a `postMessage` handshake with the extension's content script and
 * **resolves `{isConnected: false}` after a 2s timeout**. On a cold browser or a
 * busy tab that timeout wins the race, the Kit concludes Freighter is missing, and
 * the modal offers to install an extension the user already has. A second attempt
 * lands after the content script is listening and answers immediately.
 *
 * Never blocks the modal: a `false` result just means we could not confirm it.
 */
export async function detectFreighter(attempts = 2): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (isFreighterAvailable()) return true

  const kit = await getKit()
  if (!kit) return false

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const wallets = await kit.refreshSupportedWallets()
      if (wallets.some((w) => w.id === FREIGHTER_ID && w.isAvailable)) return true
    } catch (e) {
      console.warn(`[wallet-kit] freighter detection attempt ${attempt + 1} failed:`, e)
    }
  }

  return false
}

/**
 * Warms wallet detection in the background at app start, so the handshake above
 * has already completed by the time the user clicks "Connect Wallet".
 *
 * Fire-and-forget and idempotent; failures are swallowed on purpose.
 */
export function prewarmWalletDetection(): void {
  if (typeof window === "undefined" || prewarmed) return
  prewarmed = true
  void detectFreighter(1).catch(() => false)
}
