-- Password Reset Tokens Table
-- Stores temporary tokens for password reset functionality

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_user_reset_token UNIQUE (user_id)
);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);

-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- RLS Policies
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can access this table (managed via API)
CREATE POLICY "Service role only" ON password_reset_tokens
  FOR ALL USING (false);

-- Allow service role to bypass RLS
GRANT ALL ON password_reset_tokens TO service_role;
