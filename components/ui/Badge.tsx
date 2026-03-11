import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'green' | 'blue' | 'orange' | 'red' | 'gray' | 'purple'
}

export default function Badge({ variant = 'gray', className, children, ...props }: BadgeProps) {
  const variants = {
    green:  'bg-green-100 text-green-700',
    blue:   'bg-blue-100 text-blue-700',
    orange: 'bg-orange-100 text-orange-700',
    red:    'bg-red-100 text-red-700',
    gray:   'bg-gray-100 text-gray-700',
    purple: 'bg-purple-100 text-purple-700',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
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
      <span className="text-xs font-medium opacity-70">{unit}</span>
      <span className="text-xs opacity-60">{label}</span>
    </div>
  )
}
