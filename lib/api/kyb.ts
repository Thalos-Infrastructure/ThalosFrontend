import { apiRequest, type ApiResponse } from "./client"

export type KybStatus = "pending" | "in_review" | "verified" | "rejected"

export interface KybBusinessDetails {
  name?: string | null
  registrationNumber?: string | null
  country?: string | null
  entityType?: string | null
}

export interface KybSessionRequest {
  organization_id: string
  business_name: string
  registration_number: string
  country: string
  entity_type: string
}

interface BackendKybVerification {
  id?: string
  organization_id: string
  business_name?: string | null
  registration_number?: string | null
  country?: string | null
  entity_type?: string | null
  status: KybStatus
  rejection_reason?: string | null
  expires_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

interface BackendKybVerificationEnvelope {
  verification: BackendKybVerification
}

export interface KybSession {
  id?: string
  organizationId: string
  status: KybStatus
  expiresAt?: string | null
  failureReason?: string | null
  business?: KybBusinessDetails
}

export interface KybStatusResponse {
  organizationId: string
  status: KybStatus
  sessionExpired?: boolean
  failureReason?: string | null
  business?: KybBusinessDetails
}

function unwrapVerification(data: BackendKybVerificationEnvelope | BackendKybVerification): BackendKybVerification {
  return "verification" in data ? data.verification : data
}

function mapVerification(verification: BackendKybVerification): KybSession {
  return {
    id: verification.id,
    organizationId: verification.organization_id,
    status: verification.status,
    expiresAt: verification.expires_at ?? null,
    failureReason: verification.rejection_reason ?? null,
    business: {
      name: verification.business_name ?? null,
      registrationNumber: verification.registration_number ?? null,
      country: verification.country ?? null,
      entityType: verification.entity_type ?? null,
    },
  }
}

function isExpired(expiresAt?: string | null): boolean {
  return Boolean(expiresAt && Date.parse(expiresAt) <= Date.now())
}

export function mapKybVerificationResponse(
  data: BackendKybVerificationEnvelope | BackendKybVerification
): KybSession {
  return mapVerification(unwrapVerification(data))
}

export function buildKybSessionBody(input: KybSessionRequest): KybSessionRequest {
  return {
    organization_id: input.organization_id,
    business_name: input.business_name.trim(),
    registration_number: input.registration_number.trim(),
    country: input.country.trim().toUpperCase(),
    entity_type: input.entity_type.trim(),
  }
}

export async function startKybSession(
  request: KybSessionRequest,
  token?: string
): Promise<ApiResponse<KybSession>> {
  const result = await apiRequest<BackendKybVerificationEnvelope>(
    "/kyb/session",
    { method: "POST", body: JSON.stringify(buildKybSessionBody(request)) },
    token
  )

  if (!result.success || !result.data) return { success: false, error: result.error }

  return { success: true, data: mapKybVerificationResponse(result.data) }
}

export async function getKybStatus(
  organizationId: string,
  token?: string
): Promise<ApiResponse<KybStatusResponse>> {
  const result = await apiRequest<BackendKybVerificationEnvelope>(
    `/kyb/status/${encodeURIComponent(organizationId)}`,
    { method: "GET" },
    token
  )

  if (!result.success || !result.data) return { success: false, error: result.error }

  const verification = mapKybVerificationResponse(result.data)

  return {
    success: true,
    data: {
      organizationId: verification.organizationId,
      status: verification.status,
      sessionExpired: isExpired(verification.expiresAt),
      failureReason: verification.failureReason,
      business: verification.business,
    },
  }
}
