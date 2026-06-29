-- Migration 011: Business Roles & Members
CREATE TABLE IF NOT EXISTS business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_wallet TEXT NOT NULL,
  member_wallet TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Admin', 'Finance', 'Operator')) DEFAULT 'Operator',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_wallet, member_wallet)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_business_members_business ON business_members(business_wallet);
CREATE INDEX IF NOT EXISTS idx_business_members_member ON business_members(member_wallet);

-- Enable RLS
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "business_members_read" ON business_members FOR SELECT USING (true);
CREATE POLICY "business_members_insert" ON business_members FOR INSERT WITH CHECK (true);
CREATE POLICY "business_members_update" ON business_members FOR UPDATE USING (true);
CREATE POLICY "business_members_delete" ON business_members FOR DELETE USING (true);
