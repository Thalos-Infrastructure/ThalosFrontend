"use client"

/**
 * Thalos wrapper around the Accesly SDK provider (#109).
 *
 * - `ThalosAcceslyProvider` wraps the app tree (see app/layout.tsx). Config
 *   comes from env; without NEXT_PUBLIC_ACCESLY_APP_ID it falls back to the
 *   SDK's public dev Cognito pool (testnet) so local dev works out of the box.
 * - `AcceslySignerBridge` (rendered inside) registers the signing runtime the
 *   unified signer's accesly provider (#110) delegates to.
 */

import React, { useEffect, useMemo, useRef } from "react"
import { AcceslyProvider, ENVIRONMENT_DEFAULTS, useAccesly } from "@accesly/react"
import { IndexedDbDeviceStore, zeroize } from "@accesly/core"
import { registerAcceslyRuntime, type AcceslyRuntime } from "@/lib/signing/accesly-bridge"
import { getStoredAuthWallet } from "@/lib/signing/session"
import { useAuthStore } from "@/lib/auth-store"
import { isAcceslyBackedUser, shouldCloseAcceslySession } from "./session-coherence"
import { gAddressFromOwnerPubkey, reconstructSeed, signChallenge } from "./signing"

const ACCESLY_APP_ID = process.env.NEXT_PUBLIC_ACCESLY_APP_ID || "thalos-local"
const ACCESLY_ENV = (process.env.NEXT_PUBLIC_ACCESLY_ENV || "dev") as "dev" | "staging" | "prod"

// Without a registered appId, pass the dev-pool cognitoConfig explicitly —
// this skips the /app-config/:appId bootstrap fetch (which would 404).
const cognitoOverride = process.env.NEXT_PUBLIC_ACCESLY_APP_ID
  ? undefined
  : ENVIRONMENT_DEFAULTS.dev.cognito

export function ThalosAcceslyProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_ACCESLY_APP_ID) {
      console.warn(
        "[accesly] NEXT_PUBLIC_ACCESLY_APP_ID is not set — falling back to the SDK's public dev Cognito pool (Stellar TESTNET). " +
          "Fine for local dev; register a Thalos app at dev.accesly.xyz and set the app id for shared/staging/mainnet environments.",
      )
    }
  }, [])

  // The React adapter defaults to an IN-MEMORY device store, which loses the
  // passkey credential record on every reload (wallet.bootstrap then throws
  // WalletAlreadyExistsError on the next session). Persist it in IndexedDB.
  const overrides = useMemo(
    () => (typeof window === "undefined" ? undefined : { deviceStore: new IndexedDbDeviceStore() }),
    [],
  )
  return (
    <AcceslyProvider appId={ACCESLY_APP_ID} env={ACCESLY_ENV} cognitoConfig={cognitoOverride} overrides={overrides}>
      <AcceslySignerBridge />
      {children}
    </AcceslyProvider>
  )
}

/**
 * Registers the Accesly signing runtime for the unified signer. Renders
 * nothing. Signing reconstructs the ed25519 key per operation (passkey
 * prompt via `unlockForSigning`) and zeroizes it right after.
 */
function AcceslySignerBridge() {
  const accesly = useAccesly()
  const { status, username } = accesly.auth
  const { user, hydrated } = useAuthStore()

  // Keep session state coherent on logout: when a Thalos session that was
  // backed by Accesly ends, close the Accesly (Cognito) session too so a
  // stale passkey session can't fight a later Freighter/Pollar login.
  // Decision matrix lives (tested) in session-coherence.ts — it only fires
  // on the transition accesly-user → logged-out, never during login.
  const hadAcceslyUser = useRef(false)
  useEffect(() => {
    if (!hydrated) return
    if (
      shouldCloseAcceslySession({
        hydrated,
        hadAcceslyUser: hadAcceslyUser.current,
        user,
        acceslyStatus: status,
      })
    ) {
      accesly.auth.signOut().catch(() => {
        // Non-fatal — the Cognito session simply expires on its own.
      })
    }
    hadAcceslyUser.current = isAcceslyBackedUser(user)
  }, [accesly.auth, hydrated, status, user])

  useEffect(() => {
    if (status !== "authenticated" || !username) {
      registerAcceslyRuntime(null)
      return
    }

    const withReconstructedSeed = async <T,>(
      fn: (seed: Uint8Array, ownerPubkey: Uint8Array) => Promise<T> | T,
    ): Promise<T> => {
      const material = await accesly.wallet.unlockForSigning(username)
      let seed: Uint8Array | null = null
      try {
        seed = await reconstructSeed(accesly._internal.endpoints, material)
        return await fn(seed, material.ownerPubkey)
      } finally {
        if (seed) zeroize(seed)
        zeroize(material.fragmentF1Plain)
        zeroize(material.fragmentF2Key)
      }
    }

    const runtime: AcceslyRuntime = {
      getGAddress: () => {
        const wallet = getStoredAuthWallet()
        return wallet?.provider === "accesly" ? wallet.publicKey : null
      },

      async signTransaction(xdr) {
        return withReconstructedSeed(async (seed, ownerPubkey) => {
          const { signedXdr } = await accesly.tx.signRawXdr({
            transactionXdr: xdr,
            ed25519Seed: seed,
            expectedPublicKey: ownerPubkey,
          })
          return { signedTxXdr: signedXdr }
        })
      },

      async signMessage(message) {
        return withReconstructedSeed((seed, ownerPubkey) => ({
          signedMessage: signChallenge(message, seed),
          signerAddress: gAddressFromOwnerPubkey(ownerPubkey),
        }))
      },
    }

    registerAcceslyRuntime(runtime)
    return () => registerAcceslyRuntime(null)
  }, [accesly, status, username])

  return null
}
