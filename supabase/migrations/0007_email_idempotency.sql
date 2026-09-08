-- ============================================================
-- CozyCraft migration 0007 — email idempotency
-- Prevents duplicate confirmation/cancellation emails for the
-- same (order_id, trigger) pair.
-- Run AFTER 0006_product_sync_fix.sql
-- ============================================================

-- Add a partial unique index: only one 'sent' email allowed per (order_id, trigger).
-- This means the first successful send creates the lock; retries are skipped.
-- 'pending' and 'failed' rows are NOT constrained so retries can be queued.
CREATE UNIQUE INDEX IF NOT EXISTS uidx_email_log_order_trigger_sent
  ON email_log (order_id, trigger)
  WHERE status = 'sent';

-- Add sent_at column to track when emails were actually delivered.
ALTER TABLE email_log ADD COLUMN IF NOT EXISTS sent_at timestamptz;
