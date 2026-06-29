import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  hashPassword,
  signToken,
  type AuthUser,
} from "@/lib/auth/utils";

function validateEmail(email: unknown): email is string {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= 8;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = body.email;
  const password = body.password;
  const name = typeof body.name === "string" ? body.name : undefined;

  if (!validateEmail(email)) {
    return NextResponse.json(
      { error: "Invalid or missing email" },
      { status: 400 },
    );
  }
  if (!validatePassword(password)) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from("auth_users")
    .select("id")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 400 },
    );
  }

  const password_hash = await hashPassword(password);

  // Signup creates the identity only. No wallet is generated here — the user
  // connects their own wallet later (M2 flow), so wallet_public_key stays null.
  const { data: inserted, error } = await supabase
    .from("auth_users")
    .insert({
      email: email.trim().toLowerCase(),
      password_hash,
      name: name ?? null,
    })
    .select("id, email, name")
    .single();

  if (error) {
    console.error("auth/register insert error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 },
    );
  }

  // The custodial-wallet link and the wallet-keyed profile row are intentionally
  // not created here. They depend on a wallet, which the user now connects later
  // (M2 flow), so they belong to the wallet-connect step rather than signup.
  //
  // account_type (personal/enterprise) is not dropped: it is no longer persisted
  // at signup (it lived on the wallet-keyed profile) and is instead set at the
  // profile-selection / wallet-connect step (#1.4). Signup must not break without
  // it, which is why nothing here depends on a wallet or profile.

  const user: AuthUser = {
    id: inserted.id,
    email: inserted.email,
    name: inserted.name ?? null,
    avatarUrl: null,
    wallet: null,
  };
  const token = signToken({ sub: inserted.id, email: inserted.email });
  return NextResponse.json({ user, token });
}
