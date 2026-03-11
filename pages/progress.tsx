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
      const d = addWeeks(weekStart, 0)
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

  return (
    <DashboardLayout pageTitle="Progress" title="Weekly Progress">
      <div className="space-y-6">
        {/* Week selector */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{weekLabel}</h2>
            {weekData[0] && weekData[6] && (
              <p className="text-sm text-gray-400">
                {format(new Date(weekData[0].iso), 'MMM d')} – {format(new Date(weekData[6].iso), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(w => w - 1)}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setWeekOffset(w => Math.min(w + 1, 0))}
              disabled={weekOffset >= 0}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
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
        <Card padding="md">
          <CardTitle className="mb-4">Daily Adherence</CardTitle>
          <div className="grid grid-cols-7 gap-2">
            {weekData.map(day => {
              const pct = target > 0 ? (day.calories / target) * 100 : 0
              const isGood = pct >= 85 && pct <= 115
              const isOver  = pct > 115
              const isFuture = new Date(day.iso) > new Date()

              return (
                <div key={day.iso} className="text-center">
                  <p className="text-xs font-medium text-gray-500 mb-2">{day.date}</p>
                  <div className={`h-16 rounded-xl flex items-end justify-center pb-1.5 text-xs font-bold transition-all ${
                    isFuture ? 'bg-gray-50 border border-dashed border-gray-200 text-gray-300' :
                    !day.logged ? 'bg-gray-100 text-gray-300' :
                    isGood  ? 'bg-green-100 text-green-700' :
                    isOver  ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}
                    style={{
                      background: isFuture ? undefined : day.logged
                        ? `linear-gradient(to top, ${
                            isGood ? '#bbf7d0' : isOver ? '#fecaca' : '#fef3c7'
                          } ${Math.min(pct, 100)}%, #f9fafb ${Math.min(pct, 100)}%)`
                        : undefined,
                    }}
                  >
                    {day.logged && !isFuture ? `${Math.round(pct)}%` : ''}
                  </div>
                  {day.logged && !isFuture && (
                    <p className="text-xs text-gray-400 mt-1">{day.calories}</p>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-200" /> On target (±15%)</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-yellow-200" /> Under target</div>
            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-red-200" /> Over target</div>
          </div>
        </Card>

        {/* Calorie bar chart */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Calories This Week</CardTitle>
            <Badge variant="green">{daysLogged} days logged</Badge>
          </CardHeader>
          {weekData.length > 0 ? (
            <WeeklyCalorieChart
              data={weekData.map(d => ({
                date: d.date,
                calories: d.calories,
                target: target,
              }))}
            />
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-400">
              <p className="text-sm">No data for this week</p>
            </div>
          )}
        </Card>

        {/* Macro line chart */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Macro Trends</CardTitle>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block" />Protein</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-orange-400 inline-block" />Carbs</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-400 inline-block" />Fat</span>
            </div>
          </CardHeader>
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
            <div className="h-40 flex items-center justify-center text-gray-400">
              <p className="text-sm">No data for this week</p>
            </div>
          )}
        </Card>

        {/* Water chart */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Water Intake</CardTitle>
            <span className="text-xs text-gray-400">Target: 2,500ml</span>
          </CardHeader>
          {weekData.some(d => d.logged) ? (
            <WaterChart data={weekData.map(d => ({ date: d.date, water: d.water }))} />
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400">
              <p className="text-sm">No data for this week</p>
            </div>
          )}
        </Card>

        {/* Day-by-day table */}
        <Card padding="md">
          <CardTitle className="mb-4">Detailed Log</CardTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 pb-3">Day</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-3">Calories</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-3">Protein</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-3 hidden sm:table-cell">Carbs</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-3 hidden sm:table-cell">Fat</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-3">Water</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {weekData.map(day => {
                  const isFuture = new Date(day.iso) > new Date()
                  const pct = target > 0 ? (day.calories / target) * 100 : 0
                  const status = !day.logged ? 'missed' : pct >= 85 && pct <= 115 ? 'on-target' : pct > 115 ? 'over' : 'under'

                  return (
                    <tr key={day.iso} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-medium text-gray-700">
                        {day.date}
                        <span className="text-xs text-gray-400 ml-2">{format(new Date(day.iso), 'MMM d')}</span>
                      </td>
                      <td className="py-3 text-right font-semibold text-gray-900">
                        {day.logged ? day.calories : '—'}
                      </td>
                      <td className="py-3 text-right text-gray-600">{day.logged ? `${day.protein}g` : '—'}</td>
                      <td className="py-3 text-right text-gray-600 hidden sm:table-cell">{day.logged ? `${day.carbs}g` : '—'}</td>
                      <td className="py-3 text-right text-gray-600 hidden sm:table-cell">{day.logged ? `${day.fat}g` : '—'}</td>
                      <td className="py-3 text-right text-gray-600">{day.logged ? `${Math.round(day.water / 100) / 10}L` : '—'}</td>
                      <td className="py-3 text-right">
                        {isFuture ? (
                          <span className="text-xs text-gray-300">Upcoming</span>
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
        </Card>
      </div>
    </DashboardLayout>
  )
}
