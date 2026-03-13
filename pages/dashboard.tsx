import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle, StatCard } from '@/components/ui/Card'
import ProgressRing from '@/components/ui/ProgressRing'
import { MacroBadge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { getGreeting, todayISO, formatDate } from '@/lib/utils'
import { User, DailyLog } from '@/lib/database.types'
import {
  Flame, Droplets, Apple, TrendingUp, Plus,
  CheckCircle2, MessageCircle, ChevronRight,
  Zap, Award, Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

type MealEntry = { name: string; calories: number; protein: number; carbs: number; fat: number }

export default function DashboardPage() {
  const [user, setUser] = useState<Partial<User> | null>(null)
  const [todayLog, setTodayLog] = useState<Partial<DailyLog> | null>(null)
  const [streak, setStreak] = useState(0)
  const [weeklyAvg, setWeeklyAvg] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

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
      const { data: logs } = await supabase
        .from('daily_logs')
        .select('log_date, total_calories')
        .eq('user_id', session.user.id)
        .order('log_date', { ascending: false })
        .limit(30)

      if (logs) {
        let s = 0
        const today = new Date()
        for (let i = 0; i < 30; i++) {
          const d = new Date(today)
          d.setDate(d.getDate() - i)
          const iso = d.toISOString().split('T')[0]
          const found = logs.find(l => l.log_date === iso)
          if (found && (found.total_calories || 0) > 0) s++
          else if (i > 0) break
        }
        setStreak(s)

        const last7 = logs.slice(0, 7)
        if (last7.length > 0) {
          const avg = last7.reduce((acc, l) => acc + (l.total_calories || 0), 0) / last7.length
          setWeeklyAvg(Math.round(avg))
        }
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
      await supabase.from('daily_logs').insert({
        user_id: session.user.id,
        log_date: todayISO(),
        water_ml: newWater,
      })
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
    { key: 'breakfast', label: 'Breakfast', icon: '🌅', time: '7–9 AM',  color: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.25)' },
    { key: 'lunch',     label: 'Lunch',     icon: '☀️',  time: '12–2 PM', color: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)' },
    { key: 'dinner',    label: 'Dinner',    icon: '🌙',  time: '6–8 PM',  color: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.25)' },
    { key: 'snacks',    label: 'Snacks',    icon: '🍎',  time: 'Anytime', color: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.25)' },
  ]

  const firstName = user?.full_name?.split(' ')[0] || 'there'

  return (
    <DashboardLayout pageTitle="Dashboard">
      {/* Greeting */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-brand-400" />
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
            {formatDate(new Date())}
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight"
          style={{ color: '#f0f4f8' }}>
          {getGreeting()}, <span className="gradient-text-green">{firstName}</span> 👋
        </h1>
        <p className="text-gray-500 mt-1.5">Let&apos;s hit your nutrition goals today</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Calorie Target"
          value={caloriesTarget}
          unit="kcal"
          icon={<Flame size={18} />}
          color="orange"
          sub={`${caloriesConsumed} consumed`}
        />
        <StatCard
          title="7-Day Streak"
          value={streak}
          unit="days"
          icon={<Award size={18} />}
          color="purple"
          sub="Keep it going!"
        />
        <StatCard
          title="Weekly Avg"
          value={weeklyAvg || '—'}
          unit={weeklyAvg ? 'kcal' : ''}
          icon={<TrendingUp size={18} />}
          color="cyan"
          sub="Avg calories / day"
        />
        <StatCard
          title="Water Today"
          value={Math.round(waterMl / 1000 * 10) / 10}
          unit="L"
          icon={<Droplets size={18} />}
          color="blue"
          sub={`Target: ${waterTarget / 1000}L`}
        />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Calorie ring + macros */}
        <Card padding="md" className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Today&apos;s Calories</CardTitle>
            <span className="text-xs font-semibold text-gray-600 bg-white/5 px-2.5 py-1 rounded-lg">
              {new Date().toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}
            </span>
          </CardHeader>
          <div className="flex flex-col items-center py-2">
            <ProgressRing
              value={caloriesPct}
              size={155}
              strokeWidth={10}
              color={caloriesPct > 100 ? '#ef4444' : '#10b981'}
              label={`${caloriesPct}%`}
              sub={`${caloriesConsumed} / ${caloriesTarget}`}
            />
            <p className="text-sm mt-3 font-medium"
              style={{ color: caloriesTarget - caloriesConsumed > 0 ? '#6ee7b7' : '#f87171' }}>
              {caloriesTarget - caloriesConsumed > 0
                ? `${caloriesTarget - caloriesConsumed} kcal remaining`
                : `${caloriesConsumed - caloriesTarget} kcal over target`}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <MacroBadge label="Protein"  value={proteinConsumed}  unit={`/${user?.protein_target || 0}g`} color="bg-blue-500/10 text-blue-400 border border-blue-500/20" />
            <MacroBadge label="Carbs"    value={carbsConsumed}    unit={`/${user?.carb_target || 0}g`}    color="bg-orange-500/10 text-orange-400 border border-orange-500/20" />
            <MacroBadge label="Fat"      value={fatConsumed}      unit={`/${user?.fat_target || 0}g`}     color="bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" />
          </div>
        </Card>

        {/* Meals */}
        <Card padding="md" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Meals Today</CardTitle>
            <Link href="/checkin">
              <button className="btn-primary text-xs px-3 py-1.5">
                <Plus size={13} /> Log meal
              </button>
            </Link>
          </CardHeader>
          <div className="space-y-2.5">
            {meals.map(meal => {
              const entries: MealEntry[] = Array.isArray((todayLog as Record<string, unknown>)?.[meal.key])
                ? (todayLog as Record<string, MealEntry[]>)[meal.key] as MealEntry[]
                : []
              const mealCals = entries.reduce((acc: number, item: MealEntry) => acc + (item.calories || 0), 0)
              const logged = entries.length > 0

              return (
                <div
                  key={meal.key}
                  className="flex items-center justify-between p-4 rounded-xl transition-all duration-200"
                  style={{
                    background: logged ? meal.color : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${logged ? meal.border : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{meal.icon}</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{meal.label}</p>
                      <p className="text-xs text-gray-600">{meal.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {logged ? (
                      <>
                        <span className="text-sm font-bold text-brand-400">{mealCals} kcal</span>
                        <CheckCircle2 size={16} className="text-brand-400" />
                      </>
                    ) : (
                      <Link href="/checkin"
                        className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-brand-400 transition-colors px-2.5 py-1.5 rounded-lg hover:bg-brand-500/10">
                        <Plus size={12} /> Add
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <Link href="/checkin">
            <button className="w-full mt-4 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-brand-400 hover:bg-brand-500/8 transition-all duration-200"
              style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              Open full meal log <ChevronRight size={14} />
            </button>
          </Link>
        </Card>

        {/* Water tracker */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Water Intake</CardTitle>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <Droplets size={13} className="text-cyan-400" />
              <span className="text-xs font-bold text-cyan-400">{waterMl}ml</span>
            </div>
          </CardHeader>
          <div className="mb-5">
            <div className="flex justify-between text-xs text-gray-600 mb-2">
              <span>0ml</span><span>{waterTarget}ml goal</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${waterPct}%`,
                  background: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
                  boxShadow: '0 0 8px rgba(6,182,212,0.5)',
                }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-2">{waterPct}% of daily goal</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[250, 500].map(ml => (
              <button
                key={ml}
                onClick={() => logWater(ml)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: 'rgba(6,182,212,0.08)',
                  border: '1px solid rgba(6,182,212,0.2)',
                  color: '#22d3ee',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(6,182,212,0.15)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(6,182,212,0.25)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(6,182,212,0.08)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <Droplets size={13} /> +{ml}ml
              </button>
            ))}
          </div>
        </Card>

        {/* Quick actions */}
        <Card padding="md">
          <CardTitle className="mb-4">Quick Actions</CardTitle>
          <div className="space-y-2">
            {[
              {
                href: '/checkin',
                icon: <Apple size={16} className="text-white" />,
                label: 'Log today\'s meals',
                sub: 'Daily check-in',
                gradient: 'linear-gradient(135deg, #10b981, #059669)',
                glow: 'rgba(16,185,129,0.3)',
              },
              {
                href: '/whatsapp',
                icon: <MessageCircle size={16} className="text-white" />,
                label: 'Connect WhatsApp',
                sub: 'Get meal reminders',
                gradient: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
                glow: 'rgba(6,182,212,0.3)',
              },
              {
                href: '/progress',
                icon: <TrendingUp size={16} className="text-white" />,
                label: 'View weekly progress',
                sub: 'Charts & insights',
                gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                glow: 'rgba(139,92,246,0.3)',
              },
            ].map(action => (
              <Link key={action.href} href={action.href}>
                <div className="flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group cursor-pointer"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.transform = 'translateX(2px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                    e.currentTarget.style.transform = 'translateX(0)'
                  }}>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: action.gradient,
                      boxShadow: `0 4px 12px ${action.glow}`,
                    }}>
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{action.label}</p>
                    <p className="text-xs text-gray-600">{action.sub}</p>
                  </div>
                  <ChevronRight size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Macro Breakdown */}
        <Card padding="md">
          <CardTitle className="mb-5">Macro Breakdown</CardTitle>
          {[
            {
              label: 'Protein',
              value: proteinConsumed,
              target: user?.protein_target || 1,
              gradient: 'linear-gradient(90deg, #3b82f6, #1d4ed8)',
              glow: 'rgba(59,130,246,0.5)',
              color: '#60a5fa',
            },
            {
              label: 'Carbs',
              value: carbsConsumed,
              target: user?.carb_target || 1,
              gradient: 'linear-gradient(90deg, #f59e0b, #ea580c)',
              glow: 'rgba(245,158,11,0.5)',
              color: '#fbbf24',
            },
            {
              label: 'Fat',
              value: fatConsumed,
              target: user?.fat_target || 1,
              gradient: 'linear-gradient(90deg, #a78bfa, #7c3aed)',
              glow: 'rgba(167,139,250,0.5)',
              color: '#c4b5fd',
            },
          ].map(macro => {
            const pct = Math.min(Math.round((macro.value / macro.target) * 100), 100)
            return (
              <div key={macro.label} className="mb-4 last:mb-0">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold" style={{ color: macro.color }}>{macro.label}</span>
                  <span className="text-gray-600 text-xs">{macro.value}g / {macro.target}g</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: macro.gradient,
                      boxShadow: `0 0 8px ${macro.glow}`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-700 mt-1">{pct}%</p>
              </div>
            )
          })}
        </Card>
      </div>
    </DashboardLayout>
  )
}
