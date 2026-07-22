import { apiRequest, type ApiResponse } from "./client"

export type KybStatus = "pending" | "in_review" | "verified" | "rejected"

export interface KybBusinessDetails {
  name?: string | null
  registrationNumber?: string | null
  country?: string | null
}

export interface KybSession {
  organizationId?: string
  status: KybStatus
  redirectUrl?: string
  verificationUrl?: string
  embeddedUrl?: string
  expiresAt?: string
  business?: KybBusinessDetails
}

export interface KybStatusResponse {
  organizationId: string
  status: KybStatus
  sessionExpired?: boolean
  failureReason?: string
  business?: KybBusinessDetails
}

export function startKybSession(token?: string): Promise<ApiResponse<KybSession>> {
  return apiRequest<KybSession>("/kyb/session", { method: "POST" }, token)
}

export function getKybStatus(
  organizationId: string,
  token?: string
): Promise<ApiResponse<KybStatusResponse>> {
  return apiRequest<KybStatusResponse>(
    `/kyb/status/${encodeURIComponent(organizationId)}`,
    { method: "GET" },
    token
  )
}
