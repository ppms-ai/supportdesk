-- =============================================================
-- Migration 0001: workspaces
-- Each row represents one business tenant.
-- =============================================================

CREATE TABLE public.workspaces (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text        NOT NULL,
  slug             text        NOT NULL UNIQUE,
  owner_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_from_email text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- Fast lookup by slug (public ticket form: /support/:slug)
CREATE INDEX workspaces_slug_idx     ON public.workspaces (slug);
-- Fast lookup by owner (dashboard auth checks)
CREATE INDEX workspaces_owner_id_idx ON public.workspaces (owner_id);

COMMENT ON TABLE  public.workspaces              IS 'One row per business tenant.';
COMMENT ON COLUMN public.workspaces.slug         IS 'URL-safe unique identifier used in /support/:slug';
COMMENT ON COLUMN public.workspaces.reply_from_email IS 'Optional override for notification sender address.';
