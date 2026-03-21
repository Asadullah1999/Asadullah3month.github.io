import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { StatCard } from '@/components/ui/Card'
import ProgressRing from '@/components/ui/ProgressRing'
import { MacroBadge } from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { getGreeting, todayISO, formatDate } from '@/lib/utils'
import { User, DailyLog } from '@/lib/database.types'
import {
  Flame, Droplets, Apple, TrendingUp, Plus,
  CheckCircle2, MessageCircle, ChevronRight,
  Award, Sparkles, Target, Brain, Zap, Star,
  ArrowUp, Coffee, Sun, Moon,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

type MealEntry = { name: string; calories: number; protein: number; carbs: number; fat: number }

const DAILY_TIPS = [
  { tip: "Drink a glass of water before each meal to help with portion control and hydration.", icon: <Droplets size={16} />, color: '#22d3ee' },
  { tip: "Eating protein at breakfast reduces hunger hormones and keeps you full longer.", icon: <Zap size={16} />, color: '#10b981' },
  { tip: "Chewing slowly increases satiety signals — aim for 20-30 chews per bite.", icon: <Apple size={16} />, color: '#f59e0b' },
  { tip: "Meal prepping on Sundays can reduce calorie intake by up to 30% during the week.", icon: <Target size={16} />, color: '#8b5cf6' },
  { tip: "Getting 7-9 hours of sleep reduces cravings for high-calorie foods by 45%.", icon: <Moon size={16} />, color: '#6366f1' },
  { tip: "Adding a side salad to any meal boosts fiber and micronutrient intake significantly.", icon: <Sparkles size={16} />, color: '#34d399' },
]

export default function DashboardPage() {
  const [user, setUser] = useState<Partial<User> | null>(null)
  const [todayLog, setTodayLog] = useState<Partial<DailyLog> | null>(null)
  const [streak, setStreak] = useState(0)
  const [weeklyAvg, setWeeklyAvg] = useState(0)
  const [loading, setLoading] = useState(true)
  const [weekLogDates, setWeekLogDates] = useState<Set<string>>(new Set())
  const [dailyTip] = useState(() => DAILY_TIPS[Math.floor(Math.random() * DAILY_TIPS.length)])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const [{ data: userData }, { data: logData }] = await Promise.all([
      supabase.from('users').select('*').eq('id', session.user.id).single(),
      supabase.from('daily_logs').select('*').eq('user_id', session.user.id).eq('log_date', todayISO()).maybeSingle(),
    ])

    if (userData) setUser(userData)
    if (logData) setTodayLog(logData)

    if (userData) {
      const { data: logs } = await supabase.from('daily_logs').select('log_date, total_calories').eq('user_id', session.user.id).order('log_date', { ascending: false }).limit(30) as { data: Array<{ log_date: string; total_calories: number | null }> | null }
      if (logs) {
        // Build set of dates with logged data for the current week
        const weekDates = new Set<string>()
        const now = new Date()
        const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1
        for (let i = 0; i <= dayOfWeek; i++) {
          const d = new Date(now); d.setDate(d.getDate() - (dayOfWeek - i))
          const iso = d.toISOString().split('T')[0]
          const found = logs.find(l => l.log_date === iso)
          if (found && (found.total_calories || 0) > 0) weekDates.add(iso)
        }
        setWeekLogDates(weekDates)
        let s = 0
        const today = new Date()
        for (let i = 0; i < 30; i++) {
          const d = new Date(today); d.setDate(d.getDate() - i)
          const iso = d.toISOString().split('T')[0]
          const found = logs.find(l => l.log_date === iso)
          if (found && (found.total_calories || 0) > 0) s++
          else if (i > 0) break
        }
        setStreak(s)
        const last7 = logs.slice(0, 7)
        if (last7.length > 0) setWeeklyAvg(Math.round(last7.reduce((acc, l) => acc + (l.total_calories || 0), 0) / last7.length))
      }
    }
    setLoading(false)
  }

  async function logWater(ml: number) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const current = todayLog?.water_ml || 0
    const newWater = current + ml
    if (todayLog?.id) {
      await supabase.from('daily_logs').update({ water_ml: newWater }).eq('id', todayLog.id)
    } else {
      await supabase.from('daily_logs').insert({ user_id: session.user.id, log_date: todayISO(), water_ml: newWater })
    }
    toast.success(`+${ml}ml water logged!`)
    loadData()
  }

  const caloriesConsumed = todayLog?.total_calories || 0
  const caloriesTarget = user?.calorie_target || 2000
  const caloriesPct = Math.min(Math.round((caloriesConsumed / caloriesTarget) * 100), 100)
  const waterMl = todayLog?.water_ml || 0
  const waterTarget = 2500
  const waterPct = Math.min(Math.round((waterMl / waterTarget) * 100), 100)
  const proteinConsumed  = Math.round(todayLog?.total_protein || 0)
  const carbsConsumed    = Math.round(todayLog?.total_carbs || 0)
  const fatConsumed      = Math.round(todayLog?.total_fat || 0)

  const meals = [
    { key: 'breakfast', label: 'Breakfast', icon: '🌅', time: '7–9 AM',  color: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', accent: '#fbbf24' },
    { key: 'lunch',     label: 'Lunch',     icon: '☀️',  time: '12–2 PM', color: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  accent: '#34d399' },
    { key: 'dinner',    label: 'Dinner',    icon: '🌙',  time: '6–8 PM',  color: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.25)',  accent: '#a78bfa' },
    { key: 'snacks',    label: 'Snacks',    icon: '🍎',  time: 'Anytime', color: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.25)',   accent: '#22d3ee' },
  ]

  const firstName = user?.full_name?.split(' ')[0] || 'there'

  // BMI calc
  const bmi = user?.height_cm && user?.weight_kg
    ? Math.round((user.weight_kg / Math.pow(user.height_cm / 100, 2)) * 10) / 10
    : null
  const bmiLabel = bmi
    ? bmi < 18.5 ? { text: 'Underweight', color: '#60a5fa' }
    : bmi < 25   ? { text: 'Normal',      color: '#34d399' }
    : bmi < 30   ? { text: 'Overweight',  color: '#fbbf24' }
    : { text: 'Obese', color: '#f87171' }
    : null

  const hour = new Date().getHours()
  const timeIcon = hour < 12 ? <Coffee size={16} /> : hour < 17 ? <Sun size={16} /> : <Moon size={16} />

  return (
    <DashboardLayout pageTitle="Dashboard">
      {/* Greeting */}
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-brand-400">{timeIcon}</span>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{formatDate(new Date())}</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: '#f0f4f8' }}>
            {getGreeting()}, <span className="gradient-text-green">{firstName}</span> 👋
          </h1>
          <p className="text-gray-500 mt-1.5">Let&apos;s crush your nutrition goals today</p>
        </div>
        {streak >= 3 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))',
              border: '1px solid rgba(245,158,11,0.25)',
              boxShadow: '0 4px 14px rgba(245,158,11,0.15)',
            }}>
            <span className="text-2xl">🔥</span>
            <div>
              <p className="text-xs text-amber-500 font-bold uppercase tracking-wide">Hot streak!</p>
              <p className="text-white font-extrabold text-sm">{streak} days in a row</p>
            </div>
          </div>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard title="Calorie Target" value={caloriesTarget} unit="kcal" icon={<Flame size={18} />} color="orange" sub={`${caloriesConsumed} consumed`} />
        <StatCard title="7-Day Streak"   value={streak}           unit="days" icon={<Award size={18} />}  color="purple" sub="Keep it going!" />
        <StatCard title="Weekly Avg"     value={weeklyAvg || '—'} unit={weeklyAvg ? 'kcal' : ''} icon={<TrendingUp size={18} />} color="cyan" sub="Avg calories / day" />
        <StatCard title="Water Today"    value={Math.round(waterMl / 1000 * 10) / 10} unit="L" icon={<Droplets size={18} />} color="blue" sub={`Target: ${waterTarget / 1000}L`} />
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Calorie ring */}
        <div className="rounded-2xl p-5 lg:col-span-1"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Today&apos;s Calories</h3>
            <span className="text-xs font-semibold text-gray-600 px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {new Date().toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </div>
          <div className="flex flex-col items-center py-2">
            <ProgressRing value={caloriesPct} size={155} strokeWidth={10}
              color={caloriesPct > 100 ? '#ef4444' : '#10b981'}
              label={`${caloriesPct}%`} sub={`${caloriesConsumed} / ${caloriesTarget}`} />
            <p className="text-sm mt-3 font-semibold"
              style={{ color: caloriesTarget - caloriesConsumed > 0 ? '#6ee7b7' : '#f87171' }}>
              {caloriesTarget - caloriesConsumed > 0
                ? `${caloriesTarget - caloriesConsumed} kcal remaining`
                : `${caloriesConsumed - caloriesTarget} kcal over target`}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <MacroBadge label="Protein" value={proteinConsumed} unit={`/${user?.protein_target || 0}g`} color="bg-blue-500/10 text-blue-400 border border-blue-500/20" />
            <MacroBadge label="Carbs"   value={carbsConsumed}   unit={`/${user?.carb_target || 0}g`}   color="bg-orange-500/10 text-orange-400 border border-orange-500/20" />
            <MacroBadge label="Fat"     value={fatConsumed}     unit={`/${user?.fat_target || 0}g`}     color="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" />
          </div>
        </div>

        {/* Meals */}
        <div className="rounded-2xl p-5 lg:col-span-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white">Meals Today</h3>
            <Link href="/checkin">
              <button className="btn-primary text-xs px-3 py-2">
                <Plus size={12} /> Log meal
              </button>
            </Link>
          </div>
          <div className="space-y-2.5">
            {meals.map(meal => {
              const entries: MealEntry[] = Array.isArray((todayLog as Record<string, unknown>)?.[meal.key])
                ? (todayLog as Record<string, MealEntry[]>)[meal.key] as MealEntry[]
                : []
              const mealCals = entries.reduce((acc, item) => acc + (item.calories || 0), 0)
              const logged = entries.length > 0
              return (
                <div key={meal.key} className="flex items-center justify-between p-4 rounded-xl transition-all duration-200"
                  style={{
                    background: logged ? meal.color : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${logged ? meal.border : 'rgba(255,255,255,0.05)'}`,
                  }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{meal.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{meal.label}</p>
                      <p className="text-xs text-gray-600">{meal.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {logged ? (
                      <>
                        <span className="text-sm font-bold" style={{ color: meal.accent }}>{mealCals} kcal</span>
                        <CheckCircle2 size={16} style={{ color: meal.accent }} />
                      </>
                    ) : (
                      <Link href="/checkin"
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all duration-200 text-gray-600 hover:text-brand-400"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <Plus size={12} /> Add
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <Link href="/checkin">
            <button className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-brand-400 transition-all duration-200"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              Open full meal log <ChevronRight size={13} />
            </button>
          </Link>
        </div>

        {/* Water tracker */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Droplets size={16} className="text-cyan-400" /> Water Intake
            </h3>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <span className="text-xs font-extrabold text-cyan-400">{waterPct}%</span>
            </div>
          </div>
          {/* Visual water rings */}
          <div className="flex justify-center mb-4 relative">
            <svg width="120" height="120" className="-rotate-90">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none" stroke="url(#waterGrad)" strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - waterPct / 100)}`}
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.7s ease' }} />
              <defs>
                <linearGradient id="waterGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-white">{(waterMl / 1000).toFixed(1)}</span>
              <span className="text-xs text-gray-500 font-medium">/ {waterTarget / 1000}L</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[250, 500].map(ml => (
              <button key={ml} onClick={() => logWater(ml)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
                style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#22d3ee' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.15)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(6,182,212,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.08)'; e.currentTarget.style.boxShadow = 'none' }}>
                <Droplets size={13} /> +{ml}ml
              </button>
            ))}
          </div>
        </div>

        {/* Daily Tip widget */}
        <div className="rounded-2xl p-5 relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))',
            border: '1px solid rgba(16,185,129,0.18)',
          }}>
          <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20"
            style={{ background: 'radial-gradient(circle, #10b981, transparent)', filter: 'blur(20px)' }} />
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: dailyTip.color }}>
              {dailyTip.icon}
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-400">Daily Tip</p>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{dailyTip.tip}</p>
          <div className="flex items-center gap-1 mt-3">
            <Star size={11} className="text-amber-400" />
            <Star size={11} className="text-amber-400" />
            <Star size={11} className="text-amber-400" />
            <span className="text-xs text-gray-600 ml-1">Nutrition insight</span>
          </div>
        </div>

        {/* BMI widget */}
        {bmi && bmiLabel && (
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Target size={15} className="text-violet-400" /> BMI Score
              </h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: `${bmiLabel.color}18`, border: `1px solid ${bmiLabel.color}35`, color: bmiLabel.color }}>
                {bmiLabel.text}
              </span>
            </div>
            <div className="text-center mb-4">
              <p className="text-5xl font-extrabold text-white mb-1">{bmi}</p>
              <p className="text-xs text-gray-500">Body Mass Index</p>
            </div>
            {/* BMI scale */}
            <div className="relative h-3 rounded-full overflow-hidden mb-2"
              style={{ background: 'linear-gradient(90deg, #60a5fa 0%, #34d399 25%, #fbbf24 60%, #f87171 100%)' }}>
              <div className="absolute top-0 bottom-0 w-0.5 bg-white rounded-full shadow-lg"
                style={{ left: `${Math.min(Math.max(((bmi - 10) / 30) * 100, 2), 98)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-bold text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            {[
              { href: '/checkin',   icon: <Apple size={15} className="text-white" />,         label: 'Log today\'s meals',     sub: 'Daily check-in',       gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.3)' },
              { href: '/whatsapp',  icon: <MessageCircle size={15} className="text-white" />,  label: 'Connect WhatsApp',       sub: 'Get meal reminders',   gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)', glow: 'rgba(6,182,212,0.3)' },
              { href: '/progress',  icon: <TrendingUp size={15} className="text-white" />,     label: 'View weekly progress',   sub: 'Charts & insights',    gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', glow: 'rgba(139,92,246,0.3)' },
              { href: '/ai-chat',   icon: <Brain size={15} className="text-white" />,          label: 'Ask AI Nutritionist',    sub: 'Personalized advice',  gradient: 'linear-gradient(135deg, #f59e0b, #ea580c)', glow: 'rgba(245,158,11,0.3)' },
            ].map(action => (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group cursor-pointer"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.transform = 'translateX(2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.transform = 'translateX(0)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: action.gradient, boxShadow: `0 4px 10px ${action.glow}` }}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white">{action.label}</p>
                    <p className="text-xs text-gray-600">{action.sub}</p>
                  </div>
                  <ChevronRight size={13} className="text-gray-700 group-hover:text-gray-500 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Macro breakdown */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-bold text-white mb-5">Macro Breakdown</h3>
          {[
            { label: 'Protein', value: proteinConsumed, target: user?.protein_target || 1, gradient: 'linear-gradient(90deg, #3b82f6, #1d4ed8)', glow: 'rgba(59,130,246,0.5)',  color: '#60a5fa' },
            { label: 'Carbs',   value: carbsConsumed,   target: user?.carb_target || 1,    gradient: 'linear-gradient(90deg, #f59e0b, #ea580c)', glow: 'rgba(245,158,11,0.5)', color: '#fbbf24' },
            { label: 'Fat',     value: fatConsumed,     target: user?.fat_target || 1,     gradient: 'linear-gradient(90deg, #a78bfa, #7c3aed)', glow: 'rgba(167,139,250,0.5)', color: '#c4b5fd' },
          ].map(macro => {
            const pct = Math.min(Math.round((macro.value / macro.target) * 100), 100)
            return (
              <div key={macro.label} className="mb-4 last:mb-0">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: macro.color }} />
                    <span className="text-sm font-semibold text-white">{macro.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{macro.value}g / {macro.target}g</span>
                    {pct >= 80 && <ArrowUp size={11} className="text-brand-400" />}
                  </div>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: macro.gradient, boxShadow: `0 0 8px ${macro.glow}` }} />
                </div>
                <p className="text-xs mt-1" style={{ color: pct >= 100 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#6b7280' }}>{pct}%</p>
              </div>
            )
          })}
        </div>

        {/* Week at a glance */}
        <div className="rounded-2xl p-5 lg:col-span-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-white">This Week at a Glance</h3>
            <Link href="/progress" className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors">
              View full progress <ChevronRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {['M','T','W','T','F','S','S'].map((day, i) => {
              const now = new Date()
              const today = now.getDay()
              const adjustedToday = today === 0 ? 6 : today - 1
              const isToday = i === adjustedToday
              const isPast = i < adjustedToday
              // Calculate the date for this day of the week
              const dayDate = new Date(now)
              dayDate.setDate(dayDate.getDate() - (adjustedToday - i))
              const dayISO = dayDate.toISOString().split('T')[0]
              const filled = isPast ? weekLogDates.has(dayISO) : false
              return (
                <div key={i} className="flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: isToday ? '#34d399' : '#4b5563' }}>{day}</span>
                  <div className="w-full aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200"
                    style={isToday ? {
                      background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
                      color: '#fff',
                    } : filled ? {
                      background: 'rgba(16,185,129,0.15)',
                      border: '1px solid rgba(16,185,129,0.3)',
                      color: '#34d399',
                    } : {
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      color: '#374151',
                    }}>
                    {isToday ? '●' : filled ? '✓' : '·'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
