import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"

const pagePath = path.resolve("app/connect/[handle]/page.tsx")

test("connect public profile page exists at app/connect/[handle]/page.tsx", () => {
  assert.ok(fs.existsSync(pagePath), "app/connect/[handle]/page.tsx must exist")
})

const source = fs.existsSync(pagePath) ? fs.readFileSync(pagePath, "utf8") : ""

test("connect page is an RSC — no client directives or client fetching", () => {
  assert.doesNotMatch(source, /"use client"/, "public showcase must be a Server Component")
  assert.doesNotMatch(
    source,
    /useState|useEffect|useRouter|useAuthStore|useStellarWallet|useCurrentAddress|useLanguage/,
    "RSC must not use client hooks/stores",
  )
})

test("connect page renders a clean 404 for an unknown handle", () => {
  assert.match(source, /notFound/, "must use notFound from next/navigation")
  assert.match(
    source,
    /payload\.notFound[\s\S]*notFound\(\)/,
    "page must call notFound() for a genuine unknown-handle result",
  )
})

test("connect page does NOT turn every failure into a 404", () => {
  assert.match(
    source,
    /payload\.notFound[\s\S]*notFound\(\)/,
    "must gate notFound() on the unknown-handle flag",
  )
  assert.match(source, /Could not load this profile/, "must render a real error state otherwise")
})

test("connect page exposes per-profile SEO metadata", () => {
  assert.match(source, /export async function generateMetadata/, "needs generateMetadata")
  assert.match(source, /Metadata/, "needs the Metadata type")
  assert.match(source, /title/, "metadata must build a per-profile title")
  assert.match(source, /openGraph/, "metadata must include OpenGraph tags")
})

test("connect page de-dupes generateMetadata and page fetches with React.cache", () => {
  assert.match(source, /from "react"[\s\S]*cache|import \{ cache \}/, "must import cache from react")
  assert.match(source, /cache\(async /, "data loader must be cached")
})

test("connect page fetches via the PUBLIC by-handle API (lib/api/profiles.ts)", () => {
  assert.match(
    source,
    /getProfileByHandle[\s\S]*from "@\/lib\/api\/profiles"/,
    "must use getProfileByHandle from lib/api/profiles",
  )
  // It must NOT hit an authenticated route (/profiles/me) on a public page.
  assert.doesNotMatch(source, /profiles\/me/, "public page must not call authenticated routes")
})

test("connect page renders both Builder and Project public views (additive)", () => {
  // Builder fields
  for (const field of ["headline", "bio", "skills", "tech_stack", "hourly_rate", "availability"]) {
    assert.match(source, new RegExp(field), `must render Builder field: ${field}`)
  }
  // Project fields
  for (const field of ["org_website", "org_description", "looking_for", "org_links", "org_name"]) {
    assert.match(source, new RegExp(field), `must render Project field: ${field}`)
  }
  // Both must be able to render at the same time on one account.
  assert.match(source, /hasBuilderData/, "must compute Builder view presence")
  assert.match(source, /hasProjectData/, "must compute Project view presence")
})

test("connect page reserves reputation (C7) and verified GitHub (C6) slots that render only if present", () => {
  assert.match(source, /reputation_score/, "must reference the C7 reputation slot")
  assert.match(source, /githubVerified|github_verified/, "must reference the C6 verified-GitHub slot")
  assert.match(source, /Verification|Verified GitHub/, "must label the verified-GitHub slot")
})

test("connect page allowlists http(s) for external links", () => {
  assert.match(source, /isSafeUrl/, "must validate external URLs")
  assert.match(source, /isSafeUrl\(profile\.org_website\)/, "must gate org_website before linking")
})