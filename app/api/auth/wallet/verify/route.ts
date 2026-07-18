import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { Keypair } from "@stellar/stellar-sdk";
import { createServiceClient } from "@/lib/supabase/service";
import { signToken, type AuthUser } from "@/lib/auth/utils";
import { verifyWalletChallenge } from "@/lib/auth/wallet-challenge";

// Uses Node crypto + jsonwebtoken — force the Node.js runtime, not edge.
export const runtime = "nodejs";

/** Decode a signature that may be base64 or base64url into raw bytes. */
function decodeSignature(signature: string): Buffer {
  const normalized = signature.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64");
}

// SEP-0053 prepends this prefix and signs the SHA-256 of (prefix + message).
const SEP53_PREFIX = "Stellar Signed Message:\n";

/**
 * Verifies wallet ownership over the EXACT challenge string. Wallets differ in
 * what bytes they actually sign, so we accept any of the known schemes and log
 * which one matched (so the flow is both wallet-agnostic and diagnosable):
 *   - "raw"     : the UTF-8 challenge bytes (matches the backend's current helper)
 *   - "sep53"   : SHA-256(prefix + challenge)  (Freighter / SEP-0053)
 *   - "sha256"  : SHA-256(challenge)
 *   - "prefixed": UTF-8 of (prefix + challenge), unhashed
 * A forged signature matches none; a valid one matches exactly one.
 */
function verifyStellarSignature(challenge: string, signature: string, address: string): void {
  let keypair: Keypair;
  try {
    keypair = Keypair.fromPublicKey(address);
  } catch {
    throw new Error("Clave pública Stellar inválida");
  }
  const sigBytes = decodeSignature(signature);
  if (sigBytes.length === 0) throw new Error("Firma vacía");

  const raw = Buffer.from(challenge, "utf-8");
  const prefixed = Buffer.from(SEP53_PREFIX + challenge, "utf-8");
  const candidates: Array<{ scheme: string; bytes: Buffer }> = [
    { scheme: "raw", bytes: raw },
    { scheme: "sep53", bytes: createHash("sha256").update(prefixed).digest() },
    { scheme: "sha256", bytes: createHash("sha256").update(raw).digest() },
    { scheme: "prefixed", bytes: prefixed },
  ];

  for (const { scheme, bytes } of candidates) {
    try {
      if (keypair.verify(bytes, sigBytes)) {
        console.log(`[auth/wallet/verify] signature OK via scheme="${scheme}" (sigLen=${sigBytes.length})`);
        return;
      }
    } catch {
      // try next scheme
    }
  }

  console.warn(
    `[auth/wallet/verify] signature rejected — no scheme matched. sigLen=${sigBytes.length}, addr=${address}`,
  );
  throw new Error("Firma Stellar inválida");
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const address = body.address;
  const challenge = body.challenge;
  const signature = body.signature;
  const provider = typeof body.provider === "string" && body.provider ? body.provider : "stellar-wallet";

  if (typeof address !== "string" || typeof challenge !== "string" || typeof signature !== "string") {
    return NextResponse.json({ error: "Faltan address, challenge o signature" }, { status: 400 });
  }

  // 1) Proof integrity + expiry (server-issued HMAC), then 2) wallet ownership (Ed25519).
  try {
    verifyWalletChallenge(challenge, address);
    verifyStellarSignature(challenge, signature, address);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Verificación fallida";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  // 3) Resolve (or create) the auth_users row keyed by wallet, so the JWT `sub`
  //    maps to a real user the backend can authorize (incl. write endpoints that
  //    check auth_users.wallet_public_key === signer).
  const supabase = createServiceClient();

  const { data: existing, error: selectError } = await supabase
    .from("auth_users")
    .select("id, email, name, wallet_public_key")
    .eq("wallet_public_key", address)
    .maybeSingle();

  if (selectError) {
    console.error("auth/wallet/verify select error:", selectError);
    return NextResponse.json({ error: "Error de base de datos" }, { status: 500 });
  }

  let row = existing;
  if (!row) {
    // Synthetic, deterministic email — wallet users have no email/password. Kept
    // unique per wallet so it never collides with real email accounts.
    const email = `${address.toLowerCase()}@wallet.thalos`;
    const { data: inserted, error: insertError } = await supabase
      .from("auth_users")
      .insert({ wallet_public_key: address, email, name: null })
      .select("id, email, name, wallet_public_key")
      .single();

    if (insertError || !inserted) {
      console.error("auth/wallet/verify insert error:", insertError);
      return NextResponse.json({ error: "No se pudo crear el usuario de wallet" }, { status: 500 });
    }
    row = inserted;
  }

  const user: AuthUser = {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    avatarUrl: null,
    wallet: { publicKey: address, provider },
  };
  const token = signToken({ sub: row.id, email: row.email });

  return NextResponse.json({ user, token });
}
