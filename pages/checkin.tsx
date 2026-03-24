import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PageHero from '@/components/ui/PageHero'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { todayISO, formatDate } from '@/lib/utils'
import { User, DailyLog, MealItem } from '@/lib/database.types'
import {
  Plus, Trash2, Save, CheckCircle2, Smile, Meh, Frown, Zap,
  Apple, Droplets, Flame, Target, Search,
} from 'lucide-react'
import toast from 'react-hot-toast'

const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }
const cardAnim: Variants = { hidden: { opacity: 0, y: 20, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } } }

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

type FoodCategory = 'all' | 'basics' | 'north_indian' | 'south_indian' | 'bengali_eastern' | 'gujarati_maharashtrian' | 'street_food' | 'sweets' | 'beverages' | 'healthy'

type CategorizedFood = MealItem & { category: FoodCategory }

const FOOD_CATEGORIES: { key: FoodCategory; label: string }[] = [
  { key: 'all',                     label: 'All' },
  { key: 'basics',                  label: 'Basics' },
  { key: 'north_indian',            label: 'North Indian' },
  { key: 'south_indian',            label: 'South Indian' },
  { key: 'bengali_eastern',         label: 'Bengali' },
  { key: 'gujarati_maharashtrian',  label: 'Gujarati' },
  { key: 'street_food',             label: 'Street Food' },
  { key: 'sweets',                  label: 'Sweets' },
  { key: 'beverages',               label: 'Drinks' },
  { key: 'healthy',                 label: 'Healthy' },
]

