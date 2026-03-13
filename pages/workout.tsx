import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import {
  Dumbbell, Flame, Clock, Plus, Trash2, Trophy, Zap,
  Activity, Heart, Wind, ChevronDown, ChevronUp, TrendingUp,
} from 'lucide-react'
import { format, subDays } from 'date-fns'

type WorkoutType = 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other'

type WorkoutLog = {
  id: string
  user_id: string
  exercise_name: string
  workout_type: WorkoutType
  duration_min: number
  calories_burned: number
  notes: string
  logged_at: string
}

const TYPE_CONFIG: Record<WorkoutType, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  strength:    { label: 'Strength',    icon: Dumbbell,  color: '#a78bfa', bg: 'rgba(139,92,246,0.12)',  border: 'rgba(139,92,246,0.25)'  },
  cardio:      { label: 'Cardio',      icon: Heart,     color: '#f87171', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.25)'   },
  flexibility: { label: 'Flexibility', icon: Activity,  color: '#34d399', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)'  },
  sports:      { label: 'Sports',      icon: Zap,       color: '#fbbf24', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.25)'  },
  other:       { label: 'Other',       icon: Wind,      color: '#60a5fa', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.25)'  },
}

// Common exercises for quick-add
const QUICK_EXERCISES = [
  { name: 'Running',        type: 'cardio'      as WorkoutType, cal_per_min: 10 },
  { name: 'Weight Lifting', type: 'strength'    as WorkoutType, cal_per_min: 6  },
  { name: 'Cycling',        type: 'cardio'      as WorkoutType, cal_per_min: 8  },
  { name: 'Yoga',           type: 'flexibility' as WorkoutType, cal_per_min: 4  },
  { name: 'Swimming',       type: 'cardio'      as WorkoutType, cal_per_min: 9  },
  { name: 'HIIT',           type: 'cardio'      as WorkoutType, cal_per_min: 12 },
  { name: 'Push-ups',       type: 'strength'    as WorkoutType, cal_per_min: 5  },
  { name: 'Walking',        type: 'cardio'      as WorkoutType, cal_per_min: 5  },
]

const TYPE_OPTIONS = Object.entries(TYPE_CONFIG).map(([value, { label }]) => ({ value, label }))

