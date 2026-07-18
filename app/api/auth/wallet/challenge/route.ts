import { NextResponse } from "next/server";
import { Keypair } from "@stellar/stellar-sdk";
import { buildWalletChallenge } from "@/lib/auth/wallet-challenge";

// Uses Node crypto (HMAC) — force the Node.js runtime, not edge.
export const runtime = "nodejs";

function isValidStellarPublicKey(address: unknown): address is string {
  if (typeof address !== "string") return false;
  try {
    Keypair.fromPublicKey(address);
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const address = body.address;

  if (!isValidStellarPublicKey(address)) {
    return NextResponse.json({ error: "Dirección de wallet Stellar inválida" }, { status: 400 });
  }

  try {
    const { challenge, expiresAt } = buildWalletChallenge(address);
    return NextResponse.json({ challenge, expiresAt });
  } catch (e) {
    console.error("auth/wallet/challenge error:", e);
    return NextResponse.json({ error: "No se pudo generar el challenge" }, { status: 500 });
  }
}
