import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  padding?: 'sm' | 'md' | 'lg' | 'none'
  variant?: 'default' | 'glass' | 'gradient'
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, padding = 'md', variant = 'default', children, ...props }, ref) => {
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }
    return (
      <div
        ref={ref}
        className={cn(
          'relative rounded-2xl overflow-hidden',
          variant === 'default' && 'card',
          variant === 'glass' && 'card-glass',
          variant === 'gradient' && 'card-gradient',
          hover && 'hover:border-white/[0.14] hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-250 cursor-pointer',
          paddings[padding],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

export default Card


export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-5', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base font-bold text-white', className)} {...props}>
      {children}
    </h3>
  )
}

const STAT_GRADIENTS = {
  green:  { bg: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', glow: 'rgba(16,185,129,0.35)' },
  blue:   { bg: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', glow: 'rgba(59,130,246,0.35)' },
  orange: { bg: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)', glow: 'rgba(245,158,11,0.35)' },
  purple: { bg: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', glow: 'rgba(139,92,246,0.35)' },
  red:    { bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', glow: 'rgba(239,68,68,0.35)' },
  cyan:   { bg: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)', glow: 'rgba(6,182,212,0.35)' },
}

export function StatCard({
  title,
  value,
  unit,
  icon,
  color = 'green',
  sub,
}: {
  title: string
  value: string | number
  unit?: string
  icon: React.ReactNode
  color?: keyof typeof STAT_GRADIENTS
  sub?: string
}) {
  const grad = STAT_GRADIENTS[color] || STAT_GRADIENTS.green
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
          style={{
            background: grad.bg,
            boxShadow: `0 4px 14px ${grad.glow}`,
          }}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-extrabold text-white tracking-tight">
        {value}
        {unit && <span className="text-lg font-semibold text-gray-300 ml-1">{unit}</span>}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
    </div>
  )
}