export default function WorkoutPage() {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    exercise_name: '',
    workout_type: 'strength' as WorkoutType,
    duration_min: '',
    calories_burned: '',
    notes: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) { setUserId(data.user.id); loadLogs(data.user.id) }
    })
  }, [])

  async function loadLogs(uid: string) {
    setLoading(true)
    const since = subDays(new Date(), 30).toISOString()
    const { data } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', uid)
      .gte('logged_at', since)
      .order('logged_at', { ascending: false })
    if (data) setLogs(data)
    setLoading(false)
  }

  function update(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  function quickAdd(ex: typeof QUICK_EXERCISES[0]) {
    const dur = 30
    setForm({
      exercise_name: ex.name,
      workout_type: ex.type,
      duration_min: dur.toString(),
      calories_burned: (dur * ex.cal_per_min).toString(),
      notes: '',
    })
    setShowForm(true)
  }

  async function saveLog() {
    if (!form.exercise_name || !form.duration_min) { toast.error('Name and duration required'); return }
    if (!userId) return
    setSaving(true)
    const { error } = await supabase.from('workout_logs').insert({
      user_id: userId,
      exercise_name: form.exercise_name,
      workout_type: form.workout_type,
      duration_min: parseInt(form.duration_min),
      calories_burned: parseInt(form.calories_burned) || 0,
      notes: form.notes,
      logged_at: new Date().toISOString(),
    })
    if (error) toast.error('Could not save workout')
    else {
      toast.success('Workout logged! 💪')
      setForm({ exercise_name: '', workout_type: 'strength', duration_min: '', calories_burned: '', notes: '' })
      setShowForm(false)
      loadLogs(userId)
    }
    setSaving(false)
  }

  async function deleteLog(id: string) {
    await supabase.from('workout_logs').delete().eq('id', id)
    toast.success('Removed')
    if (userId) loadLogs(userId)
  }

  // Stats
  const today = new Date().toISOString().split('T')[0]
  const todayLogs = logs.filter(l => l.logged_at.startsWith(today))
  const weekLogs = logs.filter(l => new Date(l.logged_at) >= subDays(new Date(), 7))
  const totalCalThisWeek = weekLogs.reduce((a, l) => a + (l.calories_burned || 0), 0)
  const totalMinThisWeek = weekLogs.reduce((a, l) => a + l.duration_min, 0)

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px' }

  return (
    <DashboardLayout pageTitle="Workout" title="Workout Tracker">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Today',         value: todayLogs.length,   unit: 'sessions', color: '#34d399', gradient: 'rgba(16,185,129,0.1)',  icon: <Dumbbell size={16} /> },
            { label: 'Week calories', value: totalCalThisWeek,   unit: 'kcal',     color: '#f87171', gradient: 'rgba(239,68,68,0.08)',  icon: <Flame size={16} />    },
            { label: 'Week time',     value: totalMinThisWeek,   unit: 'min',      color: '#60a5fa', gradient: 'rgba(59,130,246,0.08)', icon: <Clock size={16} />    },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-2xl text-center" style={{ background: s.gradient, border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex justify-center mb-2" style={{ color: s.color }}>{s.icon}</div>
              <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.unit}</p>
              <p className="text-xs text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Quick add exercises */}
        <div style={cardStyle} className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quick Add</p>
            <button
              onClick={() => { setForm({ exercise_name: '', workout_type: 'strength', duration_min: '', calories_burned: '', notes: '' }); setShowForm(true) }}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}
            >
              <Plus size={13} /> Custom
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_EXERCISES.map(ex => {
              const cfg = TYPE_CONFIG[ex.type]
              const Icon = cfg.icon
              return (
                <button
                  key={ex.name}
                  onClick={() => quickAdd(ex)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 20px ${cfg.bg}` }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <Icon size={14} /> {ex.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Log form */}
        {showForm && (
          <div style={cardStyle} className="p-5">
            <p className="font-bold text-white mb-4">Log Workout</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Exercise name"
                  value={form.exercise_name}
                  onChange={e => update('exercise_name', e.target.value)}
                  placeholder="e.g. Bench Press"
                  autoFocus
                />
                <Select
                  label="Type"
                  value={form.workout_type}
                  onChange={e => update('workout_type', e.target.value)}
                  options={TYPE_OPTIONS}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Duration (min)"
                  type="number"
                  value={form.duration_min}
                  onChange={e => {
                    update('duration_min', e.target.value)
                    // Auto-estimate calories
                    const quick = QUICK_EXERCISES.find(q => q.name.toLowerCase() === form.exercise_name.toLowerCase())
                    if (quick && e.target.value) {
                      update('calories_burned', String(parseInt(e.target.value) * quick.cal_per_min))
                    }
                  }}
                  placeholder="30"
                  min="1"
                />
                <Input
                  label="Calories burned"
                  type="number"
                  value={form.calories_burned}
                  onChange={e => update('calories_burned', e.target.value)}
                  placeholder="Auto-estimated"
                  min="0"
                />
              </div>
              <Input
                label="Notes (optional)"
                value={form.notes}
                onChange={e => update('notes', e.target.value)}
                placeholder="Sets, reps, or how you felt..."
              />
              <div className="flex gap-3">
                <Button onClick={saveLog} loading={saving}><Dumbbell size={14} /> Save Workout</Button>
                <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Recent workouts */}
        <div style={cardStyle} className="overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between">
              <p className="font-bold text-white">Recent Workouts</p>
              <Badge variant="gray">{logs.length} this month</Badge>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-600 text-sm">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="p-10 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Dumbbell size={24} className="text-violet-400" />
              </div>
              <div>
                <p className="font-bold text-white">No workouts logged yet</p>
                <p className="text-sm text-gray-500 mt-1">Use Quick Add above to log your first session!</p>
              </div>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {logs.map(log => {
                const cfg = TYPE_CONFIG[log.workout_type] || TYPE_CONFIG.other
                const Icon = cfg.icon
                return (
                  <div key={log.id} className="flex items-center gap-4 px-5 py-4 group transition-colors"
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                      <Icon size={16} style={{ color: cfg.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm">{log.exercise_name}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                        <span className="flex items-center gap-1"><Clock size={11} /> {log.duration_min} min</span>
                        {log.calories_burned > 0 && <span className="flex items-center gap-1"><Flame size={11} /> {log.calories_burned} kcal</span>}
                        <span>{format(new Date(log.logged_at), 'MMM d, h:mm a')}</span>
                      </div>
                      {log.notes && <p className="text-xs text-gray-600 mt-0.5 truncate">{log.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      <button
                        onClick={() => deleteLog(log.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </DashboardLayout>
  )
}
