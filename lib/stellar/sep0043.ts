import { Keypair, Networks } from "@stellar/stellar-sdk"

// Domain prefix baked into every challenge — no inline magic strings elsewhere.
export const SEP0043_CHALLENGE_PREFIX = "THALOS-SEP0043-VERIFY"

// Challenges are valid for 5 minutes.
export const CHALLENGE_TTL_SECONDS = 300

function networkPassphrase(): string {
  const net = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "TESTNET"
  return net === "MAINNET" ? Networks.PUBLIC : Networks.TESTNET
}

/**
 * Builds the UTF-8 string that the wallet must sign.
 *
 * Format (no colons inside any field):
 *   THALOS-SEP0043-VERIFY:{networkPassphrase}:{userId}:{walletAddress}:{expiresAt}
 *
 * Including the network passphrase prevents cross-network replay attacks.
 */
export function buildChallengeMessage(
  userId: string,
  walletAddress: string,
  expiresAt: number,
): string {
  return `${SEP0043_CHALLENGE_PREFIX}:${networkPassphrase()}:${userId}:${walletAddress}:${expiresAt}`
}

export interface ParsedChallenge {
  userId: string
  walletAddress: string
  expiresAt: number
}

/**
 * Parses a challenge message produced by buildChallengeMessage.
 * Returns null if the prefix, network passphrase, or structure is wrong.
 */
export function parseChallengeMessage(message: string): ParsedChallenge | null {
  const expectedPrefix = `${SEP0043_CHALLENGE_PREFIX}:${networkPassphrase()}:`
  if (!message.startsWith(expectedPrefix)) return null

  // Remaining: "{userId}:{walletAddress}:{expiresAt}"
  const tail = message.slice(expectedPrefix.length)
  const parts = tail.split(":")
  if (parts.length !== 3) return null

  const [userId, walletAddress, expiresAtStr] = parts
  const expiresAt = Number(expiresAtStr)

  if (!userId || !walletAddress || !Number.isInteger(expiresAt)) return null

  return { userId, walletAddress, expiresAt }
}

/**
 * Verifies an Ed25519 Stellar signature over a challenge message.
 *
 * walletAddress — StrKey-encoded public key (G…)
 * message       — the exact string returned by buildChallengeMessage
 * signatureB64  — base64-encoded 64-byte Ed25519 signature from the wallet
 */
export function verifyStellarSignature(
  walletAddress: string,
  message: string,
  signatureB64: string,
): boolean {
  try {
    const keypair = Keypair.fromPublicKey(walletAddress)
    const data = Buffer.from(message, "utf-8")
    const sig = Buffer.from(signatureB64, "base64")
    return keypair.verify(data, sig)
  } catch {
    return false
  }
}
