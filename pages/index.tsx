import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { motion, type Variants } from 'framer-motion'
import {
  BarChart2, MessageCircle, TrendingUp, Bell,
  Check, Zap, Users, Bot, ChevronRight, Sparkles,
  Shield, Clock, Star,
} from 'lucide-react'

// ─── Animation Variants ───────────────────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] } },
}
const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const cardAnim: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
}
const floatAnim: Variants = {
  rest: { y: 0, rotate: 0 },
  float: {
    y: [-8, 0, -8],
    rotate: [0.5, -0.5, 0.5],
    transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
  },
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <BarChart2 className="w-5 h-5" />,
    title: 'Smart Calorie Tracking',
    desc: 'Log meals in seconds with personalized macro targets tailored to your body and goals.',
    gradient: 'from-emerald-500 to-teal-600',
    glow: 'rgba(16,185,129,0.3)',
    glowColor: 'emerald',
  },
  {
    icon: <MessageCircle className="w-5 h-5" />,
    title: 'WhatsApp Check-ins',
    desc: 'Get meal reminders and send your daily log directly via WhatsApp — zero friction.',
    gradient: 'from-cyan-500 to-blue-600',
    glow: 'rgba(6,182,212,0.3)',
    glowColor: 'cyan',
  },
  {
    icon: <Bell className="w-5 h-5" />,
    title: 'Smart Reminders',
    desc: 'Stay consistent with intelligent reminders sent at exactly the right moment.',
    gradient: 'from-orange-500 to-rose-600',
    glow: 'rgba(249,115,22,0.3)',
    glowColor: 'orange',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Progress Analytics',
    desc: 'Beautiful charts showing calorie trends, weight progress, and weekly insights.',
    gradient: 'from-violet-500 to-purple-600',
    glow: 'rgba(139,92,246,0.3)',
    glowColor: 'violet',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Nutritionist Panel',
    desc: 'Professionals can manage clients, create custom diet plans, and track outcomes.',
    gradient: 'from-pink-500 to-rose-600',
    glow: 'rgba(236,72,153,0.3)',
    glowColor: 'pink',
  },
  {
    icon: <Bot className="w-5 h-5" />,
    title: 'AI Nutritionist',
    desc: 'Ask anything about your nutrition. Get personalized advice powered by AI.',
    gradient: 'from-amber-500 to-orange-600',
    glow: 'rgba(245,158,11,0.3)',
    glowColor: 'amber',
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
  { value: '100%', label: 'Free to start', icon: '🆓' },
  { value: 'AI', label: 'Powered nutrition coach', icon: '🤖' },
  { value: '24/7', label: 'WhatsApp reminders', icon: '💬' },
  { value: '6', label: 'Health goals supported', icon: '🎯' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Create your account',
    desc: 'Sign up in 30 seconds. Tell us your goals, weight, and dietary preferences.',
    gradient: 'from-emerald-500 to-cyan-500',
    glow: 'rgba(16,185,129,0.35)',
  },
  {
    step: '02',
    title: 'Log your meals',
    desc: 'Snap a photo, search our database, or just tell the AI what you ate.',
    gradient: 'from-cyan-500 to-violet-500',
    glow: 'rgba(6,182,212,0.35)',
  },
  {
    step: '03',
    title: 'Reach your goals',
    desc: 'Watch your progress charts climb. Get weekly AI insights and recommendations.',
    gradient: 'from-violet-500 to-pink-500',
    glow: 'rgba(139,92,246,0.35)',
  },
]

const TESTIMONIALS = [
  {
    initials: 'SR',
    name: 'Early Beta User',
    role: 'Weight loss journey',
    quote: 'Having calorie targets calculated specifically for my body made a real difference. The dashboard keeps me honest every single day.',
    stars: 5,
    gradient: 'from-emerald-500 to-cyan-500',
  },
  {
    initials: 'MK',
    name: 'Muscle-gain goal',
    role: 'Fitness & strength',
    quote: 'The macro breakdown is exactly what I needed for bulking. Protein targets, carb cycling — it\'s all there without any guesswork.',
    stars: 5,
    gradient: 'from-violet-500 to-pink-500',
  },
  {
    initials: 'LA',
    name: 'Maintenance focus',
    role: 'Long-term health',
    quote: 'The weekly progress charts keep me motivated. Seeing the trend line move in the right direction is genuinely addictive.',
    stars: 5,
    gradient: 'from-orange-500 to-rose-500',
  },
]

