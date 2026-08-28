/**
 * Client-only PollarClient singleton (#108). Mirrors lib/stellar-wallet-kit.ts.
 *
 * Shared by the React provider and by lib/signing/providers/social.ts, a plain
 * module called from agreementActions that cannot read React context.
 */

import { PollarClient, type WalletAdapter } from "@pollar/core"
import { POLLAR_ENABLED, POLLAR_PUBLISHABLE_KEY, STELLAR_NETWORK } from "@/lib/config"

let client: PollarClient | null = null
/**
 * The in-flight build. Memoized because `ensurePollarClient` awaits a dynamic
 * import before it can assign `client`, so two callers that both arrive while
 * that import is pending would both sail past a `if (client)` check and build a
 * second client. React invokes effects twice in development, so that race is
 * the common case, not a rare one — and a second PollarClient means the login
 * driven on one instance is watched on another, which looks like the session
 * vanishing the moment a flow starts.
 */
let building: Promise<PollarClient | null> | null = null

function build(walletAdapters?: WalletAdapter[]): PollarClient {
  return new PollarClient({
    apiKey: POLLAR_PUBLISHABLE_KEY,
    // Pollar spells the network lowercase; lib/config.ts stays the source of truth.
    stellarNetwork: STELLAR_NETWORK === "MAINNET" ? "mainnet" : "testnet",
    ...(walletAdapters?.length ? { walletAdapters } : {}),
  })
}

/**
 * The one client, or null before `ensurePollarClient` has finished building it
 * (and always on the server, where PollarClient cannot read localStorage).
 *
 * Synchronous because lib/signing/providers/social.ts is a plain module that
 * cannot await. It deliberately does NOT build one of its own: a second
 * PollarClient gets its own DPoP key and its own view of the session, so the
 * flow driven on one instance would be watched on another. Callers already
 * treat null as "no wallet available", which is the honest answer here.
 *
 * Everything that calls this runs after PollarWalletProvider has mounted from
 * the root layout, so in practice the client exists by then.
 */
export function getPollarClient(): PollarClient | null {
  if (typeof window === "undefined") return null
  if (!POLLAR_ENABLED) return null
  return client
}

/**
 * The full client, with the Stellar Wallets Kit registered as wallet adapters so
 * `login({ provider })` can reach Freighter, xBull, Lobstr and the rest.
 *
 * Async because the adapter package imports the Kit eagerly and the Kit defines
 * custom elements on import, which throws during SSR — the same reason
 * lib/stellar-wallet-kit.ts loads the Kit dynamically. PollarClient only takes
 * `walletAdapters` in its constructor, so the adapters have to be resolved
 * before the client exists rather than registered onto a live one.
 *
 * Called once from PollarWalletProvider at mount, well before any UI can start
 * a login, and cached in the same singleton `getPollarClient` returns.
 */
export function ensurePollarClient(): Promise<PollarClient | null> {
  if (typeof window === "undefined") return Promise.resolve(null)
  if (!POLLAR_ENABLED) return Promise.resolve(null)
  if (client) return Promise.resolve(client)

  // Assigned before the first await, so a concurrent caller joins this build
  // instead of starting a second one.
  building ??= (async () => {
    try {
      const [{ stellarWalletsKitAdapters }, { Networks }] = await Promise.all([
        import("@pollar/stellar-wallets-kit-adapter"),
        import("@creit.tech/stellar-wallets-kit/types"),
      ])

      client ??= build(
        stellarWalletsKitAdapters({
          network: STELLAR_NETWORK === "MAINNET" ? Networks.PUBLIC : Networks.TESTNET,
        }),
      )
    } catch (e) {
      // A failed adapter import must not cost the user every other login method,
      // so fall back to a client that can still do Google / GitHub / email.
      console.error("[pollar] could not load the Stellar Wallets Kit adapters:", e)
      client ??= build()
    }

    return client
  })()

  return building
}

/** Drops the singleton so the next call rebuilds it (logout/tests). */
export function clearPollarClient(): void {
  client = null
  building = null
}
