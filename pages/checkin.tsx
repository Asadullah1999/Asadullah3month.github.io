import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { todayISO, formatDate } from '@/lib/utils'
import { User, DailyLog, MealItem } from '@/lib/database.types'
import {
  Plus, Trash2, Save, CheckCircle2, Smile, Meh, Frown, Zap,
  Apple, Clock, Droplets,
} from 'lucide-react'
import toast from 'react-hot-toast'

type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snacks'

const MEAL_SECTIONS: { key: MealKey; label: string; icon: string; placeholder: string }[] = [
  { key: 'breakfast', label: 'Breakfast',  icon: '🌅', placeholder: 'e.g. 2 eggs, toast, orange juice' },
  { key: 'lunch',     label: 'Lunch',      icon: '☀️',  placeholder: 'e.g. chicken rice, salad' },
  { key: 'dinner',    label: 'Dinner',     icon: '🌙', placeholder: 'e.g. grilled fish, vegetables, rice' },
  { key: 'snacks',    label: 'Snacks',     icon: '🍎', placeholder: 'e.g. apple, protein shake, nuts' },
]

const MOOD_OPTIONS = [
  { value: 'great', label: 'Great',  icon: <Smile size={20} className="text-green-500" /> },
  { value: 'good',  label: 'Good',   icon: <Smile size={20} className="text-blue-400" /> },
  { value: 'okay',  label: 'Okay',   icon: <Meh   size={20} className="text-yellow-500" /> },
  { value: 'bad',   label: 'Bad',    icon: <Frown size={20} className="text-red-400" /> },
]

// Common foods with nutrition data
const QUICK_FOODS: MealItem[] = [
  { name: 'Boiled egg',      calories: 77,  protein: 6,  carbs: 1,  fat: 5,  quantity: '1 large' },
  { name: 'Chicken breast',  calories: 165, protein: 31, carbs: 0,  fat: 4,  quantity: '100g' },
  { name: 'White rice',      calories: 206, protein: 4,  carbs: 45, fat: 0,  quantity: '1 cup cooked' },
  { name: 'Whole wheat bread', calories: 69, protein: 4, carbs: 12, fat: 1,  quantity: '1 slice' },
  { name: 'Banana',          calories: 105, protein: 1,  carbs: 27, fat: 0,  quantity: '1 medium' },
  { name: 'Oats',            calories: 147, protein: 5,  carbs: 25, fat: 3,  quantity: '40g dry' },
  { name: 'Greek yogurt',    calories: 100, protein: 17, carbs: 6,  fat: 0,  quantity: '170g' },
  { name: 'Almonds',         calories: 164, protein: 6,  carbs: 6,  fat: 14, quantity: '28g (23 nuts)' },
  { name: 'Apple',           calories: 95,  protein: 0,  carbs: 25, fat: 0,  quantity: '1 medium' },
  { name: 'Salmon',          calories: 208, protein: 20, carbs: 0,  fat: 13, quantity: '100g' },
  { name: 'Lentils',         calories: 230, protein: 18, carbs: 40, fat: 1,  quantity: '1 cup cooked' },
  { name: 'Milk (whole)',    calories: 149, protein: 8,  carbs: 12, fat: 8,  quantity: '240ml' },
]

function blankItem(): MealItem {
  return { name: '', calories: 0, protein: 0, carbs: 0, fat: 0, quantity: '' }
}

