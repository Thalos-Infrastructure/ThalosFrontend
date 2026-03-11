-- Profiles table (user profiles linked to wallet address)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  account_type TEXT CHECK (account_type IN ('personal', 'enterprise')) DEFAULT 'personal',
  role TEXT CHECK (role IN ('user', 'validator', 'dispute_resolver', 'admin')) DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast wallet lookups
CREATE INDEX IF NOT EXISTS idx_profiles_wallet ON profiles(wallet_address);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles
CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);

-- Anyone can insert (will be validated by wallet signature in app)
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (true);

-- Anyone can update (will be validated by wallet signature in app)
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
