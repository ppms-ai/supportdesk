import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { anonFrom, anonRpc } from '../../lib/supabase'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'

const schema = z.object({
  client_name:  z.string().min(2,  'Please enter your name'),
  client_email: z.string().email('Enter a valid email address'),
  subject:      z.string().min(3,  'Please enter a subject'),
  description:  z.string().min(10, 'Please describe your issue in a bit more detail'),
})

export default function SubmitTicket() {
  const { slug } = useParams()
  const [pageState,    setPageState]    = useState('loading')
  const [workspace,    setWorkspace]    = useState(null)
  const [ticketNum,    setTicketNum]    = useState(null)
  const [serverError,  setServerError]  = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  useEffect(() => {
    async function loadWorkspace() {
      const data = await anonFrom('workspaces', {
        select:  'id,name',
        filters: { slug },
      })

      if (!data) {
        setPageState('notFound')
      } else {
        setWorkspace(data)
        setPageState('form')
      }
    }
    loadWorkspace()
  }, [slug])

  async function onSubmit(values) {
    setServerError('')

   const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/tickets`, {
  method: 'POST',
  headers: {
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    Prefer: 'return=minimal',
  },
  body: JSON.stringify({
    workspace_id: workspace.id,
    subject:      values.subject,
    description:  values.description,
    client_name:  values.client_name,
    client_email: values.client_email,
    status:       'open',
  }),
})

if (!res.ok) {
  const errBody = await res.json().catch(() => ({}))
console.error('Submit error:', errBody)
  setServerError('Something went wrong. Please try again.')
  return
}

    setTicketNum(null)
    setPageState('success')
  }

  // ── Loading ──────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <PageShell>
        <div className="flex justify-center py-16">
          <svg className="h-8 w-8 animate-spin text-brand-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </PageShell>
    )
  }

  // ── Not found ────────────────────────────────────────────────────────────
  if (pageState === 'notFound') {
    return (
      <PageShell>
        <div className="rounded-2xl border border-parchment bg-white p-10 text-center shadow-sm">
          <p className="text-4xl mb-3">🔍</p>
          <h2 className="text-lg font-semibold text-[#2C2C2C] tracking-tight">Page not found</h2>
          <p className="mt-2 text-sm text-[#6B6B6B]">
            We couldn&apos;t find a support page for{' '}
            <span className="font-mono text-[#2C2C2C]">{slug}</span>.
            Please check your link and try again.
          </p>
        </div>
      </PageShell>
    )
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (pageState === 'success') {
    return (
      <PageShell businessName={workspace.name}>
        <div className="rounded-2xl border border-emerald-200 bg-white p-10 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 mb-4">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-[#2C2C2C] tracking-tight">Request received!</h2>
          <p className="mt-2 text-sm text-[#6B6B6B] leading-relaxed">
            Thanks for reaching out.{' '}
            <span className="font-medium text-[#2C2C2C]">{workspace.name}</span>{' '}
            has been notified and will get back to you shortly.
          </p>
          {ticketNum && (
            <p className="mt-5 inline-block rounded-full border border-parchment bg-cream
                          px-4 py-1.5 font-mono text-xs text-[#6B6B6B]">
              Reference #{ticketNum}
            </p>
          )}
          <button
            onClick={() => { setPageState('form'); setTicketNum(null) }}
            className="mt-6 block w-full text-center text-sm text-brand-600 hover:text-brand-700"
          >
            Submit another request
          </button>
        </div>
      </PageShell>
    )
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <PageShell businessName={workspace.name}>
      <div className="rounded-2xl border border-parchment bg-white p-8 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
          {serverError && <Alert variant="error">{serverError}</Alert>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              id="client_name"
              label="Your name"
              type="text"
              autoComplete="name"
              placeholder="Jane Smith"
              error={errors.client_name?.message}
              {...register('client_name')}
            />
            <Input
              id="client_email"
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="jane@example.com"
              error={errors.client_email?.message}
              {...register('client_email')}
            />
          </div>

          <Input
            id="subject"
            label="Subject"
            type="text"
            placeholder="e.g. Issue with my appointment booking"
            error={errors.subject?.message}
            {...register('subject')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-[#2C2C2C]">
              How can we help?
            </label>
            <textarea
              id="description"
              rows={5}
              placeholder="Please describe your issue or question…"
              className={`
                block w-full rounded-xl border px-4 py-3 text-sm text-[#2C2C2C] bg-cream
                placeholder:text-[#6B6B6B] leading-relaxed
                focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
                ${errors.description ? 'border-red-300' : 'border-parchment'}
              `}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            )}
          </div>

          <Button type="submit" loading={isSubmitting} className="w-full mt-1">
            Send request
          </Button>
        </form>
      </div>
    </PageShell>
  )
}

// ─── Page chrome ──────────────────────────────────────────────────────────────
function PageShell({ businessName, children }) {
  return (
    <div className="min-h-screen bg-cream px-4 py-12">
      <div className="mx-auto w-full max-w-lg space-y-6">
        <div className="text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
            </svg>
          </div>
          {businessName ? (
            <>
              <h1 className="text-xl font-semibold text-[#2C2C2C] tracking-tight">{businessName}</h1>
              <p className="mt-1 text-sm text-[#6B6B6B]">
                Fill in the form below and we&apos;ll get back to you as soon as possible.
              </p>
            </>
          ) : (
            <h1 className="text-xl font-semibold text-[#2C2C2C] tracking-tight">SupportDesk</h1>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
