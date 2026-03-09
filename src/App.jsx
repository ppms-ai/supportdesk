import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppShell from './components/layout/AppShell'

// Auth
import Login           from './pages/auth/Login'
import Register        from './pages/auth/Register'
// Onboarding
import CreateWorkspace from './pages/onboarding/CreateWorkspace'
// Dashboard
import DashboardHome   from './pages/dashboard/DashboardHome'
import TicketList      from './pages/dashboard/TicketList'
import TicketDetail    from './pages/dashboard/TicketDetail'
// Public
import SubmitTicket    from './pages/public/SubmitTicket'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public ──────────────────────────────────────── */}
          <Route path="/login"             element={<Login />} />
          <Route path="/register"          element={<Register />} />
          <Route path="/support/:slug"     element={<SubmitTicket />} />

          {/* ── Onboarding (auth, no workspace needed) ──────── */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute requireWorkspace={false}>
                <CreateWorkspace />
              </ProtectedRoute>
            }
          />

          {/* ── Dashboard (auth + workspace, shared AppShell) ── */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard"      element={<DashboardHome />} />
            <Route path="/tickets"        element={<TicketList />} />
            <Route path="/tickets/:id"    element={<TicketDetail />} />
          </Route>

          {/* ── Fallback ────────────────────────────────────── */}
          <Route path="/"  element={<Navigate to="/dashboard" replace />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
