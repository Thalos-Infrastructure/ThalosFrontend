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

import React, { useEffect } from "react"
import { AcceslyProvider, ENVIRONMENT_DEFAULTS, useAccesly } from "@accesly/react"
import { zeroize } from "@accesly/core"
import { registerAcceslyRuntime, type AcceslyRuntime } from "@/lib/signing/accesly-bridge"
import { getStoredAuthWallet } from "@/lib/signing/session"
import { gAddressFromOwnerPubkey, reconstructSeed, signChallenge } from "./signing"

const ACCESLY_APP_ID = process.env.NEXT_PUBLIC_ACCESLY_APP_ID || "thalos-local"
const ACCESLY_ENV = (process.env.NEXT_PUBLIC_ACCESLY_ENV || "dev") as "dev" | "staging" | "prod"

// Without a registered appId, pass the dev-pool cognitoConfig explicitly —
// this skips the /app-config/:appId bootstrap fetch (which would 404).
const cognitoOverride = process.env.NEXT_PUBLIC_ACCESLY_APP_ID
  ? undefined
  : ENVIRONMENT_DEFAULTS.dev.cognito

export function ThalosAcceslyProvider({ children }: { children: React.ReactNode }) {
  return (
    <AcceslyProvider appId={ACCESLY_APP_ID} env={ACCESLY_ENV} cognitoConfig={cognitoOverride}>
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
