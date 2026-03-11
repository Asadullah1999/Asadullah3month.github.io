import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Select } from '@/components/ui/Input'
import { supabase } from '@/lib/supabase'
import { calculateBMR, calculateTDEE, calculateCalorieTarget, calculateMacros, getBMICategory } from '@/lib/utils'
import { User } from '@/lib/database.types'
import { Save, User as UserIcon, Ruler, Weight, Target, Activity, Salad } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const [user, setUser] = useState<Partial<User> | null>(null)
  const [form, setForm] = useState({
    full_name: '', age: '', gender: 'male',
    height_cm: '', weight_kg: '',
    goal: 'lose_weight', activity_level: 'moderate', diet_preference: 'omnivore',
  })
  const [saving, setSaving] = useState(false)

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

    const { error } = await supabase.from('users').update({
      full_name: form.full_name,
      age,
      gender: form.gender as 'male' | 'female' | 'other',
      height_cm: heightCm,
      weight_kg: weightKg,
      goal: form.goal as 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_health',
      activity_level: form.activity_level as 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
      diet_preference: form.diet_preference as 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'halal' | 'kosher',
      calorie_target: calories,
      protein_target: macros.protein,
      carb_target: macros.carbs,
      fat_target: macros.fat,
    }).eq('id', session.user.id)

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
  ]

  return (
    <DashboardLayout pageTitle="Profile" title="My Profile">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Nutrition targets (read only) */}
        {user?.calorie_target && (
          <Card padding="md" className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
            <CardTitle className="mb-4 text-green-800">Your Nutrition Targets</CardTitle>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Calories', value: `${user.calorie_target}`, unit: 'kcal', color: 'bg-white text-orange-600' },
                { label: 'Protein',  value: `${user.protein_target}`, unit: 'g',    color: 'bg-white text-blue-600' },
                { label: 'Carbs',    value: `${user.carb_target}`,    unit: 'g',    color: 'bg-white text-orange-500' },
                { label: 'Fat',      value: `${user.fat_target}`,     unit: 'g',    color: 'bg-white text-yellow-600' },
              ].map(t => (
                <div key={t.label} className={`${t.color} rounded-xl p-3 text-center shadow-sm`}>
                  <p className="text-lg font-bold">{t.value}</p>
                  <p className="text-xs opacity-70">{t.unit}</p>
                  <p className="text-xs font-medium mt-0.5">{t.label}</p>
                </div>
              ))}
            </div>
            {bmi && bmiInfo && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-green-700 font-medium">BMI: {bmi}</span>
                <span className={`font-medium ${bmiInfo.color}`}>— {bmiInfo.label}</span>
              </div>
            )}
          </Card>
        )}

        {/* Basic info */}
        <Card padding="md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserIcon size={16} className="text-gray-400" />
              <CardTitle>Basic Information</CardTitle>
            </div>
          </CardHeader>
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['male', 'female', 'other'] as const).map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => update('gender', g)}
                      className={`py-2.5 rounded-xl border text-sm font-medium capitalize transition-all ${
                        form.gender === g ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Body stats */}
        <Card padding="md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Ruler size={16} className="text-gray-400" />
              <CardTitle>Body Measurements</CardTitle>
            </div>
          </CardHeader>
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
        </Card>

        {/* Goals */}
        <Card padding="md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target size={16} className="text-gray-400" />
              <CardTitle>Goals & Activity</CardTitle>
            </div>
          </CardHeader>
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
        </Card>

        {/* Diet */}
        <Card padding="md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Salad size={16} className="text-gray-400" />
              <CardTitle>Diet Preference</CardTitle>
            </div>
          </CardHeader>
          <Select
            value={form.diet_preference}
            onChange={e => update('diet_preference', e.target.value)}
            options={DIET_OPTIONS}
          />
          <p className="text-xs text-gray-400 mt-2">
            This helps personalize your meal suggestions and nutrient recommendations.
          </p>
        </Card>

        <Button onClick={saveProfile} loading={saving} size="lg" fullWidth>
          <Save size={16} /> Save profile & recalculate targets
        </Button>
      </div>
    </DashboardLayout>
  )
}
