import * as bcrypt from "bcryptjs";
import * as jose from "jose";
import * as jwt from "jsonwebtoken";

export const SALT_ROUNDS = 10;

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  wallet: { publicKey: string; type?: string };
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Sign JWT using jsonwebtoken (Node crypto). Avoids "importKey is not a function" with jose in Next.js server. */
export function signToken(payload: { sub: string; email: string }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return jwt.sign(
    { ...payload },
    secret,
    { algorithm: "HS256", expiresIn: "7d" },
  );
}

/** Verify JWT using jsonwebtoken (Node crypto). */
export function verifyToken(token: string): { sub: string; email: string } | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] }) as { sub?: string; email?: string };
    const sub = payload.sub;
    const email = payload.email;
    return sub && email ? { sub, email } : null;
  } catch {
    return null;
  }
}

/** Supabase access token payload (after verification with SUPABASE_JWT_SECRET). */
export interface SupabaseJwtPayload {
  sub: string;
  email?: string;
  user_metadata?: { full_name?: string; name?: string; user_name?: string };
}

export async function verifySupabaseToken(
  accessToken: string,
): Promise<SupabaseJwtPayload | null> {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;
  const encoder = new TextEncoder();
  const key = await jose.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  try {
    const { payload } = await jose.jwtVerify(accessToken, key);
    const sub = payload.sub as string;
    if (!sub) return null;
    return {
      sub,
      email: payload.email as string | undefined,
      user_metadata: payload.user_metadata as SupabaseJwtPayload["user_metadata"],
    };
  } catch {
    return null;
  }
}
