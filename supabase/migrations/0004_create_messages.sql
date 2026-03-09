-- =============================================================
-- Migration 0004: messages
-- Threaded conversation on a ticket between owner and client.
-- In V1, only owners post messages (no client portal).
-- =============================================================

CREATE TABLE public.messages (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id        uuid        NOT NULL REFERENCES public.tickets(id)    ON DELETE CASCADE,
  workspace_id     uuid        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  body             text        NOT NULL,
  author_type      text        NOT NULL CHECK (author_type IN ('owner')),
  author_name      text        NOT NULL,
  -- author_id is null-safe: set for owner posts, NULL not used in V1
  author_id        uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  is_internal_note boolean     NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Fast fetch of all messages for a ticket (the common read path)
CREATE INDEX messages_ticket_id_idx    ON public.messages (ticket_id);
-- Supports workspace-scoped RLS checks without joining to tickets
CREATE INDEX messages_workspace_id_idx ON public.messages (workspace_id);

COMMENT ON TABLE  public.messages                  IS 'Owner replies and internal notes on a ticket.';
COMMENT ON COLUMN public.messages.workspace_id     IS 'Denormalised from ticket for simpler RLS policies.';
COMMENT ON COLUMN public.messages.is_internal_note IS 'When true, message is visible to owner only (hidden from client notifications).';
COMMENT ON COLUMN public.messages.author_type      IS 'V1: owner only. V2 will add client replies via portal.';
