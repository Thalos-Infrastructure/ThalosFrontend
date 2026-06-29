export type AuthWallet = {
  publicKey: string;
  provider: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  wallet: AuthWallet | null;
};

export type AuthResponse = {
  user: AuthUser;
  token: string;
};

export function normalizeAuthUser(raw: unknown): AuthUser | null {
  if (!raw || typeof raw !== "object") return null;
  const u = raw as Record<string, unknown>;

  const id = u.id;
  if (!id || typeof id !== "string") return null;

  const email = u.email;
  if (!email || typeof email !== "string") return null;

  const w = u.wallet as Record<string, unknown> | null | undefined;
  const publicKey = w?.publicKey;

  return {
    id,
    email,
    name: typeof u.name === "string" ? u.name : null,
    avatarUrl: typeof u.avatarUrl === "string" ? u.avatarUrl : null,
    wallet: publicKey && typeof publicKey === "string"
      ? {
          publicKey,
          // coalesce old "type" field during transition
          provider: String(w!.provider ?? w!.type ?? "embedded"),
        }
      : null,
  };
}
