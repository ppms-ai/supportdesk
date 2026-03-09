import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,      setUser]      = useState(null)
  const [workspace, setWorkspace] = useState(null)
  const [loading,   setLoading]   = useState(true)

  // Fetch the workspace that belongs to this user.
  async function fetchWorkspace(userId) {
    const { data } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle()
    setWorkspace(data ?? null)
  }

  // Bootstrap: onAuthStateChange fires immediately with INITIAL_SESSION,
  // making it the single reliable source of truth for auth state.
  // We do not call getSession() separately to avoid a race condition where
  // both paths call fetchWorkspace concurrently and loading never resolves.
  useEffect(() => {
    // Safety net: if onAuthStateChange never fires (e.g. storage lock stall),
    // force loading to false after 3 seconds so the app doesn't hang forever.
    const fallbackTimer = setTimeout(() => {
      console.log('[AuthContext] 3s fallback triggered — onAuthStateChange did not fire. Forcing loading to false.')
      setLoading(false)
    }, 3000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        clearTimeout(fallbackTimer)
        const currentUser = session?.user ?? null
        setUser(currentUser)
        if (currentUser) {
          await fetchWorkspace(currentUser.id)
        } else {
          setWorkspace(null)
        }
        console.log('[AuthContext] Auth state resolved via onAuthStateChange. Setting loading to false.')
        setLoading(false)
      }
    )

    return () => {
      clearTimeout(fallbackTimer)
      subscription.unsubscribe()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    // State is cleared by the onAuthStateChange listener above.
  }

  // After the owner creates their workspace during onboarding, call this
  // to update context without requiring a full page reload.
  function refreshWorkspace() {
    if (user) return fetchWorkspace(user.id)
    return Promise.resolve()
  }

  return (
    <AuthContext.Provider value={{ user, workspace, loading, signOut, refreshWorkspace }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
