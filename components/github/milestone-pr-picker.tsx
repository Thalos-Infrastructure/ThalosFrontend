"use client"

import * as React from "react"
import { Github, Loader2, ExternalLink, GitPullRequest, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import {
  getGithubLinkStatus,
  listMergedPrs,
  attachPr,
  detachPr,
  getAttachedPrs,
  type GithubLinkStatus,
  type GithubPullRequest,
} from "@/lib/api/github"
import { GithubLinkStatusCard } from "./github-link-status"

const prKey = (pr: GithubPullRequest) => `${pr.repo}#${pr.number}`
const REPO_RE = /^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/

/**
 * Dialog that lets a builder attach merged PRs — scoped to a project repo — as
 * milestone evidence (C6 / issue #128). Consumes ThalosBackend#157:
 *   - PRs are attachable ONLY after the GitHub link is verified (gate);
 *   - the repo-scoped search runs server-side (`/github-evidence/merged-prs?repo=`);
 *   - attach/detach persist per-PR against the milestone.
 * The GitHub token never reaches the client.
 */
export function MilestonePrPicker({
  agreementId,
  milestoneIndex,
  walletAddress,
  token,
  repo: repoProp,
  attached = [],
  onAttached,
  trigger,
  disabled,
}: {
  agreementId: string
  milestoneIndex: number
  walletAddress?: string
  token?: string
  /** Project repo (owner/repo). If omitted the builder enters it in the dialog. */
  repo?: string
  attached?: GithubPullRequest[]
  onAttached?: (pullRequests: GithubPullRequest[]) => void
  trigger?: React.ReactNode
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [linkStatus, setLinkStatus] = React.useState<GithubLinkStatus | null>(null)
  const [repo, setRepo] = React.useState(repoProp ?? "")
  const [prs, setPrs] = React.useState<GithubPullRequest[]>([])
  const [searched, setSearched] = React.useState(false)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [loading, setLoading] = React.useState(false)
  const [searching, setSearching] = React.useState(false)
  const [attaching, setAttaching] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const verified = Boolean(linkStatus?.linked)
  const repoValid = REPO_RE.test(repo.trim())

  // On open: check verification (via profile) and seed the selection from the
  // already-attached PRs.
  React.useEffect(() => {
    if (!open) return
    let active = true
    setSelected(new Set(attached.map(prKey)))
    setPrs([])
    setSearched(false)
    setError(null)
    ;(async () => {
      setLoading(true)
      const res = await getGithubLinkStatus(walletAddress)
      if (!active) return
      if (res.success && res.data) setLinkStatus(res.data)
      else setError(res.error ?? "Could not check GitHub link")
      setLoading(false)
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, walletAddress])

  const runSearch = async () => {
    if (!repoValid) return
    setSearching(true)
    setError(null)
    const res = await listMergedPrs(repo.trim(), token)
    if (res.success && res.data) {
      setPrs(res.data)
    } else {
      setError(res.error ?? "Could not load pull requests")
    }
    setSearched(true)
    setSearching(false)
  }

  const toggle = (pr: GithubPullRequest) => {
    setSelected((prev) => {
      const next = new Set(prev)
      const key = prKey(pr)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleAttach = async () => {
    if (!walletAddress) {
      setError("Connect your wallet to attach evidence.")
      return
    }
    setAttaching(true)
    setError(null)

    const attachedByKey = new Map(attached.map((p) => [prKey(p), p]))
    const candidateByKey = new Map(prs.map((p) => [prKey(p), p]))

    // Attach newly-selected PRs that were not already attached.
    for (const key of selected) {
      if (attachedByKey.has(key)) continue
      const pr = candidateByKey.get(key)
      if (!pr) continue
      const res = await attachPr(agreementId, milestoneIndex, pr, walletAddress, token)
      if (!res.success) {
        setError(res.error ?? "Could not attach a pull request")
        setAttaching(false)
        return
      }
    }

    // Detach previously-attached PRs that were deselected (need their id).
    for (const [key, pr] of attachedByKey) {
      if (selected.has(key) || !pr.id) continue
      const res = await detachPr(agreementId, milestoneIndex, pr.id, token)
      if (!res.success) {
        setError(res.error ?? "Could not detach a pull request")
        setAttaching(false)
        return
      }
    }

    // Re-read the persisted set so the caller renders authoritative state (ids).
    const refreshed = await getAttachedPrs(agreementId, milestoneIndex, token)
    setAttaching(false)
    onAttached?.(refreshed.success && refreshed.data ? refreshed.data : [])
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            size="sm"
            variant="outline"
            disabled={disabled}
            className="rounded-full border-cyan-500/20 bg-cyan-500/10 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20"
          >
            <Github className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" /> Attach GitHub PRs
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="h-4 w-4" aria-hidden="true" /> Attach GitHub PRs
          </DialogTitle>
          <DialogDescription>
            Merged pull requests from the project&apos;s repository, verified by GitHub.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…
          </div>
        ) : !verified ? (
          // Gate: must verify GitHub ownership before PRs can be listed/attached.
          <div className="py-4">
            <GithubLinkStatusCard
              walletAddress={walletAddress}
              token={token}
              onLinked={(s) => setLinkStatus(s)}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Repo-scoped search */}
            <div className="flex gap-2">
              <input
                type="text"
                value={repo}
                onChange={(e) => setRepo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && repoValid && runSearch()}
                placeholder="owner/repo"
                className="h-9 flex-1 rounded-lg border border-white/15 bg-[#0a0a0c]/50 px-3 text-sm text-white placeholder:text-white/25 focus:border-cyan-500/50 focus:outline-none"
              />
              <Button
                size="sm"
                onClick={runSearch}
                disabled={!repoValid || searching}
                className="rounded-lg bg-cyan-500 px-3 text-xs font-semibold text-white hover:bg-cyan-600 disabled:opacity-40"
              >
                {searching ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Search className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </Button>
            </div>
            {repo.trim() && !repoValid ? (
              <p className="text-xs text-amber-400">Use the owner/repo format (e.g. stellar/stellar-core).</p>
            ) : null}

            {searching ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-white/50">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Searching…
              </div>
            ) : prs.length > 0 ? (
              <ScrollArea className="max-h-64 pr-3">
                <ul className="flex flex-col gap-1.5">
                  {prs.map((pr) => {
                    const key = prKey(pr)
                    const checked = selected.has(key)
                    return (
                      <li key={key}>
                        <label
                          className={cn(
                            "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                            checked
                              ? "border-cyan-500/40 bg-cyan-500/10"
                              : "border-white/[0.06] bg-[#0a0a0c]/50 hover:border-white/15"
                          )}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggle(pr)}
                            className="mt-0.5"
                            aria-label={`Attach ${pr.repo}#${pr.number}`}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-white">{pr.title}</span>
                              <a
                                href={pr.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="shrink-0 text-white/30 hover:text-cyan-400"
                                aria-label="Open PR on GitHub"
                              >
                                <ExternalLink className="h-3 w-3" aria-hidden="true" />
                              </a>
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-white/40">
                              {pr.repo}#{pr.number}
                              {pr.merged_at ? ` · merged ${new Date(pr.merged_at).toLocaleDateString()}` : ""}
                            </span>
                          </span>
                        </label>
                      </li>
                    )
                  })}
                </ul>
              </ScrollArea>
            ) : searched ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <GitPullRequest className="h-6 w-6 text-white/25" aria-hidden="true" />
                <p className="text-sm text-white/50">No merged pull requests found in {repo.trim()}.</p>
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-white/40">
                Enter the project repo and search to list your merged PRs.
              </p>
            )}
          </div>
        )}

        {error ? <p className="text-xs text-red-400">{error}</p> : null}

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-xs text-white/60">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleAttach}
            disabled={!verified || attaching || loading}
            className="rounded-lg bg-cyan-500 px-4 text-xs font-semibold text-white hover:bg-cyan-600 disabled:opacity-40"
          >
            {attaching ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
            Save evidence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MilestonePrPicker
