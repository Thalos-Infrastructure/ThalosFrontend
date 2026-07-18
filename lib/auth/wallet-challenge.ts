import { createHmac, randomBytes } from "crypto";

/**
 * Stateless wallet-ownership challenge.
 *
 * Mirrors the backend's approach (src/wallets/helpers/stellar-verification.helper.ts):
 * the challenge carries an HMAC "Proof" line signed with JWT_SECRET, so no server-side
 * nonce store is needed — integrity + expiry are self-contained. The wallet signs the
 * FULL challenge string; `verifyWalletChallenge` + the Stellar signature check both run
 * against that exact string (no line stripping), keeping the flow self-consistent.
 */

const PREFIX = "Thalos Wallet Ownership Proof";
const TTL_SECONDS = 5 * 60;

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

export function buildWalletChallenge(address: string): { challenge: string; expiresAt: string } {
  const secret = getSecret();
  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const nonce = randomBytes(16).toString("hex");
  const payload: WalletChallengePayload = { v: 1, addr: address, nonce, exp };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", secret).update(payloadB64).digest("base64url");

  const expiresAtIso = new Date(exp * 1000).toISOString();
  const challenge =
    `${PREFIX}\n\n` +
    `Firmá este mensaje para iniciar sesión en Thalos con tu wallet.\n` +
    `Esta firma no autoriza ninguna transacción ni movimiento de fondos.\n\n` +
    `Wallet: ${address}\n` +
    `Nonce: ${nonce}\n` +
    `Expira: ${expiresAtIso}\n` +
    `Proof: ${payloadB64}.${sig}`;

  return { challenge, expiresAt: expiresAtIso };
}

/** Recomputes the HMAC proof, checks the address matches and that it has not expired. Throws on any failure. */
export function verifyWalletChallenge(challenge: string, address: string): WalletChallengePayload {
  const secret = getSecret();
  const match = challenge.match(/^Proof:\s*(.+)$/m);
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
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("El challenge expiró");

  return payload;
}
