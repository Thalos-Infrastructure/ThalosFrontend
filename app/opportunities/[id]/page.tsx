"use client"

import React, { useState, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ThalosLoader } from "@/components/thalos-loader"
import { useLanguage } from "@/lib/i18n"
import { useStellarWallet } from "@/lib/stellar-wallet"
import { useAuthStore } from "@/lib/auth-store"
import {
  getOpportunity,
  applyToOpportunity,
  getMyApplication,
  type Opportunity,
  type Application,
} from "@/lib/api"

const statusColors: Record<string, string> = {
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  filled: "bg-[#f0b400]/20 text-[#f0b400] border-[#f0b400]/30",
}

function formatBudget(amount: number | string) {
  const n = typeof amount === "string" ? parseFloat(amount) : amount
  if (Number.isNaN(n)) return String(amount)
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

export default function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { t } = useLanguage()
  const { address, openWalletModal } = useStellarWallet()
  const { token, user } = useAuthStore()

  const goBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push("/connect?tab=opportunities")
    }
  }

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)

  // Apply flow
  const [showApplyForm, setShowApplyForm] = useState(false)
  const [message, setMessage] = useState("")
  const [myApplication, setMyApplication] = useState<Application | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [applyError, setApplyError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const result = await getOpportunity(id, token)
      if (cancelled) return
      if (!result.success || !result.data) {
        setError(result.error || t("connect.notFoundDesc"))
        setOpportunity(null)
      } else {
        setError(null)
        setOpportunity(result.data)
      }
      setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id, token, t])

  // Restore the builder's existing application (if any) so the applied /
  // rejected / accepted state survives a reload instead of resetting to "Apply".
  useEffect(() => {
    let cancelled = false
    async function restoreApplication() {
      if (!token || !user?.id || !id) return
      const result = await getMyApplication(id, user.id, token)
      if (cancelled) return
      if (result.success && result.data) {
        setMyApplication(result.data)
      }
    }
    restoreApplication()
    return () => {
      cancelled = true
    }
  }, [id, token, user?.id])

  const canApply = opportunity?.status === "open"

  const handleApply = async () => {
    if (!opportunity) return
    setSubmitting(true)
    setApplyError(null)
    const result = await applyToOpportunity(opportunity.id, message.trim(), token)
    setSubmitting(false)

    if (!result.success) {
      const messageText = result.error || t("connect.applyFail")
      if (/already applied/i.test(messageText)) {
        setShowApplyForm(false)
        toast.info(t("connect.alreadyApplied"))
        restoreMyApplication()
      } else {
        setApplyError(messageText)
        toast.error(messageText)
      }
      return
    }

    setMyApplication(result.data ?? null)
    setShowApplyForm(false)
    toast.success(t("connect.applySuccess"))
  }

  const restoreMyApplication = async () => {
    if (!token || !user?.id || !id) return
    const result = await getMyApplication(id, user.id, token)
    if (result.success && result.data) setMyApplication(result.data)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link href="/">
            <Image
              src="/thalos-icon.png"
              alt="Thalos"
              width={32}
              height={32}
              className="opacity-80 hover:opacity-100 transition-opacity"
            />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={goBack}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            {t("connect.backToDirectory")}
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {loading ? (
          <div className="flex justify-center py-20">
            <ThalosLoader />
          </div>
        ) : error || !opportunity ? (
          <div className="rounded-2xl border border-border/40 bg-card/50 p-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-foreground">{t("connect.notFound")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {error || t("connect.notFoundDesc")}
            </p>
            <Button onClick={goBack} className="mt-6 bg-[#f0b400] text-black hover:bg-[#f0b400]/90">
              {t("connect.backToDirectory")}
            </Button>
          </div>
        ) : (
          <div className="space-y-10">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    statusColors[opportunity.status],
                  )}
                >
                  {t(`connect.status.${opportunity.status}`)}
                </span>
                <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs font-medium text-muted-foreground border border-border/40">
                  {t(`connect.engagement.${opportunity.engagement_type}`)}
                </span>
              </div>
              <div>
                <div className="mb-3">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    {opportunity.title}
                  </h1>
                  <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
                    {(opportunity.description || "").replace(/\s+/g, " ").trim()}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {t("connect.budget")}
                </h3>
                <p className="text-2xl font-bold text-[#f0b400]">
                  {formatBudget(opportunity.budget_amount)}{" "}
                  <span className="text-base">{opportunity.budget_asset}</span>
                </p>
              </div>
            </div>

            {opportunity.skills_required.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-semibold text-foreground">
                  {t("connect.skills")}
                </h3>
                <div className="flex flex-wrap gap-y-1.5 gap-x-3">
                  {opportunity.skills_required.map((skill) => (
                    <span key={skill} className="text-sm text-muted-foreground">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Section — heading is flush with title & skills; content in the card. */}
            {canApply && (
              <>
                <h3 className="text-xl font-semibold text-foreground mb-5">{t("connect.apply")}</h3>
                <div className="rounded-2xl border border-border/40 bg-card/50 py-6">
                  {!address ? (
                    <div className="py-6 text-center">
                      <p className="text-muted-foreground mb-4">{t("connect.connectToApply")}</p>
                      <Button
                        onClick={() => openWalletModal()}
                        className="bg-[#f0b400] text-black hover:bg-[#f0b400]/90"
                      >
                        Connect Wallet
                      </Button>
                    </div>
                  ) : myApplication ? (
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <div className="flex-1 rounded-xl border border-border/40 bg-card/50 py-4">
                        <p className="mb-1.5 block text-sm font-semibold text-foreground">
                          {t("connect.applyMessage")}
                        </p>
                        <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
                          {myApplication.message || "—"}
                        </p>
                      </div>

                      <div className="sm:w-44 shrink-0">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                            myApplication.status === "rejected"
                              ? "border-red-500/30 bg-red-500/10 text-red-400"
                              : "border-green-500/30 bg-green-500/10 text-green-400"
                          }`}
                        >
                          {myApplication.status === "rejected"
                            ? t("connect.rejected")
                            : myApplication.status === "accepted"
                              ? t("connect.accepted")
                              : t("connect.applied")}
                        </span>
                        {myApplication.status === "pending" && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("connect.applySuccess")}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : showApplyForm ? (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-foreground">
                          {t("connect.applyMessage")}
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={t("connect.applyMessagePlaceholder")}
                          rows={4}
                          className="w-full rounded-xl border border-border/40 bg-background/50 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-[#f0b400]/50 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/15 resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          onClick={handleApply}
                          disabled={submitting}
                          className="bg-[#f0b400] text-black hover:bg-[#f0b400]/90"
                        >
                          {submitting ? "..." : t("connect.apply")}
                        </Button>
                        <Button variant="outline" onClick={() => setShowApplyForm(false)}>
                          {t("connect.cancel")}
                        </Button>
                      </div>
                      {applyError && <p className="text-sm text-red-400">{applyError}</p>}
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowApplyForm(true)}
                      className="w-full bg-[#f0b400] text-black hover:bg-[#f0b400]/90"
                    >
                      {t("connect.apply")}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
