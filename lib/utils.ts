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

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
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
