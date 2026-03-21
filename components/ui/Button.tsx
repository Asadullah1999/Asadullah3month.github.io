import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, fullWidth, children, disabled, style, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed'

    const sizes = {
      sm: 'text-xs px-3 py-2',
      md: 'text-sm px-4 py-2.5',
      lg: 'text-base px-6 py-3',
    }

    const variantStyles: Record<string, React.CSSProperties> = {
      primary: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        boxShadow: '0 0 0 1px rgba(16,185,129,0.3), 0 4px 14px rgba(16,185,129,0.3), inset 0 1px 0 rgba(255,255,255,0.15)',
        color: '#fff',
      },
      secondary: {
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
        color: '#d1d5db',
      },
      ghost: {
        background: 'transparent',
        color: '#9ca3af',
      },
      danger: {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        boxShadow: '0 4px 14px rgba(239,68,68,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        color: '#fff',
      },
    }

    const hoverMap: Record<string, string> = {
      primary: 'hover:brightness-110 hover:-translate-y-px active:scale-[0.97] active:brightness-95 active:translate-y-0',
      secondary: 'hover:brightness-125 hover:text-white active:scale-[0.97] active:brightness-90',
      ghost: 'hover:bg-white/[0.06] hover:text-white active:scale-[0.97] active:bg-white/[0.03]',
      danger: 'hover:brightness-110 hover:-translate-y-px active:scale-[0.97] active:brightness-95 active:translate-y-0',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(base, sizes[size], hoverMap[variant], fullWidth && 'w-full', className)}
        style={{ ...variantStyles[variant], ...style }}
        {...props}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export default Button
