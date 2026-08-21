import { apiRequest, type ApiResponse } from "./client"

export type ProfileType = "builder" | "project"

export interface BuilderProfile {
  headline: string | null
  bio: string | null
  skills: string[]
  tech_stack: string[]
  hourly_rate: number | null
  availability: string | null
  portfolio_links: string[]
  social_links: string[]
  handle: string | null
}

export interface ProjectProfile {
  org_name: string | null
  org_description: string | null
  org_website: string | null
  looking_for: string[]
  org_links: string[]
}

export interface ConnectProfile extends BuilderProfile, ProjectProfile {
  id?: string
  profile_types: ProfileType[]
  created_at?: string
  updated_at?: string
}

export type UpdateProfileInput = Partial<Omit<ConnectProfile, "id" | "created_at" | "updated_at">>

type ProfileEnvelope = ConnectProfile | { profile: ConnectProfile }

function unwrapProfile(data: ProfileEnvelope): ConnectProfile {
  return "profile" in data ? data.profile : data
}

/** Load the authenticated account's Builder/Project profile. */
export async function getProfile(token: string): Promise<ApiResponse<ConnectProfile>> {
  const result = await apiRequest<ProfileEnvelope>("/profiles", { method: "GET" }, token)
  if (!result.success || !result.data) return { success: false, error: result.error }
  return { success: true, data: unwrapProfile(result.data) }
}

/** Create or update the authenticated account's additive profile types. */
export async function saveProfile(
  profile: UpdateProfileInput,
  token: string
): Promise<ApiResponse<ConnectProfile>> {
  const result = await apiRequest<ProfileEnvelope>(
    "/profiles",
    { method: "PATCH", body: JSON.stringify(profile) },
    token
  )
  if (!result.success || !result.data) return { success: false, error: result.error }
  return { success: true, data: unwrapProfile(result.data) }
}
