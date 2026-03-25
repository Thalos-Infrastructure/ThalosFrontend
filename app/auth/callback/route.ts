import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { signToken, type AuthUser } from "@/lib/auth/utils";
import { Keypair } from "stellar-sdk";

/**
 * Server-side OAuth callback. The code verifier is in the request cookies
 * (set by the browser when signInWithOAuth was called), so exchangeCodeForSession
 * works correctly here. Client-side exchange often fails with "PKCE code verifier not found".
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/auth/select-profile";
  const base = url.origin;

  if (!code) {
    return NextResponse.redirect(new URL("/?auth_error=missing_code", base));
  }

  try {
    const supabase = await createClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    if (sessionError || !sessionData?.user) {
      console.error("auth/callback exchangeCodeForSession:", sessionError?.message ?? sessionError);
      return NextResponse.redirect(
        new URL(`/?auth_error=get_user_failed&details=${encodeURIComponent(sessionError?.message ?? "Unknown error")}`, base),
      );
    }

    const supaUser = sessionData.user;
    const email = (supaUser.email ?? "").trim().toLowerCase();
    if (!email) {
      return NextResponse.redirect(new URL("/?auth_error=no_email", base));
    }

    const name = (supaUser.user_metadata?.full_name ?? supaUser.user_metadata?.name ?? supaUser.user_metadata?.user_name) as string | undefined;
    const db = createServiceClient();
    const { data: existing } = await db
      .from("auth_users")
      .select("id, email, name, wallet_public_key")
      .eq("email", email)
      .maybeSingle();

    let userId: string;
    let walletPublicKey: string;
    let userName: string | undefined = name;

    if (existing) {
      userId = existing.id;
      walletPublicKey = existing.wallet_public_key;
      if (existing.name) userName = existing.name;
    } else {
      const keypair = Keypair.random();
      walletPublicKey = keypair.publicKey();
      const { data: inserted, error: insertError } = await db
        .from("auth_users")
        .insert({
          email,
          password_hash: null,
          name: name ?? null,
          wallet_public_key: walletPublicKey,
          auth_provider: "oauth",
        })
        .select("id, name")
        .single();
      if (insertError || !inserted) {
        console.error("auth/callback insert auth_users:", insertError?.message ?? insertError);
        return NextResponse.redirect(
          new URL(`/?auth_error=insert_failed&details=${encodeURIComponent(insertError?.message ?? "Run 007_auth_users_oauth.sql")}`, base),
        );
      }
      userId = inserted.id;
      if (inserted.name) userName = inserted.name;
    }

    const token = signToken({ sub: userId, email });
    const successUrl = new URL("/auth/callback/success", base);
    successUrl.searchParams.set("token", token);
    successUrl.searchParams.set("next", next);
    return NextResponse.redirect(successUrl.toString());
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("auth/callback unhandled error:", err);
    return NextResponse.redirect(
      new URL(`/?auth_error=server_error&details=${encodeURIComponent(message)}`, base),
    );
  }
}
