-- Migration 011: Migrate existing orphan wallets to a non-operational state (Issue #74 / #71)

BEGIN;

-- 1. Make wallet_public_key nullable (Resolves #71 / 3.1 requirement)
ALTER TABLE auth_users ALTER COLUMN wallet_public_key DROP NOT NULL;

-- 2. Null out orphan wallet_public_keys in auth_users
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

-- 3. Mark or remove auto-linked custodial wallet rows
-- Deleting them ensures that the user has no operational wallets and will be prompted to connect one.
DELETE FROM linked_wallets
WHERE wallet_type = 'custodial';

COMMIT;

-- Note:
-- Users affected by this migration will have wallet_public_key = NULL and no rows in linked_wallets.
-- On their next login, the frontend will see they have no connected wallet and prompt them to connect a real wallet.
