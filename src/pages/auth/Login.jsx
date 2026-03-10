import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login() {
  const { user, workspace, loading } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  if (!loading && user) {
    const from = location.state?.from?.pathname
    return <Navigate to={from || (workspace ? '/dashboard' : '/onboarding')} replace />
  }

  async function onSubmit({ email, password }) {
    setServerError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setServerError(error.message)
      return
    }
    navigate(location.state?.from?.pathname || '/dashboard', { replace: true })
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your SupportDesk account"
      footer={
        <>
          Need an account?{' '}
          <a href="mailto:calie@pivotandprospermarketing.com" className="font-medium text-brand-600 hover:text-brand-700">
            Contact us
          </a>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {serverError && <Alert variant="error">{serverError}</Alert>}

        <Input
          id="email"
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          id="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" loading={isSubmitting} className="w-full mt-1">
          Sign in
        </Button>
      </form>
    </AuthShell>
  )
}

// ─── Shared auth shell ────────────────────────────────────────────────────────
export function AuthShell({ title, subtitle, footer, children }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-sm space-y-6">

        {/* Wordmark */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#2C2C2C] tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-[#6B6B6B]">{subtitle}</p>}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-parchment bg-white p-8 shadow-sm">
          {children}
        </div>

        {footer && (
          <p className="text-center text-sm text-[#6B6B6B]">{footer}</p>
        )}
      </div>
    </div>
  )
}
