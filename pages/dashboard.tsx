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
  CheckCircle2, Clock, MessageCircle, ChevronRight,
  Zap, Award,
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

    // Compute 7-day streak
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

        // Weekly avg calories
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

  // Macro consumed
  const proteinConsumed  = Math.round(todayLog?.total_protein || 0)
  const carbsConsumed    = Math.round(todayLog?.total_carbs || 0)
  const fatConsumed      = Math.round(todayLog?.total_fat || 0)

  const meals = [
    { key: 'breakfast', label: 'Breakfast', icon: '🌅', time: '7–9 AM' },
    { key: 'lunch',     label: 'Lunch',     icon: '☀️',  time: '12–2 PM' },
    { key: 'dinner',    label: 'Dinner',    icon: '🌙',  time: '6–8 PM' },
    { key: 'snacks',    label: 'Snacks',    icon: '🍎',  time: 'Anytime' },
  ]

  return (
    <DashboardLayout pageTitle="Dashboard">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {getGreeting()}, {user?.full_name?.split(' ')[0] || 'there'} 👋
        </h1>
        <p className="text-gray-500 mt-1">{formatDate(new Date())} · Let&apos;s hit your goal today</p>
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
          color="blue"
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
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calorie ring + macros */}
        <Card padding="md" className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Today&apos;s Calories</CardTitle>
            <span className="text-sm text-gray-400">{new Date().toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </CardHeader>
          <div className="flex flex-col items-center py-2">
            <ProgressRing
              value={caloriesPct}
              size={150}
              strokeWidth={10}
              color={caloriesPct > 100 ? '#ef4444' : '#22c55e'}
              label={`${caloriesPct}%`}
              sub={`${caloriesConsumed} / ${caloriesTarget}`}
            />
            <p className="text-sm text-gray-500 mt-3">
              {caloriesTarget - caloriesConsumed > 0
                ? `${caloriesTarget - caloriesConsumed} kcal remaining`
                : `${caloriesConsumed - caloriesTarget} kcal over target`}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <MacroBadge label="Protein"  value={proteinConsumed}  unit={`/${user?.protein_target || 0}g`} color="bg-blue-50 text-blue-700" />
            <MacroBadge label="Carbs"    value={carbsConsumed}    unit={`/${user?.carb_target || 0}g`}    color="bg-orange-50 text-orange-700" />
            <MacroBadge label="Fat"      value={fatConsumed}      unit={`/${user?.fat_target || 0}g`}     color="bg-yellow-50 text-yellow-700" />
          </div>
        </Card>

        {/* Meals */}
        <Card padding="md" className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Meals Today</CardTitle>
            <Link href="/checkin">
              <Button variant="secondary" size="sm">
                <Plus size={14} /> Log meal
              </Button>
            </Link>
          </CardHeader>
          <div className="space-y-3">
            {meals.map(meal => {
              const entries: MealEntry[] = Array.isArray((todayLog as Record<string, unknown>)?.[meal.key])
                ? (todayLog as Record<string, MealEntry[]>)[meal.key] as MealEntry[]
                : []
              const mealCals = entries.reduce((acc: number, item: MealEntry) => acc + (item.calories || 0), 0)
              const logged = entries.length > 0

              return (
                <div
                  key={meal.key}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-colors ${
                    logged ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{meal.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{meal.label}</p>
                      <p className="text-xs text-gray-400">{meal.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {logged ? (
                      <>
                        <span className="text-sm font-semibold text-green-700">{mealCals} kcal</span>
                        <CheckCircle2 size={16} className="text-green-500" />
                      </>
                    ) : (
                      <Link href="/checkin" className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-600 transition-colors">
                        <Plus size={14} /> Add
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <Link href="/checkin">
            <Button variant="ghost" size="sm" fullWidth className="mt-4 text-green-600 hover:bg-green-50">
              Open full meal log <ChevronRight size={14} />
            </Button>
          </Link>
        </Card>

        {/* Water tracker */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Water Intake</CardTitle>
            <div className="flex items-center gap-1">
              <Droplets size={16} className="text-blue-400" />
              <span className="text-sm font-semibold text-blue-600">{waterMl}ml</span>
            </div>
          </CardHeader>
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>0ml</span><span>{waterTarget}ml goal</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-400 transition-all duration-500"
                style={{ width: `${waterPct}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">{waterPct}% of daily goal</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[250, 500].map(ml => (
              <button
                key={ml}
                onClick={() => logWater(ml)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
              >
                <Droplets size={14} /> +{ml}ml
              </button>
            ))}
          </div>
        </Card>

        {/* Quick actions */}
        <Card padding="md">
          <CardTitle className="mb-4">Quick Actions</CardTitle>
          <div className="space-y-2.5">
            <Link href="/checkin">
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 cursor-pointer transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center">
                  <Apple size={16} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Log today&apos;s meals</p>
                  <p className="text-xs text-gray-400">Daily check-in</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-green-500 transition-colors" />
              </div>
            </Link>
            <Link href="/whatsapp">
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 cursor-pointer transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <MessageCircle size={16} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Connect WhatsApp</p>
                  <p className="text-xs text-gray-400">Get meal reminders</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-green-500 transition-colors" />
              </div>
            </Link>
            <Link href="/progress">
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50 cursor-pointer transition-colors group">
                <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                  <TrendingUp size={16} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">View weekly progress</p>
                  <p className="text-xs text-gray-400">Charts & insights</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-green-500 transition-colors" />
              </div>
            </Link>
          </div>
        </Card>

        {/* Calorie breakdown bar */}
        <Card padding="md">
          <CardTitle className="mb-4">Macro Breakdown</CardTitle>
          {[
            { label: 'Protein', value: proteinConsumed, target: user?.protein_target || 1, color: 'bg-blue-400' },
            { label: 'Carbs',   value: carbsConsumed,   target: user?.carb_target || 1,    color: 'bg-orange-400' },
            { label: 'Fat',     value: fatConsumed,     target: user?.fat_target || 1,      color: 'bg-yellow-400' },
          ].map(macro => {
            const pct = Math.min(Math.round((macro.value / macro.target) * 100), 100)
            return (
              <div key={macro.label} className="mb-4 last:mb-0">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-gray-700">{macro.label}</span>
                  <span className="text-gray-500">{macro.value}g / {macro.target}g</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full ${macro.color} transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </Card>
      </div>
    </DashboardLayout>
  )
}
