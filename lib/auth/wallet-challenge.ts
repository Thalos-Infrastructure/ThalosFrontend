import { createHmac, randomBytes } from "crypto";

/**
 * Stateless wallet-ownership challenge.
 *
 * Mirrors the backend's approach (src/wallets/helpers/stellar-verification.helper.ts):
 * the challenge carries an HMAC "Proof" line signed with JWT_SECRET, so no server-side
 * nonce store is needed — integrity + expiry are self-contained. The wallet signs the
 * FULL challenge message; `verifyWalletChallenge` + the Stellar signature check both run
 * against that exact message (no line stripping), keeping the flow self-consistent.
 */

const PREFIX = "Thalos Wallet Ownership Proof";
const TTL_SECONDS = 5 * 60;

/**
 * Wire shape of a challenge as returned by `POST /api/auth/wallet/challenge`.
 * Field names are the canonical ones shared with the Nest backend
 * (`message` + `expires_at`, snake_case) so FE, Next BFF and Nest agree
 * end-to-end — see GF-8 (#142 / ThalosBackend#143).
 */
export interface WalletChallenge {
  /** The exact string the wallet must sign. */
  message: string;
  /** ISO-8601 instant after which the challenge is no longer accepted. */
  expires_at: string;
}

/** Thrown when a challenge is well-formed and ours, but past its `expires_at`. */
export class WalletChallengeExpiredError extends Error {
  readonly code = "challenge_expired" as const;
  constructor(message = "El challenge expiró, volvé a intentar") {
    super(message);
    this.name = "WalletChallengeExpiredError";
  }
}

export interface WalletChallengePayload {
  v: 1;
  addr: string;
  nonce: string;
  exp: number; // unix seconds
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function buildWalletChallenge(address: string): WalletChallenge {
  const secret = getSecret();
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const nonce = randomBytes(16).toString("hex");
  const payload: WalletChallengePayload = { v: 1, addr: address, nonce, exp };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(payloadB64).digest("base64url");

  const expiresAt = new Date(exp * 1000).toISOString();
  const message =
    `${PREFIX}\n\n` +
    `Firmá este mensaje para iniciar sesión en Thalos con tu wallet.\n` +
    `Esta firma no autoriza ninguna transacción ni movimiento de fondos.\n\n` +
    `Wallet: ${address}\n` +
    `Nonce: ${nonce}\n` +
    `Expira: ${expiresAt}\n` +
    `Proof: ${payloadB64}.${sig}`;

  return { message, expires_at: expiresAt };
}

/** Recomputes the HMAC proof, checks the address matches and that it has not expired. Throws on any failure. */
export function verifyWalletChallenge(message: string, address: string): WalletChallengePayload {
  const secret = getSecret();
  const match = message.match(/^Proof:\s*(.+)$/m);
  if (!match) throw new Error("Challenge sin proof");

  const [payloadB64, hmac] = match[1].trim().split(".");
  if (!payloadB64 || !hmac) throw new Error("Proof malformado");

  const expected = createHmac("sha256", secret).update(payloadB64).digest("base64url");
  if (hmac !== expected) throw new Error("Proof inválido");

  let payload: WalletChallengePayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf-8"));
  } catch {
    throw new Error("Payload del challenge ilegible");
  }

  if (payload.addr !== address) throw new Error("La wallet no coincide con el challenge");
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new WalletChallengeExpiredError();

  return payload;
}
