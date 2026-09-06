import { Badge } from "@/components/ui/badge"
import type { Opportunity } from "@/lib/api/opportunities"

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-lg font-semibold text-white">{opportunity.title}</h2>{opportunity.project_name && <p className="mt-1 text-sm text-white/45">{opportunity.project_name}</p>}</div>
        <p className="text-sm font-semibold text-[#f0b400]">{new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(opportunity.budget_amount)} {opportunity.budget_asset}</p>
      </div>
      <p className="mt-4 whitespace-pre-line text-sm leading-6 text-white/65">{opportunity.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">{opportunity.skills_required.map((skill) => <Badge key={skill} variant="secondary" className="bg-white/8 text-white/65">{skill}</Badge>)}</div>
      <p className="mt-5 text-xs font-medium uppercase tracking-wider text-white/35">{opportunity.engagement_type} engagement</p>
    </article>
  )
}
