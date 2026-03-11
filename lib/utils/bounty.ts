/**
 * Generate shareable link for bounty
 * This is a client-side utility, not a server action
 */
export function getBountyShareableLink(slug: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== "undefined" ? window.location.origin : "https://thalos.xyz")
  return `${base}/bounty/${slug}`
}

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30)
  
  const hash = Math.random().toString(36).substring(2, 6)
  return `${base}-${hash}`
}
