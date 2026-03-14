import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle, StatCard } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { WeeklyCalorieChart, MacroLineChart, WaterChart } from '@/components/charts/WeeklyChart'
import { supabase } from '@/lib/supabase'
import { User, DailyLog } from '@/lib/database.types'
import {
  TrendingUp, Flame, Droplets, Award, Target, CheckCircle2, XCircle,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { format, subDays, startOfWeek, addWeeks } from 'date-fns'

type WeekDay = {
  date: string
  iso: string
  calories: number
  protein: number
  carbs: number
  fat: number
  water: number
  logged: boolean
}

export default function ProgressPage() {
  const [user, setUser] = useState<Partial<User> | null>(null)
  const [weekData, setWeekData] = useState<WeekDay[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [weekOffset])

  async function loadData() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: userData } = await supabase.from('users').select('*').eq('id', session.user.id).single()
    if (userData) setUser(userData)

    // Build 7-day window
    const weekStart = addWeeks(startOfWeek(new Date(), { weekStartsOn: 1 }), weekOffset)
    const days: WeekDay[] = []
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart)
      day.setDate(day.getDate() + i)
      const iso = day.toISOString().split('T')[0]
      days.push({
        date: format(day, 'EEE'),
        iso,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        water: 0,
        logged: false,
      })
    }

    const startIso = days[0].iso
    const endIso = days[6].iso

    const { data: logs } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('log_date', startIso)
      .lte('log_date', endIso)

    if (logs) {
      for (const day of days) {
        const log = logs.find(l => l.log_date === day.iso)
        if (log) {
          day.calories = log.total_calories || 0
          day.protein  = Math.round(log.total_protein || 0)
          day.carbs    = Math.round(log.total_carbs || 0)
          day.fat      = Math.round(log.total_fat || 0)
          day.water    = log.water_ml || 0
          day.logged   = true
        }
      }
    }

    setWeekData(days)
    setLoading(false)
  }

  const target = user?.calorie_target || 2000
  const daysLogged = weekData.filter(d => d.logged).length
  const daysHitTarget = weekData.filter(d => d.logged && d.calories >= target * 0.85 && d.calories <= target * 1.15).length
  const avgCalories = weekData.filter(d => d.logged).length > 0
    ? Math.round(weekData.filter(d => d.logged).reduce((a, d) => a + d.calories, 0) / weekData.filter(d => d.logged).length)
    : 0
  const avgWater = weekData.filter(d => d.logged).length > 0
    ? Math.round(weekData.filter(d => d.logged).reduce((a, d) => a + d.water, 0) / weekData.filter(d => d.logged).length)
    : 0

  const weekLabel = weekOffset === 0 ? 'This week' :
    weekOffset === -1 ? 'Last week' :
    `Week of ${weekData[0]?.iso ? format(new Date(weekData[0].iso), 'MMM d') : ''}`

  const navBtnStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#9ca3af',
  }

  return (
    <DashboardLayout pageTitle="Progress" title="Weekly Progress">
      <div className="space-y-6">
        {/* Week selector */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{weekLabel}</h2>
            {weekData[0] && weekData[6] && (
              <p className="text-sm text-gray-500">
                {format(new Date(weekData[0].iso), 'MMM d')} – {format(new Date(weekData[6].iso), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="p-2 rounded-xl transition-colors hover:text-white"
              style={navBtnStyle}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
              className="px-4 py-2 text-sm rounded-xl transition-colors hover:text-white disabled:opacity-40"
              style={navBtnStyle}
            >
              Today
            </button>
            <button
              onClick={() => setWeekOffset(w => Math.min(w + 1, 0))}
              disabled={weekOffset >= 0}
              className="p-2 rounded-xl transition-colors hover:text-white disabled:opacity-40"
              style={navBtnStyle}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Days Logged"
            value={daysLogged}
            unit="/ 7"
            icon={<CheckCircle2 size={18} />}
            color="green"
            sub="Consistency score"
          />
          <StatCard
            title="On Target"
            value={daysHitTarget}
            unit="days"
            icon={<Target size={18} />}
            color="blue"
            sub="Within ±15% of goal"
          />
          <StatCard
            title="Avg Calories"
            value={avgCalories || '—'}
            unit={avgCalories ? 'kcal' : ''}
            icon={<Flame size={18} />}
            color="orange"
            sub={`Goal: ${target} kcal`}
          />
          <StatCard
            title="Avg Water"
            value={avgWater ? `${Math.round(avgWater / 100) / 10}` : '—'}
            unit={avgWater ? 'L' : ''}
            icon={<Droplets size={18} />}
            color="blue"
            sub="Target: 2.5L/day"
          />
        </div>

        {/* Weekly adherence grid */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Daily Adherence</p>
          <div className="grid grid-cols-7 gap-2">
            {weekData.map(day => {
              const pct = target > 0 ? (day.calories / target) * 100 : 0
              const isGood = pct >= 85 && pct <= 115
              const isOver  = pct > 115
              const isFuture = new Date(day.iso) > new Date()

              let bg = 'rgba(255,255,255,0.04)'
              let textColor = '#4b5563'
              let borderColor = 'rgba(255,255,255,0.06)'

              if (!isFuture && day.logged) {
                if (isGood) { bg = 'rgba(16,185,129,0.15)'; textColor = '#34d399'; borderColor = 'rgba(16,185,129,0.3)' }
                else if (isOver) { bg = 'rgba(239,68,68,0.12)'; textColor = '#f87171'; borderColor = 'rgba(239,68,68,0.25)' }
                else { bg = 'rgba(245,158,11,0.12)'; textColor = '#fbbf24'; borderColor = 'rgba(245,158,11,0.25)' }
              }

              return (
                <div key={day.iso} className="text-center">
                  <p className="text-xs font-semibold text-gray-600 mb-2">{day.date}</p>
                  <div
                    className="h-16 rounded-xl flex items-end justify-center pb-1.5 text-xs font-bold transition-all"
                    style={{ background: bg, border: `1px solid ${borderColor}`, color: textColor }}
                  >
                    {day.logged && !isFuture ? `${Math.round(pct)}%` : ''}
                  </div>
                  {day.logged && !isFuture && (
                    <p className="text-xs text-gray-600 mt-1">{day.calories}</p>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-600">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(16,185,129,0.25)' }} />
              On target (±15%)
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(245,158,11,0.25)' }} />
              Under target
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ background: 'rgba(239,68,68,0.2)' }} />
              Over target
            </div>
          </div>
        </div>

        {/* Calorie bar chart */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white uppercase tracking-wider">Calories This Week</p>
            <Badge variant="green">{daysLogged} days logged</Badge>
          </div>
          {weekData.length > 0 ? (
            <WeeklyCalorieChart
              data={weekData.map(d => ({
                date: d.date,
                calories: d.calories,
                target: target,
              }))}
            />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600">
              <p className="text-sm">No data for this week</p>
            </div>
          )}
        </div>

        {/* Macro line chart */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white uppercase tracking-wider">Macro Trends</p>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block rounded" />Protein</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-400 inline-block rounded" />Carbs</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-400 inline-block rounded" />Fat</span>
            </div>
          </div>
          {weekData.some(d => d.logged) ? (
            <MacroLineChart
              data={weekData.map(d => ({
                date: d.date,
                protein: d.protein,
                carbs: d.carbs,
                fat: d.fat,
              }))}
            />
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-600">
              <p className="text-sm">No data for this week</p>
            </div>
          )}
        </div>

        {/* Water chart */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white uppercase tracking-wider">Water Intake</p>
            <span className="text-xs text-gray-500">Target: 2,500ml</span>
          </div>
          {weekData.some(d => d.logged) ? (
            <WaterChart data={weekData.map(d => ({ date: d.date, water: d.water }))} />
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-600">
              <p className="text-sm">No data for this week</p>
            </div>
          )}
        </div>

        {/* Day-by-day table */}
        <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Detailed Log</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="text-left text-xs font-semibold text-gray-600 pb-3 uppercase tracking-wider">Day</th>
                  <th className="text-right text-xs font-semibold text-gray-600 pb-3 uppercase tracking-wider">Calories</th>
                  <th className="text-right text-xs font-semibold text-gray-600 pb-3 uppercase tracking-wider">Protein</th>
                  <th className="text-right text-xs font-semibold text-gray-600 pb-3 uppercase tracking-wider hidden sm:table-cell">Carbs</th>
                  <th className="text-right text-xs font-semibold text-gray-600 pb-3 uppercase tracking-wider hidden sm:table-cell">Fat</th>
                  <th className="text-right text-xs font-semibold text-gray-600 pb-3 uppercase tracking-wider">Water</th>
                  <th className="text-right text-xs font-semibold text-gray-600 pb-3 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {weekData.map((day, i) => {
                  const isFuture = new Date(day.iso) > new Date()
                  const pct = target > 0 ? (day.calories / target) * 100 : 0
                  const status = !day.logged ? 'missed' : pct >= 85 && pct <= 115 ? 'on-target' : pct > 115 ? 'over' : 'under'

                  return (
                    <tr
                      key={day.iso}
                      className="transition-colors"
                      style={{ borderBottom: i < weekData.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                    >
                      <td className="py-3 font-semibold text-white">
                        {day.date}
                        <span className="text-xs text-gray-600 ml-2">{format(new Date(day.iso), 'MMM d')}</span>
                      </td>
                      <td className="py-3 text-right font-bold text-white">
                        {day.logged ? day.calories : <span className="text-gray-700">—</span>}
                      </td>
                      <td className="py-3 text-right text-gray-400">{day.logged ? `${day.protein}g` : <span className="text-gray-700">—</span>}</td>
                      <td className="py-3 text-right text-gray-400 hidden sm:table-cell">{day.logged ? `${day.carbs}g` : <span className="text-gray-700">—</span>}</td>
                      <td className="py-3 text-right text-gray-400 hidden sm:table-cell">{day.logged ? `${day.fat}g` : <span className="text-gray-700">—</span>}</td>
                      <td className="py-3 text-right text-gray-400">{day.logged ? `${Math.round(day.water / 100) / 10}L` : <span className="text-gray-700">—</span>}</td>
                      <td className="py-3 text-right">
                        {isFuture ? (
                          <span className="text-xs text-gray-700">Upcoming</span>
                        ) : (
                          <Badge variant={
                            status === 'on-target' ? 'green' :
                            status === 'over' ? 'red' :
                            status === 'under' ? 'orange' :
                            'gray'
                          }>
                            {status === 'on-target' ? 'On target' :
                             status === 'over' ? 'Over' :
                             status === 'under' ? 'Under' :
                             'Missed'}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
