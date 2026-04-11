-- Notification logs table for tracking email/telegram/push notifications
-- Created: 2024

-- Create notification_logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES agreements(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  recipient_email TEXT,
  recipient_wallet TEXT,
  channel TEXT NOT NULL DEFAULT 'email', -- 'email', 'telegram', 'push'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_notification_logs_agreement_id ON notification_logs(agreement_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient_wallet ON notification_logs(recipient_wallet);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created_at ON notification_logs(created_at DESC);

-- RLS policies
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own notification logs
CREATE POLICY "Users can view own notification logs"
  ON notification_logs FOR SELECT
  USING (
    recipient_wallet IN (
      SELECT wallet_address FROM profiles WHERE id = auth.uid()
    )
    OR
    recipient_wallet IN (
      SELECT wallet_public_key FROM auth_users WHERE id::text = auth.uid()::text
    )
  );

-- Service role can manage all notifications
CREATE POLICY "Service role manages notifications"
  ON notification_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Add notification preferences to profiles if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'notification_preferences'
  ) THEN
    ALTER TABLE profiles ADD COLUMN notification_preferences JSONB DEFAULT '{
      "email_enabled": true,
      "telegram_enabled": false,
      "events": {
        "agreement_created": true,
        "agreement_funded": true,
        "evidence_submitted": true,
        "milestone_approved": true,
        "dispute_opened": true,
        "dispute_resolved": true,
        "agreement_completed": true
      }
    }'::jsonb;
  END IF;
END $$;
