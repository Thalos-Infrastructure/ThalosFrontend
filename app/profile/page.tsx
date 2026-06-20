"use client"

import React, { useState, useEffect, useId } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import { useStellarWallet } from "@/lib/stellar-wallet"
import { useAuthStore } from "@/lib/auth-store"
import { updateProfile, type ProfileUpdateInput } from "@/lib/actions/profile"
import { LinkedWallets } from "@/components/profile/linked-wallets"

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  info,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
  info?: string
}) {
  const id = useId()
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        {label}
        {info && (
          <span className="normal-case tracking-normal font-normal text-muted-foreground/50">({info})</span>
        )}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "h-12 w-full rounded-xl border border-border/40 bg-card/30 px-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-[#f0b400]/50 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/15 transition-all duration-200",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
    </div>
  )
}

const Icons = {
  user: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  wallet: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <path d="M1 10h22" />
    </svg>
  ),
  shield: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  check: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  arrowLeft: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  ),
  camera: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
}

export default function ProfilePage() {
  const { t } = useLanguage()
  const router = useRouter()
  const { address, profile, refreshProfile, disconnect } = useStellarWallet()
  const { user, hydrated, logout } = useAuthStore()

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  const isAuthUser = Boolean(user?.id)
  const isWalletOnly = Boolean(address && !user?.id)
  const canSaveOnChain = Boolean(address)

  const roleLabels: Record<string, { label: string; color: string }> = {
    user: { label: t("profile.role.user"), color: "bg-zinc-500/20 text-zinc-400" },
    validator: { label: t("profile.role.validator"), color: "bg-blue-500/20 text-blue-400" },
    dispute_resolver: {
      label: t("profile.role.disputeResolver"),
      color: "bg-purple-500/20 text-purple-400",
    },
    admin: { label: t("profile.role.admin"), color: "bg-[#f0b400]/20 text-[#f0b400]" },
  }

  const accountTypeLabels: Record<string, string> = {
    personal: t("profile.account.personal"),
    enterprise: t("profile.account.enterprise"),
  }

  useEffect(() => {
    if (!hydrated) return

    if (!user && !address) {
      router.push("/")
      return
    }

    if (profile) {
      setDisplayName(profile.display_name || "")
      setEmail(profile.email || user?.email || "")
      setAvatarUrl(profile.avatar_url || "")
      setIsLoading(false)
      return
    }

    if (user) {
      setDisplayName(user.name || "")
      setEmail(user.email || "")
      setAvatarUrl("")
    }

    if (address) {
      refreshProfile().finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [hydrated, user, address, profile, router, refreshProfile])

  const handleSave = async () => {
    if (!address) return

    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    const updates: ProfileUpdateInput = {
      display_name: displayName || undefined,
      email: email || undefined,
      avatar_url: avatarUrl || undefined,
    }

    const { error } = await updateProfile(address, updates)

    if (error) {
      setSaveError(error)
    } else {
      setSaveSuccess(true)
      await refreshProfile()
      setTimeout(() => setSaveSuccess(false), 3000)
    }

    setIsSaving(false)
  }

  const handleSignOut = () => {
    logout()
    disconnect()
    router.push("/")
  }

  const handleDisconnectWallet = () => {
    disconnect()
    router.push("/")
  }

  const truncateAddress = (addr: string) => {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const avatarInitial = () => {
    if (displayName) return displayName.charAt(0).toUpperCase()
    if (email) return email.charAt(0).toUpperCase()
    if (address) return address.charAt(0)
    return "?"
  }

  const sidebarTitle = () => {
    if (displayName) return displayName
    if (user?.name) return user.name
    if (address) return truncateAddress(address)
    if (user?.email) return user.email.split("@")[0]
    return t("profile.title")
  }

  if (!hydrated || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#f0b400] border-t-transparent" />
      </div>
    )
  }

  if (!user && !address) {
    return null
  }

  const currentRole = profile?.role || "user"
  const currentAccountType = profile?.account_type || "personal"
  const dashboardHref =
    currentAccountType === "enterprise" ? "/dashboard/business" : "/dashboard/personal"

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href={dashboardHref}>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                {Icons.arrowLeft}
                {t("profile.backToDashboard")}
              </Button>
            </Link>
          </div>
          <Link href="/">
            <Image
              src="/thalos-icon.png"
              alt="Thalos"
              width={32}
              height={32}
              className="opacity-80 hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("profile.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("profile.subtitle")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
              <div className="mb-6 flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#f0b400]/20 to-[#f0b400]/5 border-2 border-[#f0b400]/30">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="Avatar" width={96} height={96} className="rounded-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-[#f0b400]">{avatarInitial()}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-card border border-border/40 text-muted-foreground hover:text-foreground hover:border-[#f0b400]/30 transition-colors"
                  >
                    {Icons.camera}
                  </button>
                </div>
                <h2 className="text-lg font-semibold text-foreground text-center">{sidebarTitle()}</h2>
                <p className="text-sm text-muted-foreground">{email || user?.email || t("profile.noEmail")}</p>
              </div>

              <div className="mb-6 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("profile.role")}
                  </span>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-medium", roleLabels[currentRole].color)}>
                    {roleLabels[currentRole].label}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("profile.accountType")}
                  </span>
                  <span className="text-sm text-foreground">{accountTypeLabels[currentAccountType]}</span>
                </div>
              </div>

              {isWalletOnly && address && (
                <div className="rounded-xl bg-background/50 p-4 border border-border/30">
                  <div className="flex items-center gap-3 mb-2">
                    {Icons.wallet}
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {t("profile.connectedWallet")}
                    </span>
                  </div>
                  <p className="font-mono text-sm text-foreground break-all">{address}</p>
                </div>
              )}

              {isAuthUser ? (
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="mt-6 w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  {t("profile.signOut")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleDisconnectWallet}
                  className="mt-6 w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  {t("profile.disconnectWallet")}
                </Button>
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {isAuthUser && user?.id && (
              <LinkedWallets userId={user.id} />
            )}

            <div className={cn("rounded-2xl border border-border/40 bg-card/50 p-8", isAuthUser && "mt-8")}>
              <h3 className="mb-6 text-lg font-semibold text-foreground flex items-center gap-2">
                {Icons.user}
                {t("profile.personalInfo")}
              </h3>

              <div className="space-y-6">
                <FormInput
                  label={t("profile.displayName")}
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder={t("profile.displayNamePlaceholder")}
                  info={t("profile.displayNameInfo")}
                />

                <FormInput
                  label={t("profile.email")}
                  value={email}
                  onChange={setEmail}
                  placeholder={t("profile.emailPlaceholder")}
                  type="email"
                  info={t("profile.emailInfo")}
                />

                <FormInput
                  label={t("profile.avatarUrl")}
                  value={avatarUrl}
                  onChange={setAvatarUrl}
                  placeholder={t("profile.avatarPlaceholder")}
                  info={t("profile.avatarInfo")}
                />

                {!canSaveOnChain && isAuthUser && (
                  <p className="text-sm text-muted-foreground">{t("profile.saveRequiresWallet")}</p>
                )}

                <div className="flex items-center gap-4 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !canSaveOnChain}
                    className="bg-[#f0b400] text-black hover:bg-[#f0b400]/90 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                        {t("profile.saving")}
                      </>
                    ) : (
                      t("profile.saveChanges")
                    )}
                  </Button>

                  {saveSuccess && (
                    <span className="flex items-center gap-2 text-sm text-green-400">
                      {Icons.check}
                      {t("profile.saved")}
                    </span>
                  )}

                  {saveError && <span className="text-sm text-red-400">{saveError}</span>}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border/40 bg-card/50 p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  {t("profile.memberSince")}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-border/40 bg-card/50 p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  {t("profile.agreements")}
                </p>
                <p className="text-lg font-semibold text-foreground">—</p>
              </div>
              <div className="rounded-xl border border-border/40 bg-card/50 p-6">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                  {t("profile.totalVolume")}
                </p>
                <p className="text-lg font-semibold text-foreground">— USDC</p>
              </div>
            </div>

            {(currentRole === "dispute_resolver" || currentRole === "admin") && (
              <div className="mt-8 rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  {Icons.shield}
                  <h3 className="text-lg font-semibold text-foreground">Dispute Resolver Access</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  You have permission to review and resolve disputes. Access the dispute management panel to handle open cases.
                </p>
                <Link href="/disputes">
                  <Button variant="outline" className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10">
                    View Open Disputes
                  </Button>
                </Link>
              </div>
            )}

            {currentRole === "validator" && (
              <div className="mt-8 rounded-2xl border border-blue-500/30 bg-blue-500/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  {Icons.check}
                  <h3 className="text-lg font-semibold text-foreground">Validator Access</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  You can validate bounty submissions. Check the bounties awaiting your approval.
                </p>
                <Link href="/dashboard/bounties">
                  <Button variant="outline" className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10">
                    View Pending Validations
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
