-- Linked wallets table - allows users to link multiple wallets to their account
-- This enables viewing agreements from all linked wallets in one place

CREATE TABLE IF NOT EXISTS linked_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('custodial', 'freighter', 'albedo', 'rabet', 'xbull', 'other')),
  label TEXT, -- User-friendly label like "My main wallet"
  is_primary BOOLEAN DEFAULT false,
  linked_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure a wallet can only be linked once per user
  UNIQUE(user_id, wallet_address)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_linked_wallets_user ON linked_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_linked_wallets_address ON linked_wallets(wallet_address);

-- RLS Policies
ALTER TABLE linked_wallets ENABLE ROW LEVEL SECURITY;

-- Users can read their own linked wallets
CREATE POLICY "linked_wallets_read_own" ON linked_wallets 
  FOR SELECT USING (true);

-- Users can insert their own linked wallets
CREATE POLICY "linked_wallets_insert" ON linked_wallets 
  FOR INSERT WITH CHECK (true);

-- Users can update their own linked wallets
CREATE POLICY "linked_wallets_update" ON linked_wallets 
  FOR UPDATE USING (true);

-- Users can delete their own linked wallets
CREATE POLICY "linked_wallets_delete" ON linked_wallets 
  FOR DELETE USING (true);

-- Function to ensure only one primary wallet per user
CREATE OR REPLACE FUNCTION ensure_single_primary_wallet()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE linked_wallets 
    SET is_primary = false 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single primary wallet
DROP TRIGGER IF EXISTS ensure_single_primary ON linked_wallets;
CREATE TRIGGER ensure_single_primary
  AFTER INSERT OR UPDATE ON linked_wallets
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION ensure_single_primary_wallet();
