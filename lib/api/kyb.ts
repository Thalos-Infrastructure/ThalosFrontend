import { apiRequest, type ApiResponse } from "./client"
import { type CreateKybSessionDto } from "@/lib/kyb"

export type KybStatus = "pending" | "in_review" | "verified" | "rejected"

export interface KybBusinessDetails {
  name?: string | null
  registrationNumber?: string | null
  country?: string | null
  entityType?: string | null
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

function unwrapVerification(data: BackendKybVerificationEnvelope): BackendKybVerification {
  return data.verification
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

export function mapKybVerificationResponse(data: BackendKybVerificationEnvelope): KybSession {
  return mapVerification(unwrapVerification(data))
}

export async function startKybSession(
  request: CreateKybSessionDto,
  token?: string | null
): Promise<ApiResponse<KybSession>> {
  const result = await apiRequest<BackendKybVerificationEnvelope>(
    "/kyb/session",
    { method: "POST", body: JSON.stringify(request) },
    token ?? undefined
  )

  if (!result.success || !result.data) return { success: false, error: result.error }

  return { success: true, data: mapKybVerificationResponse(result.data) }
}

export async function getKybStatus(
  organizationId: string,
  token?: string | null
): Promise<ApiResponse<KybStatusResponse>> {
  const result = await apiRequest<BackendKybVerificationEnvelope>(
    `/kyb/status/${encodeURIComponent(organizationId)}`,
    { method: "GET" },
    token ?? undefined
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
