import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Calculate BMR using Mifflin-St Jeor equation
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  if (gender === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161
}

// Activity multipliers
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
} as const

export function calculateTDEE(
  bmr: number,
  activityLevel: keyof typeof ACTIVITY_MULTIPLIERS
): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel])
}

// Calorie targets based on goal
export function calculateCalorieTarget(
  tdee: number,
  goal: 'lose_weight' | 'gain_muscle' | 'maintain' | 'improve_health'
): number {
  switch (goal) {
    case 'lose_weight':    return Math.round(tdee - 500)
    case 'gain_muscle':    return Math.round(tdee + 300)
    case 'maintain':       return tdee
    case 'improve_health': return tdee
    default:               return tdee
  }
}

// Macro targets (grams) from calorie target
export function calculateMacros(calories: number, goal: string) {
  if (goal === 'gain_muscle') {
    return {
      protein: Math.round((calories * 0.30) / 4),
      carbs:   Math.round((calories * 0.45) / 4),
      fat:     Math.round((calories * 0.25) / 9),
    }
  }
  if (goal === 'lose_weight' || goal === 'keto') {
    return {
      protein: Math.round((calories * 0.35) / 4),
      carbs:   Math.round((calories * 0.30) / 4),
      fat:     Math.round((calories * 0.35) / 9),
    }
  }
  return {
    protein: Math.round((calories * 0.25) / 4),
    carbs:   Math.round((calories * 0.50) / 4),
    fat:     Math.round((calories * 0.25) / 9),
  }
}

// Adjust macros for health conditions
export function adjustForHealthConditions(
  calories: number,
  macros: { protein: number; carbs: number; fat: number },
  diabetesType: string = 'none',
  bpStatus: string = 'normal'
): { calories: number; protein: number; carbs: number; fat: number } {
  let { protein, carbs, fat } = macros
  let adjustedCalories = calories

  if (diabetesType === 'type1' || diabetesType === 'type2') {
    // Reduce carbs by 15%, increase protein by 10%
    const carbReduction = Math.round(carbs * 0.15)
    const proteinIncrease = Math.round(protein * 0.10)
    carbs -= carbReduction
    protein += proteinIncrease
    // Slight calorie reduction for diabetics
    adjustedCalories = Math.round(calories * 0.95)
  } else if (diabetesType === 'prediabetic') {
    // Moderate carb reduction (10%)
    const carbReduction = Math.round(carbs * 0.10)
    carbs -= carbReduction
    protein += Math.round(protein * 0.05)
  } else if (diabetesType === 'gestational') {
    // Moderate carb control, ensure adequate protein
    const carbReduction = Math.round(carbs * 0.12)
    carbs -= carbReduction
    protein += Math.round(protein * 0.08)
  }

  if (bpStatus === 'high_stage1' || bpStatus === 'high_stage2' || bpStatus === 'hypertensive_crisis') {
    // For high BP: slightly reduce calories, shift toward lean protein
    adjustedCalories = Math.round(adjustedCalories * 0.97)
    fat = Math.round(fat * 0.90)
    protein += Math.round(protein * 0.05)
  }

  return { calories: adjustedCalories, protein, carbs, fat }
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function todayISO(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Server-safe version — uses TIMEZONE_OFFSET_MINUTES env var (default 330 = IST UTC+5:30)
// Use this in all API routes so WhatsApp logs & website show the same date
export function todayISOServer(): string {
  const offsetMinutes = Number(process.env.TIMEZONE_OFFSET_MINUTES ?? 330)
  const now = new Date()
  const local = new Date(now.getTime() + offsetMinutes * 60 * 1000)
  return local.toISOString().split('T')[0]
}

// Get YYYY-MM-DD date string in any IANA timezone (e.g. 'Asia/Kolkata', 'America/New_York')
// en-CA locale always returns YYYY-MM-DD format
export function dateForTimezone(timezone: string): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: timezone })
  } catch {
    return todayISOServer() // fallback
  }
}

// Get local hour (0-23) in any IANA timezone
export function hourForTimezone(timezone: string): number {
  try {
    const h = parseInt(
      new Date().toLocaleTimeString('en-US', { timeZone: timezone, hour: 'numeric', hour12: false })
    )
    return isNaN(h) ? new Date().getUTCHours() : h % 24
  } catch {
    return new Date().getUTCHours()
  }
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function calorieProgress(consumed: number, target: number): number {
  return Math.min(Math.round((consumed / target) * 100), 100)
}

export function getBMICategory(bmi: number): { label: string; color: string } {
  if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' }
  if (bmi < 25)   return { label: 'Normal', color: 'text-green-500' }
  if (bmi < 30)   return { label: 'Overweight', color: 'text-yellow-500' }
  return            { label: 'Obese', color: 'text-red-500' }
}