const QUICK_FOODS: CategorizedFood[] = [
  // Basics
  { name: 'Boiled egg',        calories: 77,  protein: 6,  carbs: 1,  fat: 5,  quantity: '1 large', category: 'basics' },
  { name: 'Chicken breast',    calories: 165, protein: 31, carbs: 0,  fat: 4,  quantity: '100g', category: 'basics' },
  { name: 'White rice',        calories: 206, protein: 4,  carbs: 45, fat: 0,  quantity: '1 cup', category: 'basics' },
  { name: 'Whole wheat bread', calories: 69,  protein: 4,  carbs: 12, fat: 1,  quantity: '1 slice', category: 'basics' },
  { name: 'Banana',            calories: 105, protein: 1,  carbs: 27, fat: 0,  quantity: '1 medium', category: 'basics' },
  { name: 'Oats',              calories: 147, protein: 5,  carbs: 25, fat: 3,  quantity: '40g dry', category: 'basics' },
  { name: 'Greek yogurt',      calories: 100, protein: 17, carbs: 6,  fat: 0,  quantity: '170g', category: 'basics' },
  { name: 'Almonds',           calories: 164, protein: 6,  carbs: 6,  fat: 14, quantity: '28g', category: 'basics' },
  { name: 'Apple',             calories: 95,  protein: 0,  carbs: 25, fat: 0,  quantity: '1 medium', category: 'basics' },
  { name: 'Paneer',            calories: 265, protein: 18, carbs: 1,  fat: 21, quantity: '100g', category: 'basics' },
  { name: 'Curd / Dahi',       calories: 98,  protein: 11, carbs: 4,  fat: 5,  quantity: '1 cup', category: 'basics' },
  { name: 'Ghee',              calories: 112, protein: 0,  carbs: 0,  fat: 12, quantity: '1 tbsp', category: 'basics' },

  // North Indian
  { name: 'Roti / Chapati',       calories: 104, protein: 3,  carbs: 18, fat: 3,  quantity: '1 piece', category: 'north_indian' },
  { name: 'Naan',                  calories: 262, protein: 9,  carbs: 45, fat: 5,  quantity: '1 piece', category: 'north_indian' },
  { name: 'Paratha (plain)',       calories: 180, protein: 4,  carbs: 28, fat: 7,  quantity: '1 piece', category: 'north_indian' },
  { name: 'Aloo Paratha',         calories: 230, protein: 5,  carbs: 32, fat: 10, quantity: '1 piece', category: 'north_indian' },
  { name: 'Dal Makhani',          calories: 230, protein: 12, carbs: 28, fat: 9,  quantity: '1 cup', category: 'north_indian' },
  { name: 'Dal Tadka',            calories: 180, protein: 10, carbs: 24, fat: 5,  quantity: '1 cup', category: 'north_indian' },
  { name: 'Rajma',                calories: 210, protein: 12, carbs: 30, fat: 5,  quantity: '1 cup', category: 'north_indian' },
  { name: 'Chole / Chana Masala', calories: 240, protein: 11, carbs: 34, fat: 7,  quantity: '1 cup', category: 'north_indian' },
  { name: 'Paneer Butter Masala', calories: 320, protein: 14, carbs: 12, fat: 25, quantity: '1 cup', category: 'north_indian' },
  { name: 'Palak Paneer',         calories: 260, protein: 15, carbs: 10, fat: 18, quantity: '1 cup', category: 'north_indian' },
  { name: 'Kadhai Paneer',        calories: 290, protein: 16, carbs: 8,  fat: 22, quantity: '1 cup', category: 'north_indian' },
  { name: 'Aloo Gobi',            calories: 150, protein: 4,  carbs: 20, fat: 7,  quantity: '1 cup', category: 'north_indian' },
  { name: 'Baingan Bharta',       calories: 140, protein: 3,  carbs: 14, fat: 9,  quantity: '1 cup', category: 'north_indian' },
  { name: 'Jeera Rice',           calories: 220, protein: 4,  carbs: 42, fat: 5,  quantity: '1 cup', category: 'north_indian' },
  { name: 'Pulao',                calories: 250, protein: 5,  carbs: 44, fat: 7,  quantity: '1 cup', category: 'north_indian' },
  { name: 'Khichdi',              calories: 200, protein: 7,  carbs: 34, fat: 4,  quantity: '1 cup', category: 'north_indian' },
  { name: 'Poha',                 calories: 180, protein: 4,  carbs: 35, fat: 4,  quantity: '1 cup', category: 'north_indian' },
  { name: 'Raita',                calories: 70,  protein: 4,  carbs: 5,  fat: 4,  quantity: '1 cup', category: 'north_indian' },
  { name: 'Biryani (chicken)',    calories: 350, protein: 18, carbs: 42, fat: 12, quantity: '1 plate', category: 'north_indian' },
  { name: 'Biryani (veg)',        calories: 280, protein: 7,  carbs: 45, fat: 8,  quantity: '1 plate', category: 'north_indian' },

  // South Indian
  { name: 'Idli',              calories: 74,  protein: 3,  carbs: 15, fat: 0,  quantity: '2 pieces', category: 'south_indian' },
  { name: 'Plain Dosa',        calories: 168, protein: 4,  carbs: 32, fat: 3,  quantity: '1 medium', category: 'south_indian' },
  { name: 'Masala Dosa',       calories: 250, protein: 6,  carbs: 38, fat: 8,  quantity: '1 piece', category: 'south_indian' },
  { name: 'Sambar',            calories: 112, protein: 6,  carbs: 18, fat: 2,  quantity: '1 cup', category: 'south_indian' },
  { name: 'Upma',              calories: 210, protein: 5,  carbs: 38, fat: 5,  quantity: '1 cup', category: 'south_indian' },
  { name: 'Vada',              calories: 97,  protein: 4,  carbs: 14, fat: 3,  quantity: '1 piece', category: 'south_indian' },
  { name: 'Medu Vada',         calories: 135, protein: 6,  carbs: 16, fat: 5,  quantity: '1 piece', category: 'south_indian' },
  { name: 'Pongal',            calories: 268, protein: 8,  carbs: 48, fat: 5,  quantity: '1 cup', category: 'south_indian' },
  { name: 'Rasam',             calories: 48,  protein: 2,  carbs: 8,  fat: 1,  quantity: '1 cup', category: 'south_indian' },
  { name: 'Coconut Chutney',   calories: 72,  protein: 1,  carbs: 3,  fat: 7,  quantity: '2 tbsp', category: 'south_indian' },
  { name: 'Uttapam',           calories: 200, protein: 5,  carbs: 34, fat: 5,  quantity: '1 piece', category: 'south_indian' },
  { name: 'Appam',             calories: 120, protein: 2,  carbs: 24, fat: 2,  quantity: '1 piece', category: 'south_indian' },
  { name: 'Puttu',             calories: 190, protein: 4,  carbs: 38, fat: 3,  quantity: '1 serving', category: 'south_indian' },
  { name: 'Lemon Rice',        calories: 235, protein: 4,  carbs: 40, fat: 7,  quantity: '1 cup', category: 'south_indian' },
  { name: 'Curd Rice',         calories: 200, protein: 6,  carbs: 34, fat: 5,  quantity: '1 cup', category: 'south_indian' },
  { name: 'Bisibele Bath',     calories: 280, protein: 9,  carbs: 44, fat: 8,  quantity: '1 cup', category: 'south_indian' },
  { name: 'Kerala Fish Curry', calories: 220, protein: 22, carbs: 8,  fat: 12, quantity: '1 cup', category: 'south_indian' },

  // Bengali / Eastern
  { name: 'Litti Chokha',       calories: 300, protein: 8,  carbs: 42, fat: 12, quantity: '2 pieces', category: 'bengali_eastern' },
  { name: 'Bengali Fish Curry', calories: 250, protein: 24, carbs: 10, fat: 14, quantity: '1 cup', category: 'bengali_eastern' },
  { name: 'Mishti Doi',         calories: 150, protein: 5,  carbs: 22, fat: 5,  quantity: '1 cup', category: 'bengali_eastern' },
  { name: 'Shukto',             calories: 130, protein: 3,  carbs: 16, fat: 7,  quantity: '1 cup', category: 'bengali_eastern' },
  { name: 'Luchi',              calories: 120, protein: 2,  carbs: 16, fat: 6,  quantity: '1 piece', category: 'bengali_eastern' },

  // Gujarati / Maharashtrian
  { name: 'Dhokla',        calories: 130, protein: 5,  carbs: 20, fat: 3,  quantity: '3 pieces', category: 'gujarati_maharashtrian' },
  { name: 'Thepla',        calories: 140, protein: 4,  carbs: 20, fat: 5,  quantity: '1 piece', category: 'gujarati_maharashtrian' },
  { name: 'Pav Bhaji',     calories: 380, protein: 10, carbs: 52, fat: 15, quantity: '1 plate', category: 'gujarati_maharashtrian' },
  { name: 'Vada Pav',      calories: 290, protein: 6,  carbs: 38, fat: 13, quantity: '1 piece', category: 'gujarati_maharashtrian' },
  { name: 'Misal Pav',     calories: 350, protein: 12, carbs: 45, fat: 14, quantity: '1 plate', category: 'gujarati_maharashtrian' },
  { name: 'Undhiyu',       calories: 220, protein: 6,  carbs: 28, fat: 10, quantity: '1 cup', category: 'gujarati_maharashtrian' },
  { name: 'Khandvi',       calories: 110, protein: 5,  carbs: 14, fat: 4,  quantity: '4 pieces', category: 'gujarati_maharashtrian' },

  // Street Food / Snacks
  { name: 'Samosa',        calories: 260, protein: 5,  carbs: 28, fat: 15, quantity: '1 piece', category: 'street_food' },
  { name: 'Pani Puri',     calories: 180, protein: 3,  carbs: 30, fat: 6,  quantity: '6 pieces', category: 'street_food' },
  { name: 'Bhel Puri',     calories: 200, protein: 4,  carbs: 32, fat: 7,  quantity: '1 plate', category: 'street_food' },
  { name: 'Aloo Tikki',    calories: 180, protein: 3,  carbs: 24, fat: 9,  quantity: '2 pieces', category: 'street_food' },
  { name: 'Dahi Vada',     calories: 165, protein: 6,  carbs: 22, fat: 6,  quantity: '2 pieces', category: 'street_food' },
  { name: 'Pakora',        calories: 190, protein: 4,  carbs: 18, fat: 12, quantity: '4 pieces', category: 'street_food' },
  { name: 'Sev Puri',      calories: 220, protein: 4,  carbs: 28, fat: 10, quantity: '1 plate', category: 'street_food' },
  { name: 'Kachori',       calories: 240, protein: 5,  carbs: 26, fat: 14, quantity: '1 piece', category: 'street_food' },

  // Sweets (for tracking)
  { name: 'Gulab Jamun',   calories: 175, protein: 2,  carbs: 28, fat: 7,  quantity: '2 pieces', category: 'sweets' },
  { name: 'Jalebi',        calories: 150, protein: 1,  carbs: 30, fat: 4,  quantity: '2 pieces', category: 'sweets' },
  { name: 'Ladoo (besan)', calories: 180, protein: 4,  carbs: 22, fat: 9,  quantity: '1 piece', category: 'sweets' },
  { name: 'Kheer',         calories: 210, protein: 6,  carbs: 32, fat: 7,  quantity: '1 cup', category: 'sweets' },
  { name: 'Halwa (suji)',  calories: 250, protein: 3,  carbs: 36, fat: 11, quantity: '1 cup', category: 'sweets' },
  { name: 'Rasgulla',      calories: 125, protein: 3,  carbs: 25, fat: 1,  quantity: '2 pieces', category: 'sweets' },
  { name: 'Barfi',         calories: 160, protein: 3,  carbs: 24, fat: 7,  quantity: '1 piece', category: 'sweets' },

  // Beverages
  { name: 'Masala Chai',     calories: 90,  protein: 3,  carbs: 12, fat: 3,  quantity: '1 cup', category: 'beverages' },
  { name: 'Filter Coffee',   calories: 80,  protein: 2,  carbs: 10, fat: 3,  quantity: '1 cup', category: 'beverages' },
  { name: 'Lassi (sweet)',    calories: 175, protein: 5,  carbs: 28, fat: 5,  quantity: '1 glass', category: 'beverages' },
  { name: 'Chaas / Buttermilk', calories: 40, protein: 2, carbs: 5,  fat: 1,  quantity: '1 glass', category: 'beverages' },
  { name: 'Nimbu Pani',      calories: 45,  protein: 0,  carbs: 12, fat: 0,  quantity: '1 glass', category: 'beverages' },
  { name: 'Coconut Water',   calories: 46,  protein: 2,  carbs: 9,  fat: 0,  quantity: '1 cup', category: 'beverages' },
  { name: 'Mango Lassi',     calories: 210, protein: 5,  carbs: 36, fat: 5,  quantity: '1 glass', category: 'beverages' },
  { name: 'Thandai',         calories: 160, protein: 4,  carbs: 22, fat: 6,  quantity: '1 glass', category: 'beverages' },

  // Healthy / Modern
  { name: 'Sprouts Salad',     calories: 120, protein: 8,  carbs: 18, fat: 2,  quantity: '1 cup', category: 'healthy' },
  { name: 'Moong Dal Chilla',  calories: 110, protein: 7,  carbs: 16, fat: 2,  quantity: '1 piece', category: 'healthy' },
  { name: 'Ragi Dosa',         calories: 130, protein: 4,  carbs: 26, fat: 2,  quantity: '1 piece', category: 'healthy' },
  { name: 'Millet Khichdi',    calories: 190, protein: 7,  carbs: 32, fat: 3,  quantity: '1 cup', category: 'healthy' },
  { name: 'Oats Upma',         calories: 160, protein: 5,  carbs: 28, fat: 4,  quantity: '1 cup', category: 'healthy' },
  { name: 'Quinoa Pulao',      calories: 180, protein: 6,  carbs: 30, fat: 4,  quantity: '1 cup', category: 'healthy' },
  { name: 'Ragi Porridge',     calories: 120, protein: 3,  carbs: 24, fat: 2,  quantity: '1 cup', category: 'healthy' },
  { name: 'Mixed Vegetable Soup', calories: 80, protein: 3, carbs: 14, fat: 1, quantity: '1 cup', category: 'healthy' },
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
  const [foodCategory, setFoodCategory] = useState<FoodCategory>('all')
  const [foodSearch, setFoodSearch] = useState('')

  useEffect(() => {
    loadData()
    let channel: ReturnType<typeof supabase.channel> | null = null
    async function setupRealtime() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      channel = supabase
        .channel('checkin-realtime')
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'daily_logs',
          filter: `user_id=eq.${session.user.id}`,
        }, (payload) => {
          const newRow = payload.new as Record<string, unknown>
          if (newRow.log_date === todayISO()) {
            setLog(newRow as Partial<DailyLog>)
          }
        })
        .subscribe()
    }
    setupRealtime()
    return () => { if (channel) supabase.removeChannel(channel) }
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
      <PageHero
        badge="Meal Log"
        badgeColor="#f59e0b"
        title="Today's Meals"
        highlight="Meals"
        subtitle="Log your breakfast, lunch, dinner & snacks"
        orbColors={['rgba(245,158,11,0.3)', 'rgba(239,68,68,0.2)']}
      />
      <motion.div className="space-y-5" initial="hidden" animate="visible" variants={stagger}>

        {/* Date header */}
        <motion.div variants={cardAnim} className="flex items-center justify-between">
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
        </motion.div>

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

            {/* Quick add with category filter */}
            <div className="pt-4 border-t border-white/[0.05]">
              <p className="text-xs font-bold text-gray-500 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                <Zap size={11} className="text-amber-400" /> Quick add — {QUICK_FOODS.length} foods
              </p>

              {/* Search */}
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="text"
                  value={foodSearch}
                  onChange={e => setFoodSearch(e.target.value)}
                  placeholder="Search foods..."
                  className="w-full pl-9 pr-3 py-2 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                />
              </div>

              {/* Category tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3">
                {FOOD_CATEGORIES.map(cat => (
                  <button key={cat.key} onClick={() => setFoodCategory(cat.key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0"
                    style={foodCategory === cat.key ? {
                      background: activeMeal.color, border: `1px solid ${activeMeal.border}`, color: activeMeal.accent,
                    } : {
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: '#6b7280',
                    }}>
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Food grid */}
              <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
                {QUICK_FOODS
                  .filter(f => foodCategory === 'all' || f.category === foodCategory)
                  .filter(f => !foodSearch || f.name.toLowerCase().includes(foodSearch.toLowerCase()))
                  .map(food => (
                  <button key={food.name} onClick={() => quickAdd(activeSection, food)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}
                    onMouseEnter={e => { e.currentTarget.style.background = activeMeal.color; e.currentTarget.style.borderColor = activeMeal.border; e.currentTarget.style.color = activeMeal.accent }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#9ca3af' }}>
                    {food.name} <span className="opacity-50">· {food.calories}</span>
                  </button>
                ))}
                {QUICK_FOODS
                  .filter(f => foodCategory === 'all' || f.category === foodCategory)
                  .filter(f => !foodSearch || f.name.toLowerCase().includes(foodSearch.toLowerCase()))
                  .length === 0 && (
                  <p className="text-xs text-gray-600 py-4 w-full text-center">No foods found. Try a different search or category.</p>
                )}
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
        <motion.div variants={cardAnim} className="flex justify-end pb-4">
          <Button onClick={saveLog} loading={saving} size="lg">
            <Save size={16} /> Save today&apos;s log
          </Button>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}
