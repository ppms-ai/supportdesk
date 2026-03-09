import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTickets } from '../../hooks/useTickets'
import StatusBadge from '../../components/ui/StatusBadge'
import { timeAgo } from '../../lib/utils'

const STATS = [
  { label: 'Open',        status: 'open',       textColor: 'text-amber-600' },
  { label: 'In Progress', status: 'in_progress', textColor: 'text-sky-600'   },
  { label: 'Resolved',    status: 'resolved',    textColor: 'text-emerald-600' },
]

export default function DashboardHome() {
  const { user, workspace } = useAuth()
  const { tickets, loading } = useTickets()

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'there'

  const counts = {
    open:        tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved:    tickets.filter(t => t.status === 'resolved').length,
  }

  const recent = tickets.slice(0, 5)

  return (
    <div className="px-8 py-8 max-w-4xl">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#2C2C2C] tracking-tight">
          Hi, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-[#6B6B6B]">
          Here&apos;s what&apos;s happening at{' '}
          <span className="font-medium text-[#2C2C2C]">{workspace?.name}</span> today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        {STATS.map(({ label, status, textColor }) => (
          <Link
            key={status}
            to={`/tickets?status=${status}`}
            className="group rounded-2xl border border-parchment bg-white p-6 shadow-sm hover:shadow-md hover:border-brand-200 transition-all duration-200"
          >
            <p className="text-sm font-medium text-[#6B6B6B] mb-1">{label}</p>
            {loading ? (
              <div className="mt-1 h-9 w-14 animate-pulse rounded-lg bg-cream" />
            ) : (
              <p className={`text-4xl font-semibold tracking-tight ${textColor}`}>
                {counts[status]}
              </p>
            )}
          </Link>
        ))}
      </div>

      {/* Total banner */}
      <div className="mb-6 rounded-2xl border border-parchment bg-white px-6 py-4 shadow-sm flex items-center justify-between">
        <p className="text-sm text-[#6B6B6B]">Total tickets all time</p>
        {loading ? (
          <div className="h-6 w-10 animate-pulse rounded bg-cream" />
        ) : (
          <p className="text-xl font-semibold text-[#2C2C2C]">{tickets.length}</p>
        )}
      </div>

      {/* Recent tickets */}
      <div className="rounded-2xl border border-parchment bg-white shadow-sm overflow-hidden mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-parchment">
          <h2 className="text-sm font-semibold text-[#2C2C2C]">Recent tickets</h2>
          <Link to="/tickets" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="divide-y divide-[#F5F0E8]">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-4 w-8 animate-pulse rounded bg-cream" />
                <div className="h-4 flex-1 animate-pulse rounded bg-cream" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-cream" />
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-[#6B6B6B]">No tickets yet.</p>
            <p className="mt-1 text-xs text-[#6B6B6B]">Share your support link below to get started.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#F5F0E8]">
            {recent.map(ticket => (
              <li key={ticket.id}>
                <Link
                  to={`/tickets/${ticket.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-cream transition-colors"
                >
                  <span className="w-8 font-mono text-xs text-[#6B6B6B]">#{ticket.ticket_number}</span>
                  <span className="flex-1 truncate text-sm font-medium text-[#2C2C2C]">{ticket.subject}</span>
                  <span className="text-xs text-[#6B6B6B] whitespace-nowrap">{timeAgo(ticket.created_at)}</span>
                  <StatusBadge status={ticket.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Support link */}
      {workspace && (
        <div className="rounded-2xl border border-dashed border-parchment bg-white px-6 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#6B6B6B] mb-1">
            Your public support link
          </p>
          <p className="font-mono text-sm text-brand-600 break-all">
            {window.location.origin}/support/{workspace.slug}
          </p>
        </div>
      )}
    </div>
  )
}
