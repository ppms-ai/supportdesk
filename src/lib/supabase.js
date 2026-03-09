import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
}

// Single Supabase client — the only GoTrueClient instance in the app.
// A second createClient() call (even with different options) registers a
// second GoTrueClient to the same project URL, causing both instances to
// compete for the auth storage lock. This blocks INITIAL_SESSION from
// firing and leaves AuthContext.loading stuck at true indefinitely.
export const supabase = createClient(supabaseUrl, supabaseKey)

// ─── Anon REST helpers for the public ticket form ─────────────────────────────
// Plain fetch calls with the anon key baked in. No GoTrueClient involved,
// so there is no lock conflict and no "Multiple GoTrueClient instances" warning.

const ANON_HEADERS = {
  apikey:         supabaseKey,
  Authorization:  `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json',
}

/**
 * Fetch a single row from a table as the anon role.
 * Returns the first matching row or null.
 */
export async function anonFrom(table, { select = '*', filters = {} } = {}) {
  const params = new URLSearchParams({ select, limit: '1' })
  Object.entries(filters).forEach(([col, val]) => params.set(col, `eq.${val}`))

  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${params}`, {
    headers: ANON_HEADERS,
  })

  if (!res.ok) return null
  const rows = await res.json()
  return Array.isArray(rows) ? (rows[0] ?? null) : null
}

/**
 * Call a Postgres RPC function as the anon role.
 * Returns { data, error } matching the Supabase client convention.
 */
export async function anonRpc(fn, params = {}) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fn}`, {
    method:  'POST',
    headers: ANON_HEADERS,
    body:    JSON.stringify(params),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }))
console.error('anonRpc error:', JSON.stringify(error))
return { data: null, error }
  }

  const data = await res.json()
  return { data, error: null }
}
