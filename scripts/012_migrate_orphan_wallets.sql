-- Migration 012: Migrate existing orphan wallets to a non-operational state (Issue #74)

BEGIN;

-- 1. Null out orphan wallet_public_keys in auth_users
-- We identify orphan wallets by checking if the user's primary wallet is a 'custodial' wallet auto-generated on signup.
UPDATE auth_users
SET wallet_public_key = NULL
WHERE id IN (
  SELECT au.id
  FROM auth_users au
  JOIN linked_wallets lw ON au.id = lw.user_id
  WHERE lw.wallet_type = 'custodial' 
    AND au.wallet_public_key = lw.wallet_address
);

-- 2. Remove auto-linked custodial wallet rows
-- Deleting them ensures that the user has no operational wallets and will be prompted to connect one.
DELETE FROM linked_wallets
WHERE wallet_type = 'custodial';

COMMIT;
