import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Environment variables ─────────────────────────────────────────────────────
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.
// The others must be added in: Supabase Dashboard → Project Settings → Edge Functions.
const RESEND_API_KEY           = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL             = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const APP_URL                  = Deno.env.get('APP_URL') ?? 'http://localhost:5173'
const FROM_EMAIL               = Deno.env.get('FROM_EMAIL')!
const WEBHOOK_SECRET           = Deno.env.get('WEBHOOK_SECRET')!

// Service-role client — can read auth.users and bypass RLS.
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

// ── Entry point ───────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  // Verify the request is from our database webhook, not a random caller.
  const authHeader = req.headers.get('Authorization') ?? ''
  if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }

  const { type, table, record, old_record } = payload

  try {
    if (table === 'tickets' && type === 'INSERT') {
      // New ticket submitted via the public form.
      await onTicketCreated(record)

    } else if (table === 'messages' && type === 'INSERT') {
      // Owner posted a reply (skip internal notes).
      if (record.author_type === 'owner' && !record.is_internal_note) {
        await onOwnerReplied(record)
      }

    } else if (table === 'tickets' && type === 'UPDATE') {
      // Status changed to resolved.
      if (old_record?.status !== 'resolved' && record.status === 'resolved') {
        await onTicketResolved(record)
      }
    }

    return json({ ok: true })
  } catch (err) {
    console.error('[send-notification]', err)
    return json({ error: (err as Error).message }, 500)
  }
})

// ── Event handlers ────────────────────────────────────────────────────────────

async function onTicketCreated(ticket: Ticket) {
  const workspace = await getWorkspace(ticket.workspace_id)
  const ownerEmail = await getOwnerEmail(workspace.owner_id)

  await sendEmail(
    ownerEmail,
    `New ticket #${ticket.ticket_number} — ${ticket.subject}`,
    newTicketHtml(ticket, workspace.name),
  )
  console.log(`[send-notification] New ticket email sent to owner ${ownerEmail}`)
}

async function onOwnerReplied(message: Message) {
  const ticket = await getTicket(message.ticket_id)
  const workspace = await getWorkspace(ticket.workspace_id)

  await sendEmail(
    ticket.client_email,
    `Reply to your request — ${workspace.name}`,
    ownerReplyHtml(ticket, message, workspace.name),
  )
  console.log(`[send-notification] Reply email sent to client ${ticket.client_email}`)
}

async function onTicketResolved(ticket: Ticket) {
  const workspace = await getWorkspace(ticket.workspace_id)

  await sendEmail(
    ticket.client_email,
    `Your request has been resolved — ${workspace.name}`,
    ticketResolvedHtml(ticket, workspace.name),
  )
  console.log(`[send-notification] Resolved email sent to client ${ticket.client_email}`)
}

// ── Data helpers ──────────────────────────────────────────────────────────────

async function getWorkspace(workspaceId: string): Promise<Workspace> {
  const { data, error } = await supabase
    .from('workspaces')
    .select('name, owner_id')
    .eq('id', workspaceId)
    .single()
  if (error || !data) throw new Error(`Workspace not found: ${workspaceId}`)
  return data
}

async function getTicket(ticketId: string): Promise<Ticket> {
  const { data, error } = await supabase
    .from('tickets')
    .select('id, ticket_number, subject, description, client_name, client_email, workspace_id, status')
    .eq('id', ticketId)
    .single()
  if (error || !data) throw new Error(`Ticket not found: ${ticketId}`)
  return data
}

async function getOwnerEmail(userId: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data.user?.email) throw new Error(`Owner email not found for user: ${userId}`)
  return data.user.email
}

// ── Resend ────────────────────────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Resend error ${res.status}: ${body}`)
  }
}

// ── Email templates ───────────────────────────────────────────────────────────

