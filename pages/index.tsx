import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  BarChart2, MessageCircle, TrendingUp, Bell,
  Check, Zap, Users, Bot, ChevronRight, Sparkles,
  Shield, Clock, Star,
} from 'lucide-react'

const FEATURES = [
  {
    icon: <BarChart2 className="w-5 h-5" />,
    title: 'Smart Calorie Tracking',
    desc: 'Log meals in seconds with personalized macro targets tailored to your body and goals.',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'rgba(16,185,129,0.3)',
  },
  {
    icon: <MessageCircle className="w-5 h-5" />,
    title: 'WhatsApp Check-ins',
    desc: 'Get meal reminders and send your daily log directly via WhatsApp — zero friction.',
    gradient: 'from-cyan-500 to-blue-600',
    glow: 'rgba(6,182,212,0.3)',
  },
  {
    icon: <Bell className="w-5 h-5" />,
    title: 'Smart Reminders',
    desc: 'Stay consistent with intelligent reminders sent at exactly the right moment.',
    gradient: 'from-orange-500 to-rose-600',
    glow: 'rgba(249,115,22,0.3)',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Progress Analytics',
    desc: 'Beautiful charts showing calorie trends, weight progress, and weekly insights.',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.3)',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Nutritionist Panel',
    desc: 'Professionals can manage clients, create custom diet plans, and track outcomes.',
    gradient: 'from-pink-500 to-rose-600',
    glow: 'rgba(236,72,153,0.3)',
  },
  {
    icon: <Bot className="w-5 h-5" />,
    title: 'AI Nutritionist',
    desc: 'Ask anything about your nutrition. Get personalized advice powered by AI.',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'rgba(245,158,11,0.3)',
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Start your nutrition journey',
    features: ['Calorie tracking', 'Meal check-ins', '7-day history', 'Basic charts'],
    cta: 'Get started free',
    highlight: false,
    badge: null,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    desc: 'For serious nutrition goals',
    features: ['Everything in Free', 'WhatsApp integration', 'Water reminders', 'Weekly reports', 'Unlimited history'],
    cta: 'Start Pro trial',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Premium',
    price: '$29',
    period: '/month',
    desc: 'With dedicated nutritionist',
    features: ['Everything in Pro', 'Nutritionist review', 'Custom diet plans', 'Priority support', 'Video consultations'],
    cta: 'Get Premium',
    highlight: false,
    badge: 'Best Results',
  },
]

const STATS = [
  { value: '50K+', label: 'Active users' },
  { value: '2M+', label: 'Meals logged' },
  { value: '98%', label: 'Goal success rate' },
  { value: '4.9★', label: 'Average rating' },
]

