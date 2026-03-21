import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PageHero from '@/components/ui/PageHero'
import PlanGate from '@/components/ui/PlanGate'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import {
  Activity, Footprints, Heart, Flame, Wind, MapPin, Watch,
  Plus, Trash2, ChevronDown, ChevronUp, Smartphone, Copy, CheckCircle2,
} from 'lucide-react'
import { format, subDays } from 'date-fns'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts'

type WatchHealthLog = {
  id: string
  user_id: string
  date: string
  steps: number | null
  heart_rate_resting: number | null
  heart_rate_max: number | null
  active_calories: number | null
  hrv: number | null
  spo2: number | null
  distance_km: number | null
  sleep_score: number | null
  source: string
  notes: string | null
  created_at: string
}

const TABS = [
  { key: 'steps',    label: 'Steps',    color: '#10b981', unit: 'steps' },
  { key: 'hr',       label: 'Heart Rate',color: '#ef4444', unit: 'bpm'   },
  { key: 'calories', label: 'Calories', color: '#f59e0b', unit: 'kcal'  },
  { key: 'hrv',      label: 'HRV',      color: '#8b5cf6', unit: 'ms'    },
  { key: 'spo2',     label: 'SpO2',     color: '#06b6d4', unit: '%'     },
  { key: 'distance', label: 'Distance', color: '#f97316', unit: 'km'    },
] as const

type TabKey = typeof TABS[number]['key']

const cardStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '20px',
}

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}
const cardAnim: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } },
}

const tooltipStyle = {
  contentStyle: {
    background: 'rgba(10,10,25,0.95)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    fontSize: 12,
    color: '#e8eaf0',
  },
}

const SOURCE_OPTS = [
  { value: 'manual',       label: 'Manual Entry' },
  { value: 'apple_health', label: 'Apple Health' },
  { value: 'google_fit',   label: 'Google Fit'   },
  { value: 'garmin',       label: 'Garmin'       },
  { value: 'fitbit',       label: 'Fitbit'       },
]

