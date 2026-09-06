"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { EngagementType, Opportunity, OpportunityInput, OpportunityStatus } from "@/lib/api/opportunities"

interface OpportunityFormProps {
  opportunity?: Opportunity | null
  saving: boolean
  onCancel: () => void
  onSubmit: (input: OpportunityInput) => Promise<void>
}

const fieldClass = "border-white/10 bg-white/5 text-white placeholder:text-white/30"
const selectClass = "h-9 w-full rounded-md border border-white/10 bg-[#111827] px-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#f0b400]/50"

const emptyInput: OpportunityInput = {
  title: "",
  description: "",
  skills_required: [],
  budget_amount: 0,
  budget_asset: "USDC",
  engagement_type: "fixed",
  status: "open",
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/50">{label}</span>{children}</label>
}

export function OpportunityForm({ opportunity, saving, onCancel, onSubmit }: OpportunityFormProps) {
  const [form, setForm] = useState<OpportunityInput>(emptyInput)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(opportunity ? {
      title: opportunity.title,
      description: opportunity.description,
      skills_required: opportunity.skills_required,
      budget_amount: opportunity.budget_amount,
      budget_asset: opportunity.budget_asset,
      engagement_type: opportunity.engagement_type,
      status: opportunity.status,
    } : emptyInput)
    setError(null)
  }, [opportunity])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !form.description.trim()) return setError("Title and description are required.")
    if (!Number.isFinite(form.budget_amount) || form.budget_amount < 0) return setError("Budget must be zero or greater.")
    if (!form.budget_asset.trim()) return setError("Budget asset is required.")
    setError(null)
    await onSubmit({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      budget_asset: form.budget_asset.trim().toUpperCase(),
      skills_required: form.skills_required.map((skill) => skill.trim()).filter(Boolean),
    })
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/10 bg-[#0c1220] p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">{opportunity ? "Edit opportunity" : "Publish an opportunity"}</h2>
        <p className="mt-1 text-sm text-white/45">Describe the role or task builders can contribute to.</p>
      </div>
      <div className="space-y-5">
        <Field label="Title"><Input required maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Senior Soroban engineer" className={fieldClass} /></Field>
        <Field label="Description"><textarea required rows={6} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Scope, outcomes, and what success looks like…" className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#f0b400]/50" /></Field>
        <Field label="Skills required (comma separated)"><Input value={form.skills_required.join(", ")} onChange={(e) => setForm({ ...form, skills_required: e.target.value.split(",") })} placeholder="Soroban, Rust, Smart contracts" className={fieldClass} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Budget amount"><Input required type="number" min="0" step="0.01" value={form.budget_amount || ""} onChange={(e) => setForm({ ...form, budget_amount: e.target.value === "" ? 0 : Number(e.target.value) })} placeholder="2500" className={fieldClass} /></Field>
          <Field label="Budget asset"><Input required value={form.budget_asset} onChange={(e) => setForm({ ...form, budget_asset: e.target.value })} className={fieldClass} /></Field>
          <Field label="Engagement type"><select aria-label="Engagement type" className={selectClass} value={form.engagement_type} onChange={(e) => setForm({ ...form, engagement_type: e.target.value as EngagementType })}><option value="fixed">Fixed</option><option value="milestone">Milestone</option><option value="hourly">Hourly</option></select></Field>
          <Field label="Status"><select aria-label="Status" className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as OpportunityStatus })}><option value="open">Open</option><option value="closed">Closed</option><option value="filled">Filled</option></select></Field>
        </div>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}
      <div className="mt-6 flex justify-end gap-3"><Button type="button" variant="ghost" onClick={onCancel} className="text-white/60 hover:bg-white/10 hover:text-white">Cancel</Button><Button type="submit" disabled={saving} className="bg-[#f0b400] text-[#0c1220] hover:bg-[#dba500]">{saving ? "Saving…" : opportunity ? "Save changes" : "Publish"}</Button></div>
    </form>
  )
}
