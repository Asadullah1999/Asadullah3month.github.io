import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  BarChart2, MessageCircle, TrendingUp, Bell,
  Check, Zap, Users, Bot, ChevronRight, Sparkles,
  Shield, Star, Crown, Lock, X, KeyRound,
  Dumbbell, Moon, ShoppingCart, ScanLine, Activity,
  ArrowRight, Play, Flame,
} from 'lucide-react'

const FEATURES = [
  {
    icon: <BarChart2 className="w-6 h-6" />, title: 'Smart Calorie Tracking',
    desc: 'Log meals in seconds with personalized macro targets tailored to your body and goals.',
    gradient: 'from-emerald-400 to-teal-500', glow: 'rgba(16,185,129,0.35)', tag: 'Free',
  },
  {
    icon: <MessageCircle className="w-6 h-6" />, title: 'WhatsApp Check-ins',
    desc: 'Get meal reminders and send your daily log directly via WhatsApp — zero friction.',
    gradient: 'from-cyan-400 to-blue-500', glow: 'rgba(6,182,212,0.35)', tag: 'Pro',
  },
  {
    icon: <Bell className="w-6 h-6" />, title: 'Smart Reminders',
    desc: 'Stay consistent with intelligent reminders sent at exactly the right moment.',
    gradient: 'from-orange-400 to-rose-500', glow: 'rgba(249,115,22,0.35)', tag: 'Pro',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />, title: 'Progress Analytics',
    desc: 'Beautiful charts showing calorie trends, weight progress, and weekly insights.',
    gradient: 'from-violet-400 to-purple-600', glow: 'rgba(139,92,246,0.35)', tag: 'Pro',
  },
  {
    icon: <Bot className="w-6 h-6" />, title: 'AI Nutritionist',
    desc: 'Ask anything about your nutrition. Get personalized advice powered by AI.',
    gradient: 'from-amber-400 to-orange-500', glow: 'rgba(245,158,11,0.35)', tag: 'Pro',
  },
  {
    icon: <Users className="w-6 h-6" />, title: 'Nutritionist Panel',
    desc: 'Professionals can manage clients, create custom diet plans, and track outcomes.',
    gradient: 'from-pink-400 to-rose-500', glow: 'rgba(236,72,153,0.35)', tag: 'Premium',
  },
  {
    icon: <ScanLine className="w-6 h-6" />, title: 'Meal & Barcode Scanner',
    desc: 'Scan any food item or take a photo of your meal — AI identifies it instantly.',
    gradient: 'from-lime-400 to-emerald-500', glow: 'rgba(132,204,22,0.35)', tag: 'Premium',
  },
  {
    icon: <Dumbbell className="w-6 h-6" />, title: 'Workout Tracker',
    desc: 'Log workouts, track calories burned, and see your fitness progress over time.',
    gradient: 'from-indigo-400 to-blue-600', glow: 'rgba(99,102,241,0.35)', tag: 'Premium',
  },
  {
    icon: <ShoppingCart className="w-6 h-6" />, title: 'AI Grocery Lists',
    desc: 'Get smart shopping lists based on your diet plan and nutrition targets.',
    gradient: 'from-teal-400 to-cyan-500', glow: 'rgba(20,184,166,0.35)', tag: 'Pro',
  },
]

