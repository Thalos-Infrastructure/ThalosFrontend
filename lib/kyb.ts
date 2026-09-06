export type KybEntityType = "company" | "startup" | "organization" | "legal_entity"
export type KybVerificationStatus = "not_started" | "in_review" | "verified" | "rejected"

export const KYB_ENTITY_TYPES: readonly KybEntityType[] = [
  "company",
  "startup",
  "organization",
  "legal_entity",
] as const

export type KybProfileFields = {
  business_name: string | null
  registration_number: string | null
  country: string | null
  entity_type: KybEntityType | null
  kyb_status: KybVerificationStatus
  kyb_session_id: string | null
}

export type CreateKybSessionDto = {
  wallet_address: string
  business_name: string
  registration_number: string
  country: string
  entity_type: KybEntityType
}

export function isKybEntityType(value: string | null | undefined): value is KybEntityType {
  return KYB_ENTITY_TYPES.includes(value as KybEntityType)
}

export function isKybVerified(status: KybVerificationStatus | null | undefined): boolean {
  return status === "verified"
}

export function canStartKybSession(fields: Partial<KybProfileFields> | null | undefined): boolean {
  if (!fields) return false
  return Boolean(
    fields.business_name?.trim() &&
    fields.registration_number?.trim() &&
    fields.country?.trim() &&
    isKybEntityType(fields.entity_type),
  )
}

export function buildCreateKybSessionDto(
  walletAddress: string,
  fields: Partial<KybProfileFields>,
): CreateKybSessionDto {
  const business_name = fields.business_name?.trim() ?? ""
  const registration_number = fields.registration_number?.trim() ?? ""
  const country = fields.country?.trim() ?? ""
  const entity_type = fields.entity_type

  if (!walletAddress.trim()) throw new Error("Wallet address is required")
  if (!business_name) throw new Error("Business name is required")
  if (!registration_number) throw new Error("Registration number is required")
  if (!country) throw new Error("Country is required")
  if (!isKybEntityType(entity_type))
    throw new Error("Entity type must be company, startup, organization, or legal_entity")

  return { wallet_address: walletAddress, business_name, registration_number, country, entity_type }
}

export function nextKybStatusAfterSessionStart(): KybVerificationStatus {
  return "in_review"
}
