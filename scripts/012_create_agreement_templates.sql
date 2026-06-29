-- Agreement Templates
-- Allows Business profile accounts to save reusable agreement templates.
-- Mirrors CreateAgreementInput so cloning is a direct field mapping.
-- Ownership enforced in Server Actions via eq("owner_wallet", walletAddress).
-- Assumes update_updated_at_column() already exists (used by all prior tables).

CREATE TABLE IF NOT EXISTS agreement_templates (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_wallet   TEXT        NOT NULL,
  name           TEXT        NOT NULL,
  title          TEXT        NOT NULL,
  description    TEXT,
  amount         TEXT,
  asset          TEXT        DEFAULT 'USDC',
  agreement_type TEXT        DEFAULT 'single'
                             CHECK (agreement_type IN ('single', 'multi')),
  milestones     JSONB       DEFAULT '[]',
  metadata       JSONB       DEFAULT '{}',
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_owner_wallet ON agreement_templates(owner_wallet);
CREATE INDEX IF NOT EXISTS idx_templates_created_at   ON agreement_templates(created_at);

ALTER TABLE agreement_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates_read_all" ON agreement_templates FOR SELECT USING (true);
CREATE POLICY "templates_insert"   ON agreement_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "templates_update"   ON agreement_templates FOR UPDATE USING (true);
CREATE POLICY "templates_delete"   ON agreement_templates FOR DELETE USING (true);

DROP TRIGGER IF EXISTS update_agreement_templates_updated_at ON agreement_templates;
CREATE TRIGGER update_agreement_templates_updated_at
  BEFORE UPDATE ON agreement_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
