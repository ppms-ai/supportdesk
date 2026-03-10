import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { generateSlug } from '../../lib/utils'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Alert from '../../components/ui/Alert'

const schema = z.object({
  name: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(80, 'Business name is too long'),
  slug: z
    .string()
    .min(2, 'URL handle must be at least 2 characters')
    .max(40, 'URL handle must be 40 characters or fewer')
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens allowed'),
})

export default function CreateWorkspace() {
  const { user, refreshWorkspace } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', slug: '' },
  })

  const nameValue = watch('name')
  useEffect(() => {
    setValue('slug', generateSlug(nameValue), { shouldValidate: false })
  }, [nameValue, setValue])

  async function onSubmit({ name, slug }) {
    setServerError('')

    const { data: existing } = await supabase
      .from('workspaces')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    if (existing) {
      setServerError('That URL handle is already taken. Please choose a different one.')
      return
    }

    const { error } = await supabase
      .from('workspaces')
      .insert({ name, slug, owner_id: user.id })

    if (error) {
      setServerError(error.message)
      return
    }

    await refreshWorkspace()
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-[#2C2C2C] tracking-tight">Set up your workspace</h1>
          <p className="mt-1 text-sm text-[#6B6B6B]">Takes 30 seconds. You can change everything later.</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-parchment bg-white p-8 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
            {serverError && <Alert variant="error">{serverError}</Alert>}

            <Input
              id="name"
              label="Business name"
              type="text"
              placeholder="e.g. Glamour Salon"
              autoFocus
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              id="slug"
              label="Your support link"
              type="text"
              placeholder="glamour-salon"
              hint={`Clients will submit tickets at: /support/${watch('slug') || 'your-handle'}`}
              error={errors.slug?.message}
              {...register('slug')}
            />

            <Button type="submit" loading={isSubmitting} className="w-full mt-1">
              Create my workspace
            </Button>
          </form>
        </div>

        <div className="flex flex-col items-center gap-2">
  <p className="text-center text-sm text-[#6B6B6B]">
    Wrong account?{' '}
    <button
      className="font-medium text-[#6B6B6B] hover:text-[#2C2C2C] underline underline-offset-2"
      onClick={async () => {
        await supabase.auth.signOut()
        navigate('/login')
      }}
    >
      Sign out
    </button>
  </p>
  <p className="text-center text-sm text-[#6B6B6B]">
    Already have an account?{' '}
    <button
      className="font-medium text-[#C9A87C] hover:text-[#b8966a] underline underline-offset-2"
      onClick={async () => {
        await supabase.auth.signOut()
        navigate('/login')
      }}
    >
      Log in
    </button>
  </p>
</div>
      </div>
    </div>
  )
}
