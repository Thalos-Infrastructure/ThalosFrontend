import { cache } from "react"
import type { Metadata } from "next"
import type { ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Building2,
  Clock,
  DollarSign,
  ExternalLink,
  Github,
  Globe,
  Handshake,
  Link2,
  Star,
  User,
  Wrench,
} from "lucide-react"
import { getProfileByHandle, type BuilderProfile } from "@/lib/api/profiles"
import { fetchReputation, type ReputationSummary } from "@/lib/api/reputation"

// The shareable card is the single source of truth a builder sends out, so it
// must always reflect what is currently on the backend. Never pre-render at
// build time — render per request from Nest via the (public) by-handle endpoint.
export const dynamic = "force-dynamic"

// One data loader, shared by generateMetadata and the page within a single
// request (React.cache de-duplicates the two calls). Keeps the by-handle fetch
// and the reputation lookup server-side only — no client fetching.
const loadPublicProfile = cache(async (handle: string) => {
  const [profileResult, reputation] = await Promise.all([
    getProfileByHandle(handle),
    fetchReputation({ handle }),
  ])
  return { ...profileResult, reputation }
})

function profileTitle(profile: BuilderProfile): string {
  if (profile.org_name) return profile.org_name
  if (profile.display_name) return profile.display_name
  return `@${profile.handle ?? ""}`.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-profile SEO metadata (requirement: SEO metadata per profile).
// ─────────────────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>
}): Promise<Metadata> {
  const { handle } = await params
  const payload = await loadPublicProfile(handle)

  if (!payload.ok) {
    return { title: "Profile not found · Thalos Connect" }
  }

  const profile = payload.profile
  const title = profileTitle(profile)
  const description =
    profile.headline ||
    profile.bio ||
    profile.org_description ||
    `Discover ${title} on Thalos Connect — the builder and project directory on Stellar.`

  const titleWithBrand = `${title} · Thalos Connect`

  return {
    title: titleWithBrand,
    description,
    openGraph: {
      title: titleWithBrand,
      description,
      url: `/connect/${handle}`,
      type: "profile",
      images: profile.avatar_url ? [{ url: profile.avatar_url, alt: title }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: titleWithBrand,
      description,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// URL safety — the reviewer asked for an http(s) allowlist, not href-twiddling.
// ─────────────────────────────────────────────────────────────────────────────

const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

/** Returns an ordered array of { label, url } for portfolio links (http/https only). */
function portfolioEntries(
  links: BuilderProfile["portfolio_links"],
): Array<{ label: string; url: string }> {
  if (!links) return []
  const raw: Array<{ label?: string; url?: string }> = Array.isArray(links)
    ? links.filter((l) => l && typeof l === "object")
    : Object.entries(links).map(([label, url]) => ({ label, url }))
  return raw
    .map((l) => ({ label: l.label ?? "", url: l.url ?? "" }))
    .filter((l) => isSafeUrl(l.url))
}

/** Returns an ordered array of { label, url } for a social/org links map (http/https only). */
function linkEntries(links: Record<string, string> | null): Array<{ label: string; url: string }> {
  if (!links) return []
  return Object.entries(links)
    .map(([label, url]) => ({ label, url }))
    .filter((l) => typeof l.url === "string" && isSafeUrl(l.url))
}

function nullIfEmpty(list: string[] | null | undefined): string[] | null {
  return list && list.length > 0 ? list : null
}

type Availability = BuilderProfile["availability"]

const availabilityLabel: Record<NonNullable<Availability>, string> = {
  available: "Available Now",
  open: "Open to Offers",
  unavailable: "Unavailable",
}

const availabilityColor: Record<NonNullable<Availability>, string> = {
  available: "bg-green-500/15 text-green-400 border-green-500/30",
  open: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  unavailable: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
}

// ─────────────────────────────────────────────────────────────────────────────
// Public profile page (RSC only). Fetches once per request, renders the Builder
// and Project views independently (additive types can coexist on one account).
// ─────────────────────────────────────────────────────────────────────────────
export default async function ConnectProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params
  const payload = await loadPublicProfile(handle)

  // Clean 404 for unknown handles — and nothing else. A backend/network failure
  // is surfaced as a real error, never a misleading “Profile Not Found”.
  if (!payload.ok) {
    if (payload.notFound) {
      notFound()
    }
    return <LoadError message={payload.error} />
  }

  const profile = payload.profile
  const reputation = payload.reputation

  // Both types are additive: an account may carry Builder data, Project data,
  // both, or neither. Render each view only when its fields are present.
  const hasBuilderData =
    Boolean(profile.headline) ||
    Boolean(profile.bio) ||
    nullIfEmpty(profile.skills) !== null ||
    nullIfEmpty(profile.tech_stack) !== null ||
    profile.hourly_rate !== null

  const hasProjectData =
    Boolean(profile.org_name) ||
    Boolean(profile.org_description) ||
    Boolean(profile.org_website) ||
    nullIfEmpty(profile.looking_for) !== null ||
    linkEntries(profile.org_links).length > 0

  const portfolio = portfolioEntries(profile.portfolio_links)
  const socials = linkEntries(profile.social_links)
  const hasLinks = portfolio.length > 0 || socials.length > 0

  // Reserved trust slots (C6 verified GitHub, C7 reputation) render ONLY when
  // the backend returns a real signal for them.
  const showReputationSlot = Boolean(reputation) || profile.reputation_score !== null

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header / nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/connect">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Thalos Connect
            </Button>
          </Link>
          <Link href="/" aria-label="Thalos home">
            <Image
              src="/thalos-icon.png"
              alt="Thalos"
              width={32}
              height={32}
              className="opacity-80 hover:opacity-100 transition-opacity"
            />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Identity header */}
        <div className="mb-10 flex flex-col items-center gap-4 text-center">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#f0b400]/20 to-[#f0b400]/5 ring-2 ring-[#f0b400]/30">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profileTitle(profile)}
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-12 w-12 text-[#f0b400]" />
            )}
          </div>

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {profileTitle(profile)}
            </h1>
            {profile.handle && <p className="mt-1 text-muted-foreground">@{profile.handle}</p>}
            {profile.org_name && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Project profile
              </div>
            )}
          </div>

          {profile.availability && (
            <Badge
              variant="outline"
              className={`gap-1 text-xs ${availabilityColor[profile.availability]}`}
            >
              <Clock className="h-3 w-3" />
              {availabilityLabel[profile.availability]}
            </Badge>
          )}
        </div>

        {/* ── Reserved trust slots: reputation (C7) + verified GitHub (C6) ──
             Render only when the underlying signal is present on the backend. */}
        {showReputationSlot && (
          <div className="mb-10">
            <ReputationSlots reputation={reputation} score={profile.reputation_score} />
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* ── Builder view (headline, bio, stack, skills) ── */}
          {hasBuilderData && (
            <section className="lg:col-span-2 space-y-8">
              {profile.headline && <h2 className="text-xl font-semibold">{profile.headline}</h2>}

              {profile.bio && (
                <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
                  <SectionLabel icon={<User className="h-4 w-4" />}>About</SectionLabel>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {profile.bio}
                  </p>
                </div>
              )}

              {nullIfEmpty(profile.tech_stack) && (
                <div>
                  <SectionLabel icon={<Briefcase className="h-4 w-4" />}>Tech stack</SectionLabel>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.tech_stack.map((tech) => (
                      <Badge
                        key={tech}
                        variant="outline"
                        className="border-blue-500/20 bg-blue-500/5 text-blue-400"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {nullIfEmpty(profile.skills) && (
                <div>
                  <SectionLabel icon={<Wrench className="h-4 w-4" />}>Skills</SectionLabel>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="bg-[#f0b400]/10 text-[#f0b400]"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ── Side column (rate + links + project card) ── */}
          <aside className="space-y-6">
            {profile.hourly_rate !== null && (
              <div className="rounded-2xl border border-border/40 bg-card/50 p-5">
                <SectionLabel icon={<DollarSign className="h-4 w-4" />}>Rate</SectionLabel>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  ${profile.hourly_rate}
                  <span className="text-sm font-normal text-muted-foreground"> /hr</span>
                </p>
              </div>
            )}

            {hasLinks && (
              <div className="rounded-2xl border border-border/40 bg-card/50 p-5">
                <SectionLabel icon={<Link2 className="h-4 w-4" />}>Links</SectionLabel>
                <div className="mt-3 space-y-2">
                  {portfolio.map((l) => (
                    <ExternalLinkItem
                      key={l.label || l.url}
                      label={l.label || "Portfolio"}
                      url={l.url}
                    />
                  ))}
                  {socials.map((l) => (
                    <ExternalLinkItem key={l.label || l.url} label={l.label} url={l.url} />
                  ))}
                </div>
              </div>
            )}

            {/* ── Project view ── */}
            {hasProjectData && (
              <div className="rounded-2xl border border-border/40 bg-card/50 p-5">
                <SectionLabel icon={<Building2 className="h-4 w-4" />}>Project</SectionLabel>

                {profile.org_description && (
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {profile.org_description}
                  </p>
                )}

                {profile.org_website && isSafeUrl(profile.org_website) && (
                  <a
                    href={profile.org_website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#f0b400] hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    {profile.org_website}
                  </a>
                )}

                {nullIfEmpty(profile.looking_for) && (
                  <div className="mt-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Looking for
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {profile.looking_for!.map((need) => (
                        <Badge
                          key={need}
                          variant="outline"
                          className="border-[#f0b400]/30 text-[#f0b400]"
                        >
                          {need}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {linkEntries(profile.org_links).length > 0 && (
                  <div className="mt-4 space-y-2">
                    {linkEntries(profile.org_links).map((l) => (
                      <ExternalLinkItem key={l.label || l.url} label={l.label} url={l.url} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {!hasBuilderData && !hasProjectData && (
              <p className="rounded-xl border border-dashed border-border/40 bg-card/30 p-4 text-center text-sm text-muted-foreground">
                This profile has not published anything publicly yet.
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Small presentational helpers — kept below so the page reads top-down.
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {icon}
      {children}
    </div>
  )
}

function ExternalLinkItem({ label, url }: { label: string; url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-[#f0b400] transition-colors"
    >
      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{label || url}</span>
    </a>
  )
}

function LoadError({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="mx-auto max-w-md rounded-2xl border border-border/40 bg-card/50 p-8 text-center">
        <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-[#f0b400]" />
        <h1 className="text-xl font-semibold text-foreground">Could not load this profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {message || "Something went wrong while fetching this profile. Please try again."}
        </p>
        <Link href="/connect" className="mt-6 inline-block">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Thalos Connect
          </Button>
        </Link>
      </div>
    </div>
  )
}

/**
 * Reserved C6/C7 trust slots. Renders only when the backend actually returns a
 * signal — reputation summary when available, or the simpler score badge when
 * only `reputation_score` is present on the profile payload.
 */
function ReputationSlots({
  reputation,
  score,
}: {
  reputation: ReputationSummary | null
  score: number | null
}) {
  if (reputation) {
    return (
      <ReputationCard
        completedAgreements={reputation.completedAgreements}
        releasedMilestones={reputation.releasedMilestones}
        githubVerified={reputation.githubVerified}
        totalReleasedUsdc={reputation.totalReleasedUsdc}
      />
    )
  }

  if (score === null) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-4">
      <Star className="h-5 w-5 text-[#f0b400]" />
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Trust score</p>
        <p className="font-semibold text-foreground">{score}</p>
      </div>
    </div>
  )
}

/** Compact reputation card (C7) + verified GitHub chip (C6), shown only when present. */
function ReputationCard({
  completedAgreements,
  releasedMilestones,
  githubVerified,
  totalReleasedUsdc,
}: {
  completedAgreements: number
  releasedMilestones: number
  githubVerified: boolean | null
  totalReleasedUsdc: number | null
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-4">
        <Handshake className="h-5 w-5 text-[#f0b400]" />
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Completed</p>
          <p className="font-semibold text-foreground">{completedAgreements} agreements</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-4">
        <Star className="h-5 w-5 text-[#f0b400]" />
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Milestones</p>
          <p className="font-semibold text-foreground">{releasedMilestones} released</p>
        </div>
      </div>
      {totalReleasedUsdc !== null && (
        <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-4">
          <Github className="h-5 w-5 text-[#f0b400]" />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Value released</p>
            <p className="font-semibold text-foreground">
              {totalReleasedUsdc.toLocaleString()} USDC
            </p>
          </div>
        </div>
      )}
      {githubVerified === true && (
        <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-400">
          <Github className="h-4 w-4" />
          <span className="font-medium">Verified GitHub</span>
          <span className="text-green-400/70">— commits backed by PR milestones</span>
        </div>
      )}
    </div>
  )
}
