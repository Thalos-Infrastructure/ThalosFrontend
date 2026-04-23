-- Identidad en acuerdos: wallet sigue siendo la fuente principal (created_by + wallet_address).
-- Opcional: enlazar filas a profiles cuando exista coincidencia por wallet.

ALTER TABLE agreements
  ADD COLUMN IF NOT EXISTS created_by_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agreements_created_by_profile
  ON agreements(created_by_profile_id);

ALTER TABLE agreement_participants
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_agreement_participants_profile
  ON agreement_participants(profile_id);
