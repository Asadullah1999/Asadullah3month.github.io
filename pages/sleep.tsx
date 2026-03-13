import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Moon, Sun, Clock, Star, Plus, Trash2, Zap } from 'lucide-react'
import { format, subDays } from 'date-fns'

type SleepQuality = '1' | '2' | '3' | '4' | '5'

type SleepEntry = {
  id: string
  user_id: string
  bedtime: string
  wake_time: string
  duration_hours: number
  quality: number
  notes: string
  logged_at: string
}

const QUALITY_CONFIG = [
  { value: '1', label: '😴 Terrible', color: '#f87171', bg: 'rgba(239,68,68,0.1)'  },
  { value: '2', label: '😕 Poor',     color: '#fb923c', bg: 'rgba(249,115,22,0.1)' },
  { value: '3', label: '😐 Okay',     color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
  { value: '4', label: '😊 Good',     color: '#34d399', bg: 'rgba(16,185,129,0.1)' },
  { value: '5', label: '😁 Great',    color: '#818cf8', bg: 'rgba(99,102,241,0.1)' },
]

const SLEEP_TIPS = [
  'Keep a consistent sleep schedule, even on weekends.',
  'Avoid screens 1 hour before bed — use blue-light glasses if needed.',
  'Keep your room cool (18–20°C) for optimal sleep.',
  'Avoid caffeine after 2pm for better deep sleep.',
  'A short 10-minute walk after dinner improves sleep quality.',
  'Try the 4-7-8 breathing technique before bed.',
]

function calcDuration(bedtime: string, wakeTime: string): number {
  if (!bedtime || !wakeTime) return 0
  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let mins = (wh * 60 + wm) - (bh * 60 + bm)
  if (mins < 0) mins += 24 * 60 // crosses midnight
  return Math.round(mins / 60 * 10) / 10
}

export default function SleepPage() {
  const [entries, setEntries] = useState<SleepEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [form, setForm] = useState({
    bedtime: '22:30',
    wake_time: '06:30',
    quality: '4' as SleepQuality,
    notes: '',
  })
  const [tip] = useState(SLEEP_TIPS[Math.floor(Math.random() * SLEEP_TIPS.length)])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
      loadEntries(data.user.id)
    })
  }, [])

  async function loadEntries(uid: string) {
    setLoading(true)
    const since = subDays(new Date(), 30).toISOString()
    const { data } = await supabase
      .from('sleep_logs')
      .select('*')
      .eq('user_id', uid)
      .gte('logged_at', since)
      .order('logged_at', { ascending: false })
    if (data) setEntries(data)
    setLoading(false)
  }

  function update(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  const duration = calcDuration(form.bedtime, form.wake_time)

  async function saveEntry() {
    if (!userId) return
    if (duration <= 0) { toast.error('Invalid bedtime/wake time'); return }
    setSaving(true)
    const { error } = await supabase.from('sleep_logs').insert({
      user_id: userId,
      bedtime: form.bedtime,
      wake_time: form.wake_time,
      duration_hours: duration,
      quality: parseInt(form.quality),
      notes: form.notes,
      logged_at: new Date().toISOString(),
    })
    if (error) toast.error('Could not save')
    else {
      toast.success('Sleep logged! 😴')
      setForm({ bedtime: '22:30', wake_time: '06:30', quality: '4', notes: '' })
      loadEntries(userId)
    }
    setSaving(false)
  }

  async function deleteEntry(id: string) {
    await supabase.from('sleep_logs').delete().eq('id', id)
    if (userId) loadEntries(userId)
  }

  // Stats
  const avgDuration = entries.length > 0
    ? Math.round(entries.slice(0, 7).reduce((a, e) => a + e.duration_hours, 0) / Math.min(entries.length, 7) * 10) / 10
    : null
  const avgQuality = entries.length > 0
    ? Math.round(entries.slice(0, 7).reduce((a, e) => a + e.quality, 0) / Math.min(entries.length, 7) * 10) / 10
    : null

  const sleepStatus = avgDuration
    ? avgDuration >= 7 && avgDuration <= 9 ? { label: 'Optimal', color: '#34d399' }
    : avgDuration >= 6 ? { label: 'Slightly low', color: '#fbbf24' }
    : { label: 'Sleep deprived', color: '#f87171' }
    : null

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px' }

  return (
    <DashboardLayout pageTitle="Sleep" title="Sleep Tracker">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <Moon size={18} className="text-indigo-400 mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-white">{avgDuration ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">hrs avg / night</p>
          </div>
          <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Star size={18} className="text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-white">{avgQuality ?? '—'}<span className="text-lg text-gray-500">/5</span></p>
            <p className="text-xs text-gray-500 mt-0.5">quality score</p>
          </div>
          <div className="p-4 rounded-2xl text-center" style={{
            background: sleepStatus ? (sleepStatus.color === '#34d399' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)') : 'rgba(255,255,255,0.03)',
            border: `1px solid ${sleepStatus ? sleepStatus.color + '33' : 'rgba(255,255,255,0.07)'}`,
          }}>
            <Zap size={18} className="mx-auto mb-2" style={{ color: sleepStatus?.color ?? '#6b7280' }} />
            <p className="text-sm font-extrabold" style={{ color: sleepStatus?.color ?? '#6b7280' }}>
              {sleepStatus?.label ?? '—'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">7-day status</p>
          </div>
        </div>

        {/* Weekly bar chart */}
        {entries.length > 0 && (
          <div style={cardStyle} className="p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Last 7 Nights</p>
            <div className="flex items-end gap-2 h-20">
              {entries.slice(0, 7).reverse().map((entry, i) => {
                const h = Math.min((entry.duration_hours / 10) * 100, 100)
                const qCfg = QUALITY_CONFIG[entry.quality - 1]
                return (
                  <div key={entry.id} className="flex-1 flex flex-col items-center gap-1.5 group relative">
                    <div className="w-full rounded-t-lg transition-all duration-300" style={{
                      height: `${Math.max(h, 8)}%`,
                      background: qCfg?.bg ?? 'rgba(99,102,241,0.2)',
                      border: `1px solid ${qCfg?.color ?? '#818cf8'}33`,
                    }} />
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="text-xs font-bold rounded-lg px-2 py-1 whitespace-nowrap"
                        style={{ background: 'rgba(15,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                        {entry.duration_hours}h · Q:{entry.quality}/5
                      </div>
                    </div>
                    <span className="text-xs text-gray-600">{format(new Date(entry.logged_at), 'EEE')}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">Bar height = hours slept · Color = quality</p>
          </div>
        )}

        {/* Log form */}
        <div style={cardStyle} className="p-5">
          <p className="font-bold text-white mb-4">Log Last Night&apos;s Sleep</p>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Bedtime" type="time" value={form.bedtime} onChange={e => update('bedtime', e.target.value)} />
              <Input label="Wake time" type="time" value={form.wake_time} onChange={e => update('wake_time', e.target.value)} />
            </div>

            {/* Duration preview */}
            {duration > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                style={{
                  background: duration >= 7 ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                  border: `1px solid ${duration >= 7 ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                }}>
                <Clock size={14} style={{ color: duration >= 7 ? '#34d399' : '#fbbf24' }} />
                <span className="font-bold" style={{ color: duration >= 7 ? '#34d399' : '#fbbf24' }}>
                  {duration} hours of sleep
                </span>
                <span className="text-gray-500">
                  {duration >= 7 && duration <= 9 ? '— Optimal range!' : duration < 7 ? '— Below recommended 7–9h' : '— Above recommended range'}
                </span>
              </div>
            )}

            {/* Quality selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sleep quality</label>
              <div className="flex gap-2">
                {QUALITY_CONFIG.map(q => (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => update('quality', q.value)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200"
                    style={form.quality === q.value ? {
                      background: q.bg,
                      border: `1px solid ${q.color}44`,
                      color: q.color,
                      boxShadow: `0 4px 12px ${q.bg}`,
                    } : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      color: '#6b7280',
                    }}
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Notes (optional)"
              value={form.notes}
              onChange={e => update('notes', e.target.value)}
              placeholder="Dreams, interruptions, stress..."
            />

            <Button onClick={saveEntry} loading={saving} fullWidth>
              <Moon size={15} /> Log Sleep
            </Button>
          </div>
        </div>

        {/* Sleep tip */}
        <div className="p-4 rounded-2xl flex gap-3 items-start"
          style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)' }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)' }}>
            <Moon size={15} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Sleep Tip</p>
            <p className="text-sm text-gray-300">{tip}</p>
          </div>
        </div>

        {/* History */}
        <div style={cardStyle} className="overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-bold text-white">Sleep History</p>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-600 text-sm">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="p-10 flex flex-col items-center gap-4 text-center">
              <Moon size={32} className="text-gray-700" />
              <p className="font-bold text-white">No sleep logged yet</p>
              <p className="text-sm text-gray-500">Log your sleep above to start tracking patterns.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {entries.map((entry, i) => {
                const qCfg = QUALITY_CONFIG[entry.quality - 1]
                return (
                  <div key={entry.id} className="flex items-center gap-4 px-5 py-3.5 group transition-colors"
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: qCfg?.bg ?? 'rgba(99,102,241,0.1)', border: `1px solid ${qCfg?.color ?? '#818cf8'}33` }}>
                      <Moon size={16} style={{ color: qCfg?.color ?? '#818cf8' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-extrabold text-white">{entry.duration_hours}h</span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{ background: qCfg?.bg, color: qCfg?.color }}>
                          {qCfg?.label}
                        </span>
                        {i === 0 && <Badge variant="blue">Latest</Badge>}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {entry.bedtime} → {entry.wake_time} · {format(new Date(entry.logged_at), 'EEE MMM d')}
                        {entry.notes && ` · ${entry.notes}`}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* SQL notice */}
        <div className="p-4 rounded-2xl text-xs text-gray-600" style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <p className="font-bold text-amber-400 mb-1">⚠ Requires database table</p>
          <pre className="mt-1 text-amber-400/70 overflow-x-auto">{`create table if not exists public.sleep_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  bedtime text not null,
  wake_time text not null,
  duration_hours numeric(4,1) not null,
  quality integer check (quality between 1 and 5) default 3,
  notes text,
  logged_at timestamptz default now()
);
alter table public.sleep_logs enable row level security;
create policy "sleep_own" on public.sleep_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);`}</pre>
        </div>
      </div>
    </DashboardLayout>
  )
}
