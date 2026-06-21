-- Migration 011: add SEP-0043 ownership-proof columns to linked_wallets
--
-- is_verified  — true once the wallet owner has signed a SEP-0043 challenge
-- verified_at  — timestamp of the successful verification
--
-- Custodial wallets are auto-verified at link time.
-- External (non-custodial) wallets start unverified and must go through
-- the challenge → sign → verify flow before is_verified becomes true.

ALTER TABLE linked_wallets
  ADD COLUMN IF NOT EXISTS is_verified  BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at  TIMESTAMPTZ;

-- Back-fill: custodial wallets that were already linked are trusted
-- by definition — mark them verified as of their link time.
UPDATE linked_wallets
SET
  is_verified = true,
  verified_at = linked_at
WHERE wallet_type = 'custodial'
  AND is_verified = false;

-- Index so the backend can quickly find unverified external wallets.
CREATE INDEX IF NOT EXISTS idx_linked_wallets_verified
  ON linked_wallets(user_id, is_verified);
