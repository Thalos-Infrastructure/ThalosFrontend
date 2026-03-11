-- Agreements table (stores metadata for all agreements - regular and bounties)
CREATE TABLE IF NOT EXISTS agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escrow_contract_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  agreement_type TEXT CHECK (agreement_type IN ('standard', 'bounty')) DEFAULT 'standard',
  amount DECIMAL(20, 7) NOT NULL,
  asset TEXT DEFAULT 'USDC',
  
  -- Parties
  payer_wallet TEXT NOT NULL,
  payee_wallet TEXT,
  
  -- Status tracking
  status TEXT CHECK (status IN ('pending', 'active', 'completed', 'disputed', 'resolved', 'cancelled')) DEFAULT 'pending',
  
  -- Milestones (JSON array)
  milestones JSONB DEFAULT '[]',
  current_milestone INTEGER DEFAULT 0,
  
  -- Timestamps
  funded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Optional: link to bounty if it's a bounty agreement
  bounty_id UUID
);

-- Agreement Participants (all parties involved in an agreement)
CREATE TABLE IF NOT EXISTS agreement_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES agreements(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  role TEXT CHECK (role IN ('payer', 'payee', 'approver', 'dispute_resolver')) NOT NULL,
  has_signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agreement_id, wallet_address, role)
);

-- Agreement Activity Log (history of actions)
CREATE TABLE IF NOT EXISTS agreement_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES agreements(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_wallet TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agreements_escrow ON agreements(escrow_contract_id);
CREATE INDEX IF NOT EXISTS idx_agreements_payer ON agreements(payer_wallet);
CREATE INDEX IF NOT EXISTS idx_agreements_payee ON agreements(payee_wallet);
CREATE INDEX IF NOT EXISTS idx_agreements_status ON agreements(status);
CREATE INDEX IF NOT EXISTS idx_agreements_type ON agreements(agreement_type);
CREATE INDEX IF NOT EXISTS idx_participants_agreement ON agreement_participants(agreement_id);
CREATE INDEX IF NOT EXISTS idx_participants_wallet ON agreement_participants(wallet_address);
CREATE INDEX IF NOT EXISTS idx_activity_agreement ON agreement_activity(agreement_id);

-- RLS Policies for agreements
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agreements_read_all" ON agreements FOR SELECT USING (true);
CREATE POLICY "agreements_insert" ON agreements FOR INSERT WITH CHECK (true);
CREATE POLICY "agreements_update" ON agreements FOR UPDATE USING (true);

-- RLS Policies for agreement_participants
ALTER TABLE agreement_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants_read_all" ON agreement_participants FOR SELECT USING (true);
CREATE POLICY "participants_insert" ON agreement_participants FOR INSERT WITH CHECK (true);
CREATE POLICY "participants_update" ON agreement_participants FOR UPDATE USING (true);

-- RLS Policies for agreement_activity
ALTER TABLE agreement_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity_read_all" ON agreement_activity FOR SELECT USING (true);
CREATE POLICY "activity_insert" ON agreement_activity FOR INSERT WITH CHECK (true);

-- Trigger for agreements updated_at
DROP TRIGGER IF EXISTS update_agreements_updated_at ON agreements;
CREATE TRIGGER update_agreements_updated_at
  BEFORE UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
