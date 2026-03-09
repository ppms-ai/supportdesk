import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'
import { AuthShell } from './Login'

const schema = z.object({
  fullName: z
    .string()
    .min(2, 'Enter your full name'),
  email: z
    .string()
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export default function Register() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [serverError,   setServerError]   = useState('')
  const [emailSent,     setEmailSent]     = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />
  }

  async function onSubmit({ fullName, email, password }) {
    setServerError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // After email confirmation, redirect back to the app.
        emailRedirectTo: `${window.location.origin}/onboarding`,
      },
    })

    if (error) {
      setServerError(error.message)
      return
    }

    // Supabase sends a confirmation email. Show a "check your inbox" state.
    setEmailSent(true)
  }

  if (emailSent) {
    return (
      <AuthShell title="Check your inbox">
        <Alert variant="success">
          We sent a confirmation link to your email. Click it to activate your account,
          then you&apos;ll be taken to set up your workspace.
        </Alert>
        <p className="mt-4 text-center text-sm text-gray-500">
          Wrong address?{' '}
          <button
            className="font-medium text-brand-600 hover:text-brand-700"
            onClick={() => setEmailSent(false)}
          >
            Go back
          </button>
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Create your account"
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {serverError && <Alert variant="error">{serverError}</Alert>}

        <Input
          id="fullName"
          label="Full name"
          type="text"
          autoComplete="name"
          placeholder="Jane Smith"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

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
          autoComplete="new-password"
          placeholder="Min. 8 characters"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          id="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" loading={isSubmitting} className="w-full mt-2">
          Create account
        </Button>
      </form>
    </AuthShell>
  )
}
