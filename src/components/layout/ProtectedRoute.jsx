import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, requireWorkspace = true }) {
  const { user, workspace, loading } = useAuth()
  const location = useLocation()

  if (loading) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream gap-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
        </svg>
      </div>
      <p className="text-sm text-[#6B6B6B]">Loading SupportDesk...</p>
    </div>
  )
}

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireWorkspace && !workspace) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
