import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Standard UUID (any version), matches what Postgres gen_random_uuid() produces.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isValidUuid(id: string): boolean {
  return UUID_RE.test(id)
}

// Soroban/Stellar StrKey contract address: 1 version byte + 32 raw bytes + 2
// checksum bytes = 35 bytes, base32-encoded (no padding) = 56 chars, starts with "C".
const SOROBAN_CONTRACT_RE = /^C[A-Z2-7]{55}$/

export function isSorobanContractId(id: string): boolean {
  return SOROBAN_CONTRACT_RE.test(id)
}

/**
 * Returns true if the agreement ID is a mock/demo ID — neither a real DB UUID
 * nor a Soroban contract ID. Real dashboard agreements are keyed by
 * escrow.contractId (Soroban "C…"), so a plain "not a UUID" check would
 * misclassify them as mock.
 */
export function isMockAgreement(id: string): boolean {
  return !isValidUuid(id) && !isSorobanContractId(id)
}
