import { apiRequest, type ApiResponse } from "./client"

export interface BuilderProfile {
  id: string
  wallet_address: string
  handle: string | null
  display_name: string | null
  avatar_url: string | null
  headline: string | null
  bio: string | null
  skills: string[]
  tech_stack: string[]
  hourly_rate: number | null
  availability: "available" | "open" | "unavailable" | null
  portfolio_links: Record<string, string> | null
  social_links: Record<string, string> | null
}

export interface ProfilePaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProfileDiscoveryParams {
  skills?: string[]
  tech_stack?: string[]
  availability?: "available" | "open" | "unavailable"
  q?: string
  page?: number
  limit?: number
}

export async function discoverProfiles(
  params: ProfileDiscoveryParams = {},
  token?: string
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
    token
  )
}
