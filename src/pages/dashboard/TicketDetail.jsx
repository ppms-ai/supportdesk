import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTicket } from '../../hooks/useTicket'
import { supabase } from '../../lib/supabase'
import StatusBadge from '../../components/ui/StatusBadge'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import { formatDate, timeAgo, STATUS_CONFIG } from '../../lib/utils'

export default function TicketDetail() {
  const { id } = useParams()
  const { user, workspace } = useAuth()
  const { ticket, messages, loading, error, refetch } = useTicket(id)

  const [replyBody,      setReplyBody]      = useState('')
  const [isInternal,     setIsInternal]     = useState(false)
  const [replying,       setReplying]       = useState(false)
  const [replyError,     setReplyError]     = useState('')
  const [statusUpdating, setStatusUpdating] = useState(false)

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-brand-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="px-8 py-8">
        <Alert variant="error">Ticket not found or you don&apos;t have access to it.</Alert>
        <Link to="/tickets" className="mt-4 inline-block text-sm text-brand-600 hover:text-brand-700">
          ← Back to tickets
        </Link>
      </div>
    )
  }

  async function handleStatusChange(newStatus) {
    if (newStatus === ticket.status) return
    setStatusUpdating(true)
    await supabase.from('tickets').update({ status: newStatus }).eq('id', ticket.id)
    await refetch()
    setStatusUpdating(false)
  }

  async function handleReply(e) {
    e.preventDefault()
    if (!replyBody.trim()) return
    setReplyError('')
    setReplying(true)

    const authorName = user?.user_metadata?.full_name ?? workspace?.name ?? 'Support'

    const { error: msgErr } = await supabase.from('messages').insert({
      ticket_id:        ticket.id,
      workspace_id:     ticket.workspace_id,
      body:             replyBody.trim(),
      author_type:      'owner',
      author_name:      authorName,
      author_id:        user.id,
      is_internal_note: isInternal,
    })

    if (msgErr) {
      setReplyError('Failed to send reply. Please try again.')
      setReplying(false)
      return
    }

    if (ticket.status === 'open' && !isInternal) {
      await supabase.from('tickets').update({ status: 'in_progress' }).eq('id', ticket.id)
    }

    setReplyBody('')
    setIsInternal(false)
    await refetch()
    setReplying(false)
  }

  return (
    <div className="px-8 py-8 max-w-3xl">

      {/* Back */}
      <Link
        to="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:text-[#2C2C2C] mb-6 transition-colors"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to tickets
      </Link>

      {/* Ticket info card */}
      <div className="rounded-2xl border border-parchment bg-white shadow-sm mb-6">

        {/* Header row */}
        <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-parchment">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-xs text-[#6B6B6B]">#{ticket.ticket_number}</span>
              <StatusBadge status={ticket.status} />
            </div>
            <h1 className="text-lg font-semibold text-[#2C2C2C] leading-snug tracking-tight">
              {ticket.subject}
            </h1>
          </div>

          {/* Status selector */}
          <div className="flex-shrink-0">
            <select
              value={ticket.status}
              onChange={e => handleStatusChange(e.target.value)}
              disabled={statusUpdating}
              className="rounded-lg border border-parchment bg-white px-3 py-1.5 text-sm text-[#2C2C2C]
                         focus:outline-none focus:ring-2 focus:ring-brand-500
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Client metadata */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-6 py-4 text-sm">
          <div>
            <span className="text-[#6B6B6B]">From </span>
            <span className="font-medium text-[#2C2C2C]">{ticket.client_name}</span>
          </div>
          <div>
            <span className="text-[#6B6B6B]">Email </span>
            <a href={`mailto:${ticket.client_email}`}
               className="font-medium text-brand-600 hover:text-brand-700 hover:underline">
              {ticket.client_email}
            </a>
          </div>
          <div>
            <span className="text-[#6B6B6B]">Submitted </span>
            <span className="text-[#2C2C2C]">{formatDate(ticket.created_at)}</span>
          </div>
          <div>
            <span className="text-[#6B6B6B]">Updated </span>
            <span className="text-[#2C2C2C]">{timeAgo(ticket.updated_at)}</span>
          </div>
        </div>
      </div>

      {/* Message thread */}
      <div className="space-y-3 mb-6">
        {/* Original description — shown as the client's first "message" */}
        <MessageBubble
          authorName={ticket.client_name}
          timestamp={ticket.created_at}
          body={ticket.description}
          isClient
        />

        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            authorName={msg.author_name}
            timestamp={msg.created_at}
            body={msg.body}
            isInternal={msg.is_internal_note}
          />
        ))}
      </div>

      {/* Reply box */}
      <div className="rounded-2xl border border-parchment bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-parchment">
          <h2 className="text-sm font-semibold text-[#2C2C2C]">
            Reply as {user?.user_metadata?.full_name ?? workspace?.name}
          </h2>
        </div>

        <form onSubmit={handleReply} className="px-6 py-5 space-y-4">
          {replyError && <Alert variant="error">{replyError}</Alert>}

          <textarea
            rows={4}
            value={replyBody}
            onChange={e => setReplyBody(e.target.value)}
            placeholder="Write your reply…"
            className="w-full rounded-xl border border-parchment bg-cream px-4 py-3
                       text-sm text-[#2C2C2C] placeholder:text-[#6B6B6B]
                       focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                       leading-relaxed transition-shadow"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={e => setIsInternal(e.target.checked)}
                className="h-4 w-4 rounded border-parchment text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm text-[#6B6B6B]">
                Internal note
                <span className="ml-1.5 text-xs text-[#6B6B6B] opacity-70">(not sent to client)</span>
              </span>
            </label>

            <Button
              type="submit"
              loading={replying}
              disabled={!replyBody.trim()}
              variant={isInternal ? 'secondary' : 'primary'}
            >
              {isInternal ? 'Save note' : 'Send reply'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ authorName, timestamp, body, isClient = false, isInternal = false }) {
  const styles = isInternal
    ? 'border-amber-200 bg-amber-50'
    : isClient
    ? 'border-parchment bg-white'
    : 'border-brand-100 bg-brand-50'

  return (
    <div className={`rounded-2xl border px-5 py-4 ${styles}`}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-sm font-semibold text-[#2C2C2C]">{authorName}</span>
        {isClient && (
          <span className="rounded-full bg-[#F0EDE8] px-2 py-0.5 text-[11px] font-medium text-[#6B6B6B]">
            Client
          </span>
        )}
        {isInternal && (
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800">
            Internal note
          </span>
        )}
        <span className="ml-auto text-xs text-[#6B6B6B]">{timeAgo(timestamp)}</span>
      </div>
      <p className="text-sm text-[#2C2C2C] whitespace-pre-wrap leading-relaxed">{body}</p>
    </div>
  )
}
