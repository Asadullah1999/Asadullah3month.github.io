import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 transition-all duration-200',
              'focus:outline-none',
              error
                ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.15)]'
                : 'focus:border-brand-500/50 focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]',
              leftIcon && 'pl-10',
              className
            )}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
            }}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">⚠ {error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-gray-600">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export default Input


interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full px-4 py-3 rounded-xl text-sm text-white appearance-none cursor-pointer transition-all duration-200',
            'focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]',
            error ? 'border-red-500/50' : '',
            className
          )}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.1)'}`,
          }}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} style={{ background: '#0f0f20', color: '#e8eaf0' }}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-xs text-red-400">⚠ {error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
