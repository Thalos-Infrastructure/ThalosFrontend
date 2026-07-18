import type { AuthUser } from "@/lib/auth/types";

/**
 * Client helpers for the wallet -> app JWT flow. These hit the Next.js API routes
 * (relative /api/auth/wallet/*), NOT the Nest backend — the app JWT is minted by
 * Next.js, consistent with email/social/OAuth login.
 */

export async function requestWalletChallenge(
  address: string,
): Promise<{ challenge: string; expiresAt: string }> {
  const res = await fetch("/api/auth/wallet/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo obtener el challenge de la wallet");
  return data;
}

export async function verifyWalletLogin(
  address: string,
  challenge: string,
  signature: string,
  provider?: string,
): Promise<{ user: AuthUser; token: string }> {
  const res = await fetch("/api/auth/wallet/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address, challenge, signature, provider }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "No se pudo verificar la firma de la wallet");
  return data;
}
