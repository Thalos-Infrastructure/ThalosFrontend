"use client"

import { ExternalLink, GitPullRequest } from "lucide-react"
import { cn } from "@/lib/utils"
import type { GithubPullRequest } from "@/lib/api/github"

/**
 * Renders the merged PRs attached to a milestone as verifiable evidence, each
 * linking to the PR on GitHub (C6 / issue #128). Also reused on the C7 profile
 * display. Presentational only.
 */
export function AttachedPullRequests({
  pullRequests,
  className,
  emptyLabel,
}: {
  pullRequests: GithubPullRequest[]
  className?: string
  emptyLabel?: string
}) {
  if (!pullRequests || pullRequests.length === 0) {
    return emptyLabel ? (
      <p className={cn("text-xs text-white/40", className)}>{emptyLabel}</p>
    ) : null
  }

  return (
    <ul className={cn("flex flex-col gap-2", className)}>
      {pullRequests.map((pr) => (
        <li key={`${pr.repo}#${pr.number}`}>
          <a
            href={pr.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-2.5 rounded-lg border border-cyan-500/15 bg-cyan-500/[0.06] px-3 py-2 transition-colors hover:border-cyan-500/40 hover:bg-cyan-500/10"
          >
            <GitPullRequest className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium text-white">{pr.title}</span>
                <ExternalLink
                  className="h-3 w-3 shrink-0 text-white/30 transition-colors group-hover:text-cyan-400"
                  aria-hidden="true"
                />
              </span>
              <span className="mt-0.5 block truncate text-xs text-white/40">
                {pr.repo}#{pr.number}
                {pr.merged_at ? ` · merged ${new Date(pr.merged_at).toLocaleDateString()}` : ""}
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}

export default AttachedPullRequests
