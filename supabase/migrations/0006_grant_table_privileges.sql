-- =============================================================
-- Migration 0006: Explicit table-level privileges
--
-- Raw SQL migrations do not automatically grant table privileges
-- the way the Supabase dashboard does. RLS policies only control
-- which ROWS a role can access; PostgreSQL GRANT controls whether
-- the role can touch the table at all. A missing GRANT causes a
-- 401 Unauthorized from PostgREST before RLS is even evaluated.
-- =============================================================

-- ---------------------------------------------------------
-- anon (unauthenticated visitors — public ticket form)
-- ---------------------------------------------------------

-- Must SELECT workspaces to resolve /support/:slug and to satisfy
-- the RLS WITH CHECK subquery on ticket INSERT.
GRANT SELECT ON public.workspaces TO anon;

-- Public form submits tickets.
GRANT INSERT ON public.tickets TO anon;

-- ---------------------------------------------------------
-- authenticated (logged-in business owners)
-- ---------------------------------------------------------

-- Owners read their workspace and update settings.
GRANT SELECT, INSERT, UPDATE ON public.workspaces TO authenticated;

-- Owners read and update their own profile.
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Owners read tickets and update status.
GRANT SELECT, UPDATE ON public.tickets TO authenticated;

-- Owners post replies and internal notes.
GRANT SELECT, INSERT ON public.messages TO authenticated;
