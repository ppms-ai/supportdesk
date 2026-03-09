import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, id, error, hint, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-[#2C2C2C]">
          {label}
        </label>
      )}
      <input
        id={id}
        ref={ref}
        className={`
          block w-full rounded-lg border px-3 py-2.5 text-sm text-[#2C2C2C]
          placeholder:text-[#6B6B6B] bg-white
          focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent
          transition-shadow duration-150
          disabled:bg-cream disabled:text-[#6B6B6B]
          ${error ? 'border-red-300 focus:ring-red-400' : 'border-parchment'}
          ${className}
        `}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-[#6B6B6B]">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
})

export default Input
