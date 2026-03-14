import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { todayISO, formatDate } from '@/lib/utils'
import { User, DailyLog, MealItem } from '@/lib/database.types'
import {
  Plus, Trash2, Save, CheckCircle2, Smile, Meh, Frown, Zap,
  Apple, Droplets, Flame, Target,
} from 'lucide-react'
import toast from 'react-hot-toast'

type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

const MEAL_SECTIONS = [
  { key: 'breakfast' as MealKey, label: 'Breakfast', icon: '🌅', color: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  accent: '#fbbf24' },
  { key: 'lunch'     as MealKey, label: 'Lunch',     icon: '☀️',  color: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', accent: '#34d399' },
  { key: 'dinner'    as MealKey, label: 'Dinner',    icon: '🌙',  color: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)', accent: '#a78bfa' },
  { key: 'snacks'    as MealKey, label: 'Snacks',    icon: '🍎',  color: 'rgba(6,182,212,0.1)',  border: 'rgba(6,182,212,0.2)',  accent: '#22d3ee' },
]

const MOOD_OPTIONS = [
  { value: 'great', label: 'Great', icon: <Smile size={22} />, gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.4)' },
  { value: 'good',  label: 'Good',  icon: <Smile size={22} />, gradient: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', glow: 'rgba(59,130,246,0.4)' },
  { value: 'okay',  label: 'Okay',  icon: <Meh   size={22} />, gradient: 'linear-gradient(135deg, #f59e0b, #d97706)', glow: 'rgba(245,158,11,0.4)' },
  { value: 'bad',   label: 'Bad',   icon: <Frown size={22} />, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', glow: 'rgba(239,68,68,0.4)' },
]

const QUICK_FOODS: MealItem[] = [
  { name: 'Boiled egg',      calories: 77,  protein: 6,  carbs: 1,  fat: 5,  quantity: '1 large' },
  { name: 'Chicken breast',  calories: 165, protein: 31, carbs: 0,  fat: 4,  quantity: '100g' },
  { name: 'White rice',      calories: 206, protein: 4,  carbs: 45, fat: 0,  quantity: '1 cup' },
  { name: 'Whole wheat bread', calories: 69, protein: 4, carbs: 12, fat: 1,  quantity: '1 slice' },
  { name: 'Banana',          calories: 105, protein: 1,  carbs: 27, fat: 0,  quantity: '1 medium' },
  { name: 'Oats',            calories: 147, protein: 5,  carbs: 25, fat: 3,  quantity: '40g dry' },
  { name: 'Greek yogurt',    calories: 100, protein: 17, carbs: 6,  fat: 0,  quantity: '170g' },
  { name: 'Almonds',         calories: 164, protein: 6,  carbs: 6,  fat: 14, quantity: '28g' },
]

function blankItem(): MealItem {
  return { name: '', calories: 0, protein: 0, carbs: 0, fat: 0, quantity: '' }
}

export default function CheckinPage() {
  const [user, setUser] = useState<Partial<User> | null>(null)
  const [log, setLog] = useState<Partial<DailyLog>>({ breakfast: [], lunch: [], dinner: [], snacks: [], water_ml: 0, mood: undefined, notes: '' })
  const [activeSection, setActiveSection] = useState<MealKey>('breakfast')
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState<MealItem>(blankItem())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const [{ data: userData }, { data: logData }] = await Promise.all([
      supabase.from('users').select('*').eq('id', session.user.id).single(),
      supabase.from('daily_logs').select('*').eq('user_id', session.user.id).eq('log_date', todayISO()).maybeSingle(),
    ])
    if (userData) setUser(userData)
    if (logData) setLog(logData)
  }

  function getMealItems(key: MealKey): MealItem[] {
    const raw = log[key]
    return Array.isArray(raw) ? raw as MealItem[] : []
  }

  function addItem(key: MealKey, item: MealItem) {
    setLog(prev => ({ ...prev, [key]: [...getMealItems(key), item] }))
    setNewItem(blankItem())
    setAdding(false)
  }

  function removeItem(key: MealKey, idx: number) {
    setLog(prev => ({ ...prev, [key]: getMealItems(key).filter((_, i) => i !== idx) }))
  }

  function quickAdd(key: MealKey, food: MealItem) {
    addItem(key, food)
    toast.success(`${food.name} added!`)
  }

  function getTotals() {
    let calories = 0, protein = 0, carbs = 0, fat = 0
    for (const key of ['breakfast', 'lunch', 'dinner', 'snacks'] as MealKey[]) {
      for (const item of getMealItems(key)) {
        calories += item.calories || 0; protein += item.protein || 0; carbs += item.carbs || 0; fat += item.fat || 0
      }
    }
    return { calories: Math.round(calories), protein: Math.round(protein), carbs: Math.round(carbs), fat: Math.round(fat) }
  }

  async function saveLog() {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const totals = getTotals()
    const payload = {
      user_id: session.user.id, log_date: todayISO(),
      breakfast: getMealItems('breakfast'), lunch: getMealItems('lunch'), dinner: getMealItems('dinner'), snacks: getMealItems('snacks'),
      total_calories: totals.calories, total_protein: totals.protein, total_carbs: totals.carbs, total_fat: totals.fat,
      water_ml: log.water_ml || 0, mood: log.mood, notes: log.notes, checkin_time: new Date().toISOString(),
    }
    const { error } = log.id
      ? await supabase.from('daily_logs').update(payload as unknown as Partial<DailyLog>).eq('id', log.id)
      : await supabase.from('daily_logs').upsert(payload as unknown as Partial<DailyLog>, { onConflict: 'user_id,log_date' })
    if (error) { toast.error(error.message) } else { toast.success('Daily log saved!'); setSaved(true); loadData() }
    setSaving(false)
  }

  const totals = getTotals()
  const calorieTarget = user?.calorie_target || 2000
  const caloriePct = Math.min(Math.round((totals.calories / calorieTarget) * 100), 100)
  const activeMeal = MEAL_SECTIONS.find(s => s.key === activeSection)!

  return (
    <DashboardLayout pageTitle="Meal Check-in" title="Daily Meal Check-in">
      <div className="space-y-5">

        {/* Date header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-white">{formatDate(new Date())}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Log your meals to track your nutrition</p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399' }}>
              <CheckCircle2 size={15} /> Saved today
            </div>
          )}
        </div>

        {/* Calorie summary */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total consumed</p>
              <p className="text-3xl font-extrabold text-white">
                {totals.calories}
                <span className="text-lg font-medium text-gray-500 ml-2">/ {calorieTarget} kcal</span>
              </p>
            </div>
            <div className="flex gap-5">
              {[
                { label: 'Protein', value: totals.protein, color: '#60a5fa' },
                { label: 'Carbs',   value: totals.carbs,   color: '#fbbf24' },
                { label: 'Fat',     value: totals.fat,     color: '#a78bfa' },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <p className="text-base font-extrabold" style={{ color: m.color }}>{m.value}g</p>
                  <p className="text-xs text-gray-600">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${caloriePct}%`,
                background: caloriePct > 100 ? 'linear-gradient(90deg, #ef4444, #dc2626)' : 'linear-gradient(90deg, #10b981, #06b6d4)',
                boxShadow: `0 0 8px ${caloriePct > 100 ? 'rgba(239,68,68,0.5)' : 'rgba(16,185,129,0.5)'}`,
              }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <p className="text-xs text-gray-600">{caloriePct}% of daily goal</p>
            <p className="text-xs" style={{ color: calorieTarget - totals.calories > 0 ? '#6ee7b7' : '#f87171' }}>
              {calorieTarget - totals.calories > 0 ? `${calorieTarget - totals.calories} kcal remaining` : `${totals.calories - calorieTarget} kcal over`}
            </p>
          </div>
        </div>

        {/* Meal tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {MEAL_SECTIONS.map(s => {
            const count = getMealItems(s.key).length
            const active = activeSection === s.key
            return (
              <button key={s.key} onClick={() => setActiveSection(s.key)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0"
                style={active ? {
                  background: s.color,
                  border: `1px solid ${s.border}`,
                  color: s.accent,
                  boxShadow: `0 4px 14px ${s.border}`,
                } : {
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#6b7280',
                }}>
                <span>{s.icon}</span>
                {s.label}
                {count > 0 && (
                  <span className="text-xs rounded-full px-1.5 py-0.5 font-bold"
                    style={{ background: active ? s.border : 'rgba(255,255,255,0.1)', color: active ? s.accent : '#9ca3af' }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Active meal section */}
        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Meal header */}
          <div className="flex items-center justify-between p-5 pb-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: activeMeal.color }}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeMeal.icon}</span>
              <h3 className="text-lg font-extrabold text-white">{activeMeal.label}</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: activeMeal.border, color: activeMeal.accent }}>
                {getMealItems(activeSection).length} items
              </span>
            </div>
            <Button size="sm" onClick={() => setAdding(!adding)}>
              <Plus size={13} /> Add food
            </Button>
          </div>

          <div className="p-5">
            {/* Items list */}
            {getMealItems(activeSection).length === 0 && !adding ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <Apple size={24} className="text-gray-600" />
                </div>
                <p className="text-sm text-gray-500">No items logged yet</p>
                <button onClick={() => setAdding(true)} className="text-brand-400 text-sm mt-2 hover:text-brand-300 transition-colors font-medium">
                  + Add your first item
                </button>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {getMealItems(activeSection).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3.5 rounded-xl transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-600">{item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-4 ml-3">
                      <div className="flex gap-3 text-xs">
                        <span className="font-bold" style={{ color: activeMeal.accent }}>{item.calories} kcal</span>
                        <span className="text-gray-500 hidden sm:block">P:{item.protein}g</span>
                        <span className="text-gray-500 hidden sm:block">C:{item.carbs}g</span>
                        <span className="text-gray-500 hidden sm:block">F:{item.fat}g</span>
                      </div>
                      <button onClick={() => removeItem(activeSection, i)}
                        className="text-gray-700 hover:text-red-400 transition-colors p-1 rounded-lg hover:bg-red-500/10">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add item form */}
            {adding && (
              <div className="pt-4 border-t border-white/[0.06] space-y-4">
                <p className="text-sm font-bold text-white">Add food item</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Food name" value={newItem.name} onChange={e => setNewItem(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Chicken breast" />
                  <Input label="Quantity" value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))} placeholder="e.g. 100g" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[['calories','Calories (kcal)'],['protein','Protein (g)'],['carbs','Carbs (g)'],['fat','Fat (g)']].map(([key, label]) => (
                    <Input key={key} label={label} type="number" min="0"
                      value={(newItem[key as keyof MealItem] as number) || ''}
                      onChange={e => setNewItem(p => ({ ...p, [key]: parseFloat(e.target.value) || 0 }))}
                      placeholder="0" />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => addItem(activeSection, newItem)} disabled={!newItem.name} size="sm">
                    <Plus size={13} /> Add item
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => { setAdding(false); setNewItem(blankItem()) }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Quick add */}
            <div className="pt-4 border-t border-white/[0.05]">
              <p className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                <Zap size={11} className="text-amber-400" /> Quick add
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_FOODS.map(food => (
                  <button key={food.name} onClick={() => quickAdd(activeSection, food)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}
                    onMouseEnter={e => { e.currentTarget.style.background = activeMeal.color; e.currentTarget.style.borderColor = activeMeal.border; e.currentTarget.style.color = activeMeal.accent }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#9ca3af' }}>
                    {food.name} <span className="opacity-50">· {food.calories}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Water + Mood */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Water */}
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.25)' }}>
                <Droplets size={15} className="text-cyan-400" />
              </div>
              <h3 className="font-bold text-white">Water intake</h3>
              <span className="ml-auto font-extrabold text-cyan-400">{log.water_ml || 0}ml</span>
            </div>
            <input type="range" min="0" max="4000" step="100"
              value={log.water_ml || 0}
              onChange={e => setLog(p => ({ ...p, water_ml: parseInt(e.target.value) }))}
              className="w-full mb-3 accent-cyan-400" />
            <div className="grid grid-cols-3 gap-2">
              {[250, 500, 750].map(ml => (
                <button key={ml} onClick={() => setLog(p => ({ ...p, water_ml: Math.min((p.water_ml || 0) + ml, 5000) }))}
                  className="py-2 rounded-xl text-xs font-bold transition-all duration-200"
                  style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#22d3ee' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.15)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(6,182,212,0.25)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(6,182,212,0.08)'; e.currentTarget.style.boxShadow = 'none' }}>
                  +{ml}ml
                </button>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div className="rounded-2xl p-5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.25)' }}>
                <Target size={15} className="text-violet-400" />
              </div>
              <h3 className="font-bold text-white">How do you feel?</h3>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {MOOD_OPTIONS.map(mood => (
                <button key={mood.value} onClick={() => setLog(p => ({ ...p, mood: mood.value as 'great'|'good'|'okay'|'bad' }))}
                  className="flex flex-col items-center gap-2 py-3 rounded-xl transition-all duration-200 text-white"
                  style={log.mood === mood.value ? {
                    background: mood.gradient,
                    boxShadow: `0 4px 14px ${mood.glow}`,
                    border: '1px solid transparent',
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#6b7280',
                  }}>
                  {mood.icon}
                  <span className="text-xs font-semibold">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-2xl p-5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <h3 className="font-bold text-white mb-3">Notes <span className="text-gray-600 font-normal text-sm">(optional)</span></h3>
          <textarea
            value={log.notes || ''}
            onChange={e => setLog(p => ({ ...p, notes: e.target.value }))}
            placeholder="Any notes about today's eating — cravings, how you felt, challenges..."
            rows={3}
            className="w-full text-sm text-white placeholder:text-gray-700 focus:outline-none resize-none"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '12px 16px',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
            }}
          />
        </div>

        {/* Save */}
        <div className="flex justify-end pb-4">
          <Button onClick={saveLog} loading={saving} size="lg">
            <Save size={16} /> Save today&apos;s log
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
