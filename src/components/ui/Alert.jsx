/**
 * Inline alert banner.
 * variant: 'error' | 'success' | 'info'
 */
export default function Alert({ variant = 'error', children }) {
  const styles = {
    error:   'bg-red-50 border-red-200 text-red-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    info:    'bg-brand-50 border-brand-200 text-brand-700',
  }

  return (
    <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles[variant]}`}>
      {children}
    </div>
  )
}
