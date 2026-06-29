import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { signToken, type AuthUser } from "@/lib/auth/utils";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const access_token = typeof body.access_token === "string" ? body.access_token : null;
  if (!access_token) {
    return NextResponse.json({ error: "Missing access_token" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error: userError } = await supabase.auth.getUser(access_token);
  const supaUser = data?.user;
  if (userError || !supaUser) {
    console.error("oauth-callback getUser:", userError?.message ?? userError);
    return NextResponse.json(
      { error: "Invalid or expired token", code: "get_user_failed", details: userError?.message },
      { status: 401 },
    );
  }

  const email = (supaUser.email ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "No email in token", code: "no_email" }, { status: 400 });
  }

  const name = (supaUser.user_metadata?.full_name ?? supaUser.user_metadata?.name ?? supaUser.user_metadata?.user_name) as string | undefined;
  const avatarUrl = (supaUser.user_metadata?.avatar_url ?? supaUser.user_metadata?.picture ?? null) as string | null;
  const db = createServiceClient();
  const { data: existing } = await db
    .from("auth_users")
    .select("id, email, name, wallet_public_key")
    .eq("email", email)
    .maybeSingle();

  let userId: string;
  let walletPublicKey: string | null;
  let userName: string | undefined = name;

  if (existing) {
    userId = existing.id;
    walletPublicKey = existing.wallet_public_key;
    if (existing.name) userName = existing.name;
  } else {
    // OAuth signup creates the identity only. No wallet is generated — the
    // user connects their own wallet later (M2 flow).
    walletPublicKey = null;

    const { data: inserted, error: insertError } = await db
      .from("auth_users")
      .insert({
        email,
        password_hash: null,
        name: name ?? null,
        auth_provider: "oauth",
      })
      .select("id, name")
      .single();
    if (insertError || !inserted) {
      console.error("oauth-callback insert auth_users:", insertError?.message ?? insertError);
      return NextResponse.json(
        { error: "Could not create user", code: "insert_failed", details: insertError?.message },
        { status: 500 },
      );
    }
    userId = inserted.id;
    if (inserted.name) userName = inserted.name;
  }

  const user: AuthUser = {
    id: userId,
    email,
    name: userName ?? null,
    avatarUrl,
    wallet: walletPublicKey
      ? { publicKey: walletPublicKey, provider: "embedded" }
      : null,
  };
  const token = signToken({ sub: userId, email });
  return NextResponse.json({ user, token });
}