export default function CheckinPage() {
  const [user, setUser] = useState<Partial<User> | null>(null)
  const [log, setLog] = useState<Partial<DailyLog>>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
    water_ml: 0,
    mood: undefined,
    notes: '',
  })
  const [activeSection, setActiveSection] = useState<MealKey>('breakfast')
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState<MealItem>(blankItem())
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

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
    if (logData) setLog(logData)
  }

  function getMealItems(key: MealKey): MealItem[] {
    const raw = log[key]
    return Array.isArray(raw) ? raw as MealItem[] : []
  }

  function addItem(key: MealKey, item: MealItem) {
    const current = getMealItems(key)
    setLog(prev => ({ ...prev, [key]: [...current, item] }))
    setNewItem(blankItem())
    setAdding(false)
  }

  function removeItem(key: MealKey, idx: number) {
    const current = getMealItems(key)
    setLog(prev => ({ ...prev, [key]: current.filter((_, i) => i !== idx) }))
  }

  function quickAdd(key: MealKey, food: MealItem) {
    addItem(key, food)
    toast.success(`${food.name} added!`)
  }

  function getTotals() {
    let calories = 0, protein = 0, carbs = 0, fat = 0
    for (const key of ['breakfast', 'lunch', 'dinner', 'snacks'] as MealKey[]) {
      for (const item of getMealItems(key)) {
        calories += item.calories || 0
        protein  += item.protein  || 0
        carbs    += item.carbs    || 0
        fat      += item.fat      || 0
      }
    }
    return {
      calories: Math.round(calories),
      protein:  Math.round(protein),
      carbs:    Math.round(carbs),
      fat:      Math.round(fat),
    }
  }

  async function saveLog() {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const totals = getTotals()
    const payload = {
      user_id: session.user.id,
      log_date: todayISO(),
      breakfast: getMealItems('breakfast'),
      lunch:     getMealItems('lunch'),
      dinner:    getMealItems('dinner'),
      snacks:    getMealItems('snacks'),
      total_calories: totals.calories,
      total_protein:  totals.protein,
      total_carbs:    totals.carbs,
      total_fat:      totals.fat,
      water_ml:   log.water_ml || 0,
      mood:       log.mood,
      notes:      log.notes,
      checkin_time: new Date().toISOString(),
    }

    const safePayload = payload as unknown as Partial<DailyLog>
    const { error } = log.id
      ? await supabase.from('daily_logs').update(safePayload).eq('id', log.id)
      : await supabase.from('daily_logs').upsert(safePayload, { onConflict: 'user_id,log_date' })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Daily log saved!')
      setSaved(true)
      loadData()
    }
    setSaving(false)
  }

  const totals = getTotals()
  const calorieTarget = user?.calorie_target || 2000
  const caloriePct = Math.min(Math.round((totals.calories / calorieTarget) * 100), 100)

  return (
    <DashboardLayout pageTitle="Meal Check-in" title="Daily Meal Check-in">
      <div className="space-y-6">
        {/* Date + summary */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{formatDate(new Date())}</h2>
            <p className="text-sm text-gray-500">Log your meals to track your nutrition</p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle2 size={16} />
              Saved today
            </div>
          )}
        </div>

        {/* Calorie summary bar */}
        <Card padding="md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">Total consumed</p>
              <p className="text-2xl font-bold text-gray-900">
                {totals.calories} <span className="text-base font-medium text-gray-400">/ {calorieTarget} kcal</span>
              </p>
            </div>
            <div className="flex gap-4 text-center">
              <div><p className="text-sm font-bold text-blue-600">{totals.protein}g</p><p className="text-xs text-gray-400">Protein</p></div>
              <div><p className="text-sm font-bold text-orange-500">{totals.carbs}g</p><p className="text-xs text-gray-400">Carbs</p></div>
              <div><p className="text-sm font-bold text-yellow-500">{totals.fat}g</p><p className="text-xs text-gray-400">Fat</p></div>
            </div>
          </div>
          <div className="h-2.5 rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all duration-500 ${caloriePct > 100 ? 'bg-red-400' : 'bg-green-500'}`}
              style={{ width: `${caloriePct}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">{caloriePct}% of daily goal</p>
        </Card>

        {/* Meal tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {MEAL_SECTIONS.map(s => {
            const count = getMealItems(s.key).length
            const active = activeSection === s.key
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                  active
                    ? 'bg-green-600 text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <span>{s.icon}</span>
                {s.label}
                {count > 0 && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${active ? 'bg-white/20 text-white' : 'bg-green-100 text-green-700'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Active meal section */}
        {MEAL_SECTIONS.filter(s => s.key === activeSection).map(section => (
          <Card key={section.key} padding="md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <span className="text-xl">{section.icon}</span>
                <CardTitle>{section.label}</CardTitle>
              </div>
              <Button size="sm" onClick={() => setAdding(!adding)}>
                <Plus size={14} /> Add food
              </Button>
            </CardHeader>

            {/* Existing items */}
            {getMealItems(section.key).length === 0 && !adding ? (
              <div className="text-center py-8 text-gray-400">
                <Apple size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm">No items logged yet</p>
                <button onClick={() => setAdding(true)} className="text-green-600 text-sm mt-1 hover:underline">
                  + Add your first item
                </button>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {getMealItems(section.key).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-4 ml-3">
                      <div className="flex gap-3 text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">{item.calories} kcal</span>
                        <span>P:{item.protein}g</span>
                        <span className="hidden sm:block">C:{item.carbs}g</span>
                        <span className="hidden sm:block">F:{item.fat}g</span>
                      </div>
                      <button onClick={() => removeItem(section.key, i)} className="text-gray-300 hover:text-red-400 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add item form */}
            {adding && (
              <div className="border-t border-gray-100 pt-4 mt-2 space-y-3">
                <p className="text-sm font-medium text-gray-700">Add food item</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Food name"
                    value={newItem.name}
                    onChange={e => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={section.placeholder}
                  />
                  <Input
                    label="Quantity / serving"
                    value={newItem.quantity}
                    onChange={e => setNewItem(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="e.g. 100g, 1 cup"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'calories', label: 'Calories', unit: 'kcal' },
                    { key: 'protein',  label: 'Protein',  unit: 'g' },
                    { key: 'carbs',    label: 'Carbs',    unit: 'g' },
                    { key: 'fat',      label: 'Fat',      unit: 'g' },
                  ].map(f => (
                    <Input
                      key={f.key}
                      label={`${f.label} (${f.unit})`}
                      type="number"
                      min="0"
                      value={(newItem[f.key as keyof MealItem] as number) || ''}
                      onChange={e => setNewItem(prev => ({ ...prev, [f.key]: parseFloat(e.target.value) || 0 }))}
                      placeholder="0"
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => addItem(section.key, newItem)}
                    disabled={!newItem.name}
                    size="sm"
                  >
                    <Plus size={14} /> Add item
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => { setAdding(false); setNewItem(blankItem()) }}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Quick add common foods */}
            <div className="border-t border-gray-100 pt-4 mt-2">
              <p className="text-xs font-medium text-gray-500 mb-2.5 flex items-center gap-1.5">
                <Zap size={12} className="text-yellow-400" /> Quick add common foods
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_FOODS.slice(0, 8).map(food => (
                  <button
                    key={food.name}
                    onClick={() => quickAdd(section.key, food)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-green-400 hover:bg-green-50 hover:text-green-700 transition-colors"
                  >
                    {food.name} <span className="text-gray-400">({food.calories} kcal)</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>
        ))}

        {/* Water + Mood + Notes */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card padding="md">
            <CardTitle className="mb-4 flex items-center gap-2">
              <Droplets size={16} className="text-blue-400" /> Water intake
            </CardTitle>
            <div className="flex items-center gap-3 mb-3">
              <input
                type="range"
                min="0"
                max="4000"
                step="100"
                value={log.water_ml || 0}
                onChange={e => setLog(prev => ({ ...prev, water_ml: parseInt(e.target.value) }))}
                className="flex-1 accent-blue-500"
              />
              <span className="text-sm font-bold text-blue-600 w-16 text-right">{log.water_ml || 0}ml</span>
            </div>
            <div className="flex gap-2">
              {[250, 500, 750].map(ml => (
                <button
                  key={ml}
                  onClick={() => setLog(prev => ({ ...prev, water_ml: Math.min((prev.water_ml || 0) + ml, 5000) }))}
                  className="flex-1 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-xs font-medium hover:bg-blue-100 transition-colors"
                >
                  +{ml}ml
                </button>
              ))}
            </div>
          </Card>

          <Card padding="md">
            <CardTitle className="mb-4">How do you feel today?</CardTitle>
            <div className="grid grid-cols-4 gap-2">
              {MOOD_OPTIONS.map(mood => (
                <button
                  key={mood.value}
                  onClick={() => setLog(prev => ({ ...prev, mood: mood.value as 'great' | 'good' | 'okay' | 'bad' }))}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all ${
                    log.mood === mood.value
                      ? 'border-green-400 bg-green-50 text-green-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {mood.icon}
                  <span className="text-xs font-medium">{mood.label}</span>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Notes */}
        <Card padding="md">
          <CardTitle className="mb-3">Notes (optional)</CardTitle>
          <textarea
            value={log.notes || ''}
            onChange={e => setLog(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any notes about today's eating — cravings, how you felt, challenges..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-400 resize-none"
          />
        </Card>

        {/* Save button */}
        <div className="flex justify-end">
          <Button onClick={saveLog} loading={saving} size="lg">
            <Save size={16} />
            Save today&apos;s log
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
