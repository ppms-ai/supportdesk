-- =============================================================
-- Migration 0005: Row Level Security policies
--
-- Roles in use:
--   anon          — unauthenticated visitors (public ticket form)
--   authenticated — logged-in business owners
--
-- Default behaviour: RLS enabled = deny all unless a policy
-- explicitly permits. SECURITY DEFINER functions bypass RLS
-- (used for ticket numbering triggers).
-- =============================================================

-- ---------------------------------------------------------
-- Enable RLS on all application tables
-- ---------------------------------------------------------
ALTER TABLE public.workspaces               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_ticket_counters ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------
-- workspaces
--
-- anon        — SELECT only (needed to resolve :slug on the
--               public form before inserting a ticket)
-- authenticated — SELECT / INSERT / UPDATE own workspace
-- ---------------------------------------------------------
CREATE POLICY "anon can look up workspace by slug"
  ON public.workspaces
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "owners can view their workspace"
  ON public.workspaces
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "owners can create their workspace"
  ON public.workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "owners can update their workspace"
  ON public.workspaces
  FOR UPDATE
  TO authenticated
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ---------------------------------------------------------
-- profiles
--
-- authenticated — SELECT / UPDATE own row only
-- (INSERT is handled by the handle_new_user trigger which
--  runs as SECURITY DEFINER, so no INSERT policy needed here)
-- ---------------------------------------------------------
CREATE POLICY "users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING     (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ---------------------------------------------------------
-- tickets
--
-- anon        — INSERT only (public form submission).
--               workspace_id must match a real workspace so
--               random UUIDs cannot be stuffed in.
-- authenticated — SELECT / UPDATE tickets in their workspace.
--               No DELETE in V1 (accidental deletion risk).
-- ---------------------------------------------------------
CREATE POLICY "anon can submit tickets"
  ON public.tickets
  FOR INSERT
  TO anon
  WITH CHECK (
    workspace_id IN (SELECT id FROM public.workspaces)
  );

CREATE POLICY "owners can view their tickets"
  ON public.tickets
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners can update their tickets"
  ON public.tickets
  FOR UPDATE
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces
      WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces
      WHERE owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------
-- messages
--
-- anon        — no access (clients do not post messages in V1)
-- authenticated — SELECT / INSERT messages in their workspace.
--               INSERT check prevents cross-workspace writes.
-- ---------------------------------------------------------
CREATE POLICY "owners can view messages in their workspace"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces
      WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owners can post messages in their workspace"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces
      WHERE owner_id = auth.uid()
    )
    AND author_id = auth.uid()
  );

-- ---------------------------------------------------------
-- workspace_ticket_counters
--
-- No policies added — default deny for all client roles.
-- Accessed exclusively via SECURITY DEFINER functions
-- (next_ticket_number, assign_ticket_number), which run
-- with elevated privileges and bypass RLS entirely.
-- ---------------------------------------------------------
