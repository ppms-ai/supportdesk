import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

/**
 * Fetches tickets for the current workspace.
 * @param {string} statusFilter - 'all' | 'open' | 'in_progress' | 'resolved'
 */
export function useTickets(statusFilter = 'all') {
  const { workspace } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const fetchTickets = useCallback(async () => {
    if (!workspace) return
    setLoading(true)

    let query = supabase
      .from('tickets')
      .select('id, ticket_number, subject, client_name, client_email, status, created_at, updated_at')
      .eq('workspace_id', workspace.id)
      .order('created_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query
    setTickets(data ?? [])
    setError(error)
    setLoading(false)
  }, [workspace, statusFilter])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  return { tickets, loading, error, refetch: fetchTickets }
}
