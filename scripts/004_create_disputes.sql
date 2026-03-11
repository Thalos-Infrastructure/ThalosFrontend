-- Disputes table (disputes for agreements)
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES agreements(id) ON DELETE CASCADE,
  escrow_contract_id TEXT NOT NULL,
  opened_by_wallet TEXT NOT NULL,
  reason TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT CHECK (status IN ('open', 'under_review', 'resolved')) DEFAULT 'open',
  resolver_wallet TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Dispute Resolutions (fund distribution after resolution)
CREATE TABLE IF NOT EXISTS dispute_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
  party_wallet TEXT NOT NULL,
  party_role TEXT CHECK (party_role IN ('payer', 'payee')) NOT NULL,
  amount DECIMAL(20, 7) NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disputes_agreement ON disputes(agreement_id);
CREATE INDEX IF NOT EXISTS idx_disputes_escrow ON disputes(escrow_contract_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_opener ON disputes(opened_by_wallet);
CREATE INDEX IF NOT EXISTS idx_disputes_resolver ON disputes(resolver_wallet);
CREATE INDEX IF NOT EXISTS idx_resolutions_dispute ON dispute_resolutions(dispute_id);

-- RLS Policies for disputes
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "disputes_read_all" ON disputes FOR SELECT USING (true);
CREATE POLICY "disputes_insert" ON disputes FOR INSERT WITH CHECK (true);
CREATE POLICY "disputes_update" ON disputes FOR UPDATE USING (true);

-- RLS Policies for dispute_resolutions
ALTER TABLE dispute_resolutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resolutions_read_all" ON dispute_resolutions FOR SELECT USING (true);
CREATE POLICY "resolutions_insert" ON dispute_resolutions FOR INSERT WITH CHECK (true);
