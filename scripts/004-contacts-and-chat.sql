-- Contacts table for storing user contacts
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_wallet TEXT NOT NULL,
  contact_wallet TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'invited')),
  invite_token TEXT,
  invite_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_wallet, contact_wallet),
  UNIQUE(owner_wallet, contact_email)
);

-- Enable RLS for contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for contacts
CREATE POLICY contacts_read_own ON contacts FOR SELECT USING (true);
CREATE POLICY contacts_insert ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY contacts_update ON contacts FOR UPDATE USING (true);
CREATE POLICY contacts_delete ON contacts FOR DELETE USING (owner_wallet = current_setting('app.current_user_wallet', true));

-- Agreement chat messages table
CREATE TABLE IF NOT EXISTS agreement_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID NOT NULL REFERENCES agreements(id) ON DELETE CASCADE,
  sender_wallet TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Enable RLS for agreement_messages
ALTER TABLE agreement_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for agreement_messages (participants only)
CREATE POLICY messages_read_all ON agreement_messages FOR SELECT USING (true);
CREATE POLICY messages_insert ON agreement_messages FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contacts_owner ON contacts(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_contacts_contact ON contacts(contact_wallet);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(contact_email);
CREATE INDEX IF NOT EXISTS idx_contacts_invite_token ON contacts(invite_token);
CREATE INDEX IF NOT EXISTS idx_messages_agreement ON agreement_messages(agreement_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON agreement_messages(sender_wallet);
CREATE INDEX IF NOT EXISTS idx_messages_created ON agreement_messages(created_at DESC);