const PLANS = [
  {
    key: 'free', name: 'Free', price: '$0', period: '/month',
    desc: 'Start your nutrition journey',
    features: ['Calorie & macro tracking', 'Daily meal check-ins', '7-day history', 'Basic charts', 'Profile & settings'],
    cta: 'Get started free', ctaHref: '/auth/signup', highlight: false, badge: null, paid: false,
    style: { border: 'rgba(255,255,255,0.08)', bg: 'rgba(255,255,255,0.03)', btn: 'rgba(255,255,255,0.08)', glow: 'transparent' },
  },
  {
    key: 'pro', name: 'Pro', price: '$9', period: '/month',
    desc: 'For serious nutrition goals',
    features: ['Everything in Free', 'AI Nutritionist chat', 'WhatsApp integration', 'Smart reminders', 'Sleep & weight log', 'Grocery list AI', 'Unlimited history'],
    cta: 'Contact Owner', ctaHref: null, highlight: true, badge: 'Most Popular', paid: true,
    style: { border: 'rgba(16,185,129,0.4)', bg: 'rgba(16,185,129,0.06)', btn: 'linear-gradient(135deg,#10b981,#06b6d4)', glow: 'rgba(16,185,129,0.15)' },
  },
  {
    key: 'premium', name: 'Premium', price: '$29', period: '/month',
    desc: 'With dedicated nutritionist',
    features: ['Everything in Pro', 'Meal scanner (AI)', 'Barcode scanner', 'Workout tracker', 'Custom diet plans', 'Nutritionist review', 'Priority support'],
    cta: 'Contact Owner', ctaHref: null, highlight: false, badge: 'Best Results', paid: true,
    style: { border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.05)', btn: 'linear-gradient(135deg,#f59e0b,#a78bfa)', glow: 'rgba(245,158,11,0.15)' },
  },
]

const STATS = [
  { value: '50K+', label: 'Active users', color: '#34d399', glow: 'rgba(16,185,129,0.2)' },
  { value: '2M+', label: 'Meals logged', color: '#38bdf8', glow: 'rgba(6,182,212,0.2)' },
  { value: '98%', label: 'Goal success rate', color: '#a78bfa', glow: 'rgba(139,92,246,0.2)' },
  { value: '4.9★', label: 'Average rating', color: '#fbbf24', glow: 'rgba(245,158,11,0.2)' },
]

const TESTIMONIALS = [
  { name: 'Sarah K.', role: 'Lost 18 lbs in 3 months', text: 'FahmiFit completely changed how I eat. The AI nutritionist actually gives useful advice, not generic tips.', avatar: 'S', color: '#10b981' },
  { name: 'Malik R.', role: 'Gained 8 lbs muscle', text: 'WhatsApp check-ins are a game changer. No more forgetting to log meals — it reminds me automatically.', avatar: 'M', color: '#06b6d4' },
  { name: 'Priya N.', role: 'Maintained goal weight', text: 'The barcode scanner saves me so much time. I just scan and everything is logged. Incredible app.', avatar: 'P', color: '#8b5cf6' },
  { name: 'James T.', role: 'Marathon runner', text: 'Best nutrition app I\'ve used. The workout tracker + calorie math together is exactly what I needed.', avatar: 'J', color: '#f59e0b' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Set Up Your Profile', desc: 'Enter your age, weight, goals and dietary preferences. Takes 2 minutes.', icon: <Activity size={22} />, color: '#10b981' },
  { step: '02', title: 'Log Meals Daily', desc: 'Use barcode scanner, AI meal scanner, or quick text entry to track every meal effortlessly.', icon: <ScanLine size={22} />, color: '#06b6d4' },
  { step: '03', title: 'Track & Achieve', desc: 'Watch your progress charts grow, get AI advice, and reach your goals faster than ever.', icon: <TrendingUp size={22} />, color: '#8b5cf6' },
]

interface ContactModalProps {
  planName: string
  planStyle: typeof PLANS[0]['style']
  onClose: () => void
}

function ContactModal({ planName, planStyle, onClose }: ContactModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
      <div className="w-full max-w-md rounded-2xl p-8 relative"
        style={{
          background: 'rgba(8,8,20,0.98)',
          border: `1px solid ${planStyle.border}`,
          boxShadow: `0 0 80px ${planStyle.glow}, 0 30px 80px rgba(0,0,0,0.7)`,
        }}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
          <X size={18} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: planStyle.btn, boxShadow: `0 8px 32px ${planStyle.glow}` }}>
            {planName === 'Premium' ? <Crown size={28} className="text-white" /> : <Zap size={28} className="text-white" fill="white" />}
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Get {planName} Access</h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            To purchase the <strong className="text-white">{planName} plan</strong>, contact the owner directly.
            Payment is processed offline — fast and secure.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <a href="https://wa.me/message/contact" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(37,211,102,0.15)' }}>
              <MessageCircle size={20} className="text-green-400" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">WhatsApp</p>
              <p className="text-xs text-gray-500">Fastest response — message us now</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-green-400" />
          </a>
          <a href="mailto:contact@fahmifit.com"
            className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(6,182,212,0.12)' }}>
              <KeyRound size={20} className="text-cyan-400" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Email</p>
              <p className="text-xs text-gray-500">contact@fahmifit.com</p>
            </div>
            <ArrowRight size={16} className="ml-auto text-cyan-400" />
          </a>
        </div>

        <p className="text-center text-xs text-gray-600">
          After payment, you&apos;ll receive an activation code to enter in the app.
          <Link href="/auth/signup" className="text-brand-400 font-semibold ml-1 hover:underline" onClick={onClose}>
            Sign up first →
          </Link>
        </p>
      </div>
    </div>
  )
}

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Free:    { bg: 'rgba(107,114,128,0.15)',  text: '#9ca3af', border: 'rgba(107,114,128,0.3)' },
  Pro:     { bg: 'rgba(16,185,129,0.12)',   text: '#34d399', border: 'rgba(16,185,129,0.3)' },
  Premium: { bg: 'rgba(245,158,11,0.12)',   text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
}

