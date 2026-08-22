export type KycVerificationStatus = "not_started" | "pending" | "in_review" | "verified" | "rejected"

export type KycProfileFields = {
  full_name?: string | null
  country?: string | null
  kyc_status: KycVerificationStatus
  kyc_session_id?: string | null
}

export type CreateKycSessionDto = {
  wallet_address: string
  user_id?: string
  full_name?: string
  country?: string
}

export function isKycVerified(status: KycVerificationStatus | null | undefined): boolean {
  return status === "verified"
}

export function canStartKycSession(fields: Partial<KycProfileFields> | null | undefined): boolean {
  if (!fields) return false
  return Boolean(fields.full_name?.trim() && fields.country?.trim())
}

export function buildCreateKycSessionDto(
  walletAddress: string,
  userId?: string | null,
  fields?: Partial<KycProfileFields> | null
): CreateKycSessionDto {
  if (!walletAddress.trim()) throw new Error("Wallet address is required")
  const fullName = fields?.full_name?.trim()
  const country = fields?.country?.trim()

  return {
    wallet_address: walletAddress,
    ...(userId ? { user_id: userId } : {}),
    ...(fullName ? { full_name: fullName } : {}),
    ...(country ? { country: country } : {}),
  }
}

export function nextKycStatusAfterSessionStart(): KycVerificationStatus {
  return "in_review"
}
