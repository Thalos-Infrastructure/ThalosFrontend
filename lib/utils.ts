import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** UUID v4 regex - used to distinguish real escrow contract IDs from mock/demo IDs. */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns true if the agreement ID is a mock/demo ID (not a valid UUID).
 * Mock agreements (AGR-001, etc.) cannot be used with Supabase operations
 * that expect UUIDs, nor with real Stellar contract calls.
 */
export function isMockAgreement(id: string): boolean {
  return !UUID_REGEX.test(id);
}
