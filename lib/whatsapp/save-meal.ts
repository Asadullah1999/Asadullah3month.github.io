/**
 * Save parsed meal items to daily_logs table
 * Used by WhatsApp webhook when users text/photo their meals
 */

import { createClient } from '@supabase/supabase-js'
import { dateForTimezone, hourForTimezone } from '@/lib/utils'

const DEFAULT_TZ = process.env.DEFAULT_TIMEZONE || 'Asia/Kolkata'

type MealItem = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantity?: string
}

function getDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function getMealCategory(timezone: string, hour?: number): 'breakfast' | 'lunch' | 'dinner' | 'snacks' {
  const h = hour ?? hourForTimezone(timezone)
  if (h >= 5 && h < 11) return 'breakfast'
  if (h >= 11 && h < 15) return 'lunch'
  if (h >= 15 && h < 18) return 'snacks'
  return 'dinner'
}

export async function saveMealToLog(
  userId: string,
  foods: MealItem[],
  mealCategory?: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
  userTimezone?: string
): Promise<{ mealCategory: string; totalCalories: number }> {
  const db = getDb()
  const tz = userTimezone || DEFAULT_TZ
  const today = dateForTimezone(tz)
  const category = mealCategory || getMealCategory(tz)

  // Fetch existing log for today
  const { data: existing } = await db
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', today)
    .maybeSingle()

  // Build the meal arrays
  const currentMeals = {
    breakfast: (existing?.breakfast as MealItem[] | null) || [],
    lunch: (existing?.lunch as MealItem[] | null) || [],
    dinner: (existing?.dinner as MealItem[] | null) || [],
    snacks: (existing?.snacks as MealItem[] | null) || [],
  }

  // Filter out junk items (0 calories, empty names) before appending
  const validFoods = foods.filter(f => f.calories > 0 && f.name && f.name.trim().length > 0)

  // Append new foods to the correct category
  currentMeals[category] = [...currentMeals[category], ...validFoods]

  // Recalculate totals across all meals
  const allFoods = [
    ...currentMeals.breakfast,
    ...currentMeals.lunch,
    ...currentMeals.dinner,
    ...currentMeals.snacks,
  ]

  const totals = allFoods.reduce(
    (acc, f) => ({
      total_calories: acc.total_calories + (f.calories || 0),
      total_protein: acc.total_protein + (f.protein || 0),
      total_carbs: acc.total_carbs + (f.carbs || 0),
      total_fat: acc.total_fat + (f.fat || 0),
    }),
    { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 }
  )

  const row = {
    user_id: userId,
    log_date: today,
    breakfast: currentMeals.breakfast,
    lunch: currentMeals.lunch,
    dinner: currentMeals.dinner,
    snacks: currentMeals.snacks,
    ...totals,
    checkin_time: new Date().toISOString(),
  }

  await db.from('daily_logs').upsert(row, { onConflict: 'user_id,log_date' })

  const addedCalories = validFoods.reduce((s, f) => s + (f.calories || 0), 0)
  return { mealCategory: category, totalCalories: addedCalories }
}
