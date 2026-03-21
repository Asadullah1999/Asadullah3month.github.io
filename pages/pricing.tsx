import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { Subscription } from '@/lib/database.types'
import {
  Zap, Check, Crown, Sparkles, X, Key, MessageCircle,
  Lock, ChevronRight, Shield, Star, Rocket,
} from 'lucide-react'
import toast from 'react-hot-toast'

const OWNER_WHATSAPP = 'https://wa.me/923001234567?text=Hi%2C%20I%27d%20like%20to%20upgrade%20my%20FahmiFit%20plan'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started — no credit card needed',
    icon: <Zap size={20} className="text-gray-400" />,
    accent: 'gray',
    features: [
      'Meal check-in & calorie tracking',
      'Water intake logging',
      'Weight & sleep logs',
      'Basic progress charts',
      '7-day history',
      'Dashboard analytics',
    ],
    locked: [
      'AI Nutritionist chat',
      'WhatsApp reminders',
      'Smart grocery list',
      'Barcode meal scanner',
      'Advanced analytics',
      'Nutritionist diet plans',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: 'per month',
    description: 'Serious about your nutrition goals',
    icon: <Rocket size={20} className="text-white" />,
    accent: 'green',
    popular: true,
    features: [
      'Everything in Free',
      'AI Nutritionist (unlimited chat)',
      'WhatsApp daily reminders',
      'Smart grocery list generator',
      'Barcode meal scanner',
      'Unlimited history',
      'Advanced analytics & charts',
      'Custom reminder schedules',
    ],
    locked: [
      'Nutritionist-created diet plans',
      'Priority support',
      'Weekly AI progress reports',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19',
    period: 'per month',
    description: 'Expert guidance + everything Pro',
    icon: <Crown size={20} className="text-white" />,
    accent: 'purple',
    features: [
      'Everything in Pro',
      'Nutritionist-created diet plans',
      'Weekly AI progress reports',
      'Priority support',
      'Early access to new features',
      'Custom macro targets by expert',
    ],
    locked: [],
  },
]

