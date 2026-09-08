-- Migration: 0008_cron_and_perf.sql
-- Description: Adds indexes to improve email cron retry performance and admin order queries.

-- Index 1: Optimize the cron query that looks for pending/failed emails.
CREATE INDEX IF NOT EXISTS idx_email_log_status_created 
ON email_log(status, created_at);

-- Index 2: Optimize idempotency checks for sendOrderEmail
CREATE UNIQUE INDEX IF NOT EXISTS uidx_email_log_order_trigger_sent 
ON email_log(order_id, trigger) 
WHERE status = 'sent';

-- Index 3: Optimize admin dashboard fetching orders by status
CREATE INDEX IF NOT EXISTS idx_orders_status 
ON orders(status);