export default function LandingPage() {
  const router = useRouter()
  const [contactPlan, setContactPlan] = useState<typeof PLANS[0] | null>(null)

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
          background: 'rgba(5,5,15,0.85)',
          backdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}>
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)', boxShadow: '0 0 24px rgba(16,185,129,0.5)' }}>
                <Zap className="text-white" fill="white" size={18} />
              </div>
              <span className="font-extrabold text-xl tracking-tight gradient-text">FahmiFit</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
              <a href="#features" className="hover:text-white transition-colors hover:text-shadow">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
              <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                Sign in
              </Link>
              <Link href="/auth/signup" className="btn-primary text-sm">
                Get started <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </nav>

        {/* === HERO === */}
        <section className="relative pt-36 pb-32 px-6 overflow-hidden">
          {/* Rich multi-color background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="orb orb-green w-[700px] h-[700px] -top-40 -left-40 opacity-25 animate-aurora" />
            <div className="orb orb-violet w-[600px] h-[600px] -top-20 -right-20 opacity-20 animate-aurora" style={{ animationDelay: '4s' }} />
            <div className="orb orb-cyan w-[500px] h-[500px] bottom-0 left-1/3 opacity-15" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full opacity-5"
              style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.6) 0%, transparent 70%)' }} />
          </div>

          {/* Dot grid */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

          <div className="max-w-5xl mx-auto text-center relative z-10">
            {/* Animated badge */}
            <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-sm font-bold shimmer-badge">
              <Sparkles size={14} className="text-amber-400" />
              <span className="gradient-text-rainbow">WhatsApp + AI Nutrition Coaching</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
              <span className="gradient-text-rainbow">Transform</span>{' '}
              <span style={{ color: '#f0f4f8' }}>your nutrition</span>
              <br />
              <span className="gradient-text">with AI power</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Track meals, get WhatsApp reminders, chat with an AI nutritionist, and monitor your progress —
              all from one beautiful dashboard designed for real results.
            </p>

            {/* CTAs */}
            <div className="flex items-center justify-center gap-4 flex-wrap mb-8">
              <Link href="/auth/signup" className="btn-gradient text-base px-9 py-4 rounded-xl font-bold shadow-2xl">
                Start for free <ChevronRight size={16} />
              </Link>
              <a href="#features"
                className="flex items-center gap-2 text-base px-8 py-4 rounded-xl font-semibold text-gray-300 hover:text-white transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Play size={14} fill="currentColor" /> See features
              </a>
            </div>
            <p className="text-sm text-gray-600">No credit card required · Free plan always available</p>

            {/* Floating app preview cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
              {[
                { label: 'Calories Today', value: '1,842', sub: 'of 2,100 goal', color: '#10b981', icon: <Flame size={14} /> },
                { label: 'Streak', value: '14 days', sub: 'Keep it up!', color: '#f59e0b', icon: <Zap size={14} /> },
                { label: 'Water', value: '6 / 8', sub: 'glasses today', color: '#06b6d4', icon: <Activity size={14} /> },
                { label: 'AI Advice', value: 'New tip', sub: 'from nutritionist', color: '#8b5cf6', icon: <Bot size={14} /> },
              ].map(card => (
                <div key={card.label} className="rounded-2xl p-4 text-left"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${card.color}30`,
                    boxShadow: `0 4px 20px ${card.color}15`,
                    backdropFilter: 'blur(10px)',
                  }}>
                  <div className="flex items-center gap-1.5 mb-2" style={{ color: card.color }}>
                    {card.icon}
                    <span className="text-xs font-semibold opacity-80">{card.label}</span>
                  </div>
                  <p className="text-lg font-extrabold text-white leading-tight">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{card.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === STATS === */}
        <section className="py-16 px-6 relative">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {STATS.map(s => (
                <div key={s.value} className="rounded-2xl p-6 text-center relative overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${s.color}25`,
                    boxShadow: `0 0 30px ${s.glow}, inset 0 1px 0 rgba(255,255,255,0.06)`,
                  }}>
                  <div className="absolute inset-0 opacity-5"
                    style={{ background: `radial-gradient(circle at 50% 0%, ${s.color}, transparent 70%)` }} />
                  <div className="text-3xl md:text-4xl font-extrabold mb-1" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === HOW IT WORKS === */}
        <section id="how-it-works" className="py-24 px-6 relative">
          <div className="orb orb-cyan w-[300px] h-[300px] top-0 right-0 opacity-10" />
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="pill mb-4"><Zap size={11} fill="currentColor" /> How It Works</div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Up and running in <span className="gradient-text-green">2 minutes</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">Three simple steps to transform your nutrition.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 relative">
              {/* Connecting line */}
              <div className="hidden md:block absolute top-10 left-1/4 right-1/4 h-px"
                style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.4), rgba(6,182,212,0.4), rgba(139,92,246,0.4))' }} />

              {HOW_IT_WORKS.map((step, i) => (
                <div key={step.step} className="relative rounded-2xl p-7"
                  style={{
                    background: `linear-gradient(135deg, ${step.color}08 0%, rgba(255,255,255,0.02) 100%)`,
                    border: `1px solid ${step.color}25`,
                    boxShadow: `0 0 30px ${step.color}10`,
                  }}>
                  <div className="text-6xl font-extrabold mb-4 opacity-20" style={{ color: step.color }}>{step.step}</div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${step.color}20`, border: `1px solid ${step.color}40`, color: step.color }}>
                    {step.icon}
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                  {i < 2 && (
                    <div className="hidden md:flex absolute -right-3 top-10 w-6 h-6 rounded-full items-center justify-center z-10"
                      style={{ background: '#05050f', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <ChevronRight size={12} className="text-gray-500" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === FEATURES === */}
        <section id="features" className="py-24 px-6 relative">
          <div className="orb orb-violet w-[450px] h-[450px] top-20 left-0 opacity-10" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="pill mb-4"><Shield size={11} /> Features</div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Everything you need to <span className="gradient-text">succeed</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                A complete nutrition coaching platform. From free basics to premium AI-powered tools.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {FEATURES.map(f => {
                const tag = TAG_COLORS[f.tag]
                return (
                  <div key={f.title} className="feature-card group relative">
                    <div className="absolute top-4 right-4">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                        style={{ background: tag.bg, border: `1px solid ${tag.border}`, color: tag.text }}>
                        {f.tag}
                      </span>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 text-white shadow-lg transition-all duration-300 group-hover:scale-110`}
                      style={{ boxShadow: `0 8px 24px ${f.glow}` }}>
                      {f.icon}
                    </div>
                    <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* === PRICING === */}
        <section id="pricing" className="py-24 px-6 relative">
          <div className="orb orb-green w-[400px] h-[400px] bottom-10 left-0 opacity-12" />
          <div className="orb w-[350px] h-[350px] top-10 right-0 opacity-10"
            style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, transparent 70%)' }} />
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="pill mb-4"><Star size={11} fill="currentColor" /> Pricing</div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Simple, transparent <span className="gradient-text-gold">pricing</span>
              </h2>
              <p className="text-gray-400 text-lg">Choose a plan that fits your goals. Upgrade anytime with a secret code.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {PLANS.map(plan => (
                <div
                  key={plan.key}
                  className={`relative rounded-2xl p-7 transition-all duration-300 ${plan.highlight ? 'scale-105 md:scale-[1.04]' : 'hover:-translate-y-1'}`}
                  style={{
                    background: plan.style.bg,
                    border: `1px solid ${plan.style.border}`,
                    boxShadow: plan.highlight
                      ? `0 0 0 1px ${plan.style.border}, 0 20px 60px ${plan.style.glow}`
                      : 'none',
                  }}>
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full text-white"
                        style={{ background: plan.style.btn, boxShadow: `0 4px 16px ${plan.style.glow}` }}>
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      {plan.key === 'premium' && <Crown size={16} className="text-amber-400" />}
                      {plan.key === 'pro' && <Zap size={16} className="text-emerald-400" fill="currentColor" />}
                      <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                    </div>
                    <p className="text-gray-500 text-sm mb-5">{plan.desc}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-5xl font-extrabold text-white">{plan.price}</span>
                      <span className="text-gray-500 mb-2 text-sm">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-7">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: plan.highlight ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)' }}>
                          <Check size={11} className={plan.highlight ? 'text-emerald-400' : plan.key === 'premium' ? 'text-amber-400' : 'text-gray-500'} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {plan.paid ? (
                    <button
                      onClick={() => setContactPlan(plan)}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
                      style={{ background: plan.style.btn, boxShadow: `0 4px 20px ${plan.style.glow}` }}>
                      <MessageCircle size={14} /> Contact Owner
                    </button>
                  ) : (
                    <Link href={plan.ctaHref!}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-gray-300 hover:text-white transition-all duration-200"
                      style={{ background: plan.style.btn, border: '1px solid rgba(255,255,255,0.1)' }}>
                      {plan.cta} <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-gray-600 mt-8">
              Payment is processed offline via WhatsApp or email. You&apos;ll receive an activation code after payment.
            </p>
          </div>
        </section>

        {/* === TESTIMONIALS === */}
        <section id="testimonials" className="py-24 px-6 relative">
          <div className="orb orb-cyan w-[300px] h-[300px] bottom-0 right-20 opacity-10" />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-16">
              <div className="pill mb-4"><Star size={11} fill="currentColor" /> Testimonials</div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Loved by <span className="gradient-text">thousands</span>
              </h2>
              <p className="text-gray-400 text-lg">Real people, real results.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
              {TESTIMONIALS.map(t => (
                <div key={t.name} className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                  }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${t.color}, ${t.color}88)`, boxShadow: `0 4px 12px ${t.color}40` }}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{t.name}</p>
                      <p className="text-xs" style={{ color: t.color }}>{t.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className="text-amber-400" fill="currentColor" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* === CTA BANNER === */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-3xl p-12 relative overflow-hidden text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(6,182,212,0.08) 30%, rgba(139,92,246,0.1) 60%, rgba(245,158,11,0.08) 100%)',
                border: '1px solid rgba(16,185,129,0.2)',
                boxShadow: '0 0 80px rgba(16,185,129,0.1), 0 0 120px rgba(139,92,246,0.08)',
              }}>
              <div className="absolute -top-20 -left-20 w-48 h-48 rounded-full opacity-30"
                style={{ background: 'radial-gradient(circle, #10b981, transparent)', filter: 'blur(40px)' }} />
              <div className="absolute -bottom-20 -right-20 w-56 h-56 rounded-full opacity-25"
                style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', filter: 'blur(50px)' }} />
              <div className="absolute top-1/2 right-10 w-32 h-32 rounded-full opacity-20"
                style={{ background: 'radial-gradient(circle, #f59e0b, transparent)', filter: 'blur(30px)' }} />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <Sparkles size={13} className="text-emerald-400" />
                  <span className="text-sm text-emerald-400 font-semibold">Start in 2 minutes</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                  Ready to{' '}
                  <span className="gradient-text-rainbow">transform</span>
                  {' '}your nutrition?
                </h2>
                <p className="text-gray-400 mb-8 text-lg max-w-xl mx-auto">
                  Join thousands who&apos;ve reached their goals with FahmiFit. Free to start, no credit card needed.
                </p>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                  <Link href="/auth/signup" className="btn-gradient text-base px-10 py-4 rounded-xl font-bold">
                    Get started free <ChevronRight size={16} />
                  </Link>
                  <a href="#pricing"
                    className="text-base px-8 py-4 rounded-xl font-semibold text-gray-300 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    View pricing
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* === FOOTER === */}
        <footer className="px-6 py-12" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                  <Zap size={15} className="text-white" fill="white" />
                </div>
                <span className="font-bold gradient-text text-lg">FahmiFit</span>
              </div>
              <div className="flex gap-8 text-sm text-gray-500">
                <a href="#features" className="hover:text-gray-300 transition-colors">Features</a>
                <a href="#pricing" className="hover:text-gray-300 transition-colors">Pricing</a>
                <a href="#testimonials" className="hover:text-gray-300 transition-colors">Reviews</a>
                <Link href="/auth/login" className="hover:text-gray-300 transition-colors">Sign in</Link>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-6"
              style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <p className="text-sm text-gray-700">© 2025 FahmiFit. All rights reserved.</p>
              <div className="flex gap-6 text-sm text-gray-700">
                <a href="#" className="hover:text-gray-500 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-gray-500 transition-colors">Terms of Service</a>
                <a href="mailto:contact@fahmifit.com" className="hover:text-gray-500 transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Contact Owner Modal */}
      {contactPlan && (
        <ContactModal
          planName={contactPlan.name}
          planStyle={contactPlan.style}
          onClose={() => setContactPlan(null)}
        />
      )}
    </>
  )
}
