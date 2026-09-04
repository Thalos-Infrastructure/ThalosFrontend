import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { signToken, type AuthUser } from "@/lib/auth/utils"
import { API_URL, POLLAR_SERVER_API_URL } from "@/lib/config"

// Uses jsonwebtoken (Node crypto) — force the Node.js runtime, not edge.
export const runtime = "nodejs"

/**
 * Pollar login → Thalos app JWT (#108, "Option B": our JWT stays primary and
 * Pollar remains the auth source).
 *
 * Every front-door login goes through here: Google, GitHub, email OTP, and a
 * self-custodied wallet connected through Pollar's Stellar Wallets Kit adapter.
 * The browser sends only its Pollar access token. Identity, wallet and provider
 * all come from Pollar's server API, never from the request body — otherwise a
 * caller could claim someone else's wallet and be issued a JWT for it.
 */

/** Fields we consume from POST /v1/tokens/verify's `content`. */
type PollarVerifiedToken = {
  userId?: unknown
  /**
   * `type` is the custody: `internal` custodial, `external` user-owned, `smart`
   * passkey. For an external wallet `provider` names the adapter that connected
   * it ("freighter", "xbull", …).
   */
  wallet?: { type?: unknown; address?: unknown; provider?: unknown } | null
  profile?: { email?: unknown; firstName?: unknown; lastName?: unknown } | null
  authProvider?: unknown
}

/**
 * Custodies that can back a Thalos session. Both put a classic G-address in
 * `wallet.address`, which is what Trustless Work matches escrow roles on.
 */
const SUPPORTED_CUSTODY = new Set(["internal", "external"])

/** The non-custodial wallet_type values ThalosBackend's LinkWalletDto whitelists. */
const KNOWN_WALLET_TYPES = new Set(["freighter", "lobstr", "xbull", "albedo"])

/** Only these mean the end-user token itself was refused; see the 502 branch. */
const TOKEN_REJECTION_CODES = new Set([
  "SDK_AUTH_TOKEN_EXPIRED",
  "SDK_AUTH_INVALID_TOKEN",
  "SDK_TOKEN_WRONG_APPLICATION",
])

function asString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null
}

function displayName(profile: PollarVerifiedToken["profile"]): string | null {
  const full = [asString(profile?.firstName), asString(profile?.lastName)].filter(Boolean).join(" ")
  return full || null
}

