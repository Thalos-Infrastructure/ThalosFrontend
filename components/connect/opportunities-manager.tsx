"use client"

import React, { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { ThalosLoader } from "@/components/thalos-loader"
import {
  createOpportunity,
  getOpenOpportunities,
  listMyOpportunities,
  updateOpportunityStatus,
  listApplications,
  updateApplicationStatus,
  type Opportunity,
  type Application,
  type EngagementType,
} from "@/lib/api"
import { getProfileByUserId } from "@/lib/actions/profile"

const statusBadge: Record<string, string> = {
  open: "bg-green-500/20 text-green-400 border-green-500/30",
  closed: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  filled: "bg-[#f0b400]/20 text-[#f0b400] border-[#f0b400]/30",
}

const applicationBadge: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  accepted: "bg-green-500/20 text-green-400 border-green-500/30",
  rejected: "bg-red-500/20 text-red-400 border-red-500/30",
}

interface ApplicantIdentity {
  name: string | null
  wallet: string
}

const inputClass =
  "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#f0b400]/40"

export function OpportunitiesManager({
  token,
  profileId,
  userId,
  onStartAgreement,
}: {
  token: string | null
  profileId: string | null
  userId: string | null
  onStartAgreement: (opportunity: Opportunity, application: Application, builderWallet: string) => void
}) {
  const { t } = useLanguage()

  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [statusBusy, setStatusBusy] = useState<string | null>(null)

  // Create form fields
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [skillsInput, setSkillsInput] = useState("")
  const [budgetInput, setBudgetInput] = useState("")
  const [engagementType, setEngagementType] = useState<EngagementType>("fixed")

  // Applicants per opportunity
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [applicationsByOpp, setApplicationsByOpp] = useState<Record<string, Application[]>>({})
  const [appsLoading, setAppsLoading] = useState<Record<string, boolean>>({})
  const [applicantProfiles, setApplicantProfiles] = useState<Record<string, ApplicantIdentity>>({})
  const applicantProfilesRef = useRef(applicantProfiles)

  useEffect(() => {
    applicantProfilesRef.current = applicantProfiles
  }, [applicantProfiles])

  // Seed the manager with this project's opportunities (session-created ones are kept).
  // Primary source: GET /opportunities/mine (all statuses, so filled/closed
  // opportunities stay listed and their accepted applicants reachable).
  // Fallback: open-only discovery filtered client-side — covers team members,
  // whose JWT resolves to a non-enterprise profile and gets 403 from /mine.
  useEffect(() => {
    let cancelled = false
    async function seed() {
      setLoading(true)
      const merge = (incoming: Opportunity[]) => {
        if (incoming.length === 0) return
        setOpportunities((prev) => {
          const map = new Map(prev.map((o) => [o.id, o]))
          incoming.forEach((o) => { if (!map.has(o.id)) map.set(o.id, o) })
          return Array.from(map.values())
        })
      }
      const mine = await listMyOpportunities(token)
      if (cancelled) return
      if (mine.success && mine.data) {
        merge(mine.data)
      } else {
        const result = await getOpenOpportunities({}, token)
        if (cancelled) return
        if (result.success) {
          merge(
            (result.data || []).filter((o) => {
              if (!o.project_id) return false
              return o.project_id === profileId || o.project_id === userId
            })
          )
        }
      }
      if (!cancelled) setLoading(false)
    }
    seed()
    return () => { cancelled = true }
  }, [token, profileId, userId])

  const resolveApplicant = useCallback(async (builderId: string) => {
    if (applicantProfilesRef.current[builderId]) return
    const result = await getProfileByUserId(builderId)
    const identity: ApplicantIdentity = {
      name: result.profile?.display_name ?? null,
      wallet: result.wallet ?? builderId,
    }
    setApplicantProfiles((prev) => ({ ...prev, [builderId]: identity }))
  }, [])

  const toggleExpanded = useCallback(async (opportunity: Opportunity) => {
    setExpandedId((prev) => (prev === opportunity.id ? null : opportunity.id))
    if (expandedId !== opportunity.id && !applicationsByOpp[opportunity.id]) {
      setAppsLoading((prev) => ({ ...prev, [opportunity.id]: true }))
      const result = await listApplications(opportunity.id, token)
      setAppsLoading((prev) => ({ ...prev, [opportunity.id]: false }))
      if (result.success) {
        setApplicationsByOpp((prev) => ({ ...prev, [opportunity.id]: result.data || [] }))
        ;(result.data || []).forEach((app) => resolveApplicant(app.builderId))
      } else {
        toast.error(result.error || t("connect.backendError"))
      }
    }
  }, [applicationsByOpp, expandedId, token, t, resolveApplicant])

  const resetForm = () => {
    setTitle(""); setDescription(""); setSkillsInput(""); setBudgetInput(""); setEngagementType("fixed")
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const skills = skillsInput.split(",").map((s) => s.trim()).filter(Boolean)
    const budget = parseFloat(budgetInput)
    if (!title.trim()) return
    if (Number.isNaN(budget) || budget <= 0) {
      toast.error(t("connect.budgetAmount"))
      return
    }
    setCreating(true)
    const result = await createOpportunity(
      {
        title: title.trim(),
        description: description.trim(),
        skills_required: skills,
        budget_amount: budget,
        budget_asset: "USDC",
        engagement_type: engagementType,
      },
      token,
    )
    setCreating(false)

    if (!result.success || !result.data) {
      toast.error(result.error || t("connect.backendError"))
      return
    }

    setOpportunities((prev) => [result.data!, ...prev])
    resetForm()
    setFormOpen(false)
    toast.success(t("connect.opportunityCreated"))
  }

  const changeStatus = async (opportunity: Opportunity, status: "open" | "closed" | "filled") => {
    setStatusBusy(opportunity.id)
    const result = await updateOpportunityStatus(opportunity.id, status, token)
    setStatusBusy(null)
    if (!result.success || !result.data) {
      toast.error(result.error || t("connect.backendError"))
      return
    }
    setOpportunities((prev) => prev.map((o) => (o.id === opportunity.id ? result.data! : o)))
    toast.success(status === "filled" ? t("connect.opportunityFilled") : status === "closed" ? t("connect.opportunityClosed") : t("connect.opportunityCreated"))
  }

  const setApplicationStatus = async (opportunity: Opportunity, application: Application, status: "accepted" | "rejected") => {
    setStatusBusy(application.id)
    const result = await updateApplicationStatus(application.id, status, token)
    setStatusBusy(null)
    if (!result.success || !result.data) {
      toast.error(result.error || t("connect.backendError"))
      return
    }
    setApplicationsByOpp((prev) => ({
      ...prev,
      [opportunity.id]: (prev[opportunity.id] || []).map((a) => (a.id === application.id ? result.data! : a)),
    }))
    toast.success(status === "accepted" ? t("connect.accepted") : t("connect.rejected"))
  }

  const startAgreement = (opportunity: Opportunity, application: Application) => {
    const identity = applicantProfiles[application.builderId]
    if (!identity?.wallet) {
      toast.error(t("connect.builderWalletMissing"))
      return
    }
    onStartAgreement(opportunity, application, identity.wallet)
  }

  const formatBudget = (amount: number | string) => {
    const n = typeof amount === "string" ? parseFloat(amount) : amount
    if (Number.isNaN(n)) return String(amount)
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">{t("connect.myOpportunities")}</h1>
          <p className="mt-1 text-sm text-white/35">{t("connect.subtitle")}</p>
        </div>
        <Button
          onClick={() => { setFormOpen((v) => !v); if (formOpen) resetForm() }}
          className="shrink-0 rounded-full bg-[#f0b400] px-5 text-sm font-semibold text-background hover:bg-[#d4a000] shadow-[0_4px_16px_rgba(240,180,0,0.25)]"
        >
          {formOpen ? t("connect.cancel") : `+ ${t("connect.createOpportunity")}`}
        </Button>
      </div>

      {/* Create form */}
      {formOpen && (
        <form onSubmit={handleCreate} className="mb-8 rounded-2xl border border-white/10 bg-[#0c1220] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <h3 className="mb-5 text-base font-semibold text-white">{t("connect.createOpportunity")}</h3>
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">{t("connect.opportunityTitle")} <span className="text-rose-400">*</span></label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("connect.opportunityTitlePlaceholder")} className={inputClass} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">{t("connect.opportunityDesc")}</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("connect.opportunityDescPlaceholder")} rows={3}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#f0b400]/40 resize-none" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">{t("connect.skills")}</label>
                <input value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} placeholder={t("connect.skillsPlaceholder")} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">{t("connect.budgetAmount")} <span className="text-rose-400">*</span></label>
                <div className="flex gap-2">
                  <input value={budgetInput} onChange={(e) => setBudgetInput(e.target.value)} placeholder="50000" type="number" min="0" className={inputClass} required />
                  <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4">
                    <span className="text-sm font-semibold text-[#f0b400]">USDC</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/50">{t("connect.engagement")}</label>
              <div className="grid grid-cols-3 gap-2">
                {(["fixed", "milestone", "hourly"] as EngagementType[]).map((type) => (
                  <button key={type} type="button" onClick={() => setEngagementType(type)}
                    className={cn("rounded-xl border px-3 py-2.5 text-sm font-medium transition-all",
                      engagementType === type ? "border-[#f0b400]/40 bg-[#f0b400]/5 text-[#f0b400]" : "border-white/[0.06] bg-white/[0.02] text-white/50 hover:border-white/15")}>
                    {t(`connect.engagement.${type}`)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={creating} className="rounded-full bg-[#f0b400] px-6 text-sm font-semibold text-background hover:bg-[#d4a000] disabled:opacity-40 shadow-[0_4px_16px_rgba(240,180,0,0.25)]">
                {creating ? "..." : t("connect.publish")}
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Opportunity list */}
      {loading ? (
        <div className="flex justify-center py-16"><ThalosLoader /></div>
      ) : opportunities.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0c1220] p-10 text-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0b400]/10 text-[#f0b400]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 7h-4a3 3 0 01-3-3V1M20 7l-8 5-8-5M4 7v14h16V7" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-white">{t("connect.emptyTitle")}</h3>
          <p className="mt-1 text-sm text-white/35">{t("connect.emptyTitleDesc")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {opportunities.map((opportunity) => {
            const isExpanded = expandedId === opportunity.id
            const applications = applicationsByOpp[opportunity.id] || []
            return (
              <div key={opportunity.id} className="rounded-2xl border border-white/10 bg-[#0c1220] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.05)]">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white">{opportunity.title}</h3>
                      <p className="mt-1 text-sm text-white/35 line-clamp-2">{opportunity.description}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full border px-3 py-1 text-xs font-medium", statusBadge[opportunity.status])}>
                      {t(`connect.status.${opportunity.status}`)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xl font-bold text-[#f0b400]">
                      {formatBudget(opportunity.budget_amount)} <span className="text-xs font-normal text-white/35">{opportunity.budget_asset}</span>
                    </span>
                    <span className="rounded-full bg-white/[0.04] px-3 py-1 text-xs font-medium text-white/50">{t(`connect.engagement.${opportunity.engagement_type}`)}</span>
                    {opportunity.skills_required.slice(0, 4).map((skill) => (
                      <span key={skill} className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-0.5 text-xs text-white/40">{skill}</span>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {opportunity.status === "open" && (
                      <Button variant="outline" size="sm" disabled={statusBusy === opportunity.id}
                        onClick={() => changeStatus(opportunity, "closed")}
                        className="rounded-full border-white/10 text-sm text-white/60 hover:bg-white/10 hover:text-white">
                        {t("connect.close")}
                      </Button>
                    )}
                    {opportunity.status === "closed" && (
                      <Button variant="outline" size="sm" disabled={statusBusy === opportunity.id}
                        onClick={() => changeStatus(opportunity, "open")}
                        className="rounded-full border-white/10 text-sm text-white/60 hover:bg-white/10 hover:text-white">
                        {t("connect.reopen")}
                      </Button>
                    )}
                    <button
                      onClick={() => toggleExpanded(opportunity)}
                      className="ml-auto text-xs font-semibold text-[#3b82f6] hover:underline flex items-center gap-1"
                    >
                      {t("connect.viewApplicants")}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        className={cn("transition-transform", isExpanded && "rotate-180")}>
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-5 border-t border-white/[0.06] pt-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/40">{t("connect.applicants")} ({applications.length})</p>
                    {appsLoading[opportunity.id] ? (
                      <p className="text-sm text-white/35">{t("connect.loadingApplicants")}</p>
                    ) : applications.length === 0 ? (
                      <p className="text-sm text-white/35">{t("connect.noApplicants")}</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {applications.map((application) => {
                          const identity = applicantProfiles[application.builderId]
                          return (
                            <div key={application.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3b82f6]/10 text-xs font-bold text-[#3b82f6]">
                                      {(identity?.name || "B").slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-semibold text-white">{identity?.name || "Builder"}</p>
                                      <p className="truncate font-mono text-[11px] text-white/30">
                                        {identity?.wallet ? `${identity.wallet.slice(0, 6)}...${identity.wallet.slice(-4)}` : application.builderId.slice(0, 8) + "..."}
                                      </p>
                                    </div>
                                    <span className={cn("ml-auto shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium", applicationBadge[application.status])}>
                                      {t(`connect.${application.status}`)}
                                    </span>
                                  </div>
                                  {application.message && (
                                    <p className="mt-3 text-sm text-white/50">{application.message}</p>
                                  )}
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                {application.status === "pending" && (
                                  <>
                                    <Button size="sm" disabled={statusBusy === application.id}
                                      onClick={() => setApplicationStatus(opportunity, application, "accepted")}
                                      className="rounded-full bg-green-500/15 px-4 text-xs font-semibold text-green-400 hover:bg-green-500/25">
                                      {t("connect.accept")}
                                    </Button>
                                    <Button size="sm" variant="outline" disabled={statusBusy === application.id}
                                      onClick={() => setApplicationStatus(opportunity, application, "rejected")}
                                      className="rounded-full border-red-500/20 px-4 text-xs font-semibold text-red-400 hover:bg-red-500/10">
                                      {t("connect.reject")}
                                    </Button>
                                  </>
                                )}
                                {application.status === "accepted" && (
                                  <Button size="sm" disabled={statusBusy === application.id}
                                    onClick={() => startAgreement(opportunity, application)}
                                    className="rounded-full bg-[#f0b400] px-4 text-xs font-semibold text-background hover:bg-[#d4a000] shadow-[0_4px_16px_rgba(240,180,0,0.25)]">
                                    {t("connect.createAgreement")}
                                  </Button>
                                )}
                              </div>
                              {application.status === "accepted" && (
                                <p className="mt-2 text-[11px] text-white/30">{t("connect.createAgreementDesc")}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}