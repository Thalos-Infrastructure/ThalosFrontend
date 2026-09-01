import { apiRequest, type ApiResponse } from "./client"

/**
 * Public-safe profile payload returned by the Nest backend for Thalos Connect.
 * A single account can be BOTH a Builder and a Project (types are additive,
 * never mutually exclusive), so these fields all live on one profile object.
 *
 * Only public-safe fields are exposed here — the backend whitelists
 * PUBLIC_PROFILE_COLUMNS and never returns email, KYB, role, or other private
 * account data on the public endpoints consumed by this module.
 */
export interface BuilderProfile {
  id: string
  wallet_address: string
  handle: string | null
  display_name: string | null
  avatar_url: string | null

  // ── Builder fields ──
  headline: string | null
  bio: string | null
  skills: string[]
  tech_stack: string[]
  hourly_rate: number | null
  availability: "available" | "open" | "unavailable" | null
  portfolio_links: Array<{ label: string; url: string }> | Record<string, string> | null
  social_links: Record<string, string> | null

  // ── Project fields (additive; both may be populated on one account) ──
  org_name: string | null
  org_description: string | null
  org_website: string | null
  looking_for: string[] | null
  org_links: Record<string, string> | null

  // ── Reserved slots (rendered only if present) ──
  // C6 — verified GitHub (null until the feature is rolled out).
  github_verified: boolean | null
  // C7 — reputation score carried in the public endpoint once wired server-side.
  reputation_score: number | null

  created_at: string
}

export interface ProjectProfile {
  org_name: string | null
  org_description: string | null
  org_website: string | null
  looking_for: string[]
  org_links: string[]
}

export interface ProfileDiscoveryParams {
  skills?: string[]
  tech_stack?: string[]
  availability?: "available" | "open" | "unavailable"
  q?: string
  page?: number
  limit?: number
}

/** Response shape for GET /profiles/handle/:handle (public, no auth). */
interface PublicProfileEnvelope {
  profile?: unknown
  data?: unknown
  error?: unknown
}

/**
 * Normalise the profile returned by GET /profiles/handle/:handle into a
 * `BuilderProfile`. The backend currently returns `{ profile, error }`, but
 * `apiRequest` hands back the raw body, so we also tolerate a `{ data }` wrapper
 * to be resilient to envelope adjustments (same defensive style as reputation.ts).
 */
function normalizeProfile(payload: unknown): BuilderProfile {
  const raw = (payload ?? {}) as Record<string, unknown>
  const profile =
    (raw.profile as Record<string, unknown> | undefined) ??
    (raw.data as Record<string, unknown> | undefined) ??
    raw

  const stringList = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string")
    if (typeof v === "string") return [v]
    return []
  }

  const linkList = (v: unknown): BuilderProfile["portfolio_links"] => {
    if (v === null || v === undefined) return null
    if (Array.isArray(v)) return v as BuilderProfile["portfolio_links"]
    if (typeof v === "object")
      return v as Record<string, string> // { label: url } style object
    return null
  }

  const stringRecordOrNull = (v: unknown): Record<string, string> | null =>
    v !== null && v !== undefined && typeof v === "object"
      ? (v as Record<string, string>)
      : null

  const asNullableString = (v: unknown): string | null =>
    typeof v === "string" && v.length > 0 ? v : null

  const asNullableNumber = (v: unknown): number | null => {
    if (v === null || v === undefined) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  const asBooleanOrNull = (v: unknown): boolean | null => {
    if (v === null || v === undefined) return null
    if (typeof v === "boolean") return v
    if (v === "true" || v === 1) return true
    if (v === "false" || v === 0) return false
    return null
  }

  const availability = profile.availability as BuilderProfile["availability"]

  return {
    id: String(profile.id ?? ""),
    wallet_address: String(profile.wallet_address ?? profile.walletAddress ?? ""),
    handle: asNullableString(profile.handle),
    display_name: asNullableString(profile.display_name ?? profile.displayName),
    avatar_url: asNullableString(profile.avatar_url ?? profile.avatarUrl),
    headline: asNullableString(profile.headline),
    bio: asNullableString(profile.bio),
    skills: stringList(profile.skills),
    tech_stack: stringList(profile.tech_stack ?? profile.techStack),
    hourly_rate: asNullableNumber(profile.hourly_rate ?? profile.hourlyRate),
    availability:
      availability === "available" || availability === "open" || availability === "unavailable"
        ? availability
        : null,
    portfolio_links: linkList(profile.portfolio_links ?? profile.portfolioLinks),
    social_links: stringRecordOrNull(profile.social_links ?? profile.socialLinks),
    org_name: asNullableString(profile.org_name ?? profile.orgName),
    org_description: asNullableString(profile.org_description ?? profile.orgDescription),
    org_website: asNullableString(profile.org_website ?? profile.orgWebsite),
    looking_for: profile.looking_for != null ? stringList(profile.looking_for) : null,
    org_links: stringRecordOrNull(profile.org_links ?? profile.orgLinks),
    github_verified: asBooleanOrNull(profile.github_verified ?? profile.githubVerified),
    reputation_score: asNullableNumber(profile.reputation_score ?? profile.reputationScore),
    created_at: String(profile.created_at ?? ""),
  }
}

