-- Bounties table (multi-validator agreements with shareable links)
CREATE TABLE IF NOT EXISTS bounties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  escrow_contract_id TEXT,
  amount DECIMAL(20, 7) NOT NULL,
  asset TEXT DEFAULT 'USDC',
  creator_wallet TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'open', 'in_progress', 'completed', 'disputed', 'cancelled')) DEFAULT 'draft',
  min_validators_required INTEGER DEFAULT 1,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bounty Validators (validators assigned to a bounty)
CREATE TABLE IF NOT EXISTS bounty_validators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  has_approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bounty_id, wallet_address)
);

-- Bounty Submissions (work submissions for a bounty)
CREATE TABLE IF NOT EXISTS bounty_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bounty_id UUID REFERENCES bounties(id) ON DELETE CASCADE,
  submitter_wallet TEXT NOT NULL,
  evidence_url TEXT,
  description TEXT,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key reference from agreements to bounties
ALTER TABLE agreements 
  DROP CONSTRAINT IF EXISTS agreements_bounty_id_fkey;
ALTER TABLE agreements 
  ADD CONSTRAINT agreements_bounty_id_fkey 
  FOREIGN KEY (bounty_id) REFERENCES bounties(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bounties_slug ON bounties(slug);
CREATE INDEX IF NOT EXISTS idx_bounties_creator ON bounties(creator_wallet);
CREATE INDEX IF NOT EXISTS idx_bounties_status ON bounties(status);
CREATE INDEX IF NOT EXISTS idx_validators_bounty ON bounty_validators(bounty_id);
CREATE INDEX IF NOT EXISTS idx_validators_wallet ON bounty_validators(wallet_address);
CREATE INDEX IF NOT EXISTS idx_submissions_bounty ON bounty_submissions(bounty_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitter ON bounty_submissions(submitter_wallet);

-- RLS Policies for bounties
ALTER TABLE bounties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bounties_read_all" ON bounties FOR SELECT USING (true);
CREATE POLICY "bounties_insert" ON bounties FOR INSERT WITH CHECK (true);
CREATE POLICY "bounties_update" ON bounties FOR UPDATE USING (true);

-- RLS Policies for bounty_validators
ALTER TABLE bounty_validators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "validators_read_all" ON bounty_validators FOR SELECT USING (true);
CREATE POLICY "validators_insert" ON bounty_validators FOR INSERT WITH CHECK (true);
CREATE POLICY "validators_update" ON bounty_validators FOR UPDATE USING (true);

-- RLS Policies for bounty_submissions
ALTER TABLE bounty_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions_read_all" ON bounty_submissions FOR SELECT USING (true);
CREATE POLICY "submissions_insert" ON bounty_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "submissions_update" ON bounty_submissions FOR UPDATE USING (true);

-- Trigger for bounties updated_at
DROP TRIGGER IF EXISTS update_bounties_updated_at ON bounties;
CREATE TRIGGER update_bounties_updated_at
  BEFORE UPDATE ON bounties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
