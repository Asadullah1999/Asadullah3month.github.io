import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PageHero from '@/components/ui/PageHero'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Scale, TrendingDown, TrendingUp, Minus, Plus, Target } from 'lucide-react'
import { format, subDays } from 'date-fns'

type WeightEntry = {
  id: string
  user_id: string
  weight_kg: number
  logged_at: string
  notes: string
}

function getBMI(weight: number, heightCm: number) {
  if (!heightCm) return null
  return Math.round((weight / Math.pow(heightCm / 100, 2)) * 10) / 10
}

function getBMILabel(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: '#60a5fa' }
  if (bmi < 25)   return { label: 'Normal',       color: '#34d399' }
  if (bmi < 30)   return { label: 'Overweight',   color: '#fbbf24' }
  return              { label: 'Obese',         color: '#f87171' }
}

export default function WeightLogPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [userHeight, setUserHeight] = useState<number | null>(null)
  const [userGoalWeight, setUserGoalWeight] = useState<number | null>(null)
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
      loadData(data.user.id)
    })
  }, [])

  async function loadData(uid: string) {
    setLoading(true)
    const [{ data: userData }, { data: logsData }] = await Promise.all([
      supabase.from('users').select('height_cm, weight_kg').eq('id', uid).single(),
      supabase.from('weight_logs').select('*').eq('user_id', uid).order('logged_at', { ascending: false }).limit(60),
    ])
    if (userData) {
      setUserHeight(userData.height_cm)
      setUserGoalWeight(userData.weight_kg)
    }
    if (logsData) setEntries(logsData)
    setLoading(false)
  }

  async function saveEntry() {
    if (!weight || isNaN(parseFloat(weight))) { toast.error('Enter a valid weight'); return }
    if (!userId) return
    setSaving(true)
    const { error } = await supabase.from('weight_logs').insert({
      user_id: userId,
      weight_kg: parseFloat(weight),
      notes,
      logged_at: new Date().toISOString(),
    })
    if (error) toast.error('Could not save')
    else {
      toast.success('Weight logged!')
      setWeight('')
      setNotes('')
      loadData(userId)
    }
    setSaving(false)
  }

  async function deleteEntry(id: string) {
    await supabase.from('weight_logs').delete().eq('id', id)
    if (userId) loadData(userId)
  }

  const latest = entries[0]
  const previous = entries[1]
  const latestWeight = latest?.weight_kg
  const change = latestWeight && previous ? +(latestWeight - previous.weight_kg).toFixed(1) : null
  const bmi = latestWeight && userHeight ? getBMI(latestWeight, userHeight) : null
  const bmiInfo = bmi ? getBMILabel(bmi) : null

  // Min/max for mini chart
  const last30 = entries.slice(0, 30).reverse()
  const weights = last30.map(e => e.weight_kg)
  const minW = Math.min(...weights)
  const maxW = Math.max(...weights)
  const range = maxW - minW || 1

  const cardStyle = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px' }

  const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }
  const cardAnim: Variants = { hidden: { opacity: 0, y: 20, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } } }

  return (
    <DashboardLayout pageTitle="Weight Log" title="Weight Tracker">
      <PageHero
        badge="Body Stats"
        badgeColor="#06b6d4"
        title="Weight Log"
        highlight="Weight"
        subtitle="Track your body weight journey over time"
        orbColors={['rgba(6,182,212,0.3)', 'rgba(16,185,129,0.2)']}
      />
      <motion.div className="max-w-2xl mx-auto space-y-5" initial="hidden" animate="visible" variants={stagger}>

        {/* Stats */}
        <motion.div variants={cardAnim} className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <Scale size={18} className="text-brand-400 mx-auto mb-2" />
            <p className="text-2xl font-extrabold text-white">{latestWeight ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">kg · Current</p>
          </div>
          <div className="p-4 rounded-2xl text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {change !== null ? (
              <>
                {change < 0
                  ? <TrendingDown size={18} className="text-brand-400 mx-auto mb-2" />
                  : change > 0
                  ? <TrendingUp size={18} className="text-red-400 mx-auto mb-2" />
                  : <Minus size={18} className="text-gray-400 mx-auto mb-2" />}
                <p className="text-2xl font-extrabold" style={{ color: change < 0 ? '#34d399' : change > 0 ? '#f87171' : '#9ca3af' }}>
                  {change > 0 ? '+' : ''}{change}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">kg change</p>
              </>
            ) : (
              <>
                <Minus size={18} className="text-gray-600 mx-auto mb-2" />
                <p className="text-2xl font-extrabold text-gray-600">—</p>
                <p className="text-xs text-gray-600 mt-0.5">kg change</p>
              </>
            )}
          </div>
          <div className="p-4 rounded-2xl text-center"
            style={{ background: bmiInfo ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Target size={18} className="mx-auto mb-2" style={{ color: bmiInfo?.color ?? '#6b7280' }} />
            <p className="text-2xl font-extrabold" style={{ color: bmiInfo?.color ?? '#6b7280' }}>{bmi ?? '—'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{bmiInfo?.label ?? 'BMI'}</p>
          </div>
        </motion.div>

        {/* Mini sparkline chart */}
        {last30.length > 1 && (
          <motion.div variants={cardAnim} style={cardStyle} className="p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Weight Trend (last {last30.length} entries)</p>
            <div className="flex items-end gap-1 h-20">
              {last30.map((entry, i) => {
                const h = ((entry.weight_kg - minW) / range) * 100
                const isLatest = i === last30.length - 1
                return (
                  <div key={entry.id} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full rounded-t-sm transition-all duration-300"
                      style={{
                        height: `${Math.max(h, 5)}%`,
                        minHeight: '4px',
                        background: isLatest
                          ? 'linear-gradient(to top, #10b981, #34d399)'
                          : 'rgba(16,185,129,0.25)',
                      }}
                    />
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="text-xs font-bold rounded-lg px-2 py-1 whitespace-nowrap"
                        style={{ background: 'rgba(16,185,129,0.9)', color: '#fff' }}>
                        {entry.weight_kg}kg
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>{format(new Date(last30[0].logged_at), 'MMM d')}</span>
              <span className="text-brand-400 font-bold">Min: {minW}kg  Max: {maxW}kg</span>
              <span>{format(new Date(last30[last30.length - 1].logged_at), 'MMM d')}</span>
            </div>
          </motion.div>
        )}

        {/* Log new entry */}
        <motion.div variants={cardAnim} style={cardStyle} className="p-5">
          <p className="font-bold text-white mb-4">Log Today&apos;s Weight</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                label="Weight (kg)"
                type="number"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                placeholder={latestWeight ? latestWeight.toString() : '70.0'}
                min="30"
                max="300"
                step="0.1"
              />
            </div>
            <div className="flex-1">
              <Input
                label="Notes (optional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Morning, post-workout..."
              />
            </div>
            <Button onClick={saveEntry} loading={saving}>
              <Plus size={15} /> Log
            </Button>
          </div>
        </motion.div>

        {/* History */}
        <motion.div variants={cardAnim} style={cardStyle} className="overflow-hidden">
          <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="font-bold text-white">History</p>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-600 text-sm">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="p-10 flex flex-col items-center gap-4 text-center">
              <Scale size={32} className="text-gray-700" />
              <p className="font-bold text-white">No entries yet</p>
              <p className="text-sm text-gray-500">Log your first weight above to start tracking.</p>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {entries.map((entry, i) => {
                const prevEntry = entries[i + 1]
                const diff = prevEntry ? +(entry.weight_kg - prevEntry.weight_kg).toFixed(1) : null
                return (
                  <div key={entry.id} className="flex items-center gap-4 px-5 py-3.5 group transition-colors"
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-extrabold text-white">{entry.weight_kg} kg</span>
                        {diff !== null && (
                          <span className="text-xs font-bold" style={{ color: diff < 0 ? '#34d399' : diff > 0 ? '#f87171' : '#9ca3af' }}>
                            {diff > 0 ? '+' : ''}{diff}
                          </span>
                        )}
                        {i === 0 && <Badge variant="green">Latest</Badge>}
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {format(new Date(entry.logged_at), 'EEEE, MMM d · h:mm a')}
                        {entry.notes && ` · ${entry.notes}`}
                      </p>
                    </div>
                    {userHeight && (
                      <span className="text-xs text-gray-600">
                        BMI {getBMI(entry.weight_kg, userHeight)}
                      </span>
                    )}
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-600 hover:text-red-400 transition-all"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    >
                      <Scale size={13} />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

      </motion.div>
    </DashboardLayout>
  )
}