/**
 * Result of a public by-handle lookup. We deliberately distinguish a genuinely
 * unknown handle (→ clean 404 page) from a backend/network failure (→ a real
 * error message), so a transient 500 is never shown as a misleading
 * “Profile Not Found”.
 */
export type GetPublicProfileResult =
  | { ok: true; profile: BuilderProfile }
  | { ok: false; notFound: true }
  | { ok: false; notFound: false; error: string }

/**
 * Fetch a public-safe profile by `handle`.
 *
 * GET /profiles/handle/:handle — public endpoint, no auth token is required or
 * sent (a viewer should be able to open the shareable card without any session).
 *
 * A handle is treated as unknown when either:
 *   - the backend answers HTTP 404, or
 *   - the backend answers HTTP 200 with an empty public payload (`{ profile: null }`),
 *     which is how the existing Nest profiles module signals a missing row.
 * All other failures are surfaced as errors, not 404s.
 */
export async function getProfileByHandle(
  handle: string,
  _token?: string,
): Promise<GetPublicProfileResult> {
  const result = await apiRequest<unknown>(
    `/profiles/handle/${encodeURIComponent(handle)}`,
    { method: "GET" },
    // Deliberately not passing `token` — this is a public endpoint. Sessions
    // belong on authenticated routes; the shareable card must not rely on one.
  )

  if (result.status === 404) {
    return { ok: false, notFound: true }
  }

  if (!result.success) {
    return {
      ok: false,
      notFound: false,
      error: result.error ?? "Failed to load public profile",
    }
  }

  const body = (result.data ?? {}) as { profile?: unknown; data?: unknown }
  // The public endpoint must return a populated profile envelope. A `null`
  // profile (HTTP 200) or a payload without the `profile`/`data` keys means the
  // handle does not point at a public profile → treat it as not found.
  if (body.profile === undefined && body.data === undefined) {
    return { ok: false, notFound: true }
  }
  const profile = normalizeProfile(body as PublicProfileEnvelope)
  if (!profile.id) {
    // Defensive: empty profile object → no public profile behind this handle.
    return { ok: false, notFound: true }
  }
  return { ok: true, profile }
}

export async function discoverProfiles(
  params: ProfileDiscoveryParams = {},
  token?: string,
): Promise<ApiResponse<ProfilePaginatedResponse<BuilderProfile>>> {
  const query = new URLSearchParams()

  if (params.skills?.length) {
    params.skills.forEach((s) => query.append("skills", s))
  }
  if (params.tech_stack?.length) {
    params.tech_stack.forEach((t) => query.append("tech_stack", t))
  }
  if (params.availability) {
    query.set("availability", params.availability)
  }
  if (params.q) {
    query.set("q", params.q)
  }
  if (params.page) {
    query.set("page", String(params.page))
  }
  if (params.limit) {
    query.set("limit", String(params.limit))
  }

  const qs = query.toString()
  return apiRequest<ProfilePaginatedResponse<BuilderProfile>>(
    `/profiles${qs ? `?${qs}` : ""}`,
    { method: "GET" },
    token,
  )
}