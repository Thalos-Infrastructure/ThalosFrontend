import { apiRequest, type ApiResponse } from "./client"
import { type CreateKycSessionDto, type KycVerificationStatus } from "@/lib/kyc"

export type KycStatus = KycVerificationStatus

interface BackendKycVerification {
  id?: string
  user_id?: string
  organization_id?: string
  status: KycStatus
  rejection_reason?: string | null
  expires_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

interface BackendKycVerificationEnvelope {
  verification: BackendKycVerification
}

export interface KycSession {
  id?: string
  userId?: string
  status: KycStatus
  expiresAt?: string | null
  failureReason?: string | null
}

export interface KycStatusResponse {
  userId?: string
  status: KycStatus
  sessionExpired?: boolean
  failureReason?: string | null
}

function unwrapVerification(data: BackendKycVerificationEnvelope): BackendKycVerification {
  return data.verification
}

function mapVerification(verification: BackendKycVerification): KycSession {
  return {
    id: verification.id,
    userId: verification.user_id,
    status: verification.status,
    expiresAt: verification.expires_at ?? null,
    failureReason: verification.rejection_reason ?? null,
  }
}

function isExpired(expiresAt?: string | null): boolean {
  return Boolean(expiresAt && Date.parse(expiresAt) <= Date.now())
}

export function mapKycVerificationResponse(data: BackendKycVerificationEnvelope): KycSession {
  return mapVerification(unwrapVerification(data))
}

export async function startKycSession(
  request: CreateKycSessionDto,
  token?: string | null
): Promise<ApiResponse<KycSession>> {
  const result = await apiRequest<BackendKycVerificationEnvelope>(
    "/kyc/session",
    { method: "POST", body: JSON.stringify(request) },
    token ?? undefined
  )

  if (!result.success || !result.data) return { success: false, error: result.error }

  return { success: true, data: mapKycVerificationResponse(result.data) }
}

export async function getKycStatus(
  userId: string,
  token?: string | null
): Promise<ApiResponse<KycStatusResponse>> {
  const result = await apiRequest<BackendKycVerificationEnvelope>(
    `/verification/user/${encodeURIComponent(userId)}`,
    { method: "GET" },
    token ?? undefined
  )

  if (!result.success || !result.data) return { success: false, error: result.error }

  const verification = mapKycVerificationResponse(result.data)

  return {
    success: true,
    data: {
      userId: verification.userId ?? userId,
      status: verification.status,
      sessionExpired: isExpired(verification.expiresAt),
      failureReason: verification.failureReason,
    },
  }
}
