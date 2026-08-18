import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { getPublicProfileByHandle, type PublicProfile } from "@/lib/api/profiles"
import { APP_URL } from "@/lib/config"

interface PageProps {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { handle } = await params
  const { profile } = await getPublicProfileByHandle(handle)

  if (!profile) {
    return { title: "Profile Not Found — Thalos" }
  }

  const name = profile.display_name || handle
  const isBuilder = profile.account_type === "personal"
  const description = isBuilder
    ? profile.builder?.bio || `${name} is a builder on Thalos.`
    : profile.project?.org_description || `${name} is a project on Thalos.`

  return {
    title: `${name} — Thalos Connect`,
    description,
    openGraph: {
      title: `${name} — Thalos Connect`,
      description,
      url: `${APP_URL}/connect/${handle}`,
      siteName: "Thalos",
      type: "profile",
      ...(profile.avatar_url ? { images: [{ url: profile.avatar_url }] } : {}),
    },
    twitter: {
      card: "summary",
      title: `${name} — Thalos Connect`,
      description,
      ...(profile.avatar_url ? { images: [profile.avatar_url] } : {}),
    },
  }
}

function Badge({
  children,
  variant = "default",
}: {
  children: React.ReactNode
  variant?: "default" | "accent" | "outline"
}) {
  const styles = {
    default:
      "bg-white/5 border-white/10 text-white/80",
    accent:
      "bg-[#f0b400]/10 border-[#f0b400]/20 text-[#f0b400]",
    outline:
      "bg-transparent border-white/15 text-white/60",
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  )
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/50">
        {icon}
      </div>
      <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">{children}</h3>
    </div>
  )
}

function LinkItem({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70 transition-colors hover:border-[#f0b400]/20 hover:bg-[#f0b400]/5 hover:text-[#f0b400]"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="shrink-0"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      <span className="truncate">{label}</span>
    </a>
  )
}

function BuilderView({ profile }: { profile: PublicProfile }) {
  const b = profile.builder
  return (
    <div className="space-y-6">
      {b?.headline && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <SectionHeading
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            }
          >
            Headline
          </SectionHeading>
          <p className="text-lg font-medium text-white/90 leading-relaxed">{b.headline}</p>
        </div>
      )}

      {b?.bio && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <SectionHeading
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
          >
            About
          </SectionHeading>
          <p className="text-sm leading-relaxed text-white/70 whitespace-pre-line">{b.bio}</p>
        </div>
      )}

      {b?.skills && b.skills.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <SectionHeading
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            }
          >
            Skills
          </SectionHeading>
          <div className="flex flex-wrap gap-2">
            {b.skills.map((skill) => (
              <Badge key={skill}>{skill}</Badge>
            ))}
          </div>
        </div>
      )}

      {b?.tech_stack && b.tech_stack.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <SectionHeading
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            }
          >
            Tech Stack
          </SectionHeading>
          <div className="flex flex-wrap gap-2">
            {b.tech_stack.map((tech) => (
              <Badge key={tech} variant="accent">
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {b?.availability && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <SectionHeading
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            }
          >
            Availability
          </SectionHeading>
          <p className="text-sm text-white/70">{b.availability}</p>
        </div>
      )}

      {b?.hourly_rate != null && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <SectionHeading
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            }
          >
            Hourly Rate
          </SectionHeading>
          <p className="text-lg font-semibold text-[#f0b400]">${b.hourly_rate}/hr</p>
        </div>
      )}

      {((b?.portfolio_links && b.portfolio_links.length > 0) ||
        (b?.social_links && b.social_links.length > 0)) && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <SectionHeading
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            }
          >
            Links
          </SectionHeading>
          <div className="grid gap-2 sm:grid-cols-2">
            {b?.portfolio_links?.map((link) => (
              <LinkItem key={link} href={link} label={link} />
            ))}
            {b?.social_links?.map((link) => (
              <LinkItem key={link} href={link} label={link} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectView({ profile }: { profile: PublicProfile }) {
  const p = profile.project
  return (
    <div className="space-y-6">
      {p?.org_name && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <SectionHeading
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            }
          >
            Organization
          </SectionHeading>
          <p className="text-lg font-medium text-white/90">{p.org_name}</p>
        </div>
      )}

      {p?.org_description && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <SectionHeading
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="17" y1="10" x2="3" y2="10" />
                <line x1="21" y1="6" x2="3" y2="6" />
                <line x1="21" y1="14" x2="3" y2="14" />
                <line x1="17" y1="18" x2="3" y2="18" />
              </svg>
            }
          >
            About
          </SectionHeading>
          <p className="text-sm leading-relaxed text-white/70 whitespace-pre-line">{p.org_description}</p>
        </div>
      )}

      {p?.org_website && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <SectionHeading
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            }
          >
            Website
          </SectionHeading>
          <a
            href={p.org_website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[#f0b400] hover:underline"
          >
            {p.org_website}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      )}

      {p?.looking_for && p.looking_for.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <SectionHeading
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          >
            Looking For
          </SectionHeading>
          <div className="flex flex-wrap gap-2">
            {p.looking_for.map((item) => (
              <Badge key={item} variant="accent">
                {item}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {p?.org_links && p.org_links.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <SectionHeading
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            }
          >
            Links
          </SectionHeading>
          <div className="grid gap-2 sm:grid-cols-2">
            {p.org_links.map((link) => (
              <LinkItem key={link} href={link} label={link} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProfileBadges({ profile }: { profile: PublicProfile }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="accent">
        {profile.account_type === "personal" ? "Builder" : "Project"}
      </Badge>
      {profile.reputation_score != null && profile.reputation_score > 0 && (
        <Badge>
          <span className="mr-1 inline-flex items-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-[#f0b400]">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </span>
          {profile.reputation_score}
        </Badge>
      )}
      {profile.verified_github && (
        <Badge>
          <span className="mr-1 inline-flex items-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </span>
          Verified GitHub
        </Badge>
      )}
    </div>
  )
}

export default async function ConnectHandlePage({ params }: PageProps) {
  const { handle } = await params
  const { profile, error } = await getPublicProfileByHandle(handle)

  if (error || !profile) {
    notFound()
  }

  const name = profile.display_name || handle

  return (
    <div className="min-h-screen bg-[#0a0e17]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0e17]/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/thalos-icon.png"
              alt="Thalos"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span className="text-sm font-bold text-white/80 hidden sm:inline">Thalos</span>
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-white/40 transition-colors hover:text-white/70"
          >
            Back to Home
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {/* Profile Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="relative mb-5">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#f0b400]/20 to-[#f0b400]/5 border-2 border-[#f0b400]/30 overflow-hidden">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={name}
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-[#f0b400]">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <h1 className="mb-2 text-2xl font-bold tracking-tight text-white">{name}</h1>
          <p className="mb-1 text-sm font-mono text-white/30">@{handle}</p>

          <div className="mt-4">
            <ProfileBadges profile={profile} />
          </div>
        </div>

        {/* Profile Content */}
        {profile.account_type === "personal" ? (
          <BuilderView profile={profile} />
        ) : (
          <ProjectView profile={profile} />
        )}

        {/* Empty state if no profile data beyond basic info */}
        {!profile.builder && !profile.project && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <p className="text-sm text-white/40">
              This profile hasn&apos;t been filled out yet.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16">
        <div className="mx-auto max-w-3xl px-6 py-8 text-center">
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} Thalos Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