export default function WatchHealthPage() {
  const [logs, setLogs] = useState<WatchHealthLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [plan, setPlan] = useState('free')
  const [planLoading, setPlanLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('steps')
  const [copied, setCopied] = useState(false)

  const [form, setForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    steps: '',
    heart_rate_resting: '',
    heart_rate_max: '',
    active_calories: '',
    hrv: '',
    spo2: '',
    distance_km: '',
    sleep_score: '',
    source: 'manual',
    notes: '',
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return
      const uid = data.user.id
      setUserId(uid)
      loadLogs(uid)

      const { data: sub } = await (supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', uid)
        .maybeSingle() as any)
      if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
        setPlan(sub.plan || 'free')
      }
      setPlanLoading(false)
    })
  }, [])

  async function loadLogs(uid: string) {
    setLoading(true)
    const { data } = await (supabase
      .from('watch_health_logs')
      .select('*')
      .eq('user_id', uid)
      .gte('date', subDays(new Date(), 30).toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(30) as any)
    if (data) setLogs(data)
    setLoading(false)
  }

  function upd(f: string, v: string) { setForm(p => ({ ...p, [f]: v })) }

  async function saveEntry() {
    if (!userId) return
    if (!form.date) { toast.error('Date is required'); return }
    setSaving(true)
    const payload: any = {
      user_id: userId,
      date: form.date,
      steps: form.steps ? parseInt(form.steps) : null,
      heart_rate_resting: form.heart_rate_resting ? parseInt(form.heart_rate_resting) : null,
      heart_rate_max: form.heart_rate_max ? parseInt(form.heart_rate_max) : null,
      active_calories: form.active_calories ? parseInt(form.active_calories) : null,
      hrv: form.hrv ? parseFloat(form.hrv) : null,
      spo2: form.spo2 ? parseFloat(form.spo2) : null,
      distance_km: form.distance_km ? parseFloat(form.distance_km) : null,
      sleep_score: form.sleep_score ? parseInt(form.sleep_score) : null,
      source: form.source || 'manual',
      notes: form.notes || null,
    }
    const { error } = await (supabase.from('watch_health_logs') as any).upsert(payload, {
      onConflict: 'user_id,date,source',
    })
    if (error) {
      toast.error('Could not save entry')
    } else {
      toast.success('Health data logged!')
      setForm(f => ({ ...f, steps: '', heart_rate_resting: '', heart_rate_max: '', active_calories: '', hrv: '', spo2: '', distance_km: '', sleep_score: '', notes: '' }))
      setShowForm(false)
      loadLogs(userId)
    }
    setSaving(false)
  }

  async function deleteLog(id: string) {
    if (!userId) return
    await (supabase.from('watch_health_logs') as any).delete().eq('id', id).eq('user_id', userId)
    loadLogs(userId)
    toast.success('Entry deleted')
  }

  function copyUserId() {
    if (!userId) return
    navigator.clipboard.writeText(userId).then(() => {
      setCopied(true)
      toast.success('User ID copied!')
      setTimeout(() => setCopied(false), 2500)
    })
  }

  // Today's log (most recent)
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const todayLog = logs.find(l => l.date === todayStr) || logs[0] || null

  // Steps ring
  const r = 50
  const circ = 2 * Math.PI * r
  const stepsPct = Math.min((todayLog?.steps || 0) / 10000, 1)

  // 7-day chart data (last 7 entries chronological)
  const chartLogs = [...logs].reverse().slice(-7)
  const chartData = chartLogs.map(l => ({
    day: format(new Date(l.date), 'EEE'),
    steps: l.steps ?? 0,
    hr: l.heart_rate_resting ?? 0,
    calories: l.active_calories ?? 0,
    hrv: l.hrv ?? 0,
    spo2: l.spo2 ?? 0,
    distance: l.distance_km ?? 0,
  }))

  // Stats tiles
  const TILES = [
    { label: 'Steps',       value: todayLog?.steps?.toLocaleString() ?? '—',          unit: '',    icon: Footprints,  color: '#10b981' },
    { label: 'Resting HR',  value: todayLog?.heart_rate_resting?.toString() ?? '—',    unit: 'bpm', icon: Heart,       color: '#ef4444' },
    { label: 'Active Cal',  value: todayLog?.active_calories?.toLocaleString() ?? '—', unit: 'kcal',icon: Flame,       color: '#f59e0b' },
    { label: 'HRV',         value: todayLog?.hrv?.toString() ?? '—',                   unit: 'ms',  icon: Activity,    color: '#8b5cf6' },
    { label: 'SpO2',        value: todayLog?.spo2?.toString() ?? '—',                  unit: '%',   icon: Wind,        color: '#06b6d4' },
    { label: 'Distance',    value: todayLog?.distance_km?.toString() ?? '—',           unit: 'km',  icon: MapPin,      color: '#f97316' },
  ]

  function renderChart(tab: TabKey) {
    const t = TABS.find(x => x.key === tab)!
    const key = tab === 'hr' ? 'hr' : tab
    if (tab === 'steps' || tab === 'calories') {
      return (
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey={key} fill={t.color} radius={[6, 6, 0, 0]} opacity={0.85} />
        </BarChart>
      )
    }
    return (
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`grad_${tab}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={t.color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={t.color} stopOpacity={0.01} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip {...tooltipStyle} />
        <Area type="monotone" dataKey={key} stroke={t.color} strokeWidth={2}
          fill={`url(#grad_${tab})`} dot={{ fill: t.color, r: 3 }} />
      </AreaChart>
    )
  }

  return (
    <DashboardLayout pageTitle="Watch Health" title="Watch Health Data">
      <PageHero
        badge="Wearables"
        badgeColor="#10b981"
        title="Watch Health Data"
        highlight="Health Data"
        subtitle="Sync smartwatch metrics and track wellness trends"
        orbColors={['rgba(16,185,129,0.3)', 'rgba(6,182,212,0.2)']}
        action={
          <button
            onClick={() => setShowForm(f => !f)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
            }}
          >
            <Plus size={15} />
            Log Health Data
          </button>
        }
      />

      <motion.div className="max-w-4xl mx-auto space-y-5" initial="hidden" animate="visible" variants={stagger}>

        {/* Stats Bar — 6 tiles */}
        <motion.div variants={cardAnim} className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {TILES.map(({ label, value, unit, icon: Icon, color }) => (
            <div key={label} className="p-4 rounded-2xl text-center flex flex-col items-center gap-1.5"
              style={{ background: `rgba(${hexAlpha(color)},0.07)`, border: `1px solid rgba(${hexAlpha(color)},0.18)` }}>
              <Icon size={17} style={{ color }} />
              <p className="text-lg font-extrabold text-white leading-none">
                {value}<span className="text-xs text-gray-500 font-normal"> {unit}</span>
              </p>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </motion.div>

        {/* Steps Progress Ring */}
        <motion.div variants={cardAnim} style={cardStyle} className="p-5 flex items-center gap-6">
          <div className="relative flex-shrink-0">
            <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                <linearGradient id="stepsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <circle cx="65" cy="65" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle cx="65" cy="65" r={r} fill="none" stroke="url(#stepsGrad)" strokeWidth="8"
                strokeLinecap="round" strokeDasharray={circ}
                strokeDashoffset={circ - circ * stepsPct}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"
              style={{ transform: 'rotate(0deg)' }}>
              <Footprints size={20} className="text-emerald-400 mb-1" />
              <p className="text-lg font-extrabold text-white leading-none">
                {Math.round(stepsPct * 100)}%
              </p>
              <p className="text-[10px] text-gray-600">of 10k</p>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Today&apos;s Steps</p>
            <p className="text-3xl font-extrabold text-white">
              {todayLog?.steps?.toLocaleString() ?? '—'}
              <span className="text-base text-gray-600 font-normal"> / 10,000</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {!todayLog ? 'No data synced yet today.' :
                stepsPct >= 1 ? '🎉 Daily goal reached!' :
                stepsPct >= 0.7 ? 'Almost there — keep moving!' :
                stepsPct >= 0.4 ? 'Good progress for today.' :
                'Every step counts — start moving!'}
            </p>
            {todayLog?.distance_km && (
              <p className="text-xs text-gray-600 mt-1.5">
                <MapPin size={11} className="inline mr-1" />
                {todayLog.distance_km} km walked today
              </p>
            )}
          </div>
        </motion.div>

        {/* Manual Entry Form (collapsible) */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={{ duration: 0.3 }}
              style={cardStyle}
              className="p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="font-bold text-white">Manual Health Entry</p>
                <button onClick={() => setShowForm(false)}
                  className="p-1.5 rounded-lg text-gray-600 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <ChevronUp size={15} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Date" type="date" value={form.date} onChange={e => upd('date', e.target.value)} />
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Source</label>
                    <select
                      value={form.source}
                      onChange={e => upd('source', e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl text-sm font-medium text-white"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      {SOURCE_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Input label="Steps" type="number" placeholder="e.g. 8500" value={form.steps} onChange={e => upd('steps', e.target.value)} />
                  <Input label="Resting HR (bpm)" type="number" placeholder="e.g. 62" value={form.heart_rate_resting} onChange={e => upd('heart_rate_resting', e.target.value)} />
                  <Input label="Max HR (bpm)" type="number" placeholder="e.g. 145" value={form.heart_rate_max} onChange={e => upd('heart_rate_max', e.target.value)} />
                  <Input label="Active Calories" type="number" placeholder="e.g. 480" value={form.active_calories} onChange={e => upd('active_calories', e.target.value)} />
                  <Input label="HRV (ms)" type="number" placeholder="e.g. 42" value={form.hrv} onChange={e => upd('hrv', e.target.value)} />
                  <Input label="SpO2 (%)" type="number" placeholder="e.g. 98" value={form.spo2} onChange={e => upd('spo2', e.target.value)} />
                  <Input label="Distance (km)" type="number" placeholder="e.g. 6.2" value={form.distance_km} onChange={e => upd('distance_km', e.target.value)} />
                  <Input label="Sleep Score" type="number" placeholder="e.g. 85" value={form.sleep_score} onChange={e => upd('sleep_score', e.target.value)} />
                </div>
                <Input label="Notes (optional)" placeholder="e.g. Felt tired, stress day..." value={form.notes} onChange={e => upd('notes', e.target.value)} />
                <Button onClick={saveEntry} loading={saving} fullWidth>
                  <Watch size={15} /> Save Health Data
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 7-Day Trend Charts — Pro gated */}
        <motion.div variants={cardAnim}>
          <PlanGate requires="pro" currentPlan={plan} loading={planLoading} featureName="7-Day Trend Charts">
            <div style={cardStyle} className="p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">7-Day Trends</p>
                <div className="flex gap-1.5 flex-wrap">
                  {TABS.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200"
                      style={activeTab === t.key ? {
                        background: `rgba(${hexAlpha(t.color)},0.15)`,
                        border: `1px solid rgba(${hexAlpha(t.color)},0.4)`,
                        color: t.color,
                      } : {
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#6b7280',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Activity size={28} className="text-gray-700" />
                  <p className="text-sm text-gray-500">No data yet — log some entries first.</p>
                </div>
              ) : (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    {renderChart(activeTab) as any}
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </PlanGate>
        </motion.div>

        {/* Apple Health Sync Guide — Pro gated */}
        <motion.div variants={cardAnim}>
          <PlanGate requires="pro" currentPlan={plan} loading={planLoading} featureName="Apple Health Auto-Sync">
            <div style={cardStyle} className="overflow-hidden">
              <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <Smartphone size={17} className="text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-white">Apple Watch / Apple Health</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>
                      iOS Shortcuts · Free
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">Auto-sync daily health data from iPhone</p>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* Steps */}
                {[
                  {
                    n: 1,
                    title: 'Create a new Shortcut',
                    desc: 'Open the Shortcuts app on iPhone → tap + (new shortcut) → name it "FahmiFit Sync"',
                  },
                  {
                    n: 2,
                    title: 'Add Health Sample actions',
                    desc: 'Add "Get Health Samples" for: Steps, Resting Heart Rate, Active Energy, Heart Rate Variability, Blood Oxygen, Walking + Running Distance',
                  },
                  {
                    n: 3,
                    title: 'Add HTTP POST action',
                    desc: null,
                    custom: (
                      <div className="space-y-2 mt-2">
                        <p className="text-xs text-gray-400">Add "Get Contents of URL" action with:</p>
                        <div className="rounded-xl p-3 font-mono text-xs space-y-1"
                          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <p><span className="text-gray-600">URL:</span> <span className="text-emerald-400">https://fahmifit.com/api/health/watch-sync</span></p>
                          <p><span className="text-gray-600">Method:</span> <span className="text-cyan-400">POST</span></p>
                          <p className="text-gray-600">Headers:</p>
                          <p className="pl-3"><span className="text-purple-400">x-sync-token:</span> <span className="text-gray-400">[contact support]</span></p>
                          <p className="pl-3"><span className="text-purple-400">x-user-id:</span></p>
                        </div>
                        {/* User ID copy block */}
                        <div className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                          style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)' }}>
                          <code className="flex-1 text-xs text-emerald-300 font-mono truncate">
                            {userId ?? 'Loading...'}
                          </code>
                          <button
                            onClick={copyUserId}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                            style={{
                              background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)',
                              border: copied ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.1)',
                              color: copied ? '#34d399' : '#9ca3af',
                            }}
                          >
                            {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
                            {copied ? 'Copied!' : 'Copy ID'}
                          </button>
                        </div>
                        <div className="rounded-xl p-3 font-mono text-xs"
                          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <p className="text-gray-600 mb-1">JSON Body:</p>
                          <p className="text-yellow-300/80">{`{ date, steps, heart_rate_resting, active_calories, hrv, spo2, distance_km, source: "apple_health" }`}</p>
                        </div>
                      </div>
                    ),
                  },
                  {
                    n: 4,
                    title: 'Schedule daily automation',
                    desc: 'Add "Personal Automation" → "Time of Day" → 9:00 PM → run this shortcut every day automatically',
                  },
                ].map(step => (
                  <div key={step.n} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-extrabold"
                      style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                      {step.n}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm font-bold text-white">{step.title}</p>
                      {step.desc && <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>}
                      {step.custom}
                    </div>
                  </div>
                ))}

                {/* Google Fit — Coming Soon */}
                <div className="mt-4 pt-4 flex items-center gap-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <Activity size={17} className="text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-500">Google Fit / Android</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(107,114,128,0.15)', border: '1px solid rgba(107,114,128,0.25)', color: '#6b7280' }}>
                        Coming Soon
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">Google Fit and Wear OS integration is in development.</p>
                  </div>
                </div>
              </div>
            </div>
          </PlanGate>
        </motion.div>

        {/* History Log Table */}
        <motion.div variants={cardAnim} style={cardStyle} className="overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-bold text-white">Health History</p>
            <p className="text-xs text-gray-600">Last 30 days</p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-600 text-sm">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
                <Activity size={26} className="text-gray-700" />
              </div>
              <div>
                <p className="font-bold text-white mb-1">No health data yet</p>
                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                  Click &quot;Log Health Data&quot; above to add your first entry, or set up Apple Health auto-sync.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {/* Table header */}
              <div className="grid px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-600"
                style={{ gridTemplateColumns: '100px 70px 70px 70px 60px 60px 70px 80px 40px' }}>
                <span>Date</span>
                <span>Steps</span>
                <span>HR</span>
                <span>Calories</span>
                <span>HRV</span>
                <span>SpO2</span>
                <span>Distance</span>
                <span>Source</span>
                <span></span>
              </div>
              {logs.map((log, i) => (
                <div key={log.id}
                  className="grid items-center px-5 py-3 group transition-colors text-sm"
                  style={{ gridTemplateColumns: '100px 70px 70px 70px 60px 60px 70px 80px 40px' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-medium text-xs">{format(new Date(log.date), 'MMM d, yyyy')}</span>
                    {i === 0 && <Badge variant="blue">New</Badge>}
                  </div>
                  <span className="text-gray-300 text-xs">{log.steps?.toLocaleString() ?? '—'}</span>
                  <span className="text-gray-300 text-xs">{log.heart_rate_resting ? `${log.heart_rate_resting} bpm` : '—'}</span>
                  <span className="text-gray-300 text-xs">{log.active_calories ? `${log.active_calories} kcal` : '—'}</span>
                  <span className="text-gray-300 text-xs">{log.hrv ? `${log.hrv} ms` : '—'}</span>
                  <span className="text-gray-300 text-xs">{log.spo2 ? `${log.spo2}%` : '—'}</span>
                  <span className="text-gray-300 text-xs">{log.distance_km ? `${log.distance_km} km` : '—'}</span>
                  <span className="text-gray-600 text-[10px]">{log.source}</span>
                  <button
                    onClick={() => deleteLog(log.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </motion.div>
    </DashboardLayout>
  )
}

/** Convert hex color to "r,g,b" string for rgba() */
function hexAlpha(hex: string): string {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return `${r},${g},${b}`
}
