import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { APP_URL } from "@/lib/config";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Check if user exists
    const { data: user } = await supabase
      .from("auth_users")
      .select("id, email, name")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token
    await supabase
      .from("password_reset_tokens")
      .upsert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
      }, { onConflict: "user_id" });

    // Send reset email
    const resetUrl = `${APP_URL}/auth/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: user.email,
      subject: "Reset your Thalos password",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="color: #1a1a1a; font-size: 24px; margin-bottom: 24px;">Reset your password</h1>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Hello${user.name ? ` ${user.name}` : ''},
          </p>
          <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            We received a request to reset your password. Click the button below to create a new password:
          </p>
          <a href="${resetUrl}" style="display: inline-block; background-color: #f0b400; color: #000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin-bottom: 24px;">
            Reset Password
          </a>
          <p style="color: #888; font-size: 14px; line-height: 1.6; margin-top: 32px;">
            This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="color: #888; font-size: 12px;">
            Thalos
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Failed to send reset email" }, { status: 500 });
  }
}
