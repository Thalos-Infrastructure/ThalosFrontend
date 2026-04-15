"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import { useStellarWallet } from "@/lib/stellar-wallet"
import { useAuthStore } from "@/lib/auth-store"
import { signInWithOAuthAction } from "@/lib/actions/auth-oauth"
import { toast } from "sonner"
import { APP_URL } from "@/lib/config"

type AuthView = "main" | "email-login" | "email-register" | "forgot-password"

interface SignInPanelProps { open: boolean; onClose: () => void }

export function SignInPanel({ open, onClose }: SignInPanelProps) {
  const { t } = useLanguage()
  const router = useRouter()
  const { logout, setUser, setToken } = useAuthStore()
  const { address, isConnecting, walletError, openWalletModal } = useStellarWallet()
  const [profileType, setProfileType] = useState<"personal" | "business">("personal")
  const [oauthLoading, setOauthLoading] = useState<"google" | "email" | null>(null)
  const [authView, setAuthView] = useState<AuthView>("main")
  const [emailForm, setEmailForm] = useState({ email: "", password: "", name: "" })
  const [emailLoading, setEmailLoading] = useState(false)
  const [forgotEmailSent, setForgotEmailSent] = useState(false)
  const dashboardHref = profileType === "personal" ? "/dashboard/personal" : "/dashboard/business"

  const handleLoginWithWallet = () => {
    openWalletModal(() => {
      logout()
      onClose()
      router.push(dashboardHref)
    }, profileType === "business" ? "enterprise" : "personal")
  }

  const handleOAuth = async (provider: "google") => {
    setOauthLoading(provider)
    try {
      const baseUrl = typeof window !== "undefined" ? window.location.origin : APP_URL
      const redirectTo = `${baseUrl}/auth/callback?next=${encodeURIComponent(dashboardHref)}`
      await signInWithOAuthAction(provider, redirectTo)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not connect"
      toast.error(msg)
    } finally {
      setOauthLoading(null)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailForm.email || !emailForm.password) return
    setEmailLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForm.email, password: emailForm.password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Login failed")
      setUser(data.user)
      setToken(data.token)
      toast.success("Welcome back!")
      onClose()
      router.push(dashboardHref)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Login failed")
    } finally {
      setEmailLoading(false)
    }
  }

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailForm.email || !emailForm.password || !emailForm.name) return
    setEmailLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: emailForm.email, 
          password: emailForm.password, 
          name: emailForm.name,
          accountType: profileType === "business" ? "enterprise" : "personal"
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Registration failed")
      setUser(data.user)
      setToken(data.token)
      toast.success("Account created!")
      onClose()
      router.push(dashboardHref)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Registration failed")
    } finally {
      setEmailLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailForm.email) return
    setEmailLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForm.email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send reset email")
      setForgotEmailSent(true)
      toast.success("Reset email sent!")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to send reset email")
    } finally {
      setEmailLoading(false)
    }
  }

  const resetAuthView = () => {
    setAuthView("main")
    setEmailForm({ email: "", password: "", name: "" })
    setForgotEmailSent(false)
  }

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden"
    else document.body.style.overflow = ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        className="relative z-10 flex w-full max-w-4xl overflow-hidden rounded-2xl border border-white/15 bg-[#0c1220]/95 backdrop-blur-2xl shadow-[0_40px_120px_rgba(0,0,0,0.5),0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh" }}
      >
        {/* Left - Image */}
        <div className="relative hidden w-[45%] md:block">
          <Image
            src="/earth-space.png"
            alt="Earth from space"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#0c1220]/90" />
        </div>

        {/* Right - Form */}
        <div className="relative flex flex-1 flex-col justify-center overflow-y-auto px-8 py-10 md:px-10">
          <button onClick={onClose} className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-white/30 hover:bg-white/8 hover:text-white transition-colors" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>

          {/* Email Login View */}
          {authView === "email-login" && (
            <>
              <button onClick={resetAuthView} className="mb-4 flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
              </button>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-white">Sign in with Email</h2>
                <p className="mt-2 text-sm text-white/60">Enter your credentials to access your account</p>
              </div>
              <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
                <Input
                  type="email"
                  placeholder="Email address"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/40"
                  required
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/40"
                  required
                />
                <Button type="submit" disabled={emailLoading} className="h-11 rounded-xl bg-[#f0b400] text-black font-semibold hover:bg-[#f0b400]/90">
                  {emailLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              <div className="mt-4 flex items-center justify-between text-sm">
                <button onClick={() => setAuthView("forgot-password")} className="text-white/60 hover:text-[#f0b400] transition-colors">
                  Forgot password?
                </button>
                <button onClick={() => setAuthView("email-register")} className="text-[#f0b400] hover:underline">
                  Create account
                </button>
              </div>
            </>
          )}

          {/* Email Register View */}
          {authView === "email-register" && (
            <>
              <button onClick={resetAuthView} className="mb-4 flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
              </button>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-white">Create Account</h2>
                <p className="mt-2 text-sm text-white/60">Sign up with your email address</p>
              </div>
              <form onSubmit={handleEmailRegister} className="flex flex-col gap-3">
                <Input
                  type="text"
                  placeholder="Full name"
                  value={emailForm.name}
                  onChange={(e) => setEmailForm({ ...emailForm, name: e.target.value })}
                  className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/40"
                  required
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/40"
                  required
                />
                <Input
                  type="password"
                  placeholder="Password (min 8 characters)"
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/40"
                  minLength={8}
                  required
                />
                <Button type="submit" disabled={emailLoading} className="h-11 rounded-xl bg-[#f0b400] text-black font-semibold hover:bg-[#f0b400]/90">
                  {emailLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
              <p className="mt-4 text-center text-sm text-white/60">
                Already have an account?{" "}
                <button onClick={() => setAuthView("email-login")} className="text-[#f0b400] hover:underline">
                  Sign in
                </button>
              </p>
            </>
          )}

          {/* Forgot Password View */}
          {authView === "forgot-password" && (
            <>
              <button onClick={resetAuthView} className="mb-4 flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                Back
              </button>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-white">Reset Password</h2>
                <p className="mt-2 text-sm text-white/60">
                  {forgotEmailSent 
                    ? "Check your email for a reset link" 
                    : "Enter your email to receive a password reset link"}
                </p>
              </div>
              {!forgotEmailSent ? (
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={emailForm.email}
                    onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                    className="h-11 rounded-xl border-white/15 bg-white/5 text-white placeholder:text-white/40"
                    required
                  />
                  <Button type="submit" disabled={emailLoading} className="h-11 rounded-xl bg-[#f0b400] text-black font-semibold hover:bg-[#f0b400]/90">
                    {emailLoading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </form>
              ) : (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center">
                  <svg className="mx-auto mb-2 h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-400">Reset link sent to {emailForm.email}</p>
                  <button onClick={() => setAuthView("email-login")} className="mt-3 text-sm text-[#f0b400] hover:underline">
                    Back to sign in
                  </button>
                </div>
              )}
            </>
          )}

          {/* Main View */}
          {authView === "main" && (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-white">{t("signin.welcome")}</h2>
                <p className="mt-2 text-sm text-white/60">{t("signin.desc")}</p>
              </div>

              <div className="mb-6">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/40">{t("signin.accountType")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { id: "personal" as const, label: t("signin.personal"), icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
                    { id: "business" as const, label: t("signin.enterprise"), icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg> },
                  ]).map((type) => (
                    <button key={type.id} onClick={() => setProfileType(type.id)}
                      className={cn("flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-300",
                        profileType === type.id ? "border-[#f0b400]/30 bg-[#f0b400]/10 text-[#f0b400]" : "border-white/15 bg-white/5 text-white/70 hover:border-white/25 hover:text-white"
                      )}>{type.icon}{type.label}</button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <Button 
                  variant="outline" 
                  onClick={() => handleOAuth("google")}
                  disabled={oauthLoading !== null}
                  className="h-11 w-full gap-3 rounded-xl border-white/15 bg-white/5 text-sm text-white font-semibold hover:bg-white/10 hover:border-white/25 transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  {oauthLoading === "google" ? t("signin.walletConnecting") : t("signin.google")}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setAuthView("email-login")}
                  className="h-11 w-full gap-3 rounded-xl border-white/15 bg-white/5 text-sm text-white font-semibold hover:bg-white/10 hover:border-white/25 transition-all"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  {t("signin.email")}
                </Button>
              </div>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">{t("signin.or")}</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <Button
                variant="outline"
                onClick={handleLoginWithWallet}
                disabled={isConnecting}
                className="h-11 w-full gap-3 rounded-xl border-white/15 bg-white/5 text-sm text-white font-semibold hover:bg-white/10 hover:border-white/25 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
                {isConnecting ? t("signin.walletConnecting") : t("signin.loginWithWallet")}
              </Button>
              {walletError && (
                <p className="mt-2 text-xs text-red-400/90" role="alert">{walletError}</p>
              )}

              <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4">
                <Link href="/admin" onClick={onClose}>
                  <button className="flex items-center gap-2 text-xs font-medium text-white/40 hover:text-[#f0b400] transition-colors">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    {t("signin.admin")}
                  </button>
                </Link>
                <p className="text-[10px] text-white/25">{t("signin.secured")}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
