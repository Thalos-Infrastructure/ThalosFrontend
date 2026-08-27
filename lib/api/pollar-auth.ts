import type { AuthUser } from "@/lib/auth/types";

/**
 * Client for the Pollar login -> app JWT exchange (#108). Hits the Next.js
 * route, not Nest: the app JWT is minted by Next.js, as for every other login.
 * That route also persists the wallet, so no identity data passes through here.
 */

export type PollarLoginResult = {
  user: AuthUser;
  token: string;
};

/** Thrown while Pollar is still provisioning the wallet, so callers can retry. */
export class PollarWalletNotReadyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PollarWalletNotReadyError";
  }
}

export async function loginWithPollar(accessToken: string): Promise<PollarLoginResult> {
  const res = await fetch("/api/auth/pollar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });
  const data = await res.json().catch(() => ({}));

  if (res.status === 409 && data.code === "WALLET_NOT_READY") {
    throw new PollarWalletNotReadyError(data.error || "La wallet de Pollar todavía no está lista");
  }
  if (!res.ok) {
    throw new Error(data.error || "No se pudo iniciar sesión con Pollar");
  }
  return data;
}
