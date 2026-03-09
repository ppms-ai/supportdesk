-- =============================================================
-- Migration 0009: Database webhook triggers
--
-- Drops and recreates all three webhook triggers so they are
-- visible in the Supabase dashboard (triggers created via the
-- dashboard UI vs SQL can fall out of sync).
--
-- Triggers:
--   1. on_ticket_insert   — fires after a new ticket is created
--   2. on_message_insert  — fires after a new message/reply is added
--   3. on_ticket_update   — fires after a ticket row is updated
--                           (e.g. status change)
--
-- All call the Edge Function via supabase_functions.http_request(),
-- which is the mechanism Supabase Database Webhooks use internally.
-- =============================================================

-- -------------------------------------------------------------
-- 1. Drop existing triggers (in case they exist but are broken
--    or invisible in the dashboard)
-- -------------------------------------------------------------
DROP TRIGGER IF EXISTS on_ticket_insert  ON public.tickets;
DROP TRIGGER IF EXISTS on_ticket_update  ON public.tickets;
DROP TRIGGER IF EXISTS on_message_insert ON public.messages;

-- -------------------------------------------------------------
-- 2. Recreate triggers
-- -------------------------------------------------------------

-- Trigger args:
--   $1  URL
--   $2  HTTP method
--   $3  Headers (JSON string)
--   $4  Query params (JSON string)
--   $5  Timeout in milliseconds

CREATE TRIGGER on_ticket_insert
  AFTER INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://yolmtbzpxfnapflvdath.supabase.co/functions/v1/send-notification',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer supportdesk2026secure"}',
    '{}',
    '5000'
  );

CREATE TRIGGER on_ticket_update
  AFTER UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://yolmtbzpxfnapflvdath.supabase.co/functions/v1/send-notification',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer supportdesk2026secure"}',
    '{}',
    '5000'
  );

CREATE TRIGGER on_message_insert
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.http_request(
    'https://yolmtbzpxfnapflvdath.supabase.co/functions/v1/send-notification',
    'POST',
    '{"Content-Type":"application/json","Authorization":"Bearer supportdesk2026secure"}',
    '{}',
    '5000'
  );
