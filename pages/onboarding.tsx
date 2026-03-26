import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { calculateBMR, calculateTDEE, calculateCalorieTarget, calculateMacros, adjustForHealthConditions } from '@/lib/utils'
import { Zap, ChevronRight, ChevronLeft, Check, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'

const STEPS = ['Basic Info', 'Body Stats', 'Goals', 'Health', 'Diet', 'Summary']

const DIABETES_OPTIONS = [
  { value: 'none',        label: 'None' },
  { value: 'type1',       label: 'Type 1 Diabetes' },
  { value: 'type2',       label: 'Type 2 Diabetes' },
  { value: 'prediabetic', label: 'Pre-diabetic' },
  { value: 'gestational', label: 'Gestational Diabetes' },
]

const BP_OPTIONS = [
  { value: 'normal',              label: 'Normal' },
  { value: 'elevated',            label: 'Elevated' },
  { value: 'high_stage1',         label: 'High — Stage 1' },
  { value: 'high_stage2',         label: 'High — Stage 2' },
  { value: 'hypertensive_crisis', label: 'Hypertensive Crisis' },
]

const ALLERGY_PRESETS = ['Gluten', 'Dairy', 'Nuts', 'Soy', 'Eggs', 'Shellfish', 'Lactose', 'Fish']

const GOAL_OPTIONS = [
  { value: 'lose_weight',    label: 'Lose weight' },
  { value: 'gain_muscle',    label: 'Build muscle' },
  { value: 'maintain',       label: 'Maintain weight' },
  { value: 'improve_health', label: 'Improve overall health' },
]

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',   label: 'Sedentary (desk job, no exercise)' },
  { value: 'light',       label: 'Light (1–3 days/week exercise)' },
  { value: 'moderate',    label: 'Moderate (3–5 days/week)' },
  { value: 'active',      label: 'Active (6–7 days/week)' },
  { value: 'very_active', label: 'Very Active (athlete / physical job)' },
]

