import { ReactNode } from 'react'
import Link from 'next/link'
import { Lock, Crown, Rocket, Sparkles } from 'lucide-react'

interface PlanGateProps {
  /** Minimum plan required: 'pro' or 'premium' */
  requires: 'pro' | 'premium'
  /** Current user plan */
  currentPlan: string
  loading?: boolean
  /** Feature name shown in the locked state */
  featureName?: string
  children: ReactNode
}

export default function PlanGate({ requires, currentPlan, loading, featureName, children }: PlanGateProps) {
  if (loading) return <>{children}</>

  const hasAccess = requires === 'pro'
    ? (currentPlan === 'pro' || currentPlan === 'premium')
    : currentPlan === 'premium'

  if (hasAccess) return <>{children}</>

  const isPremiumRequired = requires === 'premium'
  const accentColor = isPremiumRequired ? '#ec4899' : '#10b981'
  const accentRgb = isPremiumRequired ? '236,72,153' : '16,185,129'
  const planLabel = isPremiumRequired ? 'Premium' : 'Pro'
  const PlanIcon = isPremiumRequired ? Crown : Rocket

  return (
    <div className="relative min-h-[400px] flex items-center justify-center overflow-hidden rounded-2xl"
      style={{
        background: `linear-gradient(135deg, rgba(${accentRgb},0.06) 0%, rgba(0,0,0,0.4) 100%)`,
        border: `1px solid rgba(${accentRgb},0.2)`,
      }}>

      {/* Background orbs */}
      <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, rgba(${accentRgb},0.15), transparent)`, filter: 'blur(40px)' }} />
      <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, rgba(${accentRgb},0.1), transparent)`, filter: 'blur(30px)' }} />

      {/* Blurred content hint */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl opacity-20"
        style={{ filter: 'blur(6px)' }}>
        {children}
      </div>

      {/* Lock overlay */}
      <div className="relative z-10 text-center p-8 max-w-sm mx-auto">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: `linear-gradient(135deg, rgba(${accentRgb},0.2), rgba(${accentRgb},0.08))`,
            border: `1px solid rgba(${accentRgb},0.3)`,
            boxShadow: `0 0 30px rgba(${accentRgb},0.2)`,
          }}>
          <Lock size={26} style={{ color: accentColor }} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
          style={{ background: `rgba(${accentRgb},0.12)`, border: `1px solid rgba(${accentRgb},0.3)`, color: accentColor }}>
          <PlanIcon size={11} />
          {planLabel} Feature
        </div>

        <h3 className="text-xl font-extrabold text-white mb-2">
          {featureName ? `${featureName} is locked` : 'Upgrade required'}
        </h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          This feature is available on the <span style={{ color: accentColor }}>{planLabel}</span> plan.
          Upgrade to unlock {featureName?.toLowerCase() || 'this feature'} and more.
        </p>

        <Link href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5"
          style={{
            background: isPremiumRequired
              ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
              : 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: `0 4px 20px rgba(${accentRgb},0.4)`,
          }}>
          <Sparkles size={15} />
          Upgrade to {planLabel}
        </Link>

        <p className="text-xs text-gray-700 mt-4">
          Offline payment · Secret code activation · No card stored
        </p>
      </div>
    </div>
  )
}
