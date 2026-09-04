"use client"

import * as React from "react"
import { Github, CheckCircle2, Loader2, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getGithubLinkStatus, getGithubOAuthUrl, type GithubLinkStatus } from "@/lib/api/github"

/**
 * Verified GitHub link status + a "Verify GitHub" action (C6 / issue #128).
 *
 * Status is read from the builder's profile (`github_username`); verification
 * asks Nest for the OAuth authorization URL (ThalosBackend#157
 * `GET /github-evidence/oauth/url`) and redirects to it. The token/secret never
 * touch the client. Reusable on the milestone evidence flow and reserved for the
 * C7 profile display.
 */
export function GithubLinkStatusCard({
  walletAddress,
  token,
  onLinked,
  className,
}: {
  walletAddress?: string
  token?: string
  onLinked?: (status: GithubLinkStatus) => void
  className?: string
}) {
  const [status, setStatus] = React.useState<GithubLinkStatus | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [verifying, setVerifying] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await getGithubLinkStatus(walletAddress)
    if (res.success && res.data) {
      setStatus(res.data)
      if (res.data.linked) onLinked?.(res.data)
    } else {
      setError(res.error ?? "Could not load GitHub link status")
    }
    setLoading(false)
  }, [walletAddress, onLinked])

  React.useEffect(() => {
    void load()
  }, [load])

  const handleVerify = async () => {
    setVerifying(true)
    setError(null)
    const res = await getGithubOAuthUrl(token)
    if (res.success && res.data?.url) {
      // Nest handles the callback and stores the verified username server-side,
      // then redirects back to /settings?github_linked=true.
      window.location.href = res.data.url
      return
    }
    setError(res.error ?? "Could not start GitHub verification")
    setVerifying(false)
  }

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-white/50", className)}>
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Checking GitHub link…
      </div>
    )
  }

  if (status?.linked) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2",
          className,
        )}
      >
        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden="true" />
        <span className="text-sm text-white">
          GitHub verified
          {status.github_username ? (
            <>
              {" "}
              as{" "}
              <a
                href={`https://github.com/${status.github_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-400 hover:underline"
              >
                @{status.github_username}
              </a>
            </>
          ) : null}
        </span>
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-start gap-2 text-sm text-white/60">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" aria-hidden="true" />
        <span>
          Verify GitHub ownership to attach merged PRs as evidence. Your token stays on the server.
        </span>
      </div>
      <Button
        size="sm"
        onClick={handleVerify}
        disabled={verifying}
        className="w-fit rounded-lg bg-cyan-500 px-4 text-xs font-semibold text-white hover:bg-cyan-600 disabled:opacity-40"
      >
        {verifying ? (
          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Github className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        )}
        {verifying ? "Redirecting…" : "Verify GitHub"}
      </Button>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}

export default GithubLinkStatusCard
