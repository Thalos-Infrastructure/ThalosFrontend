import { Github, Milestone, Handshake, Coins, GitPullRequest } from "lucide-react"
import type { ReputationSummary } from "@/lib/api/reputation"

export function ReputationSummary({ reputation }: { reputation: ReputationSummary | null }) {
  if (!reputation) return null
  const stats = [
    [Handshake, reputation.completedAgreements, "Completed agreements"],
    [Milestone, reputation.releasedMilestones, "Released milestones"],
    [GitPullRequest, reputation.prBackedMilestones, "PR-backed milestones"],
  ] as const
  return <section className="rounded-2xl border border-border/40 bg-card/50 p-6" aria-label="Reputation">
    <div className="mb-5 flex items-center justify-between"><h3 className="text-lg font-semibold">Reputation</h3>{reputation.githubVerified === true && <span className="flex items-center gap-1.5 text-sm text-green-400"><Github size={16}/> Verified GitHub</span>}</div>
    <div className="grid gap-4 sm:grid-cols-3">{stats.map(([Icon, value, label]) => <div key={label} className="border-l border-border/40 pl-4"><Icon size={17} className="mb-2 text-[#f0b400]"/><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-muted-foreground">{label}</p></div>)}</div>
    {reputation.totalReleasedUsdc != null && <div className="mt-5 flex items-center gap-2 border-t border-border/40 pt-4 text-sm"><Coins size={16} className="text-[#f0b400]"/><span>Total value released: <strong>{reputation.totalReleasedUsdc.toLocaleString()} USDC</strong></span></div>}
  </section>
}