function esc(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function baseLayout(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#FAF8F5;font-family:'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FAF8F5;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

        <!-- Logo -->
        <tr>
          <td style="padding-bottom:24px;text-align:center;">
            <span style="font-size:22px;font-weight:700;color:#C9A87C;letter-spacing:-0.5px;">SupportDesk</span>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background:#ffffff;border-radius:16px;border:1px solid #E8E2D9;padding:36px 40px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding-top:24px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#6B6B6B;">Powered by SupportDesk</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function newTicketHtml(ticket: Ticket, workspaceName: string): string {
  const ticketUrl = `${APP_URL}/tickets/${ticket.id}`
  return baseLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#2C2C2C;letter-spacing:-0.5px;">New support ticket</h1>
    <p style="margin:0 0 28px;font-size:14px;color:#6B6B6B;line-height:1.6;">
      A new request has been submitted to <strong style="color:#2C2C2C;">${esc(workspaceName)}</strong>.
    </p>

    <!-- Ticket summary -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#FAF8F5;border:1px solid #E8E2D9;border-radius:12px;margin-bottom:28px;">
      <tr><td style="padding:20px 24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6B6B6B;">
          Ticket #${ticket.ticket_number}
        </p>
        <p style="margin:0 0 18px;font-size:17px;font-weight:600;color:#2C2C2C;">${esc(ticket.subject)}</p>
        <p style="margin:0 0 4px;font-size:13px;color:#6B6B6B;">
          <strong style="color:#2C2C2C;">From:</strong> ${esc(ticket.client_name)}
        </p>
        <p style="margin:0 0 18px;font-size:13px;color:#6B6B6B;">
          <strong style="color:#2C2C2C;">Email:</strong> ${esc(ticket.client_email)}
        </p>
        <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#2C2C2C;">Message</p>
        <p style="margin:0;font-size:14px;color:#2C2C2C;line-height:1.7;">${esc(ticket.description).replace(/\n/g, '<br/>')}</p>
      </td></tr>
    </table>

    <!-- CTA -->
    <table cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="border-radius:8px;background-color:#C9A87C;">
          <a href="${ticketUrl}"
            style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
            View &amp; reply →
          </a>
        </td>
      </tr>
    </table>
  `)
}

function ownerReplyHtml(ticket: Ticket, message: Message, workspaceName: string): string {
  return baseLayout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#2C2C2C;letter-spacing:-0.5px;">You have a reply</h1>
    <p style="margin:0 0 28px;font-size:14px;color:#6B6B6B;line-height:1.6;">
      <strong style="color:#2C2C2C;">${esc(workspaceName)}</strong> has replied to your support request.
    </p>

    <!-- Original ticket reference -->
    <p style="margin:0 0 8px;font-size:12px;color:#6B6B6B;">
      Re: ${esc(ticket.subject)} &mdash; #${ticket.ticket_number}
    </p>

    <!-- Reply body with gold left border -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
      <tr>
        <td width="3" style="background-color:#C9A87C;border-radius:3px;">&nbsp;</td>
        <td style="padding:0 0 0 16px;">
          <p style="margin:0;font-size:14px;color:#2C2C2C;line-height:1.7;">
            ${esc(message.body).replace(/\n/g, '<br/>')}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#6B6B6B;line-height:1.6;">
      If you have further questions, please contact
      <strong style="color:#2C2C2C;">${esc(workspaceName)}</strong> directly.
    </p>
  `)
}

function ticketResolvedHtml(ticket: Ticket, workspaceName: string): string {
  return baseLayout(`
    <!-- Icon -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:20px;">
      <tr><td align="center">
        <div style="display:inline-block;width:52px;height:52px;border-radius:50%;background-color:#E8F7F0;text-align:center;line-height:52px;font-size:22px;">✓</div>
      </td></tr>
    </table>

    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#2C2C2C;letter-spacing:-0.5px;text-align:center;">
      Request resolved
    </h1>
    <p style="margin:0 0 28px;font-size:14px;color:#6B6B6B;line-height:1.6;text-align:center;">
      <strong style="color:#2C2C2C;">${esc(workspaceName)}</strong> has marked your support request as resolved.
    </p>

    <!-- Ticket reference -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#FAF8F5;border:1px solid #E8E2D9;border-radius:12px;margin-bottom:28px;">
      <tr><td style="padding:16px 24px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:#6B6B6B;">
          Ticket #${ticket.ticket_number}
        </p>
        <p style="margin:0;font-size:16px;font-weight:600;color:#2C2C2C;">${esc(ticket.subject)}</p>
      </td></tr>
    </table>

    <p style="margin:0;font-size:13px;color:#6B6B6B;line-height:1.6;text-align:center;">
      Still need help? Don&rsquo;t hesitate to reach out again.
    </p>
  `)
}

// ── Utility ───────────────────────────────────────────────────────────────────

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  record: any
  old_record: any
}

interface Ticket {
  id: string
  ticket_number: number
  subject: string
  description: string
  client_name: string
  client_email: string
  workspace_id: string
  status: string
}

interface Message {
  id: string
  ticket_id: string
  workspace_id: string
  body: string
  author_type: string
  author_name: string
  is_internal_note: boolean
}

interface Workspace {
  name: string
  owner_id: string
}
