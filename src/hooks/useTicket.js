import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Fetches a single ticket and its message thread.
 * @param {string} ticketId - UUID of the ticket
 */
export function useTicket(ticketId) {
  const [ticket,   setTicket]   = useState(null)
  const [messages, setMessages] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  const fetchTicket = useCallback(async () => {
    if (!ticketId) return
    setLoading(true)

    const [{ data: ticketData, error: ticketErr }, { data: msgData }] =
      await Promise.all([
        supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single(),
        supabase
          .from('messages')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: true }),
      ])

    setTicket(ticketData ?? null)
    setMessages(msgData ?? [])
    setError(ticketErr)
    setLoading(false)
  }, [ticketId])

  useEffect(() => { fetchTicket() }, [fetchTicket])

  return { ticket, messages, loading, error, refetch: fetchTicket }
}
