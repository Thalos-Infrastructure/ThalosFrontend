-- Alinear tabla agreements con ThalosBackend / Server Actions (además de 002_create_agreements.sql).

ALTER TABLE agreements ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE agreements ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- agreement_type: el API usa single | multi | bounty (y a veces standard).
ALTER TABLE agreements DROP CONSTRAINT IF EXISTS agreements_agreement_type_check;
ALTER TABLE agreements ADD CONSTRAINT agreements_agreement_type_check CHECK (
  agreement_type IN ('standard', 'bounty', 'single', 'multi')
);

-- status: el API puede enviar funded.
ALTER TABLE agreements DROP CONSTRAINT IF EXISTS agreements_status_check;
ALTER TABLE agreements ADD CONSTRAINT agreements_status_check CHECK (
  status IN (
    'pending',
    'funded',
    'active',
    'completed',
    'disputed',
    'resolved',
    'cancelled'
  )
);

-- Esquema 002: NOT NULL en columnas que el Nest no envía al crear.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'agreements'
      AND column_name = 'escrow_contract_id'
  ) THEN
    ALTER TABLE agreements ALTER COLUMN escrow_contract_id DROP NOT NULL;
  END IF;
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'agreements'
      AND column_name = 'payer_wallet'
  ) THEN
    ALTER TABLE agreements ALTER COLUMN payer_wallet DROP NOT NULL;
  END IF;
END $$;