export async function POST(req: Request) {
  const secretKey = process.env.POLLAR_SECRET_KEY
  if (!secretKey) {
    console.error("auth/pollar: POLLAR_SECRET_KEY is not set")
    return NextResponse.json({ error: "Pollar no está configurado" }, { status: 500 })
  }

  const body = await req.json().catch(() => ({}))
  const accessToken = asString(body.accessToken)
  if (!accessToken) {
    return NextResponse.json({ error: "Falta accessToken" }, { status: 400 })
  }

  // 1) Validate the token with Pollar — the only source of truth for who this is.
  let verified: PollarVerifiedToken
  try {
    const res = await fetch(`${POLLAR_SERVER_API_URL}/tokens/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-pollar-api-key": secretKey },
      body: JSON.stringify({ token: accessToken }),
      cache: "no-store",
    })

    const raw = await res.text()
    let payload: { success?: unknown; code?: unknown; content?: unknown } = {}
    try {
      payload = JSON.parse(raw)
    } catch {
      // Pollar always answers JSON, so anything else means we never reached it —
      // a wrong POLLAR_SERVER_API_URL returns a text/plain "404 page not found".
      console.error(
        `auth/pollar: non-JSON reply from ${POLLAR_SERVER_API_URL}/tokens/verify ` +
          `(HTTP ${res.status}): ${raw.slice(0, 120)}`,
      )
      return NextResponse.json(
        { error: "No se pudo contactar con Pollar", code: "POLLAR_UNREACHABLE" },
        { status: 502 },
      )
    }

    // Branch on `code`, not status: an invalid api key answers 404
    // API_KEY_NOT_FOUND, so status alone would report our own misconfiguration
    // as the user's session being expired.
    if (typeof payload.code === "string" && TOKEN_REJECTION_CODES.has(payload.code)) {
      console.warn("auth/pollar verify rejected:", res.status, payload.code)
      return NextResponse.json(
        { error: "Sesión de Pollar inválida o expirada", code: payload.code },
        { status: 401 },
      )
    }

    if (!res.ok || payload.success !== true) {
      console.error(
        `auth/pollar: unexpected reply from ${POLLAR_SERVER_API_URL}/tokens/verify ` +
          `(HTTP ${res.status}, code=${String(payload.code)})`,
      )
      return NextResponse.json(
        {
          error: "Pollar respondió de forma inesperada",
          code: typeof payload.code === "string" ? payload.code : "POLLAR_BAD_RESPONSE",
          upstreamStatus: res.status,
        },
        { status: 502 },
      )
    }

    verified = (payload.content ?? {}) as PollarVerifiedToken
  } catch (e) {
    console.error(`auth/pollar: request to ${POLLAR_SERVER_API_URL}/tokens/verify failed:`, e)
    return NextResponse.json(
      { error: "No se pudo contactar con Pollar", code: "POLLAR_UNREACHABLE" },
      { status: 502 },
    )
  }

  const pollarUserId = asString(verified.userId)
  if (!pollarUserId) {
    console.error("auth/pollar: verify response had no userId")
    return NextResponse.json({ error: "Respuesta de Pollar incompleta" }, { status: 502 })
  }

  // A session can be verified moments before provisioning finishes. Retryable.
  const walletAddress = asString(verified.wallet?.address)
  if (!walletAddress) {
    return NextResponse.json(
      { error: "La wallet de Pollar todavía no está lista", code: "WALLET_NOT_READY" },
      { status: 409 },
    )
  }

  // Pollar reports the custody directly, so trust it rather than sniffing the
  // address shape. `smart` is the passkey C-address: Trustless Work cannot use a
  // Soroban contract address as an escrow party, so a session backed by one
  // could log in and then fail on every escrow. Passkey users go through #109
  // (Accesly), which bridges the smart account to a real G-address first.
  const custody = asString(verified.wallet?.type)
  if (!custody || !SUPPORTED_CUSTODY.has(custody)) {
    console.warn(`auth/pollar: unsupported wallet custody "${custody}"`)
    return NextResponse.json(
      {
        error:
          custody === "smart"
            ? "Para entrar con passkey usa Accesly"
            : "Este método de login todavía no está soportado",
        code: "UNSUPPORTED_WALLET",
      },
      { status: 400 },
    )
  }

  // Custodial wallets are interchangeable, so the generic "embedded" is enough
  // and matches what /api/auth/me falls back to. An external one keeps its
  // adapter id: signing is dispatched by provider (#110), and the user should
  // see which wallet they connected rather than a wallet they do not own.
  const isExternal = custody === "external"
  const walletProvider = isExternal
    ? (asString(verified.wallet?.provider) ?? "external")
    : "embedded"

  // The wallet_type POST /v1/wallets accepts. A provisioned wallet is
  // 'custodial'; a wallet the user brought is named by the adapter that
  // connected it, and anything outside the backend's whitelist — Pollar reports
  // a generic "wallet" for some — falls back to 'other' rather than being
  // rejected for a label.
  const walletType = isExternal
    ? KNOWN_WALLET_TYPES.has(walletProvider)
      ? walletProvider
      : "other"
    : "custodial"

  const pollarEmail = asString(verified.profile?.email)?.toLowerCase() ?? null
  const authProvider = asString(verified.authProvider) ?? "pollar"
  const supabase = createServiceClient()

  // 2) Resolve the account BY POLLAR USER ID. /tokens/verify vouches for the
  //    user id but carries no "email verified" flag, so matching on email would
  //    hand an existing Thalos account to anyone presenting a Pollar profile
  //    with that address. Thalos keeps managing its own emails separately.
  const { data: existing, error: selectError } = await supabase
    .from("auth_users")
    .select("id, email, name, wallet_public_key")
    .eq("pollar_user_id", pollarUserId)
    .maybeSingle()

  if (selectError) {
    console.error("auth/pollar select error:", selectError)
    return NextResponse.json({ error: "Error de base de datos" }, { status: 500 })
  }

  let row = existing

  if (!row) {
    const insert = (email: string) =>
      supabase
        .from("auth_users")
        .insert({
          email,
          password_hash: null,
          name: displayName(verified.profile),
          auth_provider: "pollar",
          pollar_user_id: pollarUserId,
          wallet_public_key: walletAddress,
        })
        .select("id, email, name, wallet_public_key")
        .single()

    // auth_users.email is unique. A Thalos account may already hold this
    // address, and since Pollar does not vouch for it we must not join the two:
    // fall back to a deterministic synthetic address so both accounts coexist.
    const synthetic = `${pollarUserId.toLowerCase()}@pollar.thalos`
    let { data: inserted, error: insertError } = await insert(pollarEmail ?? synthetic)
    if (insertError?.code === "23505" && pollarEmail) {
      ;({ data: inserted, error: insertError } = await insert(synthetic))
    }

    // The synthetic address is derived from the Pollar user id and is minted
    // nowhere else, so a row already holding it IS this Pollar user — reached
    // here only because its pollar_user_id is missing (an account created
    // before that column was backfilled, or a login that was interrupted after
    // the insert). Adopting it is not an email match: the address encodes the
    // id Pollar vouches for. Backfilling the id makes the next login find it by
    // the intended key instead of arriving here again.
    if (insertError?.code === "23505") {
      const { data: adopted, error: adoptError } = await supabase
        .from("auth_users")
        .update({ pollar_user_id: pollarUserId })
        .eq("email", synthetic)
        .select("id, email, name, wallet_public_key")
        .single()

      if (adoptError || !adopted) {
        console.error("auth/pollar adopt error:", adoptError)
        return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 })
      }
      inserted = adopted
      insertError = null
    }

    if (insertError || !inserted) {
      console.error("auth/pollar insert error:", insertError)
      return NextResponse.json({ error: "No se pudo crear el usuario" }, { status: 500 })
    }
    row = inserted
  } else if (row.wallet_public_key !== walletAddress) {
    // The embedded wallet MUST be the one Pollar holds the key for: socialSigner
    // refuses to sign for any other address, so leaving a stale one here would
    // let the user in but break every signature.
    const { data: updated, error: updateError } = await supabase
      .from("auth_users")
      .update({ wallet_public_key: walletAddress })
      .eq("id", row.id)
      .select("id, email, name, wallet_public_key")
      .single()

    if (updateError || !updated) {
      console.error("auth/pollar update error:", updateError)
      return NextResponse.json({ error: "No se pudo asociar la wallet" }, { status: 500 })
    }
    row = updated
  }

  // 3) Mint the Thalos JWT. It is signed here, by Next.js (HS256, 7d, JWT_SECRET
  //    shared with ThalosBackend), which only validates it.
  const user: AuthUser = {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    avatarUrl: null,
    wallet: { publicKey: walletAddress, provider: walletProvider },
  }
  const token = signToken({ sub: row.id, email: row.email })

  // 4) Persist to user_wallets from here rather than handing pollarUserId back
  //    to the browser to forward: the browser would then be free to submit any
  //    value it liked. Non-fatal, matching how the Kit provider treats linking.
  //
  //    Every login records its wallet the same way, whichever custody it has:
  //    the account should not have to explain why the wallet it signed in with
  //    is missing from its own list. The backend accepts Pollar's SEP-10 proof
  //    for an external wallet in place of a SEP-0043 signature the browser
  //    could not produce anyway (ThalosBackend#131).
  try {
    const res = await fetch(`${API_URL}/wallets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        wallet_address: walletAddress,
        wallet_type: walletType,
        auth_provider: "pollar",
        pollar_user_id: pollarUserId,
        label: `Pollar (${authProvider})`,
      }),
    })
    // 409 just means the wallet is already linked — expected on every re-login.
    if (!res.ok && res.status !== 409) {
      console.warn("auth/pollar: could not persist to user_wallets:", res.status)
    }
  } catch (e) {
    console.warn("auth/pollar: could not reach the backend to persist the wallet:", e)
  }

  return NextResponse.json({ user, token })
}
