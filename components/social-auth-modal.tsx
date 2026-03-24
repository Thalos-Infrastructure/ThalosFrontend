"use client";

import React, { useState, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { useAuthStore } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { signInWithOAuthAction } from "@/lib/actions/auth-oauth";
import { useStellarWallet } from "@/lib/stellar-wallet";
import Image from "next/image";

interface SocialAuthModalProps {
  mode: "login" | "signup";
  open: boolean;
  onClose: () => void;
}

export function SocialAuthModal({ mode, open, onClose }: SocialAuthModalProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { login } = useAuthStore();
  const { isConnecting, walletError, openWalletModal } = useStellarWallet();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<"google" | "github" | null>(null);
  const [accountType, setAccountType] = useState<"personal" | "enterprise" | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);

  const handleOAuth = async (provider: "google" | "github") => {
    if (!accountType) {
      toast.error("Please select an account type first");
      return;
    }
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
    if (!accountType) {
      toast.error("Please select an account type first");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(isLogin ? "/api/auth/login" : "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, accountType }),
      });
      if (!res.ok) {
        throw new Error("Authentication error");
      }
      const data = await res.json();
      login(data.user, data.token);
      onClose();
      router.push(accountType === "enterprise" ? "/dashboard/business" : "/dashboard/personal");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not sign in.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleWalletConnect = () => {
    if (!accountType) {
      toast.error("Please select an account type first");
      return;
    }
    openWalletModal(() => {
      onClose();
      router.push(accountType === "enterprise" ? "/dashboard/business" : "/dashboard/personal");
    }, accountType === "enterprise" ? "business" : "personal");
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      
      {/* Modal */}
      <div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#0f1729] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image header with subtle text */}
        <div className="relative h-32 overflow-hidden">
          <Image
            src="/earth-space.jpg"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f1729]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/40">
              The Trust Layer
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="relative px-6 pb-6 -mt-4">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute -top-28 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white/60 hover:bg-black/50 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>

          {/* Account Type Selection */}
          <div className="mb-5">
            <p className="mb-3 text-center text-xs font-medium uppercase tracking-wider text-white/40">
              Select account type
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType("personal")}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                  accountType === "personal"
                    ? "border-[#f0b400]/50 bg-[#f0b400]/10 text-[#f0b400]"
                    : "border-white/10 bg-[#1a2744] text-white/60 hover:border-white/20 hover:bg-[#1e2d4d]"
                }`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-sm font-semibold">Personal</span>
              </button>
              <button
                type="button"
                onClick={() => setAccountType("enterprise")}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                  accountType === "enterprise"
                    ? "border-[#f0b400]/50 bg-[#f0b400]/10 text-[#f0b400]"
                    : "border-white/10 bg-[#1a2744] text-white/60 hover:border-white/20 hover:bg-[#1e2d4d]"
                }`}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 21h18" />
                  <path d="M5 21V7l8-4v18" />
                  <path d="M19 21V11l-6-4" />
                  <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
                </svg>
                <span className="text-sm font-semibold">Enterprise</span>
              </button>
            </div>
          </div>

          {/* Auth Options - Only show after account type selected */}
          {accountType && (
            <div className="animate-fade-in">
              {/* OAuth buttons */}
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full gap-3 rounded-xl border-white/10 bg-[#1a2744] text-sm font-medium text-white hover:bg-[#1e2d4d] hover:border-white/20"
                  onClick={() => handleOAuth("google")}
                  disabled={oauthLoading !== null}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  {oauthLoading === "google" ? "Connecting..." : t("signin.google")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full gap-3 rounded-xl border-white/10 bg-[#1a2744] text-sm font-medium text-white hover:bg-[#1e2d4d] hover:border-white/20"
                  onClick={() => handleOAuth("github")}
                  disabled={oauthLoading !== null}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  {oauthLoading === "github" ? "Connecting..." : t("signin.github")}
                </Button>
              </div>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-medium uppercase tracking-widest text-white/30">or</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              {/* Wallet button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleWalletConnect}
                disabled={isConnecting}
                className="h-11 w-full gap-3 rounded-xl border-white/10 bg-[#1a2744] text-sm font-medium text-white hover:bg-[#1e2d4d] hover:border-white/20"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <path d="M1 10h22" />
                </svg>
                {isConnecting ? t("signin.walletConnecting") : t("signin.wallet")}
              </Button>
              {walletError && (
                <p className="mt-2 text-xs text-red-400/90 text-center" role="alert">{walletError}</p>
              )}

              {/* Email toggle */}
              {!showEmailForm ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailForm(true);
                    setTimeout(() => emailInputRef.current?.focus(), 100);
                  }}
                  className="mt-4 w-full text-center text-xs text-white/40 hover:text-white/60 transition-colors"
                >
                  or continue with email
                </button>
              ) : (
                <form onSubmit={handleSubmit} className="mt-4 space-y-3 animate-fade-in">
                  {!isLogin && (
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-10 w-full rounded-xl border border-white/10 bg-[#1a2744] px-3 text-sm text-white placeholder:text-white/30 focus:border-[#f0b400]/40 focus:outline-none"
                      placeholder="Your name"
                    />
                  )}
                  <input
                    ref={emailInputRef}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/10 bg-[#1a2744] px-3 text-sm text-white placeholder:text-white/30 focus:border-[#f0b400]/40 focus:outline-none"
                    placeholder="Email address"
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 w-full rounded-xl border border-white/10 bg-[#1a2744] px-3 text-sm text-white placeholder:text-white/30 focus:border-[#f0b400]/40 focus:outline-none"
                    placeholder="Password"
                  />
                  {error && <p className="text-xs text-red-400">{error}</p>}
                  <Button
                    type="submit"
                    className="h-10 w-full rounded-xl border border-white/20 bg-white/10 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                    disabled={loading}
                  >
                    {loading ? "Processing..." : isLogin ? "Sign in" : "Create account"}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
