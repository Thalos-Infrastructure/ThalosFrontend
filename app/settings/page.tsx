"use client"

import { Suspense } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { GithubLinkStatusCard } from "@/components/github/github-link-status"
import { useAuthStore } from "@/lib/auth-store"
import { useCurrentAddress } from "@/lib/use-current-address"
import { ThalosLoader } from "@/components/thalos-loader"

/**
 * Landing for Nest's GitHub OAuth callback (ThalosBackend#157).
 * Redirects to `/settings?github_linked=true&github_username=…`.
 */
function SettingsContent() {
  const searchParams = useSearchParams()
  const linked = searchParams.get("github_linked") === "true"
  const username = searchParams.get("github_username")
  const { token, user } = useAuthStore()
  const address = useCurrentAddress()
  const walletAddress = address ?? user?.wallet?.publicKey ?? undefined

  return (
    <div className="relative min-h-screen text-foreground">
      <div className="fixed inset-0 z-0 bg-[#060810]">
        <div className="absolute top-0 left-1/4 h-[600px] w-[600px] rounded-full bg-[#f0b400]/5 blur-[150px]" />
        <div className="absolute right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-[#0ea5e9]/5 blur-[150px]" />
      </div>

      <header className="sticky top-0 z-40 bg-[#0c1220]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-20 max-w-[720px] items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/thalos-icon.png"
              alt="Thalos"
              width={72}
              height={72}
              className="h-16 w-16 object-contain"
              priority
            />
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-[520px] px-4 py-16">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0a0a0c]/80 p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/70">
            <Github className="h-4 w-4" aria-hidden="true" />
            GitHub evidence
          </div>

          {linked ? (
            <div className="mb-5 flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-3">
              <CheckCircle2
                className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-semibold text-white">GitHub verified</p>
                <p className="mt-0.5 text-sm text-white/60">
                  {username ? (
                    <>
                      Linked as{" "}
                      <a
                        href={`https://github.com/${username}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-emerald-400 hover:underline"
                      >
                        @{username}
                      </a>
                      . You can attach merged PRs as milestone evidence.
                    </>
                  ) : (
                    "Your GitHub account is linked. You can attach merged PRs as milestone evidence."
                  )}
                </p>
              </div>
            </div>
          ) : (
            <p className="mb-5 text-sm text-white/60">
              Verify GitHub ownership to attach merged pull requests as milestone evidence. Your
              token stays on the server.
            </p>
          )}

          <GithubLinkStatusCard walletAddress={walletAddress} token={token ?? undefined} />

          <div className="mt-6">
            <Button
              asChild
              className="rounded-lg bg-cyan-500 px-4 text-xs font-semibold text-white hover:bg-cyan-600"
            >
              <Link href="/dashboard/personal">Continue to dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<ThalosLoader />}>
      <SettingsContent />
    </Suspense>
  )
}