export default function LandingPage() {
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
  }, [router])

  return (
    <>
      <Head>
        <title>FahmiFit — AI-Powered Nutrition Coaching</title>
        <meta name="description" content="Track meals, get WhatsApp reminders, and reach your nutrition goals faster with AI-powered coaching." />
      </Head>

      <div className="min-h-screen" style={{ background: '#05050f' }}>
        {/* === NAV === */}
        <nav className="fixed top-0 left-0 right-0 z-50" style={{
          background: 'rgba(5,5,15,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                  boxShadow: '0 0 20px rgba(16,185,129,0.4)',
                }}>
                <Zap className="w-4.5 h-4.5 text-white" fill="white" size={18} />
              </div>
              <span className="font-bold text-xl tracking-tight gradient-text">FahmiFit</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
              <a href="#features" className="hover:text-white transition-colors">Features</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
              >
                Sign in
              </Link>
              <Link href="/auth/signup" className="btn-primary text-sm">
                Get started <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </nav>

        {/* === HERO === */}
        <section className="relative pt-36 pb-28 px-6 overflow-hidden">
          {/* Background orbs */}
          <div className="orb orb-green w-[600px] h-[600px] -top-32 -left-32 opacity-30 animate-aurora" />
          <div className="orb orb-violet w-[500px] h-[500px] -top-20 -right-20 opacity-25 animate-aurora" style={{ animationDelay: '4s' }} />
          <div className="orb orb-cyan w-[400px] h-[400px] bottom-0 left-1/2 -translate-x-1/2 opacity-20" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full text-sm font-semibold"
              style={{
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.25)',
                color: '#34d399',
              }}>
              <Sparkles size={13} />
              WhatsApp + AI-powered nutrition coaching
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-none mb-6"
              style={{ color: '#f0f4f8' }}>
              Reach your{' '}
              <span className="gradient-text-green">nutrition goals</span>
              <br />
              <span style={{ color: '#94a3b8' }}>faster than ever</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Track meals, get WhatsApp reminders, and monitor your progress —
              all from one beautiful dashboard. Built for real people.
            </p>

            {/* CTAs */}
            <div className="flex items-center justify-center gap-4 flex-wrap mb-6">
              <Link href="/auth/signup" className="btn-gradient text-base px-8 py-3.5 rounded-xl font-bold">
                Start for free <ChevronRight size={16} />
              </Link>
              <Link href="/auth/login"
                className="flex items-center gap-2 text-base px-8 py-3.5 rounded-xl font-semibold text-gray-300 hover:text-white transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                Sign in
              </Link>
            </div>
            <p className="text-sm text-gray-600">No credit card required · Free plan available</p>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
              {STATS.map(s => (
                <div key={s.value} className="text-center">
                  <div className="text-3xl font-extrabold gradient-text-green mb-1">{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === FEATURES === */}
        <section id="features" className="py-24 px-6 relative">
          <div className="orb orb-violet w-[400px] h-[400px] top-20 right-0 opacity-15" />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="pill mb-4">
                <Shield size={11} /> Features
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Everything you need
              </h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                A complete nutrition coaching platform designed for real results.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map((f) => (
                <div key={f.title} className="feature-card group">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 text-white shadow-lg transition-all duration-300 group-hover:scale-110`}
                    style={{ boxShadow: `0 8px 24px ${f.glow}` }}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === PRICING === */}
        <section id="pricing" className="py-24 px-6 relative">
          <div className="orb orb-green w-[350px] h-[350px] bottom-0 left-10 opacity-15" />
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="pill mb-4">
                <Star size={11} /> Pricing
              </div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Simple, transparent pricing
              </h2>
              <p className="text-gray-400 text-lg">
                Choose a plan that fits your goals
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl p-7 transition-all duration-300 ${
                    plan.highlight ? 'scale-105' : 'hover:-translate-y-1'
                  }`}
                  style={plan.highlight ? {
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    boxShadow: '0 0 0 1px rgba(16,185,129,0.2), 0 20px 60px rgba(16,185,129,0.12)',
                  } : {
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                  }}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full text-white"
                        style={{
                          background: plan.highlight
                            ? 'linear-gradient(135deg, #10b981, #06b6d4)'
                            : 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                          boxShadow: plan.highlight
                            ? '0 4px 12px rgba(16,185,129,0.4)'
                            : '0 4px 12px rgba(139,92,246,0.4)',
                        }}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="font-bold text-white text-lg mb-1">{plan.name}</h3>
                    <p className="text-gray-500 text-sm mb-5">{plan.desc}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                      <span className="text-gray-500 mb-1.5 text-sm">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: plan.highlight ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)' }}>
                          <Check size={11} className={plan.highlight ? 'text-brand-400' : 'text-gray-500'} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/auth/signup"
                    className={`w-full flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                      plan.highlight ? 'btn-primary' : 'btn-secondary'
                    }`}
                    style={plan.highlight ? {} : {}}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === CTA BANNER === */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="rounded-2xl p-12 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(6,182,212,0.08) 50%, rgba(139,92,246,0.1) 100%)',
                border: '1px solid rgba(16,185,129,0.2)',
              }}>
              <div className="orb orb-green w-48 h-48 -top-10 -left-10 opacity-30" />
              <div className="orb orb-violet w-40 h-40 -bottom-10 -right-10 opacity-25" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 mb-6">
                  <Clock size={14} className="text-brand-400" />
                  <span className="text-sm text-brand-400 font-semibold">Start in 2 minutes</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                  Ready to transform your nutrition?
                </h2>
                <p className="text-gray-400 mb-8 text-lg">
                  Join thousands who&apos;ve reached their goals with FahmiFit.
                </p>
                <Link href="/auth/signup" className="btn-gradient text-base px-10 py-4 rounded-xl font-bold">
                  Get started free <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* === FOOTER === */}
        <footer className="px-6 py-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)' }}>
                <Zap size={15} className="text-white" fill="white" />
              </div>
              <span className="font-bold gradient-text">FahmiFit</span>
            </div>
            <p className="text-sm text-gray-600">© 2025 FahmiFit. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
