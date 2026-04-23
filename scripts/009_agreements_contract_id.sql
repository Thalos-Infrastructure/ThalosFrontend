-- Columna que usa ThalosBackend / lib/actions (Trustless contract id; null hasta deploy/link).
-- Si tu tabla viene de 002_create_agreements.sql tenés escrow_contract_id pero no contract_id.

ALTER TABLE agreements
  ADD COLUMN IF NOT EXISTS contract_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_agreements_contract_id_unique
  ON agreements (contract_id)
  WHERE contract_id IS NOT NULL;
