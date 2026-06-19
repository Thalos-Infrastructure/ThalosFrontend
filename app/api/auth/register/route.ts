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
  const accountType = body.accountType === "enterprise" ? "enterprise" : "personal";

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
  const { data: inserted, error } = await supabase
    .from("auth_users")
    .insert({
      email: email.trim().toLowerCase(),
      password_hash,
      name: name ?? null,
      wallet_public_key: null,
    })
    .select("id, email, name, wallet_public_key")
    .single();

  if (error) {
    console.error("auth/register insert error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 },
    );
  }

  const user: AuthUser = {
    id: inserted.id,
    email: inserted.email,
    name: inserted.name ?? undefined,
    wallet: undefined,
  };
  const token = signToken({ sub: inserted.id, email: inserted.email });
  return NextResponse.json({ user, token });
}
