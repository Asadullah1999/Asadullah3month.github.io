export function Skeleton({ className = '', variant = 'text' }: { className?: string; variant?: 'text' | 'card' | 'circle' | 'stat' }) {
  const base = 'animate-pulse rounded-xl'

  if (variant === 'circle') {
    return <div className={`${base} w-12 h-12 rounded-full ${className}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
  }

  if (variant === 'stat') {
    return (
      <div className={`${base} p-5 ${className}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="h-3 w-20 rounded-lg mb-3" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-8 w-24 rounded-lg" style={{ background: 'rgba(255,255,255,0.08)' }} />
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div className={`${base} p-5 ${className}`} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="h-3 w-32 rounded-lg mb-4" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-4 w-full rounded-lg mb-2" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="h-4 w-3/4 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
    )
  }

  // text
  return <div className={`${base} h-4 ${className}`} style={{ background: 'rgba(255,255,255,0.06)' }} />
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="stat" />)}
      </div>
      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-5">
        <Skeleton variant="card" className="lg:col-span-1 h-64" />
        <Skeleton variant="card" className="lg:col-span-2 h-64" />
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <Skeleton variant="card" className="h-48" />
        <Skeleton variant="card" className="h-48" />
      </div>
    </div>
  )
}
