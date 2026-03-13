import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'blue' | 'orange' | 'red' | 'gray' | 'purple'
}

export default function Badge({ variant = 'gray', className, children, ...props }: BadgeProps) {
  const variants = {
    green:  'bg-brand-500/15 text-brand-400 border border-brand-500/25',
    blue:   'bg-blue-500/15 text-blue-400 border border-blue-500/25',
    orange: 'bg-orange-500/15 text-orange-400 border border-orange-500/25',
    red:    'bg-red-500/15 text-red-400 border border-red-500/25',
    gray:   'bg-white/8 text-gray-400 border border-white/10',
    purple: 'bg-violet-500/15 text-violet-400 border border-violet-500/25',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

export function MacroBadge({ label, value, unit, color }: {
  label: string
  value: number
  unit: string
  color: string
}) {
  return (
    <div className={cn('flex flex-col items-center p-3 rounded-xl', color)}>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs font-medium opacity-80">{unit}</span>
      <span className="text-xs opacity-60 mt-0.5">{label}</span>
    </div>
  )
}
