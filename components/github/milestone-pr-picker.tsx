"use client"

import * as React from "react"
import { Github, Loader2, ExternalLink, GitPullRequest } from "lucide-react"
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
  listProjectPullRequests,
  attachPullRequests,
  type GithubLinkStatus,
  type GithubPullRequest,
} from "@/lib/api/github"
import { GithubLinkStatusCard } from "./github-link-status"

const prKey = (pr: GithubPullRequest) => `${pr.repo}#${pr.number}`

/**
 * Dialog that lets a builder attach merged PRs — scoped to the agreement's
 * project repo — as milestone evidence (C6 / issue #128).
 *
 * PRs are attachable ONLY after the GitHub link is verified: until then the
 * dialog shows the verification step instead of the list. The repo-scoped PR
 * search and all GitHub calls run server-side (Nest); the token never reaches
 * the client.
 */
export function MilestonePrPicker({
  agreementId,
  milestoneIndex,
  token,
  attached = [],
  onAttached,
  trigger,
  disabled,
}: {
  agreementId: string
  milestoneIndex: number
  token?: string
  attached?: GithubPullRequest[]
  onAttached?: (pullRequests: GithubPullRequest[]) => void
  trigger?: React.ReactNode
  disabled?: boolean
}) {
  const [open, setOpen] = React.useState(false)
  const [linkStatus, setLinkStatus] = React.useState<GithubLinkStatus | null>(null)
  const [prs, setPrs] = React.useState<GithubPullRequest[]>([])
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [loading, setLoading] = React.useState(false)
  const [attaching, setAttaching] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadPullRequests = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await listProjectPullRequests(agreementId, token)
    if (res.success && res.data) {
      setPrs(res.data)
    } else {
      setError(res.error ?? "Could not load pull requests")
    }
    setLoading(false)
  }, [agreementId, token])

  // When the dialog opens, check verification then (if verified) load PRs.
  React.useEffect(() => {
    if (!open) return
    let active = true
    setSelected(new Set(attached.map(prKey)))
    ;(async () => {
      setLoading(true)
      setError(null)
      const statusRes = await getGithubLinkStatus(token)
      if (!active) return
      if (statusRes.success && statusRes.data) {
        setLinkStatus(statusRes.data)
        if (statusRes.data.linked) {
          await loadPullRequests()
          return
        }
      } else {
        setError(statusRes.error ?? "Could not check GitHub link")
      }
      setLoading(false)
    })()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token])

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
    const chosen = prs.filter((pr) => selected.has(prKey(pr)))
    setAttaching(true)
    setError(null)
    const res = await attachPullRequests(agreementId, milestoneIndex, chosen, token)
    setAttaching(false)
    if (res.success) {
      onAttached?.(res.data ?? chosen)
      setOpen(false)
    } else {
      setError(res.error ?? "Could not attach pull requests")
    }
  }

  const verified = Boolean(linkStatus?.linked)

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
            Merged pull requests from this project&apos;s repository, verified by GitHub.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading…
          </div>
        ) : !verified ? (
          // Gate: must verify GitHub ownership before PRs can be listed/attached.
          <div className="py-4">
            <GithubLinkStatusCard token={token} onLinked={() => void loadPullRequests()} />
          </div>
        ) : prs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <GitPullRequest className="h-6 w-6 text-white/25" aria-hidden="true" />
            <p className="text-sm text-white/50">No merged pull requests found in the project repo.</p>
            {error ? <p className="text-xs text-red-400">{error}</p> : null}
          </div>
        ) : (
          <ScrollArea className="max-h-72 pr-3">
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
        )}

        {error && verified && prs.length > 0 ? (
          <p className="text-xs text-red-400">{error}</p>
        ) : null}

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="text-xs text-white/60"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleAttach}
            disabled={!verified || attaching || loading}
            className="rounded-lg bg-cyan-500 px-4 text-xs font-semibold text-white hover:bg-cyan-600 disabled:opacity-40"
          >
            {attaching ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
            {`Attach${selected.size ? ` (${selected.size})` : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MilestonePrPicker
