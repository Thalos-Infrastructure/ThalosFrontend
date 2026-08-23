import type { AuthUser } from "@/lib/auth/types";
import type { WalletChallenge } from "@/lib/auth/wallet-challenge";

/**
 * Client helpers for the wallet -> app JWT flow. These hit the Next.js API routes
 * (relative /api/auth/wallet/*), NOT the Nest backend — the app JWT is minted by
 * Next.js, consistent with email/social/OAuth login.
 *
 * The challenge payload uses the canonical field names shared with the Nest
 * backend: `message` (the exact string to sign) + `expires_at` (GF-8, #142).
 */

/** Raised when the challenge is already past `expires_at` before we even sign it. */
export class WalletChallengeExpired extends Error {
  constructor(message = "El challenge de la wallet expiró, volvé a intentar") {
    super(message);
    this.name = "WalletChallengeExpired";
  }
}

/** True when `expires_at` is a valid instant that already passed. */
export function isChallengeExpired(expiresAt: string | undefined, now: number = Date.now()): boolean {
  if (!expiresAt) return false; // no expiry advertised: let the server decide
  const ts = Date.parse(expiresAt);
  return Number.isFinite(ts) && ts <= now;
}

export async function requestWalletChallenge(address: string): Promise<WalletChallenge> {
  const res = await fetch("/api/auth/wallet/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo obtener el challenge de la wallet");
  if (typeof data.message !== "string" || !data.message) {
    throw new Error("El challenge de la wallet no trae el campo message");
  }
  // Our BFF always sends both fields; a payload missing `expires_at` would
  // otherwise satisfy `WalletChallenge` at the type level while holding
  // `undefined`, which is the exact class of bug this issue is about.
  if (typeof data.expires_at !== "string" || !data.expires_at) {
    throw new Error("El challenge de la wallet no trae el campo expires_at");
  }
  // Clock skew or a stale response would make us sign something the server will
  // reject anyway — fail early with an actionable error instead.
  if (isChallengeExpired(data.expires_at)) throw new WalletChallengeExpired();
  return { message: data.message, expires_at: data.expires_at };
}

export async function verifyWalletLogin(
  address: string,
  message: string,
  signature: string,
  provider?: string,
): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch("/api/auth/wallet/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, message, signature, provider }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (data.code === "challenge_expired") throw new WalletChallengeExpired(data.error);
    throw new Error(data.error || "No se pudo verificar la firma de la wallet");
  }
  return data;
}
