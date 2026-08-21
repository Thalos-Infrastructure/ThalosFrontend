"use client"

/**
 * Every way into Thalos, in Thalos's own chrome (#108).
 *
 * Google, GitHub, email OTP and a self-custodied wallet all authenticate
 * through Pollar, but Pollar's login modal is never opened — each button drives
 * its provider directly and the flow is rendered from `authStep`. That is the
 * whole point: one visual language, one session, no white modal on top of ours.
 *
 * Shared because there are two front doors — the navbar modal and the bottom-bar
 * panel — that used to carry copy-pasted button blocks and had already drifted
 * apart. Passkey is NOT here: Accesly is its own auth system, so the caller
 * renders that button itself (see components/accesly-auth-modal.tsx).
 */

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/lib/i18n"
import { usePollarWallet } from "@/lib/pollar-wallet"
import type { Profile } from "@/lib/actions/profile"

/** Which sub-view the block is showing; `null` is the list of providers. */
type Expanded = "email" | "wallet" | null

export interface PollarLoginOptionsProps {
  /** Only decides the dashboard for a brand-new account; existing ones route by profile. */
  accountType: "personal" | "enterprise"
  /** Fired once the Thalos session exists. Close the modal and route here. */
  onAuthenticated: (address: string, profile: Profile | null) => void
  /** Rendered between the social buttons and the wallet ones. */
  divider?: React.ReactNode
  /** Rendered under the wallet button, for auth systems that are not Pollar. */
  children?: React.ReactNode
}

const OUTLINE =
  "h-11 w-full gap-3 rounded-xl border-white/15 bg-transparent text-sm font-medium text-white hover:bg-white/5 hover:border-white/25"

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75z"
      />
    </svg>
  )
}

function GithubMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.35-1.29-1.71-1.29-1.71-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.24 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5z" />
    </svg>
  )
}

function WalletMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <path d="M1 10h22" />
    </svg>
  )
}

function MailMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

export function PollarLoginOptions({
  accountType,
  onAuthenticated,
  divider,
  children,
}: PollarLoginOptionsProps) {
  const { t } = useLanguage()
  const {
    enabled,
    isConnecting,
    error,
    authStep,
    walletOptions,
    loginWith,
    startEmailLogin,
    sendEmailCode,
    verifyEmailCode,
    cancelLogin,
  } = usePollarWallet()

  const [expanded, setExpanded] = useState<Expanded>(null)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")

  // Without a publishable key there is no login at all, so say so rather than
  // rendering dead buttons — every provider here goes through Pollar.
  if (!enabled) {
    return <p className="text-center text-xs text-red-400/90">{t("signin.comingSoon")}</p>
  }

  const done = (address: string, profile: Profile | null) => {
    setExpanded(null)
    setEmail("")
    setCode("")
    onAuthenticated(address, profile)
  }

  const collapse = () => {
    cancelLogin()
    setExpanded(null)
    setCode("")
  }

  const openEmail = () => {
    setExpanded("email")
    void startEmailLogin(done, accountType)
  }

  const sendingCode = authStep === "sending_email"
  const verifying = authStep === "verifying_email_code"
  const awaitingCode = authStep === "entering_code" || verifying

  if (expanded === "email") {
    return (
      <div className="flex flex-col gap-2.5">
        {!awaitingCode ? (
          <form
            className="flex flex-col gap-2.5"
            onSubmit={(e) => {
              e.preventDefault()
              if (email.trim()) sendEmailCode(email.trim())
            }}
          >
            <input
              type="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("signin.emailPlaceholder")}
              className="h-11 w-full rounded-xl border border-white/15 bg-transparent px-4 text-sm text-white placeholder:text-white/30 focus:border-[#f0b400]/50 focus:outline-none"
            />
            <Button type="submit" disabled={sendingCode} className={OUTLINE} variant="outline">
              {sendingCode ? t("signin.emailSending") : t("signin.emailSendCode")}
            </Button>
          </form>
        ) : (
          <form
            className="flex flex-col gap-2.5"
            onSubmit={(e) => {
              e.preventDefault()
              if (code.trim()) verifyEmailCode(code.trim())
            }}
          >
            <p className="text-center text-[11px] text-white/40">{t("signin.emailCodeLabel")}</p>
            <input
              // Not type="number": leading zeros matter and spinners are wrong here.
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={6}
              autoFocus
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder={t("signin.emailCodePlaceholder")}
              className="h-11 w-full rounded-xl border border-white/15 bg-transparent px-4 text-center text-lg tracking-[0.4em] text-white placeholder:text-white/20 focus:border-[#f0b400]/50 focus:outline-none"
            />
            <Button type="submit" disabled={verifying} className={OUTLINE} variant="outline">
              {verifying ? t("signin.emailVerifying") : t("signin.emailVerify")}
            </Button>
            <button
              type="button"
              onClick={() => sendEmailCode(email.trim())}
              className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
            >
              {t("signin.emailResend")}
            </button>
          </form>
        )}

        {error && (
          <p className="text-xs text-red-400/90 text-center" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={collapse}
          className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
        >
          {awaitingCode ? t("signin.emailChange") : t("signin.back")}
        </button>
      </div>
    )
  }

  if (expanded === "wallet") {
    return (
      <div className="flex flex-col gap-2.5">
        <p className="text-center text-[11px] text-white/40">{t("signin.pickWallet")}</p>

        {walletOptions.length === 0 ? (
          <p className="text-center text-xs text-white/50">{t("signin.noWalletsAvailable")}</p>
        ) : (
          <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto">
            {walletOptions.map((wallet) => (
              <Button
                key={wallet.id}
                type="button"
                variant="outline"
                disabled={isConnecting}
                onClick={() => void loginWith(wallet.id, done, accountType)}
                className="h-11 justify-start gap-2.5 rounded-xl border-white/15 bg-transparent px-3 text-sm font-medium text-white hover:bg-white/5 hover:border-white/25"
              >
                {wallet.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- adapter-supplied URL/data-URI, not a known host
                  <img src={wallet.iconUrl} alt="" width={18} height={18} className="rounded" />
                ) : (
                  <WalletMark />
                )}
                <span className="truncate">{wallet.label}</span>
              </Button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400/90 text-center" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={collapse}
          className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
        >
          {t("signin.back")}
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <Button
        type="button"
        variant="outline"
        disabled={isConnecting}
        onClick={() => void loginWith("google", done, accountType)}
        className={OUTLINE}
      >
        <GoogleMark />
        {t("signin.google")}
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={isConnecting}
        onClick={() => void loginWith("github", done, accountType)}
        className={OUTLINE}
      >
        <GithubMark />
        {t("signin.github")}
      </Button>

      <Button
        type="button"
        variant="outline"
        disabled={isConnecting}
        onClick={openEmail}
        className={OUTLINE}
      >
        <MailMark />
        {t("signin.email")}
      </Button>

      {divider}

      <Button
        type="button"
        variant="outline"
        disabled={isConnecting}
        onClick={() => setExpanded("wallet")}
        className={OUTLINE}
      >
        <WalletMark />
        {t("signin.wallet")}
      </Button>

      {children}

      <p className="mt-1 text-center text-[11px] text-white/40">{t("signin.noWalletDesc")}</p>

      {error && (
        <p className="text-xs text-red-400/90 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
