"use client";
// Rebuild trigger v2
import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { signInWithOAuthAction } from "@/lib/actions/auth-oauth";
import { useStellarWallet } from "@/lib/stellar-wallet";

interface SocialAuthModalProps {
  mode: "login" | "signup";
  open: boolean;
  onClose: () => void;
}

export function SocialAuthModal({ mode, open, onClose }: SocialAuthModalProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { login, logout } = useAuthStore();
  const { isConnecting, walletError, openWalletModal } = useStellarWallet();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const handleOAuth = async (provider: "google" | "github") => {
    setOauthLoading(provider);
    setError(null);
    try {
      const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "";
      await signInWithOAuthAction(provider, redirectTo);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not connect";
      setError(msg);
      toast.error(msg);
    } finally {
      setOauthLoading(null);
    }
  };

  if (!open) return null;

  const isLogin = mode === "login";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      if (!res.ok) {
        throw new Error("Error de autenticación");
      }
      const data = await res.json();
      login(data.user, data.token);
      onClose();
      router.push("/auth/select-profile");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "No se pudo iniciar sesión.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const title = isLogin ? "Welcome back" : "Create an account";
  const subtitle = isLogin
    ? "Sign in to your account to continue"
    : "Join Thalos and start using protected escrows";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-border/30 bg-card px-8 py-10 shadow-[0_40px_120px_rgba(0,0,0,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-white/5 hover:text-foreground"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-2.5 mb-4">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full gap-3 rounded-xl border-border/30 bg-secondary/40 text-sm font-semibold text-foreground"
            onClick={() => handleOAuth("google")}
            disabled={oauthLoading !== null}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            {oauthLoading === "google" ? "…" : t("signin.google")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full gap-3 rounded-xl border-border/30 bg-secondary/40 text-sm font-semibold text-foreground"
            onClick={() => handleOAuth("github")}
            disabled={oauthLoading !== null}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            {oauthLoading === "github" ? "…" : t("signin.github")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full gap-3 rounded-xl border-border/30 bg-secondary/40 text-sm font-semibold text-foreground"
            onClick={() => {
              emailInputRef.current?.focus();
              emailInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            {t("signin.email")}
          </Button>
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {t("signin.or")}
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            openWalletModal(() => {
              // Quitar sesión OAuth/email para que la UI muestre la wallet de Freighter (B), no la asignada a la cuenta (A).
              logout();
              onClose();
              router.push("/auth/select-profile");
            }, "personal")
          }
          disabled={isConnecting}
          className="h-10 w-full gap-3 rounded-xl border-border/40 bg-secondary/40 text-sm font-semibold text-foreground hover:bg-secondary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <path d="M1 10h22" />
          </svg>
          {isConnecting ? t("signin.walletConnecting") : t("signin.wallet")}
        </Button>
        {walletError && (
          <p className="mt-1 text-xs text-red-400/90" role="alert">{walletError}</p>
        )}

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border/40" />
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {t("signin.or")}
          </span>
          <div className="h-px flex-1 bg-border/40" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div className="space-y-1 text-sm">
              <label className="text-xs font-medium text-muted-foreground">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-xl border border-border/40 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#f0b400]/50 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/15"
                placeholder="Your name"
              />
            </div>
          )}
          <div className="space-y-1 text-sm">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input
              ref={emailInputRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 w-full rounded-xl border border-border/40 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#f0b400]/50 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/15"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground">Password</label>
              {isLogin && (
                <button type="button" className="text-[11px] font-medium text-primary/80">
                  Forgot?
                </button>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 w-full rounded-xl border border-border/40 bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-[#f0b400]/50 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/15"
              placeholder="Enter your password"
            />
          </div>

          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}

          <Button
            type="submit"
            className="mt-2 h-10 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            disabled={loading}
          >
            {loading ? "Processing..." : isLogin ? "Sign in" : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
            }}
            className="font-semibold text-primary"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}