const DIET_OPTIONS = [
  { value: 'omnivore',     label: 'Omnivore (everything)' },
  { value: 'vegetarian',   label: 'Vegetarian' },
  { value: 'vegan',        label: 'Vegan' },
  { value: 'keto',         label: 'Keto / Low-carb' },
  { value: 'paleo',        label: 'Paleo' },
  { value: 'halal',        label: 'Halal' },
  { value: 'kosher',       label: 'Kosher' },
  { value: 'south_indian', label: 'South Indian' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    age: '',
    gender: 'male',
    height_cm: '',
    weight_kg: '',
    goal: 'lose_weight',
    activity_level: 'moderate',
    diet_preference: 'omnivore',
    diabetes_type: 'none',
    bp_status: 'normal',
    allergies: [] as string[],
    medications: '',
  })
  const [customAllergy, setCustomAllergy] = useState('')
  const [targets, setTargets] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/auth/login')
      else if (session.user.user_metadata.full_name) {
        setForm(prev => ({ ...prev, full_name: session.user.user_metadata.full_name || '' }))
      }
    })
  }, [router])

  useEffect(() => {
    if (form.weight_kg && form.height_cm && form.age) {
      const bmr = calculateBMR(
        parseFloat(form.weight_kg),
        parseFloat(form.height_cm),
        parseInt(form.age),
        form.gender as 'male' | 'female' | 'other'
      )
      const tdee = calculateTDEE(bmr, form.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active')
      const calories = calculateCalorieTarget(tdee, form.goal as 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_health')
      const macros = calculateMacros(calories, form.goal)
      const adjusted = adjustForHealthConditions(calories, macros, form.diabetes_type, form.bp_status)
      setTargets(adjusted)
    }
  }, [form.weight_kg, form.height_cm, form.age, form.gender, form.activity_level, form.goal, form.diabetes_type, form.bp_status])

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleFinish() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    const { error } = await supabase
      .from('users')
      .update({
        full_name: form.full_name,
        age: parseInt(form.age),
        gender: form.gender as 'male' | 'female' | 'other',
        height_cm: parseFloat(form.height_cm),
        weight_kg: parseFloat(form.weight_kg),
        goal: form.goal as 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_health',
        activity_level: form.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
        diet_preference: form.diet_preference as any,
        calorie_target: targets.calories,
        protein_target: targets.protein,
        carb_target: targets.carbs,
        fat_target: targets.fat,
        diabetes_type: form.diabetes_type,
        bp_status: form.bp_status,
        allergies: form.allergies,
        medications: form.medications ? form.medications.split(',').map(m => m.trim()).filter(Boolean) : [],
        health_conditions: [
          ...(form.diabetes_type !== 'none' ? [{ type: 'diabetes', subtype: form.diabetes_type }] : []),
          ...(form.bp_status !== 'normal' ? [{ type: 'blood_pressure', status: form.bp_status }] : []),
        ],
        onboarded: true,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
      } as any)
      .eq('id', session.user.id)

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Profile set up! Let\'s start your journey.')
    router.push('/dashboard')
  }

  const canNext = () => {
    if (step === 0) return form.full_name.trim().length > 0
    if (step === 1) return form.age && form.height_cm && form.weight_kg
    return true
  }

  const choiceBtnStyle = (selected: boolean) => selected ? {
    background: 'rgba(16,185,129,0.12)',
    border: '1px solid rgba(16,185,129,0.4)',
    color: '#34d399',
    boxShadow: '0 0 16px rgba(16,185,129,0.12)',
  } : {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#9ca3af',
  }

  return (
    <>
      <Head><title>Set Up Profile · FahmiFit</title></Head>
      <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: '#05050f' }}>
        {/* Ambient orbs */}
        <div className="fixed top-1/4 left-1/6 w-96 h-96 rounded-full pointer-events-none opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.8), transparent)', filter: 'blur(80px)' }} />
        <div className="fixed bottom-1/4 right-1/6 w-96 h-96 rounded-full pointer-events-none opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.8), transparent)', filter: 'blur(80px)' }} />

        <div className="w-full max-w-lg relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <span className="font-extrabold text-lg" style={{
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>FahmiFit</span>
          </div>

          {/* Progress stepper */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-300"
                  style={i < step ? {
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    boxShadow: '0 0 12px rgba(16,185,129,0.4)',
                  } : i === step ? {
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    boxShadow: '0 0 16px rgba(16,185,129,0.5)',
                    outline: '3px solid rgba(16,185,129,0.2)',
                  } : {
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#4b5563',
                  }}
                >
                  {i < step ? <Check size={13} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className="h-0.5 flex-1 rounded transition-all duration-300"
                    style={{ background: i < step ? 'linear-gradient(90deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)' }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="rounded-2xl p-8" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}>
            <h2 className="text-xl font-extrabold text-white mb-1">{STEPS[step]}</h2>

            {/* Step 0: Basic info */}
            {step === 0 && (
              <div className="space-y-4 mt-5">
                <p className="text-gray-500 text-sm">Let&apos;s start with your name and basic details.</p>
                <Input
                  label="Your full name"
                  value={form.full_name}
                  onChange={e => update('full_name', e.target.value)}
                  placeholder="Asadullah Amanullah"
                  autoFocus
                />
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Gender</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['male', 'female', 'other'] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => update('gender', g)}
                        className="py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200"
                        style={choiceBtnStyle(form.gender === g)}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Body stats */}
            {step === 1 && (
              <div className="space-y-4 mt-5">
                <p className="text-gray-500 text-sm">We use this to calculate your personalized calorie target.</p>
                <Input
                  label="Age"
                  type="number"
                  value={form.age}
                  onChange={e => update('age', e.target.value)}
                  placeholder="28"
                  min="10"
                  max="100"
                  hint="Years old"
                />
                <Input
                  label="Height"
                  type="number"
                  value={form.height_cm}
                  onChange={e => update('height_cm', e.target.value)}
                  placeholder="175"
                  min="100"
                  max="250"
                  hint="Centimeters (cm)"
                />
                <Input
                  label="Current weight"
                  type="number"
                  value={form.weight_kg}
                  onChange={e => update('weight_kg', e.target.value)}
                  placeholder="75"
                  min="30"
                  max="300"
                  hint="Kilograms (kg)"
                />
              </div>
            )}

            {/* Step 2: Goals */}
            {step === 2 && (
              <div className="space-y-4 mt-5">
                <p className="text-gray-500 text-sm">What&apos;s your primary nutrition goal?</p>
                <div className="space-y-2.5">
                  {GOAL_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update('goal', opt.value)}
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={choiceBtnStyle(form.goal === opt.value)}
                    >
                      {opt.label}
                      {form.goal === opt.value && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.3)' }}>
                          <Check size={12} style={{ color: '#34d399' }} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <Select
                  label="Activity level"
                  value={form.activity_level}
                  onChange={e => update('activity_level', e.target.value)}
                  options={ACTIVITY_OPTIONS}
                />
              </div>
            )}

            {/* Step 3: Health Complications */}
            {step === 3 && (
              <div className="space-y-5 mt-5">
                <p className="text-gray-500 text-sm">Help us personalize your nutrition plan with your health info. This is optional but helps us give better advice.</p>

                {/* Diabetes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Diabetes Status</label>
                  <div className="space-y-2">
                    {DIABETES_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('diabetes_type', opt.value)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                        style={choiceBtnStyle(form.diabetes_type === opt.value)}
                      >
                        {opt.label}
                        {form.diabetes_type === opt.value && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.3)' }}>
                            <Check size={12} style={{ color: '#34d399' }} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blood Pressure */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Blood Pressure</label>
                  <div className="space-y-2">
                    {BP_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('bp_status', opt.value)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                        style={choiceBtnStyle(form.bp_status === opt.value)}
                      >
                        {opt.label}
                        {form.bp_status === opt.value && (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.3)' }}>
                            <Check size={12} style={{ color: '#34d399' }} />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Allergies */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Food Allergies</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {ALLERGY_PRESETS.map(a => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            allergies: prev.allergies.includes(a)
                              ? prev.allergies.filter(x => x !== a)
                              : [...prev.allergies, a],
                          }))
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                        style={choiceBtnStyle(form.allergies.includes(a))}
                      >
                        {form.allergies.includes(a) && <span className="mr-1">&#10003;</span>}
                        {a}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customAllergy}
                      onChange={e => setCustomAllergy(e.target.value)}
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
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customAllergy.trim() && !form.allergies.includes(customAllergy.trim())) {
                          setForm(prev => ({ ...prev, allergies: [...prev.allergies, customAllergy.trim()] }))
                          setCustomAllergy('')
                        }
                      }}
                      className="px-3 py-2 rounded-lg text-sm font-semibold transition-all"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' }}
                    >
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

                {/* Medications */}
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Current Medications <span className="text-gray-600 normal-case">(optional)</span></label>
                  <input
                    type="text"
                    value={form.medications}
                    onChange={e => update('medications', e.target.value)}
                    placeholder="e.g., Metformin, Lisinopril (comma-separated)"
                    className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Diet preference */}
            {step === 4 && (
              <div className="space-y-4 mt-5">
                <p className="text-gray-500 text-sm">Select your diet preference or restrictions.</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {DIET_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update('diet_preference', opt.value)}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={choiceBtnStyle(form.diet_preference === opt.value)}
                    >
                      <span>{opt.label}</span>
                      {form.diet_preference === opt.value && <Check size={13} style={{ color: '#34d399' }} className="flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Summary */}
            {step === 5 && (
              <div className="space-y-4 mt-5">
                <p className="text-gray-500 text-sm">Here&apos;s your personalized nutrition plan based on your profile.</p>

                {/* Calorie target hero */}
                <div className="rounded-2xl p-5 text-center" style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(6,182,212,0.08))',
                  border: '1px solid rgba(16,185,129,0.25)',
                  boxShadow: '0 8px 32px rgba(16,185,129,0.1)',
                }}>
                  <p className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-2">Daily Calorie Target</p>
                  <p className="text-5xl font-extrabold text-white">{targets.calories}
                    <span className="text-xl font-semibold text-brand-400 ml-2">kcal</span>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Calculated for your {form.goal.replace('_', ' ')} goal</p>
                </div>

                {/* Macros */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Protein', value: targets.protein, color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)' },
                    { label: 'Carbs',   value: targets.carbs,   color: '#fb923c', bg: 'rgba(249,115,22,0.1)', border: 'rgba(249,115,22,0.2)' },
                    { label: 'Fat',     value: targets.fat,     color: '#facc15', bg: 'rgba(234,179,8,0.1)',  border: 'rgba(234,179,8,0.2)'  },
                  ].map(m => (
                    <div key={m.label} className="rounded-xl p-3.5 text-center"
                      style={{ background: m.bg, border: `1px solid ${m.border}` }}>
                      <p className="text-2xl font-extrabold" style={{ color: m.color }}>{m.value}g</p>
                      <p className="text-xs font-semibold text-gray-500 mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>

                {/* Summary info */}
                <div className="rounded-xl p-4 space-y-2.5 text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  {[
                    ['Name', form.full_name],
                    ['Age / Gender', `${form.age} / ${form.gender}`],
                    ['Height / Weight', `${form.height_cm}cm / ${form.weight_kg}kg`],
                    ['Goal', form.goal.replace(/_/g, ' ')],
                    ['Diet', form.diet_preference],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-semibold text-white capitalize">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              {step > 0 ? (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-white transition-colors"
                >
                  <ChevronLeft size={16} /> Back
                </button>
              ) : <div />}

              {step < STEPS.length - 1 ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext()}
                >
                  Continue <ChevronRight size={16} />
                </Button>
              ) : (
                <Button onClick={handleFinish} loading={loading}>
                  Start my journey <ChevronRight size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
