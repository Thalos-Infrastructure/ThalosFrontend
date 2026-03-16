import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  comparePassword,
  signToken,
  type AuthUser,
} from "@/lib/auth/utils";

function validateEmail(email: unknown): email is string {
  return typeof email === "string" && email.length > 0;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = body.email;
  const password = body.password;

  if (!validateEmail(email) || typeof password !== "string") {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("auth_users")
    .select("id, email, name, wallet_public_key, password_hash")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("auth/login select error:", error);
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }
  if (!row) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }
  if (row.password_hash == null) {
    return NextResponse.json(
      { error: "This account uses Google or GitHub sign-in" },
      { status: 401 },
    );
  }

  const valid = await comparePassword(password, row.password_hash);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 },
    );
  }

  const user: AuthUser = {
    id: row.id,
    email: row.email,
    name: row.name ?? undefined,
    wallet: { publicKey: row.wallet_public_key, type: "embedded" },
  };
  const token = signToken({ sub: row.id, email: row.email });
  return NextResponse.json({ user, token });
}