// ─── Dashboard Mockup (inline, not exported) ──────────────────────────────────
function DashboardMockup() {
  const macros = [
    { label: 'Protein', value: 142, max: 160, color: '#10b981' },
    { label: 'Carbs',   value: 210, max: 280, color: '#06b6d4' },
    { label: 'Fat',     value: 58,  max: 73,  color: '#8b5cf6' },
  ]
  const meals = [
    { name: 'Oats & berries',    kcal: '340 kcal', time: '8:00 AM' },
    { name: 'Grilled chicken',   kcal: '520 kcal', time: '1:00 PM' },
    { name: 'Greek yogurt',      kcal: '180 kcal', time: '4:00 PM' },
  ]
  const pct = 1840 / 2200
  const r = 28
  const circ = 2 * Math.PI * r
  const dash = circ * pct

  return (
    <div className="text-left">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-0.5">Today&apos;s Progress</p>
          <p className="text-white font-bold text-lg leading-none">1,840 <span className="text-gray-500 text-sm font-normal">/ 2,200 kcal</span></p>
        </div>
        {/* Calorie ring */}
        <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
          <circle cx="36" cy="36" r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${circ}`}
            strokeDashoffset={`${circ - dash}`} />
        </svg>
      </div>

      {/* Macro bars */}
      <div className="space-y-3 mb-5">
        {macros.map(m => (
          <div key={m.label}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{m.label}</span>
              <span>{m.value}g / {m.max}g</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(m.value / m.max) * 100}%`, background: m.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Recent meals */}
      <div>
        <p className="text-xs text-gray-600 uppercase tracking-widest mb-2">Recent meals</p>
        <div className="space-y-2">
          {meals.map(meal => (
            <div key={meal.name} className="flex items-center justify-between py-1.5 border-b border-white/5">
              <div>
                <p className="text-sm text-white font-medium leading-none mb-0.5">{meal.name}</p>
                <p className="text-xs text-gray-600">{meal.time}</p>
              </div>
              <span className="text-xs text-gray-400">{meal.kcal}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
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

        {/* ═══════════════════════════ NAV ═══════════════════════════ */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed top-0 left-0 right-0 z-50"
          style={{
            background: 'rgba(5,5,15,0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
                <Zap size={18} className="text-white" fill="white" />
              </div>
              <span className="font-bold text-xl tracking-tight gradient-text">FahmiFit</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
              <a href="#features"     className="hover:text-white transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
              <a href="#pricing"      className="hover:text-white transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login"
                className="text-sm font-medium text-gray-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
                Sign in
              </Link>
              <Link href="/auth/signup" className="btn-primary text-sm">
                Get started <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </motion.nav>

        {/* ═══════════════════════════ HERO ═══════════════════════════ */}
        <section className="relative pt-40 pb-20 px-6 overflow-hidden">
          {/* Animated grid */}
          <div className="grid-bg" />
          {/* Hero glow */}
          <div className="hero-glow" />
          {/* 5 orbs */}
          <div className="orb orb-green  w-[700px] h-[700px] -top-40 -left-40 opacity-25 animate-aurora" />
          <div className="orb orb-violet w-[600px] h-[600px] -top-20 -right-20 opacity-20 animate-aurora" style={{ animationDelay: '4s' }} />
          <div className="orb orb-cyan   w-[500px] h-[500px] bottom-0 left-1/2 -translate-x-1/2 opacity-15" />
          <div className="orb orb-orange w-[320px] h-[320px] top-1/3 right-0 opacity-12 animate-aurora" style={{ animationDelay: '8s' }} />
          <div className="orb orb-pink   w-[280px] h-[280px] top-1/4 left-10 opacity-10 animate-aurora" style={{ animationDelay: '2s' }} />

          <div className="max-w-5xl mx-auto text-center relative z-10">
            {/* Badge */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible"
              className="inline-flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full text-sm font-semibold"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}
            >
              <Sparkles size={13} />
              WhatsApp + AI-powered nutrition coaching
            </motion.div>

            {/* H1 */}
            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible"
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-extrabold tracking-tight leading-none mb-6"
            >
              <span className="gradient-text-rainbow">Eat smart.</span>
              <br />
              <span style={{ color: '#f0f4f8' }}>Live strong.</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              variants={fadeUp} initial="hidden" animate="visible"
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              Track meals, get WhatsApp reminders, and monitor your progress —
              all from one beautiful dashboard. Built for real people.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible"
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-4 flex-wrap mb-4"
            >
              <Link href="/auth/signup" className="btn-gradient text-base px-10 py-4 rounded-xl font-bold">
                Start for free <ChevronRight size={16} />
              </Link>
              <Link href="/auth/login"
                className="flex items-center gap-2 text-base px-8 py-4 rounded-xl font-semibold text-gray-300 hover:text-white transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                Sign in
              </Link>
            </motion.div>
            <motion.p
              variants={fadeUp} initial="hidden" animate="visible"
              transition={{ delay: 0.35 }}
              className="text-sm text-gray-600 mb-16"
            >
              No credit card required · Free plan available
            </motion.p>

            {/* Floating dashboard mockup */}
            <motion.div
              variants={floatAnim}
              initial="rest"
              animate="float"
              className="glass-panel mx-auto p-6 max-w-sm text-left relative z-10"
              style={{ boxShadow: '0 0 0 1px rgba(16,185,129,0.15), 0 40px 100px rgba(0,0,0,0.6), 0 0 80px rgba(16,185,129,0.08)' }}
            >
              <DashboardMockup />
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
            >
              {STATS.map(s => (
                <motion.div key={s.value} variants={cardAnim} className="text-center">
                  <div className="text-4xl font-extrabold gradient-text mb-1">{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════ HOW IT WORKS ═══════════════════════ */}
        <section id="how-it-works" className="py-28 px-6 relative overflow-hidden">
          <div className="section-divider mb-24" />
          <div className="orb orb-cyan   w-[400px] h-[400px] top-10 -left-20 opacity-10" />
          <div className="orb orb-violet w-[300px] h-[300px] bottom-10 right-0 opacity-08" />

          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="text-center mb-20"
            >
              <div className="pill mb-4"><Zap size={11} /> How it works</div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                Three steps to{' '}
                <span className="gradient-text">your best self</span>
              </h2>
              <p className="text-gray-400 text-lg mt-4 max-w-xl mx-auto">
                Simple enough to start today. Powerful enough to last forever.
              </p>
            </motion.div>

            <motion.div
              variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              className="grid md:grid-cols-3 gap-10 relative"
            >
              {/* Connecting line — desktop only */}
              <div className="hidden md:block absolute top-10 left-[16.6%] right-[16.6%] h-px"
                style={{ background: 'linear-gradient(90deg, #10b981, #8b5cf6)', opacity: 0.2 }} />

              {HOW_IT_WORKS.map(step => (
                <motion.div key={step.step} variants={cardAnim} className="text-center relative">
                  <div className={`w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-6 text-white font-black text-2xl`}
                    style={{ boxShadow: `0 12px 40px ${step.glow}` }}>
                    {step.step}
                  </div>
                  <h3 className="font-bold text-white text-xl mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <div className="section-divider mt-24" />
        </section>

        {/* ═══════════════════════ FEATURES ═══════════════════════════ */}
        <section id="features" className="py-24 px-6 relative">
          <div className="orb orb-violet w-[450px] h-[450px] top-10 right-0 opacity-12" />
          <div className="orb orb-pink   w-[300px] h-[300px] bottom-20 left-10 opacity-10" />

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="pill mb-4"><Shield size={11} /> Features</div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Everything you need
              </h2>
              <p className="text-gray-400 text-lg max-w-xl mx-auto">
                A complete nutrition coaching platform designed for real results.
              </p>
            </motion.div>

            <motion.div
              variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {FEATURES.map(f => (
                <motion.div
                  key={f.title}
                  variants={cardAnim}
                  className="feature-card group"
                  data-glow={f.glowColor}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-5 text-white shadow-lg transition-all duration-300 group-hover:scale-110`}
                    style={{ boxShadow: `0 8px 24px ${f.glow}` }}>
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════ TESTIMONIALS ═══════════════════════ */}
        <section id="testimonials" className="py-28 px-6 relative overflow-hidden">
          <div className="section-divider mb-24" />
          <div className="orb orb-orange w-[350px] h-[350px] top-0 right-20 opacity-10" />
          <div className="orb orb-green  w-[300px] h-[300px] bottom-10 left-0 opacity-08" />

          <div className="max-w-6xl mx-auto relative z-10">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="pill mb-4"><Star size={11} /> Testimonials</div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                Goal stories{' '}
                <span className="gradient-text-violet">from our users</span>
              </h2>
              <p className="text-gray-400 text-lg mt-4">
                Built for people who want real results — not guesswork.
              </p>
            </motion.div>

            <motion.div
              variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }}
              className="grid md:grid-cols-3 gap-6"
            >
              {TESTIMONIALS.map(t => (
                <motion.div key={t.name} variants={cardAnim} className="card-glass p-7">
                  {/* Stars */}
                  <div className="flex gap-1 mb-5" aria-label={`${t.stars} out of 5 stars`}>
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} size={14} className="text-amber-400" fill="#f59e0b" />
                    ))}
                  </div>
                  {/* Quote */}
                  <p className="text-gray-300 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{t.name}</p>
                      <p className="text-gray-500 text-xs">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
          <div className="section-divider mt-24" />
        </section>

        {/* ═══════════════════════ PRICING ════════════════════════════ */}
        <section id="pricing" className="py-24 px-6 relative">
          <div className="orb orb-green  w-[350px] h-[350px] bottom-0 left-10 opacity-12" />
          <div className="orb orb-orange w-[280px] h-[280px] top-20 right-0 opacity-10" />
          <div className="orb orb-pink   w-[240px] h-[240px] top-0 left-1/2 opacity-08" />

          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="pill mb-4"><Star size={11} /> Pricing</div>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                Simple, transparent pricing
              </h2>
              <p className="text-gray-400 text-lg">Choose a plan that fits your goals</p>
            </motion.div>

            <motion.div
              variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }}
              className="grid md:grid-cols-3 gap-6"
            >
              {PLANS.map(plan => (
                <motion.div
                  key={plan.name}
                  variants={cardAnim}
                  whileHover={plan.highlight ? { scale: 1.03 } : { y: -4 }}
                  className="relative rounded-2xl p-7 transition-colors duration-300"
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
                            ? 'linear-gradient(135deg,#10b981,#06b6d4)'
                            : 'linear-gradient(135deg,#8b5cf6,#ec4899)',
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
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-gray-400">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ background: plan.highlight ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)' }}>
                          <Check size={11} className={plan.highlight ? 'text-emerald-400' : 'text-gray-500'} />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/auth/signup"
                    className={`w-full flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-all duration-200 ${plan.highlight ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════ CTA BANNER ═════════════════════════ */}
        <section className="py-20 px-6">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="max-w-3xl mx-auto"
          >
            <div className="card-gradient rounded-3xl p-14 relative overflow-hidden text-center aurora-bg noise-bg">
              <div className="orb orb-green  w-64 h-64 -top-16 -left-16 opacity-30" />
              <div className="orb orb-violet w-56 h-56 -bottom-12 -right-12 opacity-25" />
              <div className="orb orb-pink   w-40 h-40 top-1/2 right-1/4 opacity-15" />
              <div className="relative z-10">
                <div className="pill mb-6">
                  <Clock size={11} /> Start in 2 minutes
                </div>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4">
                  Ready to transform<br />
                  <span className="gradient-text-rainbow">your nutrition?</span>
                </h2>
                <p className="text-gray-400 mb-8 text-lg">
                  Start free today — no credit card, no fluff, just results.
                </p>
                <Link href="/auth/signup" className="btn-gradient text-base px-12 py-4 rounded-xl font-bold">
                  Get started free <ChevronRight size={16} />
                </Link>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ═══════════════════════ FOOTER ═════════════════════════════ */}
        <footer className="px-6 py-16" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-10 mb-12">
              {/* Brand */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
                    <Zap size={18} className="text-white" fill="white" />
                  </div>
                  <span className="font-bold text-xl gradient-text">FahmiFit</span>
                </div>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6">
                  AI-powered nutrition coaching for real people. Track, learn, and thrive — one meal at a time.
                </p>
                {/* Social links */}
                <div className="flex items-center gap-3">
                  {/* Twitter/X */}
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#94a3b8">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.732-8.853L1.445 2.25H8.42l4.262 5.632 5.562-5.632Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  {/* WhatsApp */}
                  <a href="https://wa.me" target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#94a3b8">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  </a>
                  {/* GitHub */}
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="#94a3b8">
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Product links */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-widest">Product</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li><a href="#features"     className="hover:text-gray-300 transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-gray-300 transition-colors">How it works</a></li>
                  <li><a href="#pricing"      className="hover:text-gray-300 transition-colors">Pricing</a></li>
                  <li><Link href="/auth/signup" className="hover:text-gray-300 transition-colors">Get started</Link></li>
                </ul>
              </div>

              {/* Legal links */}
              <div>
                <h4 className="text-white font-semibold text-sm mb-4 uppercase tracking-widest">Legal</h4>
                <ul className="space-y-3 text-sm text-gray-500">
                  <li><a href="#" className="hover:text-gray-300 transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-gray-300 transition-colors">Terms of Service</a></li>
                </ul>
              </div>
            </div>

            <div className="section-divider mb-6" />
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600">© 2025 FahmiFit. All rights reserved.</p>
              <p className="text-xs text-gray-700">Built with AI. Powered by love for nutrition.</p>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
