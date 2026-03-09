import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTickets } from '../../hooks/useTickets'
import StatusBadge from '../../components/ui/StatusBadge'
import { timeAgo } from '../../lib/utils'

const TABS = [
  { label: 'All',         value: 'all' },
  { label: 'Open',        value: 'open' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Resolved',    value: 'resolved' },
]

export default function TicketList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialStatus = TABS.find(t => t.value === searchParams.get('status'))?.value ?? 'all'
  const [activeTab, setActiveTab] = useState(initialStatus)
  const [search,    setSearch]    = useState('')

  const { tickets, loading } = useTickets(activeTab)

  function handleTabChange(value) {
    setActiveTab(value)
    setSearchParams(value === 'all' ? {} : { status: value })
  }

  const filtered = search.trim()
    ? tickets.filter(t =>
        t.subject.toLowerCase().includes(search.toLowerCase()) ||
        t.client_name.toLowerCase().includes(search.toLowerCase()) ||
        t.client_email.toLowerCase().includes(search.toLowerCase()) ||
        String(t.ticket_number).includes(search)
      )
    : tickets

  return (
    <div className="px-8 py-8">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#2C2C2C] tracking-tight">Tickets</h1>
        <span className="text-sm text-[#6B6B6B]">
          {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Search */}
      <div className="mb-5">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B6B6B]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search tickets, clients, emails…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border border-parchment bg-white py-2.5 pl-9 pr-3 text-sm text-[#2C2C2C] placeholder:text-[#6B6B6B] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Status tabs */}
      <div className="mb-4 flex gap-1 border-b border-parchment">
        {TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.value
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-[#6B6B6B] hover:text-[#2C2C2C]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-parchment bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-[#F5F0E8]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4">
                <div className="h-5 w-16 animate-pulse rounded-full bg-cream" />
                <div className="h-4 w-8 animate-pulse rounded bg-cream" />
                <div className="h-4 flex-1 animate-pulse rounded bg-cream" />
                <div className="h-4 w-28 animate-pulse rounded bg-cream" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-[#6B6B6B]">
              {search ? 'No tickets match your search.' : 'No tickets in this category yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="grid grid-cols-[7rem_3rem_1fr_14rem_7rem] gap-4 items-center
                            border-b border-parchment bg-cream px-6 py-2.5
                            text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B]">
              <span>Status</span>
              <span>#</span>
              <span>Subject</span>
              <span>Client</span>
              <span>Submitted</span>
            </div>

            {/* Rows */}
            <ul className="divide-y divide-[#F5F0E8]">
              {filtered.map(ticket => (
                <li key={ticket.id}>
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="grid grid-cols-[7rem_3rem_1fr_14rem_7rem] gap-4 items-center
                               px-6 py-4 hover:bg-cream transition-colors duration-100"
                  >
                    <span><StatusBadge status={ticket.status} /></span>
                    <span className="font-mono text-xs text-[#6B6B6B]">#{ticket.ticket_number}</span>
                    <span className="truncate text-sm font-medium text-[#2C2C2C]">{ticket.subject}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[#2C2C2C]">{ticket.client_name}</p>
                      <p className="truncate text-xs text-[#6B6B6B]">{ticket.client_email}</p>
                    </div>
                    <span className="text-xs text-[#6B6B6B] whitespace-nowrap">
                      {timeAgo(ticket.created_at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
