import Link from 'next/link'
import { Lock, Zap } from 'lucide-react'
import { useSubscription, planAtLeast, PlanTier } from '@/hooks/useSubscription'

interface PlanGateProps {
  requiredPlan: PlanTier
  children: React.ReactNode
  /** Optional: show as overlay on existing content instead of replacing it */
  overlay?: boolean
}

const PLAN_LABELS: Record<PlanTier, string> = {
  free: 'Free',
  pro: 'Pro',
  premium: 'Premium',
}

const PLAN_COLORS: Record<PlanTier, { border: string; bg: string; badge: string; glow: string }> = {
  free: {
    border: 'rgba(255,255,255,0.12)',
    bg: 'rgba(255,255,255,0.03)',
    badge: 'linear-gradient(135deg,#6b7280,#4b5563)',
    glow: 'rgba(255,255,255,0.05)',
  },
  pro: {
    border: 'rgba(16,185,129,0.3)',
    bg: 'rgba(16,185,129,0.05)',
    badge: 'linear-gradient(135deg,#10b981,#06b6d4)',
    glow: 'rgba(16,185,129,0.15)',
  },
  premium: {
    border: 'rgba(245,158,11,0.35)',
    bg: 'rgba(245,158,11,0.05)',
    badge: 'linear-gradient(135deg,#f59e0b,#a78bfa)',
    glow: 'rgba(245,158,11,0.15)',
  },
}

export default function PlanGate({ requiredPlan, children, overlay = false }: PlanGateProps) {
  const { plan, loading } = useSubscription()

  if (loading) return <>{children}</>
  if (planAtLeast(plan, requiredPlan)) return <>{children}</>

  const colors = PLAN_COLORS[requiredPlan]
  const label = PLAN_LABELS[requiredPlan]

  const lockUI = (
    <div
      className="flex flex-col items-center justify-center text-center px-8 py-16 rounded-2xl"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 0 40px ${colors.glow}`,
        minHeight: 240,
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: colors.badge, boxShadow: `0 8px 24px ${colors.glow}` }}
      >
        <Lock size={28} className="text-white" />
      </div>
      <div
        className="text-xs font-bold px-3 py-1 rounded-full text-white mb-3"
        style={{ background: colors.badge }}
      >
        {label} Plan Required
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Unlock with {label}</h3>
      <p className="text-gray-400 text-sm mb-6 max-w-xs">
        This feature is available on the <span className="text-white font-semibold">{label}</span> plan and above.
        Upgrade to unlock it instantly.
      </p>
      <Link
        href="/subscription"
        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
        style={{ background: colors.badge, boxShadow: `0 4px 16px ${colors.glow}` }}
      >
        <Zap size={14} fill="white" />
        Upgrade to {label}
      </Link>
    </div>
  )

  if (overlay) {
    return (
      <div className="relative">
        <div className="opacity-20 pointer-events-none select-none blur-sm">{children}</div>
        <div className="absolute inset-0 flex items-center justify-center z-10">{lockUI}</div>
      </div>
    )
  }

  return lockUI
}
