import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Head from 'next/head'
import Link from 'next/link'
import {
  Utensils, Zap, Download, Loader2, ChevronDown, ChevronRight,
  Flame, Drumstick, Wheat, Droplets, Sun, Moon, Coffee,
  AlertTriangle, Sparkles, Clock, Apple, RefreshCw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePlan } from '@/lib/usePlan'
import Sidebar from '@/components/layout/Sidebar'

type PlanType = 'regular' | 'ramadan' | 'keto' | 'intermittent_fasting'

type Meal = {
  name: string
  time: string
  items: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

type DayPlan = {
  day: string
  meals: Meal[]
}

type PlanData = {
  overview: {
    plan_type: string
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
  }
  days: DayPlan[]
  key_notes: string[]
}

type UserProfile = {
  full_name: string | null
  age: number | null
  gender: string | null
  height_cm: number | null
  weight_kg: number | null
  goal: string | null
  activity_level: string | null
  diet_preference: string | null
  calorie_target: number | null
  protein_target: number | null
  carb_target: number | null
  fat_target: number | null
  diabetes_type: string | null
  bp_status: string | null
  allergies: string[] | null
}

const PLAN_OPTIONS: { value: PlanType; label: string; emoji: string; desc: string }[] = [
  { value: 'regular', label: 'Regular', emoji: '🍽️', desc: 'Balanced meals across the day' },
  { value: 'ramadan', label: 'Ramadan Fasting', emoji: '🌙', desc: 'Suhoor, Iftar & Dinner' },
  { value: 'keto', label: 'Keto', emoji: '🥑', desc: 'Low carb, high fat ketogenic' },
  { value: 'intermittent_fasting', label: 'Intermittent Fasting', emoji: '⏰', desc: '16:8 eating window' },
]

const MEAL_ICONS: Record<string, typeof Sun> = {
  Suhoor: Moon,
  Iftar: Sun,
  Dinner: Utensils,
  Breakfast: Coffee,
  Lunch: Sun,
  Snack: Apple,
  'Meal 1': Clock,
  'Meal 2': Clock,
  'Meal 3': Clock,
}

function getMealIcon(name: string) {
  for (const [key, Icon] of Object.entries(MEAL_ICONS)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return Icon
  }
  return Utensils
}

function MacroBar({ label, value, color, icon: Icon }: {
  label: string; value: number; color: string; icon: typeof Flame
}) {
  return (
    <div className="flex items-center gap-3 flex-1 min-w-[120px]">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
        <Icon size={16} style={{ color }} />
      </div>
      <div>
        <p className="text-white font-bold text-lg leading-tight">{value}<span className="text-gray-500 text-xs font-normal ml-0.5">{label === 'Calories' ? ' kcal' : 'g'}</span></p>
        <p className="text-gray-500 text-xs">{label}</p>
      </div>
    </div>
  )
}

export default function DietPlanPage() {
  const { plan: userPlan, loading: planLoading, isPro } = usePlan()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [planType, setPlanType] = useState<PlanType>('regular')
  const [generating, setGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<PlanData | null>(null)
  const [error, setError] = useState('')
  const [expandedDay, setExpandedDay] = useState<number>(0)
  const [savedPlans, setSavedPlans] = useState<{ id: string; title: string; meals: PlanData; created_at: string }[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)

      const [{ data: profile }, { data: plans }] = await Promise.all([
        supabase.from('users').select('full_name, age, gender, height_cm, weight_kg, goal, activity_level, diet_preference, calorie_target, protein_target, carb_target, fat_target, diabetes_type, bp_status, allergies, role').eq('id', session.user.id).single(),
        supabase.from('diet_plans').select('id, title, meals, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(5),
      ])

      if (profile) {
        setUser(profile as unknown as UserProfile)
        setIsAdmin((profile as Record<string, unknown>).role === 'admin' || (profile as Record<string, unknown>).role === 'nutritionist')
      }
      if (plans) setSavedPlans(plans as typeof savedPlans)
    }
    load()
  }, [])

  async function generatePlan() {
    if (!userId) return
    setGenerating(true)
    setError('')
    setGeneratedPlan(null)

    try {
      const resp = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ userId, planType, durationDays: 7 }),
      })
      const data = await resp.json()

      if (data.gated) {
        setError(data.error)
        return
      }
      if (data.error) {
        setError(data.error)
        return
      }
      setGeneratedPlan(data.plan)
      setExpandedDay(0)
    } catch {
      setError('Failed to generate plan. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function loadSavedPlan(plan: typeof savedPlans[0]) {
    setGeneratedPlan(plan.meals)
    setExpandedDay(0)
    setShowHistory(false)
  }

  function handleExport() {
    window.print()
  }

  const firstName = user?.full_name?.split(' ')[0] || 'there'

  return (
    <>
      <Head>
        <title>Diet Plan Generator - FahmiFit</title>
        <style>{`
          @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible !important; }
            .print-area {
              position: absolute; left: 0; top: 0; width: 100%;
              background: white !important; color: black !important;
              padding: 20px;
            }
            .print-area .print-hide { display: none !important; }
            .print-area .day-card { break-inside: avoid; page-break-inside: avoid; margin-bottom: 16px; border: 1px solid #ddd; border-radius: 8px; padding: 12px; }
            .print-area .meal-row { border-bottom: 1px solid #eee; padding: 8px 0; }
            .print-area h2, .print-area h3 { color: #111 !important; }
            .print-area p, .print-area span { color: #333 !important; }
          }
        `}</style>
      </Head>
      <Sidebar isAdmin={isAdmin} user={user ? { full_name: user.full_name, email: undefined } : undefined} plan={userPlan} />

      <main className="lg:ml-60 min-h-screen" style={{ background: '#050510' }}>
        <div className="max-w-5xl mx-auto px-4 py-8">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>
                <Utensils size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">AI Diet Plan Generator</h1>
                <p className="text-gray-500 text-sm">Personalized meal plans powered by AI</p>
              </div>
            </div>
          </motion.div>

          {/* Profile Summary */}
          {user && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl p-4 mb-6"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Profile:</span>
                  <span className="text-white font-medium">{user.full_name}</span>
                </div>
                <span className="text-gray-700">|</span>
                <span className="text-gray-400">{user.age}y, {user.gender}, {user.weight_kg}kg, {user.height_cm}cm</span>
                <span className="text-gray-700">|</span>
                <span className="text-gray-400">Goal: <span className="text-emerald-400">{(user.goal || '').replace('_', ' ')}</span></span>
                <span className="text-gray-700">|</span>
                <span className="text-gray-400">Diet: <span className="text-cyan-400">{user.diet_preference || 'omnivore'}</span></span>
                {user.diabetes_type && user.diabetes_type !== 'none' && (
                  <>
                    <span className="text-gray-700">|</span>
                    <span className="text-amber-400 flex items-center gap-1"><AlertTriangle size={12} /> {user.diabetes_type}</span>
                  </>
                )}
                {user.allergies && user.allergies.length > 0 && (
                  <>
                    <span className="text-gray-700">|</span>
                    <span className="text-red-400">Allergies: {user.allergies.join(', ')}</span>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Plan Type Selector */}
          {!generatedPlan && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <h2 className="text-white font-semibold mb-3 text-lg">Choose Plan Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {PLAN_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPlanType(opt.value)}
                    className="text-left rounded-xl p-4 transition-all"
                    style={{
                      background: planType === opt.value ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                      border: planType === opt.value ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      boxShadow: planType === opt.value ? '0 0 20px rgba(16,185,129,0.1)' : 'none',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opt.emoji}</span>
                      <div>
                        <p className="text-white font-semibold text-sm">{opt.label}</p>
                        <p className="text-gray-500 text-xs">{opt.desc}</p>
                      </div>
                      {planType === opt.value && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 8px #10b981' }} />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* Generate Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <button
                  onClick={generatePlan}
                  disabled={generating || planLoading || !isPro}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all"
                  style={{
                    background: generating || !isPro ? 'rgba(16,185,129,0.3)' : 'linear-gradient(135deg, #10b981, #059669)',
                    boxShadow: generating || !isPro ? 'none' : '0 0 20px rgba(16,185,129,0.3)',
                    cursor: generating || !isPro ? 'not-allowed' : 'pointer',
                  }}
                >
                  {generating ? (
                    <><Loader2 size={18} className="animate-spin" /> Generating 7-Day Plan...</>
                  ) : (
                    <><Sparkles size={18} /> Generate 7-Day Plan</>
                  )}
                </button>

                {!isPro && !planLoading && (
                  <Link href="/pricing" className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-1">
                    <Zap size={14} /> Upgrade to Pro to unlock
                  </Link>
                )}

                {savedPlans.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="text-sm text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <Clock size={14} /> Past Plans ({savedPlans.length})
                    <ChevronDown size={14} className={`transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>

              {/* Saved Plans */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 space-y-2 overflow-hidden"
                  >
                    {savedPlans.map((sp) => (
                      <button
                        key={sp.id}
                        onClick={() => loadSavedPlan(sp)}
                        className="w-full text-left rounded-xl p-3 flex items-center gap-3 transition-all hover:bg-white/5"
                        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <Utensils size={14} className="text-gray-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{sp.title}</p>
                          <p className="text-gray-600 text-xs">{new Date(sp.created_at).toLocaleDateString()}</p>
                        </div>
                        <ChevronRight size={14} className="text-gray-600" />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 rounded-xl p-3 flex items-center gap-2"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <AlertTriangle size={16} className="text-red-400" />
                  <p className="text-red-400 text-sm">{error}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Generating Animation */}
          {generating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 flex flex-col items-center justify-center py-16"
            >
              <motion.div
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.1))', border: '1px solid rgba(16,185,129,0.3)' }}
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles size={32} className="text-emerald-400" />
              </motion.div>
              <p className="text-white font-semibold mb-2">Crafting your personalized meal plan...</p>
              <p className="text-gray-500 text-sm">Analyzing your profile, health data & preferences</p>
              <div className="flex gap-1 mt-4">
                {[0, 1, 2, 3, 4].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-emerald-500"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Generated Plan Display */}
          {generatedPlan && !generating && (
            <div ref={printRef} className="print-area">
              {/* Action Bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center gap-3 mb-6 print-hide"
              >
                <button
                  onClick={() => setGeneratedPlan(null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <RefreshCw size={14} /> New Plan
                </button>
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 0 12px rgba(59,130,246,0.3)' }}
                >
                  <Download size={14} /> Export as PDF
                </button>
              </motion.div>

              {/* Plan Title */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-6 mb-6 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.06))', border: '1px solid rgba(16,185,129,0.2)' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full" style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.1), transparent)', transform: 'translate(30%, -30%)' }} />
                <h2 className="text-xl font-bold text-white mb-1">
                  {generatedPlan.overview.plan_type === 'ramadan' ? '🌙 Ramadan' : generatedPlan.overview.plan_type === 'keto' ? '🥑 Keto' : generatedPlan.overview.plan_type === 'intermittent_fasting' ? '⏰ IF' : '🍽️'} 7-Day Diet Plan
                </h2>
                <p className="text-gray-400 text-sm mb-4">Personalized for {firstName} — {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

                {/* Macro Overview */}
                <div className="flex flex-wrap gap-4">
                  <MacroBar label="Calories" value={generatedPlan.overview.calories} color="#f59e0b" icon={Flame} />
                  <MacroBar label="Protein" value={generatedPlan.overview.protein} color="#ef4444" icon={Drumstick} />
                  <MacroBar label="Carbs" value={generatedPlan.overview.carbs} color="#3b82f6" icon={Wheat} />
                  <MacroBar label="Fat" value={generatedPlan.overview.fat} color="#a855f7" icon={Droplets} />
                </div>
              </motion.div>

              {/* Day Cards */}
              <div className="space-y-3">
                {generatedPlan.days.map((day, idx) => {
                  const isOpen = expandedDay === idx
                  const dayTotal = day.meals.reduce((sum, m) => sum + (m.calories || 0), 0)
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                      className="rounded-2xl overflow-hidden day-card"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {/* Day Header */}
                      <button
                        onClick={() => setExpandedDay(isOpen ? -1 : idx)}
                        className="w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.02] print-hide"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                            style={{
                              background: `linear-gradient(135deg, ${['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'][idx % 7]}20, transparent)`,
                              color: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'][idx % 7],
                              border: `1px solid ${['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'][idx % 7]}30`,
                            }}
                          >
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-white font-semibold text-sm">{day.day}</p>
                            <p className="text-gray-500 text-xs">{day.meals.length} meals &middot; {dayTotal} kcal</p>
                          </div>
                        </div>
                        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Print: always show meals */}
                      <div className="hidden print:block px-5 pb-4">
                        {day.meals.map((meal, mi) => (
                          <div key={mi} className="meal-row py-3" style={{ borderTop: mi > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-white font-semibold text-sm">{meal.name}</p>
                              <span className="text-gray-500 text-xs">{meal.time}</span>
                            </div>
                            <p className="text-gray-300 text-sm mb-1">{meal.items}</p>
                            <div className="flex gap-3 text-xs text-gray-500">
                              <span>{meal.calories} kcal</span>
                              <span>P: {meal.protein}g</span>
                              <span>C: {meal.carbs}g</span>
                              <span>F: {meal.fat}g</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Interactive expand */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden print-hide"
                          >
                            <div className="px-5 pb-4 space-y-0">
                              {day.meals.map((meal, mi) => {
                                const MealIcon = getMealIcon(meal.name)
                                return (
                                  <motion.div
                                    key={mi}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: mi * 0.08 }}
                                    className="py-3 meal-row"
                                    style={{ borderTop: mi > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 flex-shrink-0"
                                        style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                        <MealIcon size={14} className="text-emerald-400" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className="text-white font-semibold text-sm">{meal.name}</p>
                                          <span className="text-gray-600 text-xs">{meal.time}</span>
                                        </div>
                                        <p className="text-gray-300 text-sm leading-relaxed mb-2">{meal.items}</p>
                                        <div className="flex flex-wrap gap-2">
                                          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)' }}>
                                            {meal.calories} kcal
                                          </span>
                                          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                                            P: {meal.protein}g
                                          </span>
                                          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                                            C: {meal.carbs}g
                                          </span>
                                          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'rgba(168,85,247,0.1)', color: '#c084fc', border: '1px solid rgba(168,85,247,0.2)' }}>
                                            F: {meal.fat}g
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}
              </div>

              {/* Key Notes */}
              {generatedPlan.key_notes && generatedPlan.key_notes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-2xl p-5 mt-6"
                  style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)' }}
                >
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-400" /> Key Notes
                  </h3>
                  <div className="space-y-2">
                    {generatedPlan.key_notes.map((note, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 text-sm mt-0.5 flex-shrink-0">{i + 1}.</span>
                        <p className="text-gray-300 text-sm leading-relaxed">{note}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
