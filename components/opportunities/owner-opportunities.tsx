"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuthStore } from "@/lib/auth-store"
import {
  listMyOpportunities,
  postOpportunity,
  removeOpportunity,
  updateOpportunity,
  updateOpportunityStatus,
  type Opportunity,
  type OpportunityInput,
  type OpportunityStatus,
} from "@/lib/api/opportunities"
import { OpportunityForm } from "./opportunity-form"
import { ArrowLeft, Edit3, Plus, Trash2 } from "lucide-react"
import Link from "next/link"

const statuses: OpportunityStatus[] = ["open", "closed", "filled"]

export function OwnerOpportunities() {
  const { token, hydrated } = useAuthStore()
  const [items, setItems] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Opportunity | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    const opportunitiesResult = await listMyOpportunities(token)
    if (opportunitiesResult.success) setItems(opportunitiesResult.data ?? [])
    else setError(opportunitiesResult.error || "Could not load your opportunities.")
    setLoading(false)
  }, [token])

  useEffect(() => { if (hydrated && token) void load(); else if (hydrated) setLoading(false) }, [hydrated, token, load])

  const save = async (input: OpportunityInput) => {
    if (!token) return
    setSaving(true)
    setError(null)
    const result = editing ? await updateOpportunity(editing.id, input, token) : await postOpportunity(input, token)
    setSaving(false)
    if (!result.success) return setError(result.error || "Could not save the opportunity.")
    setEditing(undefined)
    await load()
  }

  const changeStatus = async (item: Opportunity, status: OpportunityStatus) => {
    if (!token || item.status === status) return
    const previous = items
    setItems((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, status } : candidate))
    const result = await updateOpportunityStatus(item.id, status, token)
    if (!result.success) { setItems(previous); setError(result.error || "Could not update status.") }
  }

  const remove = async (item: Opportunity) => {
    if (!token || !window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return
    const result = await removeOpportunity(item.id, token)
    if (result.success) setItems((current) => current.filter((candidate) => candidate.id !== item.id))
    else setError(result.error || "Could not delete the opportunity.")
  }

  if (!hydrated || loading) return <p className="py-20 text-center text-white/50">Loading your opportunities…</p>
  if (!token) return <div className="rounded-2xl border border-white/10 p-10 text-center"><h2 className="text-xl font-semibold text-white">Sign in required</h2><p className="mt-2 text-white/50">Sign in to manage project opportunities.</p><Button asChild className="mt-6 bg-[#f0b400] text-[#0c1220]"><Link href="/">Go to sign in</Link></Button></div>
  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div><Link href="/dashboard/business" className="mb-3 inline-flex items-center gap-2 text-sm text-white/45 hover:text-white"><ArrowLeft className="h-4 w-4" />Dashboard</Link><h1 className="text-3xl font-bold text-white">Project opportunities</h1><p className="mt-2 text-white/50">Publish work and manage its availability.</p></div>
        <Button onClick={() => setEditing(null)} className="gap-2 bg-[#f0b400] text-[#0c1220] hover:bg-[#dba500]"><Plus className="h-4 w-4" />New opportunity</Button>
      </div>
      {error && <p role="alert" className="mb-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</p>}
      {editing !== undefined ? <OpportunityForm opportunity={editing} saving={saving} onCancel={() => setEditing(undefined)} onSubmit={save} /> : items.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 py-16 text-center"><h2 className="font-semibold text-white">No opportunities published</h2><p className="mt-2 text-sm text-white/45">Create the first opportunity for your project.</p></div> : (
        <div className="space-y-4">{items.map((item) => <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-3"><h2 className="truncate text-lg font-semibold text-white">{item.title}</h2><Badge className={item.status === "open" ? "bg-emerald-500/15 text-emerald-300" : item.status === "filled" ? "bg-blue-500/15 text-blue-300" : "bg-white/10 text-white/50"}>{item.status}</Badge></div><p className="mt-2 line-clamp-2 text-sm text-white/50">{item.description}</p><p className="mt-3 text-sm font-medium text-[#f0b400]">{item.budget_amount} {item.budget_asset} · {item.engagement_type}</p></div><div className="flex flex-wrap items-center gap-2"><select aria-label={`Status for ${item.title}`} value={item.status} onChange={(e) => void changeStatus(item, e.target.value as OpportunityStatus)} className="h-9 rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white">{statuses.map((status) => <option key={status} value={status}>{status[0].toUpperCase() + status.slice(1)}</option>)}</select><Button size="sm" variant="outline" onClick={() => setEditing(item)} className="gap-2"><Edit3 className="h-4 w-4" />Edit</Button><Button aria-label={`Delete ${item.title}`} size="icon" variant="ghost" onClick={() => void remove(item)} className="text-red-400 hover:bg-red-500/10 hover:text-red-300"><Trash2 className="h-4 w-4" /></Button></div></div></article>)}</div>
      )}
    </>
  )
}
