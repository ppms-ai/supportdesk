import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="h-4.5 w-4.5 h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/tickets',
    label: 'Tickets',
    icon: (
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
]

export default function AppShell() {
  const { workspace, user, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {/* ── Sidebar ──────────────────────────────────────────── */}
      <aside className="flex w-60 flex-shrink-0 flex-col bg-white border-r border-parchment">

        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-parchment">
          <span className="text-lg font-bold text-brand-600 tracking-tight">SupportDesk</span>
        </div>

        {/* Workspace */}
        {workspace && (
          <div className="px-6 pt-5 pb-3">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6B6B] mb-1">
              Workspace
            </p>
            <p className="truncate text-sm font-semibold text-[#2C2C2C]">{workspace.name}</p>
          </div>
        )}

        {/* Divider */}
        <div className="mx-6 border-t border-parchment" />

        {/* Nav */}
        <nav className="flex-1 px-3 pt-3 space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-100 ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-[#6B6B6B] hover:bg-cream hover:text-[#2C2C2C]'
                }`
              }
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="border-t border-parchment px-5 py-4">
          <p className="truncate text-xs text-[#6B6B6B]">{user?.email}</p>
          <button
            onClick={handleSignOut}
            className="mt-2 flex items-center gap-1.5 text-xs text-[#6B6B6B] hover:text-[#2C2C2C] transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