const CARD_STYLE: Record<string, React.CSSProperties> = {
  gray: {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  green: {
    background: 'linear-gradient(145deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.05) 100%)',
    border: '1px solid rgba(16,185,129,0.3)',
    boxShadow: '0 0 60px rgba(16,185,129,0.1), 0 0 0 1px rgba(16,185,129,0.15)',
  },
  purple: {
    background: 'linear-gradient(145deg, rgba(139,92,246,0.08) 0%, rgba(236,72,153,0.05) 100%)',
    border: '1px solid rgba(139,92,246,0.3)',
    boxShadow: '0 0 40px rgba(139,92,246,0.08)',
  },
}

const ICON_BG: Record<string, React.CSSProperties> = {
  gray: { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' },
  green: { background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 20px rgba(16,185,129,0.5)' },
  purple: { background: 'linear-gradient(135deg, #8b5cf6, #ec4899)', boxShadow: '0 4px 20px rgba(139,92,246,0.5)' },
}

function ActivateModal({ plan, userId, onClose, onSuccess }: {
  plan: typeof PLANS[1]
  userId: string
  onClose: () => void
  onSuccess: (plan: string) => void
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleActivate() {
    if (!code.trim()) { toast.error('Please enter your activation code'); return }
    setLoading(true)
    const res = await fetch('/api/activate-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, userId }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { toast.error(data.error || 'Invalid code'); return }
    toast.success(`🎉 ${data.message}`)
    onSuccess(data.plan)
    onClose()
  }

  const accentColor = plan.accent === 'green' ? '#10b981' : '#8b5cf6'
  const accentRgb = plan.accent === 'green' ? '16,185,129' : '139,92,246'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl p-8 relative animate-fade-in"
        style={{
          background: 'rgba(8,8,20,0.98)',
          border: `1px solid rgba(${accentRgb},0.25)`,
          boxShadow: `0 0 80px rgba(${accentRgb},0.15), 0 40px 80px rgba(0,0,0,0.8)`,
        }}>
        {/* Close */}
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <X size={16} />
        </button>

        {/* Plan badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={ICON_BG[plan.accent]}>
            {plan.icon}
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white">Activate {plan.name} Plan</h3>
            <p className="text-sm text-gray-500">{plan.price} {plan.period}</p>
          </div>
        </div>

        {/* Contact owner first */}
        <div className="rounded-xl p-4 mb-6" style={{ background: `rgba(${accentRgb},0.08)`, border: `1px solid rgba(${accentRgb},0.2)` }}>
          <div className="flex items-start gap-3">
            <MessageCircle size={16} style={{ color: accentColor }} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-white mb-1">Step 1: Contact the owner</p>
              <p className="text-xs text-gray-400 mb-3">
                Payment is handled offline. Message the owner to pay and receive your activation code.
              </p>
              <a
                href={OWNER_WHATSAPP}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', boxShadow: '0 4px 14px rgba(37,211,102,0.35)' }}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Message on WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Code entry */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-white mb-3">Step 2: Enter your activation code</p>
          <div className="relative">
            <Key size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleActivate()}
              placeholder="FAHMIFIT-XXXX-2025"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none uppercase tracking-widest font-mono"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid rgba(${accentRgb},0.2)`,
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = `rgba(${accentRgb},0.5)`; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(${accentRgb},0.1)` }}
              onBlur={e => { e.currentTarget.style.borderColor = `rgba(${accentRgb},0.2)`; e.currentTarget.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.3)' }}
            />
          </div>
        </div>

        <button
          onClick={handleActivate}
          disabled={loading || !code.trim()}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98]"
          style={{
            background: plan.accent === 'green'
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
            boxShadow: `0 4px 20px rgba(${accentRgb},0.4)`,
          }}
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Sparkles size={15} />
              Activate {plan.name} Plan
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-600 mt-4">
          Code is case-insensitive · One-time offline payment · 30 days access
        </p>
      </div>
    </div>
  )
}

export default function PricingPage() {
  const [subscription, setSubscription] = useState<Partial<Subscription> | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [activateFor, setActivateFor] = useState<typeof PLANS[1] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSubscription()
  }, [])

  async function loadSubscription() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setUserId(session.user.id)
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
    setSubscription(data)
    setLoading(false)
  }

  const currentPlan = subscription?.plan || 'free'
  const isActive = !subscription || subscription?.status === 'active' || subscription?.status === 'trialing'

  function handlePlanSuccess(plan: string) {
    setSubscription(prev => ({ ...prev, plan: plan as 'pro' | 'premium', status: 'active' }))
  }

  return (
    <DashboardLayout pageTitle="Pricing" title="Upgrade Plan">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-2"
            style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>
            <Star size={11} fill="#34d399" /> Choose your plan
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight">
            Simple, <span className="gradient-text">transparent</span> pricing
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Pay offline. Get a secret code. Activate instantly. No credit card stored.
          </p>
        </div>

        {/* How it works */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { step: '1', icon: <MessageCircle size={16} />, text: 'Contact owner on WhatsApp', color: '#25D366' },
            { step: '2', icon: <Shield size={16} />, text: 'Pay offline & receive your code', color: '#10b981' },
            { step: '3', icon: <Key size={16} />, text: 'Enter code to unlock features', color: '#8b5cf6' },
          ].map(item => (
            <div key={item.step} className="text-center p-4 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-3"
                style={{ background: `rgba(${item.color === '#25D366' ? '37,211,102' : item.color === '#10b981' ? '16,185,129' : '139,92,246'},0.15)`, color: item.color }}>
                {item.icon}
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>

        {/* Current plan banner */}
        {currentPlan !== 'free' && isActive && (
          <div className="flex items-center gap-4 p-4 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(16,185,129,0.08))',
              border: '1px solid rgba(139,92,246,0.25)',
            }}>
            <Crown size={20} className="text-purple-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-white capitalize">{currentPlan} Plan — Active</p>
              {subscription?.current_period_end && (
                <p className="text-xs text-gray-500">
                  Access until {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              )}
            </div>
            <a href={OWNER_WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition-all hover:brightness-110"
              style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)' }}>
              Renew
            </a>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map(plan => {
            const isCurrent = currentPlan === plan.id && (plan.id === 'free' ? true : isActive)
            const accentColor = plan.accent === 'green' ? '#10b981' : plan.accent === 'purple' ? '#8b5cf6' : '#6b7280'

            return (
              <div key={plan.id}
                className="relative rounded-2xl p-6 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1"
                style={CARD_STYLE[plan.accent]}>

                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 px-4 py-1 rounded-full text-xs font-bold text-white"
                      style={{
                        background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                        boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
                      }}>
                      <Sparkles size={10} fill="white" /> Most Popular
                    </div>
                  </div>
                )}

                {/* Plan icon + name */}
                <div className="flex items-center gap-3 pt-1">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={ICON_BG[plan.accent]}>
                    {plan.icon}
                  </div>
                  <div>
                    <p className="font-extrabold text-white text-base">{plan.name}</p>
                    <p className="text-xs text-gray-500">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-end gap-1.5">
                  <span className="text-5xl font-extrabold text-white leading-none">{plan.price}</span>
                  <span className="text-sm text-gray-500 mb-1.5">{plan.period}</span>
                </div>

                {/* Divider */}
                <div className="h-px" style={{ background: `rgba(${plan.accent === 'green' ? '16,185,129' : plan.accent === 'purple' ? '139,92,246' : '255,255,255'},0.1)` }} />

                {/* Features */}
                <ul className="space-y-2.5 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: `rgba(${plan.accent === 'green' ? '16,185,129' : plan.accent === 'purple' ? '139,92,246' : '107,114,128'},0.15)` }}>
                        <Check size={10} style={{ color: accentColor }} />
                      </div>
                      <span className="text-gray-300">{f}</span>
                    </li>
                  ))}
                  {plan.locked.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm opacity-30">
                      <Lock size={12} className="mt-0.5 flex-shrink-0 text-gray-600" />
                      <span className="text-gray-500">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div className="w-full text-center py-3 rounded-xl text-sm font-semibold"
                    style={{
                      background: `rgba(${plan.accent === 'green' ? '16,185,129' : plan.accent === 'purple' ? '139,92,246' : '255,255,255'},0.06)`,
                      border: `1px solid rgba(${plan.accent === 'green' ? '16,185,129' : plan.accent === 'purple' ? '139,92,246' : '255,255,255'},0.12)`,
                      color: accentColor,
                    }}>
                    ✓ Current plan
                  </div>
                ) : plan.id === 'free' ? (
                  <div className="w-full text-center py-3 rounded-xl text-xs text-gray-600">
                    Free forever — no action needed
                  </div>
                ) : (
                  <button
                    onClick={() => setActivateFor(plan)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] hover:-translate-y-0.5"
                    style={{
                      background: plan.accent === 'green'
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      boxShadow: `0 4px 20px rgba(${plan.accent === 'green' ? '16,185,129' : '139,92,246'},0.4)`,
                    }}
                  >
                    <ChevronRight size={15} />
                    Get {plan.name} Plan
                  </button>
                )}
              </div>
            )
          })}
        </div>

        {/* Payment note */}
        <div className="text-center py-4 space-y-2">
          <p className="text-xs text-gray-600">
            All payments are handled offline via WhatsApp. No credit card is stored. Contact owner to pay and receive your code.
          </p>
          <a href={OWNER_WHATSAPP} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold text-green-400 hover:text-green-300 transition-colors">
            <MessageCircle size={14} /> Contact owner on WhatsApp
          </a>
        </div>
      </div>

      {/* Activation Modal */}
      {activateFor && userId && (
        <ActivateModal
          plan={activateFor}
          userId={userId}
          onClose={() => setActivateFor(null)}
          onSuccess={handlePlanSuccess}
        />
      )}
    </DashboardLayout>
  )
}
