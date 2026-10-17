/**
 * Is this escrow funded?
 *
 * One answer, because the two places that used to decide it separately
 * disagreed on screen: a badge saying Funded next to a button still offering to
 * fund. Both were reading the same absent `balance` and drawing opposite
 * conclusions from `NaN`.
 */

import type { NormalizedEscrow } from "./indexerEscrow"

/**
 * A number, or undefined for anything that is not one.
 *
 * `Number("")` and `Number("   ")` are both 0, so a blank balance would pass a
 * finiteness check and then lose every comparison — reporting an escrow as
 * unfunded on the strength of a field that said nothing at all.
 */
function numericOrUndefined(value: string | number | undefined | null): number | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === "string" && value.trim() === "") return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function isFundedEscrow(
  escrow: Pick<NormalizedEscrow, "balance" | "amount" | "fundedBy">,
): boolean {
  const balance = numericOrUndefined(escrow.balance)
  const amount = numericOrUndefined(escrow.amount)

  // Only a balance that is actually a number may decide. `Number(undefined)` is
  // NaN and every comparison against NaN is false, so reading an absent balance
  // as "not funded" is a conclusion the payload does not support — Trustless
  // Work marks `balance` optional on the indexer responses.
  if (balance !== undefined && amount !== undefined && amount > 0) {
    return balance >= amount
  }

  // No usable balance: the funder is the only remaining evidence.
  //
  // A capture from testnet on 2026-10-05 carried `balance` on all eight escrows
  // and `fundedBy` on none, so in practice this branch does not run — the field
  // is documented but not sent. It stays as a cheap guard for the shape the
  // documentation promises, and nothing is built on it.
  return typeof escrow.fundedBy === "string" && escrow.fundedBy.trim().length > 0
}
