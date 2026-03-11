import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Leaf, MessageCircle, TrendingUp, Bell, ChevronRight,
  Check, Zap, Users, BarChart2,
} from 'lucide-react'

const FEATURES = [
  {
    icon: <BarChart2 className="w-5 h-5" />,
    title: 'Smart Calorie Tracking',
    desc: 'Log meals in seconds. Get personalized calorie and macro targets based on your body and goals.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: <MessageCircle className="w-5 h-5" />,
    title: 'WhatsApp Check-ins',
    desc: 'Receive meal reminders and send your daily log directly via WhatsApp — no app required.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: <Bell className="w-5 h-5" />,
    title: 'Water & Meal Reminders',
    desc: 'Stay on track with smart reminders sent at the right time, every day.',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: 'Weekly Progress Reports',
    desc: 'Beautiful charts showing your calorie adherence, weight trend, and streak data.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: 'Nutritionist Panel',
    desc: 'Professional nutritionists can manage clients, create diet plans, and track progress.',
    color: 'bg-pink-50 text-pink-600',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: 'n8n Automation Ready',
    desc: 'Plug into n8n workflows for automated WhatsApp messages, summaries, and notifications.',
    color: 'bg-yellow-50 text-yellow-600',
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'For individuals getting started',
    features: ['Calorie tracking', 'Meal check-ins', '7-day history', 'Basic charts'],
    cta: 'Get started free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$9',
    period: '/month',
    desc: 'For serious nutrition goals',
    features: ['Everything in Free', 'WhatsApp integration', 'Water reminders', 'Weekly reports', 'Unlimited history'],
    cta: 'Start Pro trial',
    highlight: true,
  },
  {
    name: 'Premium',
    price: '$29',
    period: '/month',
    desc: 'With dedicated nutritionist',
    features: ['Everything in Pro', 'Nutritionist review', 'Custom diet plans', 'Priority support', 'Video consultations'],
    cta: 'Get Premium',
    highlight: false,
  },
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
        <title>NutriCoach — Nutrition Coaching with WhatsApp</title>
      </Head>
      <div className="min-h-screen bg-white">
        {/* Nav */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-lg">NutriCoach</span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="btn-primary text-sm"
              >
                Get started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-32 pb-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <Zap className="w-3.5 h-3.5" />
              WhatsApp + AI-powered nutrition coaching
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Reach your nutrition{' '}
              <span className="text-green-600">goals faster</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              Track meals, get WhatsApp reminders, and monitor your progress — all from one
              clean dashboard. Built for real people, not fitness obsessives.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link href="/auth/signup" className="btn-primary text-base px-8 py-3">
                Start for free <ChevronRight className="w-4 h-4" />
              </Link>
              <Link href="/auth/login" className="btn-secondary text-base px-8 py-3">
                Sign in
              </Link>
            </div>
            <p className="text-sm text-gray-400 mt-4">No credit card required · Free plan available</p>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Everything you need</h2>
              <p className="text-gray-500 text-lg">A complete nutrition coaching platform, ready to use</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((f) => (
                <div key={f.title} className="card p-6 hover:shadow-card-hover transition-shadow">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Simple pricing</h2>
              <p className="text-gray-500 text-lg">Choose a plan that fits your goals</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border p-7 ${
                    plan.highlight
                      ? 'border-green-500 shadow-elevated bg-white'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-green-600 text-white text-xs font-semibold px-4 py-1 rounded-full">
                        Most popular
                      </span>
                    </div>
                  )}
                  <div className="mb-5">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{plan.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">{plan.desc}</p>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-400 mb-1">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-2.5 mb-7">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/auth/signup"
                    className={`w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      plan.highlight
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-100 py-10 px-4">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
                <Leaf className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-gray-700">NutriCoach</span>
            </div>
            <p className="text-sm text-gray-400">© 2025 NutriCoach. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  )
}
