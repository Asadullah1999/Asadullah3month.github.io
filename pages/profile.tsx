import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'
import PageHero from '@/components/ui/PageHero'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { calculateBMR, calculateTDEE, calculateCalorieTarget, calculateMacros, adjustForHealthConditions, getBMICategory } from '@/lib/utils'
import { User } from '@/lib/database.types'
import { Save, User as UserIcon, Ruler, Weight, Target, Activity, Salad, Flame, Zap, Heart, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

const SECTION_STYLE = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
  padding: '24px',
}

export default function ProfilePage() {
  const [user, setUser] = useState<Partial<User> | null>(null)
  const [form, setForm] = useState({
    full_name: '', age: '', gender: 'male',
    height_cm: '', weight_kg: '',
    goal: 'lose_weight', activity_level: 'moderate', diet_preference: 'omnivore',
    diabetes_type: 'none', bp_status: 'normal',
    allergies: [] as string[], medications: '',
  })
  const [saving, setSaving] = useState(false)
  const [customAllergy, setCustomAllergy] = useState('')
  const ALLERGY_PRESETS = ['Gluten', 'Dairy', 'Nuts', 'Soy', 'Eggs', 'Shellfish', 'Lactose', 'Fish']

  useEffect(() => { loadUser() }, [])

  async function loadUser() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('users').select('*').eq('id', session.user.id).single()
    if (data) {
      setUser(data)
      setForm({
        full_name: data.full_name || '',
        age: data.age?.toString() || '',
        gender: data.gender || 'male',
        height_cm: data.height_cm?.toString() || '',
        weight_kg: data.weight_kg?.toString() || '',
        goal: data.goal || 'lose_weight',
        activity_level: data.activity_level || 'moderate',
        diet_preference: data.diet_preference || 'omnivore',
        diabetes_type: (data as any).diabetes_type || 'none',
        bp_status: (data as any).bp_status || 'normal',
        allergies: (data as any).allergies || [],
        medications: (data as any).medications?.join(', ') || '',
      })
    }
  }

  function update(f: string, v: string) { setForm(prev => ({ ...prev, [f]: v })) }

  async function saveProfile() {
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const weightKg = parseFloat(form.weight_kg)
    const heightCm = parseFloat(form.height_cm)
    const age = parseInt(form.age)

    const bmr = calculateBMR(weightKg, heightCm, age, form.gender as 'male' | 'female' | 'other')
    const tdee = calculateTDEE(bmr, form.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active')
    const calories = calculateCalorieTarget(tdee, form.goal as 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_health')
    const macros = calculateMacros(calories, form.goal)
    const adjusted = adjustForHealthConditions(calories, macros, form.diabetes_type, form.bp_status)

    const { error } = await supabase.from('users').update({
      full_name: form.full_name,
      age,
      gender: form.gender as 'male' | 'female' | 'other',
      height_cm: heightCm,
      weight_kg: weightKg,
      goal: form.goal as any,
      activity_level: form.activity_level as any,
      diet_preference: form.diet_preference as any,
      calorie_target: adjusted.calories,
      protein_target: adjusted.protein,
      carb_target: adjusted.carbs,
      fat_target: adjusted.fat,
      diabetes_type: form.diabetes_type,
      bp_status: form.bp_status,
      allergies: form.allergies,
      medications: form.medications ? form.medications.split(',').map(m => m.trim()).filter(Boolean) : [],
    } as any).eq('id', session.user.id)

    if (error) toast.error(error.message)
    else { toast.success('Profile updated!'); loadUser() }
    setSaving(false)
  }

  const bmi = form.height_cm && form.weight_kg
    ? Math.round((parseFloat(form.weight_kg) / Math.pow(parseFloat(form.height_cm) / 100, 2)) * 10) / 10
    : null
  const bmiInfo = bmi ? getBMICategory(bmi) : null

  const GOAL_OPTIONS = [
    { value: 'lose_weight',    label: 'Lose weight' },
    { value: 'gain_muscle',    label: 'Build muscle' },
    { value: 'maintain',       label: 'Maintain weight' },
    { value: 'improve_health', label: 'Improve health' },
  ]
  const ACTIVITY_OPTIONS = [
    { value: 'sedentary',   label: 'Sedentary' },
    { value: 'light',       label: 'Light activity' },
    { value: 'moderate',    label: 'Moderate activity' },
    { value: 'active',      label: 'Active' },
    { value: 'very_active', label: 'Very active' },
  ]
  const DIET_OPTIONS = [
    { value: 'omnivore',   label: 'Omnivore' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'vegan',      label: 'Vegan' },
    { value: 'keto',       label: 'Keto / Low-carb' },
    { value: 'paleo',      label: 'Paleo' },
    { value: 'halal',      label: 'Halal' },
    { value: 'kosher',     label: 'Kosher' },
    { value: 'south_indian', label: 'South Indian' },
  ]

  const MACRO_ITEMS = [
    { label: 'Calories', value: user?.calorie_target, unit: 'kcal', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(234,88,12,0.1))', border: 'rgba(245,158,11,0.25)', color: '#fbbf24' },
    { label: 'Protein',  value: user?.protein_target, unit: 'g',    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.1))', border: 'rgba(59,130,246,0.25)', color: '#60a5fa' },
    { label: 'Carbs',    value: user?.carb_target,    unit: 'g',    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(239,68,68,0.08))', border: 'rgba(245,158,11,0.2)', color: '#fb923c' },
    { label: 'Fat',      value: user?.fat_target,     unit: 'g',    gradient: 'linear-gradient(135deg, rgba(234,179,8,0.12), rgba(245,158,11,0.08))', border: 'rgba(234,179,8,0.2)', color: '#facc15' },
  ]

  const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }
  const cardAnim: Variants = { hidden: { opacity: 0, y: 20, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } } }

  return (
    <DashboardLayout pageTitle="Profile" title="My Profile">
      <PageHero
        badge="Your Profile"
        badgeColor="#8b5cf6"
        title="Health Profile"
        highlight="Profile"
        subtitle="Manage your personal health info and nutrition targets"
        orbColors={['rgba(139,92,246,0.3)', 'rgba(236,72,153,0.2)']}
      />
      <motion.div className="max-w-2xl mx-auto space-y-5" initial="hidden" animate="visible" variants={stagger}>

        {/* Nutrition targets (read only) */}
        {user?.calorie_target && (
          <motion.div variants={cardAnim} className="rounded-2xl overflow-hidden" style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))',
            border: '1px solid rgba(16,185,129,0.2)',
            boxShadow: '0 8px 32px rgba(16,185,129,0.08)',
          }}>
            <div className="p-5 pb-4" style={{ borderBottom: '1px solid rgba(16,185,129,0.12)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <Zap size={15} className="text-brand-400" />
                </div>
                <p className="font-bold text-white">Your Nutrition Targets</p>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-4 gap-3">
                {MACRO_ITEMS.map(t => (
                  <div key={t.label} className="rounded-xl p-3 text-center" style={{ background: t.gradient, border: `1px solid ${t.border}` }}>
                    <p className="text-lg font-extrabold" style={{ color: t.color }}>{t.value}</p>
                    <p className="text-xs font-semibold mt-0.5" style={{ color: t.color, opacity: 0.7 }}>{t.unit}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t.label}</p>
                  </div>
                ))}
              </div>
              {bmi && bmiInfo && (
                <div className="mt-3 flex items-center gap-2 text-sm pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span className="text-brand-400 font-bold">BMI: {bmi}</span>
                  <span className="text-gray-500">—</span>
                  <span className="font-semibold text-white">{bmiInfo.label}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Basic info */}
        <motion.div variants={cardAnim} style={SECTION_STYLE}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <UserIcon size={15} className="text-violet-400" />
            </div>
            <p className="font-bold text-white">Basic Information</p>
          </div>
          <div className="space-y-4">
            <Input
              label="Full name"
              value={form.full_name}
              onChange={e => update('full_name', e.target.value)}
              placeholder="Your full name"
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Age"
                type="number"
                value={form.age}
                onChange={e => update('age', e.target.value)}
                placeholder="28"
                min="10" max="100"
              />
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['male', 'female', 'other'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => update('gender', g)}
                      className="py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200"
                      style={form.gender === g ? {
                        background: 'rgba(16,185,129,0.15)',
                        border: '1px solid rgba(16,185,129,0.4)',
                        color: '#34d399',
                        boxShadow: '0 0 12px rgba(16,185,129,0.15)',
                      } : {
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#6b7280',
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Body stats */}
        <motion.div variants={cardAnim} style={SECTION_STYLE}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)' }}>
              <Ruler size={15} className="text-cyan-400" />
            </div>
            <p className="font-bold text-white">Body Measurements</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Height (cm)"
              type="number"
              value={form.height_cm}
              onChange={e => update('height_cm', e.target.value)}
              placeholder="175"
            />
            <Input
              label="Weight (kg)"
              type="number"
              value={form.weight_kg}
              onChange={e => update('weight_kg', e.target.value)}
              placeholder="75"
            />
          </div>
        </motion.div>

        {/* Goals */}
        <motion.div variants={cardAnim} style={SECTION_STYLE}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <Target size={15} className="text-amber-400" />
            </div>
            <p className="font-bold text-white">Goals & Activity</p>
          </div>
          <div className="space-y-4">
            <Select
              label="Primary goal"
              value={form.goal}
              onChange={e => update('goal', e.target.value)}
              options={GOAL_OPTIONS}
            />
            <Select
              label="Activity level"
              value={form.activity_level}
              onChange={e => update('activity_level', e.target.value)}
              options={ACTIVITY_OPTIONS}
            />
          </div>
        </motion.div>

        {/* Diet */}
        <motion.div variants={cardAnim} style={SECTION_STYLE}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <Salad size={15} className="text-brand-400" />
            </div>
            <p className="font-bold text-white">Diet Preference</p>
          </div>
          <Select
            value={form.diet_preference}
            onChange={e => update('diet_preference', e.target.value)}
            options={DIET_OPTIONS}
          />
          <p className="text-xs text-gray-600 mt-2">
            This helps personalize your meal suggestions and nutrient recommendations.
          </p>
        </motion.div>

        {/* Health Conditions */}
        <motion.div variants={cardAnim} style={SECTION_STYLE}>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <Heart size={15} className="text-red-400" />
            </div>
            <p className="font-bold text-white">Health Conditions</p>
          </div>
          <div className="space-y-4">
            <Select
              label="Diabetes Status"
              value={form.diabetes_type}
              onChange={e => update('diabetes_type', e.target.value)}
              options={[
                { value: 'none', label: 'None' },
                { value: 'type1', label: 'Type 1 Diabetes' },
                { value: 'type2', label: 'Type 2 Diabetes' },
                { value: 'prediabetic', label: 'Pre-diabetic' },
                { value: 'gestational', label: 'Gestational Diabetes' },
              ]}
            />
            <Select
              label="Blood Pressure"
              value={form.bp_status}
              onChange={e => update('bp_status', e.target.value)}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'elevated', label: 'Elevated' },
                { value: 'high_stage1', label: 'High — Stage 1' },
                { value: 'high_stage2', label: 'High — Stage 2' },
                { value: 'hypertensive_crisis', label: 'Hypertensive Crisis' },
              ]}
            />
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Food Allergies</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {ALLERGY_PRESETS.map(a => (
                  <button key={a} type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      allergies: prev.allergies.includes(a) ? prev.allergies.filter(x => x !== a) : [...prev.allergies, a],
                    }))}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                    style={form.allergies.includes(a) ? {
                      background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399',
                    } : {
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af',
                    }}>
                    {form.allergies.includes(a) && '✓ '}{a}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={customAllergy} onChange={e => setCustomAllergy(e.target.value)}
                  placeholder="Add custom allergy..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm text-white placeholder:text-gray-600 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && customAllergy.trim()) {
                      e.preventDefault()
                      if (!form.allergies.includes(customAllergy.trim())) {
                        setForm(prev => ({ ...prev, allergies: [...prev.allergies, customAllergy.trim()] }))
                      }
                      setCustomAllergy('')
                    }
                  }} />
                <button type="button" onClick={() => {
                  if (customAllergy.trim() && !form.allergies.includes(customAllergy.trim())) {
                    setForm(prev => ({ ...prev, allergies: [...prev.allergies, customAllergy.trim()] }))
                    setCustomAllergy('')
                  }
                }} className="px-3 py-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <Plus size={16} />
                </button>
              </div>
              {form.allergies.filter(a => !ALLERGY_PRESETS.includes(a)).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.allergies.filter(a => !ALLERGY_PRESETS.includes(a)).map(a => (
                    <span key={a} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}>
                      {a}
                      <button type="button" onClick={() => setForm(prev => ({ ...prev, allergies: prev.allergies.filter(x => x !== a) }))}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <Input
              label="Medications (comma-separated)"
              value={form.medications}
              onChange={e => update('medications', e.target.value)}
              placeholder="e.g., Metformin, Lisinopril"
            />
          </div>
        </motion.div>

        <motion.div variants={cardAnim}>
          <Button onClick={saveProfile} loading={saving} size="lg" fullWidth>
            <Save size={16} /> Save profile & recalculate targets
          </Button>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}
