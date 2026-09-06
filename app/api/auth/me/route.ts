import { NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/service"
import { verifyToken, type AuthUser } from "@/lib/auth/utils"

export async function GET(req: Request) {
  const auth = req.headers.get("authorization")
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 })
  }
  const payload = verifyToken(token)
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
  const supabase = createServiceClient()
  // wallet_provider distinguishes login methods (accesly/#109, pollar/#108…).
  // Fall back to a provider-less select while the migration hasn't run yet.
  let row: {
    id: string
    email: string
    name: string | null
    wallet_public_key: string | null
    wallet_provider?: string | null
  } | null = null
  const withProvider = await supabase
    .from("auth_users")
    .select("id, email, name, wallet_public_key, wallet_provider")
    .eq("id", payload.sub)
    .single()
  if (!withProvider.error && withProvider.data) {
    row = withProvider.data
  } else {
    const fallback = await supabase
      .from("auth_users")
      .select("id, email, name, wallet_public_key")
      .eq("id", payload.sub)
      .single()
    if (fallback.error || !fallback.data) {
      return NextResponse.json({ error: "User not found" }, { status: 401 })
    }
    row = fallback.data
  }
  const user: AuthUser = {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    avatarUrl: null,
    wallet: row.wallet_public_key
      ? { publicKey: row.wallet_public_key, provider: row.wallet_provider || "embedded" }
      : null,
  }
  return NextResponse.json({ user })
}
