-- =============================================================
-- Migration 0003: tickets
-- Core support ticket entity. One row per client request.
-- =============================================================

-- ---------------------------------------------------------
-- Counter table: atomic per-workspace ticket numbering.
-- Avoids race conditions that a MAX()+1 query would cause.
-- ---------------------------------------------------------
CREATE TABLE public.workspace_ticket_counters (
  workspace_id       uuid    PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  last_ticket_number integer NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.workspace_ticket_counters IS 'Atomic ticket number counter per workspace. Do not query directly.';

-- ---------------------------------------------------------
-- Function: atomically claims the next ticket number for
-- a given workspace. Uses INSERT ... ON CONFLICT to ensure
-- concurrent submissions never get the same number.
-- SECURITY DEFINER so the anon role (public form) can trigger
-- it safely without direct table access.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.next_ticket_number(p_workspace_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
BEGIN
  INSERT INTO public.workspace_ticket_counters (workspace_id, last_ticket_number)
  VALUES (p_workspace_id, 1)
  ON CONFLICT (workspace_id) DO UPDATE
    SET last_ticket_number = public.workspace_ticket_counters.last_ticket_number + 1
  RETURNING last_ticket_number INTO next_num;

  RETURN next_num;
END;
$$;

-- ---------------------------------------------------------
-- Tickets table
-- ---------------------------------------------------------
CREATE TABLE public.tickets (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ticket_number integer     NOT NULL,
  subject       text        NOT NULL,
  description   text        NOT NULL,
  status        text        NOT NULL DEFAULT 'open'
                            CHECK (status IN ('open', 'in_progress', 'resolved')),
  client_name   text        NOT NULL,
  client_email  text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),

  -- Friendly reference like #42 is unique per workspace
  UNIQUE (workspace_id, ticket_number)
);

CREATE INDEX tickets_workspace_id_idx        ON public.tickets (workspace_id);
CREATE INDEX tickets_workspace_status_idx    ON public.tickets (workspace_id, status);
CREATE INDEX tickets_workspace_created_idx   ON public.tickets (workspace_id, created_at DESC);

COMMENT ON COLUMN public.tickets.ticket_number IS 'Human-friendly sequential number, unique per workspace (e.g. #1, #2).';
COMMENT ON COLUMN public.tickets.description   IS 'Initial message submitted by the client via the public form.';

-- ---------------------------------------------------------
-- Trigger: auto-assign ticket_number before insert.
-- Calls next_ticket_number() which is SECURITY DEFINER,
-- so this trigger function must also be SECURITY DEFINER
-- to work correctly when fired from an anon INSERT.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.ticket_number := public.next_ticket_number(NEW.workspace_id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_ticket_insert
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_ticket_number();

-- ---------------------------------------------------------
-- Trigger: keep updated_at current on every UPDATE.
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tickets_set_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
