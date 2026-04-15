import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Find valid reset token
    const { data: resetToken } = await supabase
      .from("password_reset_tokens")
      .select("user_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (!resetToken) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });
    }

    // Check if token is expired
    if (new Date(resetToken.expires_at) < new Date()) {
      // Delete expired token
      await supabase
        .from("password_reset_tokens")
        .delete()
        .eq("token", token);
      return NextResponse.json({ error: "Reset link has expired" }, { status: 400 });
    }

    // Hash new password
    const password_hash = await bcrypt.hash(password, 12);

    // Update user password
    const { error: updateError } = await supabase
      .from("auth_users")
      .update({ password_hash })
      .eq("id", resetToken.user_id);

    if (updateError) {
      console.error("Password update error:", updateError);
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
    }

    // Delete used token
    await supabase
      .from("password_reset_tokens")
      .delete()
      .eq("token", token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
