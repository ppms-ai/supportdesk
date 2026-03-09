-- =============================================================
-- Migration 0007: Grant anon SELECT on tickets
--
-- Required so that INSERT ... RETURNING ticket_number works for
-- the public ticket form. PostgreSQL requires SELECT privilege on
-- any column referenced in a RETURNING clause.
--
-- This is safe: anon has no SELECT RLS policy on tickets, so a
-- standalone GET /tickets as anon returns zero rows. RETURNING
-- on INSERT is not filtered by SELECT RLS policies — only INSERT
-- RLS policies apply — so the submitting client gets back only
-- the row they just created.
-- =============================================================

GRANT SELECT ON public.tickets TO anon;
