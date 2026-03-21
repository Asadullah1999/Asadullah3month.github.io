import { useState, useEffect } from 'react'
import Head from 'next/head'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import { useSubscription, PlanTier } from '@/hooks/useSubscription'
import toast from 'react-hot-toast'
import {
  Check, Lock, Zap, Crown, Star, MessageCircle, Mail,
  X, KeyRound, ChevronRight, Sparkles, Shield,
} from 'lucide-react'

const PLANS = [
  {
    key: 'free' as PlanTier,
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Start your nutrition journey',
    badge: null,
    color: { border: 'rgba(255,255,255,0.08)', bg: 'rgba(255,255,255,0.03)', glow: 'transparent', btn: 'rgba(255,255,255,0.08)', btnBorder: 'rgba(255,255,255,0.15)', text: '#9ca3af' },
    features: [
      'Calorie & macro tracking',
      'Daily meal check-ins',
      '7-day history',
      'Basic progress charts',
      'Profile & settings',
    ],
  },
  {
    key: 'pro' as PlanTier,
    name: 'Pro',
    price: '$9',
    period: '/month',
    desc: 'For serious nutrition goals',
    badge: 'Most Popular',
    color: { border: 'rgba(16,185,129,0.35)', bg: 'rgba(16,185,129,0.06)', glow: 'rgba(16,185,129,0.12)', btn: 'linear-gradient(135deg,#10b981,#06b6d4)', btnBorder: 'transparent', text: '#34d399' },
    features: [
      'Everything in Free',
      'AI Nutritionist chat',
      'WhatsApp integration',
      'Smart reminders',
      'Sleep & weight tracking',
      'Grocery list AI',
      'Unlimited history',
    ],
  },
  {
    key: 'premium' as PlanTier,
    name: 'Premium',
    price: '$29',
    period: '/month',
    desc: 'With dedicated nutritionist',
    badge: 'Best Results',
    color: { border: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.05)', glow: 'rgba(245,158,11,0.12)', btn: 'linear-gradient(135deg,#f59e0b,#a78bfa)', btnBorder: 'transparent', text: '#fbbf24' },
    features: [
      'Everything in Pro',
      'Meal scanner (AI)',
      'Barcode scanner',
      'Workout tracker',
      'Custom diet plans',
      'Nutritionist review',
      'Priority support',
    ],
  },
]

interface ContactModalProps {
  targetPlan: PlanTier
  onClose: () => void
  onSuccess: () => void
}

function ContactModal({ targetPlan, onClose, onSuccess }: ContactModalProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const plan = PLANS.find(p => p.key === targetPlan)!

  async function handleActivate() {
    if (!code.trim()) { toast.error('Please enter an activation code'); return }
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { toast.error('Please sign in first'); return }

      const res = await fetch('/api/subscription/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code, plan: targetPlan }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Invalid code'); return }
      toast.success(`🎉 You're now on the ${plan.name} plan!`)
      onSuccess()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl p-8 relative"
        style={{
          background: 'rgba(10,10,25,0.98)',
          border: plan.color.border ? `1px solid ${plan.color.border}` : '1px solid rgba(255,255,255,0.1)',
          boxShadow: `0 0 60px ${plan.color.glow}, 0 25px 80px rgba(0,0,0,0.6)`,
        }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: plan.color.btn as string, boxShadow: `0 8px 24px ${plan.color.glow}` }}>
            {targetPlan === 'premium' ? <Crown size={28} className="text-white" /> : <Zap size={28} className="text-white" fill="white" />}
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-1">Upgrade to {plan.name}</h2>
          <p className="text-gray-400 text-sm">Contact the owner to get your activation code, then enter it below.</p>
        </div>

        {/* Contact info */}
        <div className="rounded-xl p-5 mb-6 space-y-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Contact to Purchase</p>
          <a href="https://wa.me/message/contact" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}>
              <MessageCircle size={16} className="text-green-400" />
            </div>
            <div>
              <p className="font-semibold">WhatsApp</p>
              <p className="text-xs text-gray-500">Message us on WhatsApp</p>
            </div>
            <ChevronRight size={14} className="ml-auto text-gray-600" />
          </a>
          <a href="mailto:contact@fahmifit.com"
            className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)' }}>
              <Mail size={16} className="text-cyan-400" />
            </div>
            <div>
              <p className="font-semibold">Email</p>
              <p className="text-xs text-gray-500">contact@fahmifit.com</p>
            </div>
            <ChevronRight size={14} className="ml-auto text-gray-600" />
          </a>
        </div>

        {/* Code entry */}
        <div className="space-y-3">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
            Activation Code
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
              <KeyRound size={16} />
            </div>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="Enter your code here"
              className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.5)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.12)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.3)' }}
              onKeyDown={e => e.key === 'Enter' && handleActivate()}
            />
          </div>
          <button
            onClick={handleActivate}
            disabled={loading || !code.trim()}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
            style={{ background: plan.color.btn as string, boxShadow: `0 4px 20px ${plan.color.glow}` }}>
            {loading ? 'Activating...' : `Activate ${plan.name} Plan`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  const { plan: currentPlan, loading } = useSubscription()
  const [modalPlan, setModalPlan] = useState<PlanTier | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  // Force re-fetch subscription after upgrade
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {}, [refreshKey])

  function handleSuccess() {
    setModalPlan(null)
    setRefreshKey(k => k + 1)
    // Reload to refresh subscription state
    setTimeout(() => window.location.reload(), 1000)
  }

  return (
    <>
      <Head><title>Subscription · FahmiFit</title></Head>
      <DashboardLayout>
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                <Sparkles size={16} className="text-white" />
              </div>
              <h1 className="text-2xl font-extrabold text-white">Subscription</h1>
            </div>
            <p className="text-gray-400">Manage your plan and unlock more features.</p>
          </div>

          {/* Current Plan Banner */}
          {!loading && (
            <div className="rounded-2xl p-5 mb-8 flex items-center gap-4"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.06) 100%)',
                border: '1px solid rgba(16,185,129,0.2)',
                boxShadow: '0 0 30px rgba(16,185,129,0.08)',
              }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', boxShadow: '0 4px 16px rgba(16,185,129,0.4)' }}>
                <Shield size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Current Plan</p>
                <p className="text-xl font-extrabold text-white capitalize">{currentPlan}</p>
              </div>
              {currentPlan === 'free' && (
                <div className="ml-auto">
                  <p className="text-sm text-gray-400">Upgrade to unlock more features</p>
                </div>
              )}
              {currentPlan !== 'free' && (
                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                  <Check size={11} /> Active
                </div>
              )}
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid md:grid-cols-3 gap-5">
            {PLANS.map(plan => {
              const isCurrent = currentPlan === plan.key
              const isLower = ['free'].includes(plan.key) && currentPlan !== 'free'
                || plan.key === 'pro' && currentPlan === 'premium'

              return (
                <div
                  key={plan.key}
                  className="relative rounded-2xl p-6 transition-all duration-300"
                  style={{
                    background: plan.color.bg,
                    border: `1px solid ${plan.color.border}`,
                    boxShadow: isCurrent ? `0 0 40px ${plan.color.glow}` : 'none',
                  }}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full text-white"
                        style={{ background: plan.color.btn as string }}>
                        {plan.badge}
                      </span>
                    </div>
                  )}
                  {isCurrent && (
                    <div className="absolute -top-3 right-4">
                      <span className="text-xs font-bold px-3 py-1 rounded-full text-white"
                        style={{ background: 'rgba(16,185,129,0.9)', border: '1px solid rgba(16,185,129,0.5)' }}>
                        ✓ Current
                      </span>
                    </div>
                  )}

                  <div className="mb-5">
                    <h3 className="font-bold text-white text-lg mb-1">{plan.name}</h3>
                    <p className="text-gray-500 text-xs mb-4">{plan.desc}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                      <span className="text-gray-500 mb-1 text-sm">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                        <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: isCurrent || !isLower ? `${plan.color.glow}` : 'rgba(255,255,255,0.04)', border: `1px solid ${plan.color.border}` }}>
                          <Check size={9} style={{ color: plan.color.text }} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center"
                      style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}>
                      <Check size={14} className="inline mr-1.5" /> Your current plan
                    </div>
                  ) : isLower ? (
                    <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center text-gray-600"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      Already included
                    </div>
                  ) : plan.key === 'free' ? (
                    <div className="w-full py-2.5 rounded-xl text-sm font-medium text-center text-gray-600"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Lock size={12} className="inline mr-1.5" /> Downgrade not available
                    </div>
                  ) : (
                    <button
                      onClick={() => setModalPlan(plan.key)}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                      style={{ background: plan.color.btn as string, boxShadow: `0 4px 16px ${plan.color.glow}` }}>
                      {plan.key === 'premium' ? <Crown size={14} className="inline mr-1.5" /> : <Zap size={14} className="inline mr-1.5" fill="white" />}
                      Upgrade to {plan.name}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Contact note */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Payment is processed offline.{' '}
              <span className="text-gray-400">Contact the owner to pay and receive your activation code.</span>
            </p>
            <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-600">
              <span className="flex items-center gap-1.5"><Star size={11} className="text-amber-500" /> Instant activation</span>
              <span className="flex items-center gap-1.5"><Shield size={11} className="text-emerald-500" /> Secure &amp; private</span>
              <span className="flex items-center gap-1.5"><MessageCircle size={11} className="text-cyan-500" /> WhatsApp support</span>
            </div>
          </div>
        </div>
      </DashboardLayout>

      {modalPlan && (
        <ContactModal
          targetPlan={modalPlan}
          onClose={() => setModalPlan(null)}
          onSuccess={handleSuccess}
        />
      )}
    </>
  )
}
