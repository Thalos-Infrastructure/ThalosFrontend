-- Allow OAuth users (no password): nullable password_hash and provider
ALTER TABLE auth_users
  ADD COLUMN IF NOT EXISTS auth_provider TEXT DEFAULT 'email';

ALTER TABLE auth_users
  ALTER COLUMN password_hash DROP NOT NULL;

-- Optional: ensure email+provider uniqueness if you later allow same email with multiple providers
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_users_email_provider ON auth_users(email, auth_provider);
