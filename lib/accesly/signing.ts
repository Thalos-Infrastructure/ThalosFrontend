/**
 * Low-level Accesly signing helpers shared by the signer bridge and the
 * login flow.
 *
 * The ed25519 seed lives split in Shamir fragments: F1 (device, decrypted via
 * the passkey PRF) + F2 (backend, fetched per-operation over an ephemeral
 * X25519 session). Reconstruction mirrors the SDK's own `tx.send` sequence.
 * Every reconstructed seed is zeroized by the caller after use.
 */

import {
  generateX25519Keypair,
  unwrapSessionFragment2,
  reconstructFromPlainAndEncrypted,
} from "@accesly/core"
import { signEd25519 } from "@accesly/core/crypto"
import { StrKey } from "@stellar/stellar-sdk"

/** Minimal surface of `useAccesly()._internal.endpoints` that we need. */
export interface AcceslyEndpointsLike {
  getFragment2(input: { clientEphemeralPubkey: string }): Promise<unknown>
}

/** Minimal surface of `wallet.unlockForSigning()` result that we need. */
export interface AcceslySigningMaterial {
  readonly fragmentF1Plain: Uint8Array
  readonly fragmentF2Key: Uint8Array
  readonly ownerPubkey: Uint8Array
}

function base64FromBytes(bytes: Uint8Array): string {
  let binary = ""
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

/**
 * Fetch F2 from the Accesly backend (ephemeral X25519 session) and combine it
 * with the unlocked F1 → 32-byte ed25519 seed. Caller MUST zeroize the result.
 */
export async function reconstructSeed(
  endpoints: AcceslyEndpointsLike,
  material: AcceslySigningMaterial,
): Promise<Uint8Array> {
  const ephemeral = generateX25519Keypair()
  const wrappedF2 = await endpoints.getFragment2({
    clientEphemeralPubkey: base64FromBytes(ephemeral.publicKey),
  })
  const sessionPlaintext = unwrapSessionFragment2(wrappedF2 as never, ephemeral.privateKey).plaintext
  const fragmentF2Wire = JSON.parse(new TextDecoder().decode(sessionPlaintext)) as {
    nonce: string
    ciphertext: string
  }
  const reconstructed = reconstructFromPlainAndEncrypted({
    fragmentF1Plain: material.fragmentF1Plain,
    fragmentF2: {
      envelope: {
        nonce: base64ToBytes(fragmentF2Wire.nonce),
        ciphertext: base64ToBytes(fragmentF2Wire.ciphertext),
      },
      key: material.fragmentF2Key,
    },
  })
  return reconstructed.privateSeed
}

/** Classic Stellar G-address derived from the Smart Account owner's ed25519 pubkey. */
export function gAddressFromOwnerPubkey(ownerPubkey: Uint8Array): string {
  return StrKey.encodeEd25519PublicKey(Buffer.from(ownerPubkey))
}

/** Raw ed25519 signature over the UTF-8 message, base64 — matches the app's wallet-challenge "raw" scheme. */
export function signChallenge(message: string, seed: Uint8Array): string {
  const signature = signEd25519(new TextEncoder().encode(message), seed)
  return base64FromBytes(signature)
}
