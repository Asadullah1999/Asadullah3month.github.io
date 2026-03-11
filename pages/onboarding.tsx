import { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { calculateBMR, calculateTDEE, calculateCalorieTarget, calculateMacros } from '@/lib/utils'
import { Leaf, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'

const STEPS = ['Basic Info', 'Body Stats', 'Goals', 'Diet', 'Summary']

const GOAL_OPTIONS = [
  { value: 'lose_weight',    label: 'Lose weight' },
  { value: 'gain_muscle',    label: 'Build muscle' },
  { value: 'maintain',       label: 'Maintain weight' },
  { value: 'improve_health', label: 'Improve overall health' },
]

const ACTIVITY_OPTIONS = [
  { value: 'sedentary',  label: 'Sedentary (desk job, no exercise)' },
  { value: 'light',      label: 'Light (1–3 days/week exercise)' },
  { value: 'moderate',   label: 'Moderate (3–5 days/week)' },
  { value: 'active',     label: 'Active (6–7 days/week)' },
  { value: 'very_active', label: 'Very Active (athlete / physical job)' },
]

const DIET_OPTIONS = [
  { value: 'omnivore',    label: 'Omnivore (everything)' },
  { value: 'vegetarian',  label: 'Vegetarian' },
  { value: 'vegan',       label: 'Vegan' },
  { value: 'keto',        label: 'Keto / Low-carb' },
  { value: 'paleo',       label: 'Paleo' },
  { value: 'halal',       label: 'Halal' },
  { value: 'kosher',      label: 'Kosher' },
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
  })

  // Calculated targets
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
      setTargets({ calories, ...macros })
    }
  }, [form.weight_kg, form.height_cm, form.age, form.gender, form.activity_level, form.goal])

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
        diet_preference: form.diet_preference as 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'halal' | 'kosher',
        calorie_target: targets.calories,
        protein_target: targets.protein,
        carb_target: targets.carbs,
        fat_target: targets.fat,
        onboarded: true,
      })
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

  return (
    <>
      <Head><title>Set Up Profile · NutriCoach</title></Head>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-green-600 flex items-center justify-center">
              <Leaf className="w-4.5 h-4.5 text-white" size={18} />
            </div>
            <span className="font-bold text-gray-900 text-lg">NutriCoach</span>
          </div>

          {/* Progress stepper */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  i < step ? 'bg-green-600 text-white' : i === step ? 'bg-green-600 text-white ring-4 ring-green-100' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 ${i < step ? 'bg-green-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="card p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-1">{STEPS[step]}</h2>

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
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['male', 'female', 'other'] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => update('gender', g)}
                        className={`py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${
                          form.gender === g
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
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
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-medium transition-all ${
                        form.goal === opt.value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {opt.label}
                      {form.goal === opt.value && <Check size={16} className="text-green-600" />}
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

            {/* Step 3: Diet preference */}
            {step === 3 && (
              <div className="space-y-4 mt-5">
                <p className="text-gray-500 text-sm">Select your diet preference or restrictions.</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {DIET_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => update('diet_preference', opt.value)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        form.diet_preference === opt.value
                          ? 'border-green-500 bg-green-50 text-green-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {form.diet_preference === opt.value && <Check size={14} className="text-green-600 flex-shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {step === 4 && (
              <div className="space-y-4 mt-5">
                <p className="text-gray-500 text-sm">Here&apos;s your personalized nutrition plan based on your profile.</p>
                <div className="bg-green-50 rounded-2xl p-5">
                  <p className="text-sm font-medium text-green-800 mb-3">Daily Calorie Target</p>
                  <p className="text-4xl font-bold text-green-700 mb-1">{targets.calories} <span className="text-lg font-medium text-green-500">kcal</span></p>
                  <p className="text-xs text-green-600">Calculated for your {form.goal.replace('_', ' ')} goal</p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3.5 text-center">
                    <p className="text-lg font-bold text-blue-700">{targets.protein}g</p>
                    <p className="text-xs text-blue-500 mt-0.5">Protein</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-3.5 text-center">
                    <p className="text-lg font-bold text-orange-700">{targets.carbs}g</p>
                    <p className="text-xs text-orange-500 mt-0.5">Carbs</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-3.5 text-center">
                    <p className="text-lg font-bold text-yellow-700">{targets.fat}g</p>
                    <p className="text-xs text-yellow-500 mt-0.5">Fat</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Name</span><span className="font-medium text-gray-900">{form.full_name}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Age / Gender</span><span className="font-medium text-gray-900">{form.age} / {form.gender}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Height / Weight</span><span className="font-medium text-gray-900">{form.height_cm}cm / {form.weight_kg}kg</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Goal</span><span className="font-medium text-gray-900 capitalize">{form.goal.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Diet</span><span className="font-medium text-gray-900 capitalize">{form.diet_preference}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              {step > 0 ? (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
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
