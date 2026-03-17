import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyToken, type AuthUser } from "@/lib/auth/utils";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 401 });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  const supabase = createServiceClient();
  const { data: row, error } = await supabase
    .from("auth_users")
    .select("id, email, name, wallet_public_key")
    .eq("id", payload.sub)
    .single();
  if (error || !row) {
    return NextResponse.json({ error: "User not found" }, { status: 401 });
  }
  const user: AuthUser = {
    id: row.id,
    email: row.email,
    name: row.name ?? undefined,
    wallet: { publicKey: row.wallet_public_key, type: "embedded" },
  };
  return NextResponse.json({ user });
}
