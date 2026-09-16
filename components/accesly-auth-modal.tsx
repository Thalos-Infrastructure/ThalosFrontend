"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useAccesly } from "@accesly/react"
import { useAuthStore } from "@/lib/auth-store"
import { completeAcceslyLogin, type AcceslyLoginStage } from "@/lib/accesly/login-flow"

interface AcceslyAuthModalProps {
  open: boolean
  onClose: () => void
}

const STAGE_LABELS: Record<AcceslyLoginStage, string> = {
  wallet: "Creating your smart account…",
  "g-address": "Activating USDC trustline…",
  session: "Signing you in…",
}

/**
 * Accesly (passkey, non-custodial) login — #109.
 *
 * Cognito email+password identifies the user; the device passkey (WebAuthn)
 * holds the signing key share. No extension, no seed phrase, no XLM required.
 */
export function AcceslyAuthModal({ open, onClose }: AcceslyAuthModalProps) {
  const router = useRouter()
  const accesly = useAccesly()
  const { login } = useAuthStore()

  const [mode, setMode] = useState<"signin" | "signup" | "confirm">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState<AcceslyLoginStage | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const finishLogin = async () => {
    const result = await completeAcceslyLogin(accesly, email, password, setStage)
    login(result.user, result.token)
    toast.success(`Wallet ready: ${result.gAddress.slice(0, 6)}…${result.gAddress.slice(-4)}`)
    onClose()
    router.push("/dashboard/personal")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === "signup") {
        const res = await accesly.auth.signUp(email, password)
        if (!res.userConfirmed) {
          setMode("confirm")
          return
        }
        await accesly.auth.signIn(email, password)
        await finishLogin()
      } else if (mode === "confirm") {
        await accesly.auth.confirmSignUp(email, code)
        await accesly.auth.signIn(email, password)
        await finishLogin()
      } else {
        await accesly.auth.signIn(email, password)
        await finishLogin()
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Accesly login failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
      setStage(null)
    }
  }

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#0c1220] p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mb-1 flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f0b400"
            strokeWidth="1.5"
          >
            <path d="M12 1a5 5 0 0 0-5 5v4h10V6a5 5 0 0 0-5-5z" />
            <rect x="4" y="10" width="16" height="12" rx="2" />
            <circle cx="12" cy="16" r="1.5" fill="#f0b400" />
          </svg>
          <h2 className="text-2xl font-bold text-white">Accesly Passkey</h2>
        </div>
        <p className="text-sm text-white/50 mb-6">
          Non-custodial wallet secured by your device passkey. No extension, no seed phrase.
        </p>

        {mode !== "confirm" && (
          <div className="mb-5 flex rounded-xl bg-white/5 p-1">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                  mode === m ? "bg-[#f0b400] text-[#0c1220]" : "text-white/50 hover:text-white/70"
                }`}
              >
                {m === "signin" ? "Sign in" : "Create account"}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "confirm" ? (
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">
                Verification code (sent to {email})
              </label>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="h-10 w-full rounded-xl border border-white/15 bg-transparent px-3 text-sm text-white placeholder:text-white/30 focus:border-[#f0b400]/50 focus:outline-none"
                placeholder="123456"
                autoFocus
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/15 bg-transparent px-3 text-sm text-white placeholder:text-white/30 focus:border-[#f0b400]/50 focus:outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/15 bg-transparent px-3 text-sm text-white placeholder:text-white/30 focus:border-[#f0b400]/50 focus:outline-none"
                  placeholder="Min. 8 characters"
                />
              </div>
            </>
          )}

          {stage && <p className="text-xs text-[#f0b400] animate-pulse">{STAGE_LABELS[stage]}</p>}
          {error && (
            <p className="text-xs text-red-400" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading || !email || (mode === "confirm" ? !code : !password)}
            className="h-11 w-full rounded-xl bg-[#f0b400] text-sm font-semibold text-[#0c1220] hover:bg-[#d9a300] transition-colors"
          >
            {loading
              ? stage
                ? STAGE_LABELS[stage]
                : "Processing…"
              : mode === "signup"
                ? "Create account & passkey"
                : mode === "confirm"
                  ? "Confirm & create wallet"
                  : "Sign in with passkey"}
          </Button>
        </form>

        <p className="mt-4 text-center text-[11px] text-white/30">
          Your key is split between this device&apos;s passkey and Accesly&apos;s distributed
          custody — neither can sign alone.
        </p>
      </div>
    </div>
  )
}
