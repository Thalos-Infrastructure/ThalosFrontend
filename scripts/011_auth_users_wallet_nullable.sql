-- Make auth_users.wallet_public_key nullable.
--
-- Signup now creates the account/identity only, with no wallet assigned
-- (no more orphan custodial wallets). Users connect their own wallet later
-- via the M2 flow, so a freshly created auth_users row starts with
-- wallet_public_key = NULL.
ALTER TABLE auth_users ALTER COLUMN wallet_public_key DROP NOT NULL;
