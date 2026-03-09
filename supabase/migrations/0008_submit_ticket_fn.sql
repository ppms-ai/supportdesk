-- =============================================================
-- Migration 0008: submit_ticket RPC function
--
-- Handles public ticket submission as a SECURITY DEFINER function
-- so it runs with elevated privileges, bypassing RLS on RETURNING.
-- This avoids granting SELECT on tickets to anon just to get the
-- ticket_number back from the INSERT ... RETURNING clause.
-- =============================================================

CREATE OR REPLACE FUNCTION public.submit_ticket(
  p_workspace_id uuid,
  p_subject       text,
  p_description   text,
  p_client_name   text,
  p_client_email  text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ticket_number integer;
BEGIN
  -- Validate that the workspace exists before inserting.
  IF NOT EXISTS (SELECT 1 FROM public.workspaces WHERE id = p_workspace_id) THEN
    RAISE EXCEPTION 'workspace_not_found';
  END IF;

  INSERT INTO public.tickets (
    workspace_id,
    subject,
    description,
    client_name,
    client_email,
    status
  )
  VALUES (
    p_workspace_id,
    p_subject,
    p_description,
    p_client_name,
    p_client_email,
    'open'
  )
  RETURNING ticket_number INTO v_ticket_number;

  RETURN v_ticket_number;
END;
$$;

-- Allow the anon role to call this function (public ticket form).
GRANT EXECUTE ON FUNCTION public.submit_ticket(uuid, text, text, text, text) TO anon;
