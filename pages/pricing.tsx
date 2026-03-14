import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { Subscription } from '@/lib/database.types'
import {
  Zap, Check, Crown, Sparkles, CreditCard, ExternalLink,
} from 'lucide-react'
import toast from 'react-hot-toast'

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with the basics',
    color: 'gray',
    features: [
      'Meal check-in & calorie tracking',
      'Water intake logging',
      'Basic progress charts',
      'Weight & sleep logs',
      '7-day history',
    ],
    missing: [
      'AI Nutritionist chat',
      'WhatsApp reminders',
      'Smart grocery list',
      'Barcode meal scanner',
      'Advanced analytics',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9',
    period: 'per month',
    description: 'For serious health tracking',
    color: 'green',
    popular: true,
    features: [
      'Everything in Free',
      'AI Nutritionist chat (unlimited)',
      'WhatsApp daily reminders',
      'Smart grocery list generator',
      'Barcode meal scanner',
      'Unlimited history',
      'Advanced analytics & charts',
      'Custom reminder schedules',
    ],
    missing: [
      'Priority support',
      'Nutritionist diet plans',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19',
    period: 'per month',
    description: 'Everything, plus expert guidance',
    color: 'purple',
    features: [
      'Everything in Pro',
      'Priority support',
      'Nutritionist-created diet plans',
      'Weekly AI progress reports',
      'Early access to new features',
    ],
    missing: [],
  },
]

const GRADIENT: Record<string, React.CSSProperties> = {
  gray: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' },
  green: {
    background: 'rgba(16,185,129,0.06)',
    border: '1px solid rgba(16,185,129,0.3)',
    boxShadow: '0 0 40px rgba(16,185,129,0.08)',
  },
  purple: { background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.25)' },
}

const ICON_STYLE: Record<string, React.CSSProperties> = {
  gray:   { background: 'rgba(255,255,255,0.08)' },
  green:  { background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.4)' },
  purple: { background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 4px 14px rgba(139,92,246,0.4)' },
}

export default function PricingPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<Partial<Subscription> | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    loadSubscription()
  }, [])

  useEffect(() => {
    if (router.query.success) {
      toast.success('Subscription activated! Welcome to ' + (router.query.plan || 'Pro') + ' plan 🎉')
    } else if (router.query.canceled) {
      toast('Checkout canceled.')
    }
  }, [router.query])

  async function loadSubscription() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    setUserId(session.user.id)
    setUserEmail(session.user.email || null)

    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
    setSubscription(data)
  }

  const currentPlan = subscription?.plan || 'free'
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  async function handleUpgrade(planId: string) {
    if (!userId) return
    setLoading(planId)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId, userId, userEmail }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || 'Failed to start checkout'); setLoading(null); return }
    window.location.href = data.url
  }

  async function handleManage() {
    if (!userId) return
    setLoading('portal')
    const res = await fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    const data = await res.json()
    if (!res.ok) { toast.error(data.error || 'Failed to open billing portal'); setLoading(null); return }
    window.location.href = data.url
  }

  return (
    <DashboardLayout pageTitle="Pricing" title="Upgrade Plan">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center space-y-2 pb-2">
          <h1 className="text-3xl font-extrabold text-white">Simple, transparent pricing</h1>
          <p className="text-gray-400 text-sm">Upgrade anytime. Cancel anytime. No hidden fees.</p>
        </div>

        {/* Current plan banner */}
        {currentPlan !== 'free' && isActive && (
          <div className="flex items-center justify-between p-4 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1), rgba(16,185,129,0.08))',
              border: '1px solid rgba(139,92,246,0.25)',
            }}>
            <div className="flex items-center gap-3">
              <Crown size={18} className="text-purple-400" />
              <div>
                <p className="text-sm font-bold text-white capitalize">
                  {currentPlan} Plan — {subscription?.status}
                </p>
                {subscription?.current_period_end && (
                  <p className="text-xs text-gray-500">
                    Renews {new Date(subscription.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              loading={loading === 'portal'}
              onClick={handleManage}
            >
              <CreditCard size={14} /> Manage billing
            </Button>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLANS.map(plan => {
            const isCurrent = currentPlan === plan.id && isActive
            const isDowngrade = plan.id === 'free'
            const canUpgrade = !isCurrent && !isDowngrade

            return (
              <div key={plan.id} className="relative rounded-2xl p-6 flex flex-col gap-5 transition-all duration-200"
                style={GRADIENT[plan.color]}>

                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
                      <Sparkles size={11} /> Most Popular
                    </div>
                  </div>
                )}

                {/* Plan header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={ICON_STYLE[plan.color]}>
                    {plan.id === 'free'    && <Zap size={17} className="text-gray-400" />}
                    {plan.id === 'pro'     && <Zap size={17} className="text-white" fill="white" />}
                    {plan.id === 'premium' && <Crown size={17} className="text-white" />}
                  </div>
                  <div>
                    <p className="font-bold text-white">{plan.name}</p>
                    <p className="text-xs text-gray-500">{plan.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div>
                  <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-sm text-gray-500 ml-1">{plan.period}</span>
                </div>

                {/* Features */}
                <ul className="space-y-2 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check size={14} className="mt-0.5 flex-shrink-0"
                        style={{ color: plan.color === 'purple' ? '#a78bfa' : '#10b981' }} />
                      <span className="text-gray-300">{f}</span>
                    </li>
                  ))}
                  {plan.missing.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm opacity-35">
                      <span className="w-3.5 h-0.5 mt-2 rounded flex-shrink-0 bg-gray-600" />
                      <span className="text-gray-500">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <div className="w-full text-center py-2.5 rounded-xl text-sm font-semibold text-gray-400"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    Current plan
                  </div>
                ) : isDowngrade ? (
                  <div className="w-full text-center py-2.5 rounded-xl text-xs text-gray-600">
                    Free forever
                  </div>
                ) : (
                  <Button
                    fullWidth
                    loading={loading === plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                    style={plan.color === 'purple' ? {
                      background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                      boxShadow: '0 4px 14px rgba(139,92,246,0.35)',
                      color: '#fff',
                    } : undefined}
                  >
                    {canUpgrade && <ExternalLink size={14} />}
                    Upgrade to {plan.name}
                  </Button>
                )}
              </div>
            )
          })}
        </div>

        {/* FAQ note */}
        <p className="text-center text-xs text-gray-600 pb-4">
          Payments processed securely by Stripe. You can cancel or change your plan at any time from the billing portal.
        </p>
      </div>
    </DashboardLayout>
  )
}
