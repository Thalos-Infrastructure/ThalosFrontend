import type { Profile } from "@/lib/actions/profile"

/**
 * Where a signed-in user belongs. The stored profile decides; `fallback` only
 * applies to a brand-new user who has no profile yet.
 */
export function dashboardPathFor(
  profile: Profile | null | undefined,
  fallback: "personal" | "enterprise" = "personal",
): string {
  const accountType = profile?.account_type ?? fallback
  return accountType === "enterprise" ? "/dashboard/business" : "/dashboard/personal"
}
