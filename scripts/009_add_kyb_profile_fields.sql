-- KYB profile fields used to create business verification sessions.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS registration_number TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS entity_type TEXT CHECK (entity_type IN ('company', 'startup', 'organization', 'legal_entity')),
  ADD COLUMN IF NOT EXISTS kyb_status TEXT CHECK (kyb_status IN ('not_started', 'in_review', 'verified', 'rejected')) DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS kyb_session_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_kyb_status ON profiles(kyb_status);
