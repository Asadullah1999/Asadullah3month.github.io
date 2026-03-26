// AI Diet Plan Generator using Groq
// Generates structured 7-day meal plans based on user profile, health conditions, and plan type

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

type PlanType = 'regular' | 'ramadan' | 'keto' | 'intermittent_fasting'

const MEAL_STRUCTURES: Record<PlanType, string[]> = {
  regular: ['Breakfast', 'Mid-Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'],
  ramadan: ['Suhoor (Pre-Dawn)', 'Iftar (Sunset)', 'Dinner (Night)'],
  keto: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
  intermittent_fasting: ['Meal 1 (12 PM)', 'Meal 2 (4 PM)', 'Meal 3 (8 PM)'],
}

const PLAN_CONTEXT: Record<PlanType, string> = {
  regular: 'Standard daily meal plan with balanced nutrition spread across the day.',
  ramadan: `Ramadan fasting diet plan. Meals are: Suhoor (pre-dawn meal before Fajr), Iftar (breaking fast at sunset with dates and light items), and Dinner (main evening meal). Focus on sustained energy, hydration between Iftar and Suhoor (2.5-3L water), complex carbs at Suhoor for slow release, and avoiding deep fried/sugary items at Iftar. Smart plate formula: 40% protein, 30% vegetables, 30% complex carbs.`,
  keto: 'Ketogenic diet plan. Very low carb (under 30g/day), high fat (70%), moderate protein. Focus on healthy fats, avoid grains/sugar/starchy vegetables.',
  intermittent_fasting: 'Intermittent fasting (16:8 window). Eating window is 12 PM to 8 PM. All calories consumed in 3 meals within this window. Higher calorie density per meal.',
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'AI not configured' })

  const { userId, planType = 'regular', durationDays = 7 } = req.body as {
    userId: string
    planType?: PlanType
    durationDays?: number
  }

  if (!userId) return res.status(400).json({ error: 'userId required' })

  const db = getDb()

  // Check plan gating — Premium feature
  const { data: sub } = await db
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .maybeSingle() as { data: { plan: string;
import { todayISOServer } from '@/lib/utils' status: string } | null }

  const plan = (sub?.status === 'active' || sub?.status === 'trialing') ? sub.plan : 'free'
  if (plan !== 'pro' && plan !== 'premium') {
    return res.status(200).json({
      gated: true,
      error: 'Diet Plan generation is a Pro feature. Upgrade your plan to generate personalized diet plans.',
    })
  }

  // Fetch user profile
  const { data: user } = await db
    .from('users')
    .select('full_name, age, gender, height_cm, weight_kg, goal, activity_level, diet_preference, calorie_target, protein_target, carb_target, fat_target, diabetes_type, bp_status, allergies, medications')
    .eq('id', userId)
    .single()

  if (!user) return res.status(400).json({ error: 'User profile not found. Complete onboarding first.' })

  const meals = MEAL_STRUCTURES[planType] || MEAL_STRUCTURES.regular
  const context = PLAN_CONTEXT[planType] || PLAN_CONTEXT.regular
  const actualDays = Math.min(durationDays, 7) // Generate max 7 days per call

  const systemPrompt = `You are FahmiFit AI, a certified sports nutritionist. Generate a detailed ${actualDays}-day meal plan in STRICT JSON format.

CLIENT PROFILE:
- Name: ${user.full_name || 'Client'}
- Age: ${user.age || '?'} years, Gender: ${user.gender || '?'}
- Height: ${user.height_cm || '?'} cm, Weight: ${user.weight_kg || '?'} kg
- Goal: ${(user.goal as string)?.replace('_', ' ') || 'maintain'}
- Activity Level: ${(user.activity_level as string)?.replace('_', ' ') || 'moderate'}
- Diet Preference: ${user.diet_preference || 'omnivore'}
- Daily Targets: ${user.calorie_target || 2000} kcal, ${user.protein_target || 100}g protein, ${user.carb_target || 200}g carbs, ${user.fat_target || 60}g fat
- Diabetes: ${user.diabetes_type || 'none'}
- Blood Pressure: ${user.bp_status || 'normal'}
- Allergies: ${(user.allergies as string[])?.join(', ') || 'none'}
- Medications: ${(user.medications as string[])?.join(', ') || 'none'}

PLAN TYPE: ${planType.replace('_', ' ').toUpperCase()}
${context}

MEAL STRUCTURE: ${meals.join(', ')}

RULES:
1. Each meal MUST include specific food items with exact quantities (grams, pieces, ml, tbsp)
2. Each meal must have approximate calories, protein, carbs, fat values
3. Daily total must be close to ${user.calorie_target || 2000} kcal (within 50 kcal)
4. Respect all allergies strictly — never include allergens
5. If diabetic: prefer low GI foods, limit simple carbs
6. If high BP: low sodium, DASH-friendly foods
7. Match diet_preference exactly (halal = no pork/alcohol, vegetarian = no meat/fish, etc.)
8. Vary meals across days — no exact repeats
9. Include locally common foods appropriate for South Asian / Indian cuisine when diet is halal or south_indian
10. Add 3-5 practical key_notes (hydration, plate formula, foods to avoid, workout tips)

RESPOND WITH ONLY THIS JSON (no markdown, no backticks, no explanation):
{
  "overview": {
    "plan_type": "${planType}",
    "calories": ${user.calorie_target || 2000},
    "protein": ${user.protein_target || 100},
    "carbs": ${user.carb_target || 200},
    "fat": ${user.fat_target || 60},
    "fiber": 30
  },
  "days": [
    {
      "day": "Day 1 - Sunday",
      "meals": [
        {
          "name": "Meal Name",
          "time": "7:00 AM",
          "items": "Food item 120g + Food item 100g + ...",
          "calories": 450,
          "protein": 30,
          "carbs": 45,
          "fat": 12
        }
      ]
    }
  ],
  "key_notes": ["Note 1", "Note 2", "Note 3"]
}`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Generate a complete ${actualDays}-day ${planType.replace('_', ' ')} meal plan for me. Return only valid JSON.` },
        ],
        max_tokens: 4096,
        temperature: 0.6,
      }),
    })

    if (!response.ok) {
      console.error('Groq plan error:', await response.text())
      return res.status(502).json({ error: 'AI service error' })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content || ''

    // Parse JSON — handle potential markdown wrapping
    let planData
    try {
      const jsonStr = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      planData = JSON.parse(jsonStr)
    } catch {
      console.error('Failed to parse plan JSON:', raw.slice(0, 500))
      return res.status(500).json({ error: 'AI returned invalid format. Please try again.' })
    }

    // Save to diet_plans table
    const title = `${planType === 'ramadan' ? 'Ramadan' : planType === 'keto' ? 'Keto' : planType === 'intermittent_fasting' ? 'IF' : ''} ${actualDays}-Day Diet Plan`.trim()
    await db.from('diet_plans').insert({
      user_id: userId,
      title,
      description: `AI-generated ${planType.replace('_', ' ')} plan — ${user.calorie_target || 2000} kcal/day`,
      meals: planData,
      calorie_target: user.calorie_target || 2000,
      protein_target: user.protein_target || 100,
      carb_target: user.carb_target || 200,
      fat_target: user.fat_target || 60,
      is_active: true,
      start_date: todayISOServer(),
    })

    return res.status(200).json({ plan: planData, saved: true })
  } catch (err) {
    console.error('Generate plan error:', err)
    return res.status(500).json({ error: 'Unexpected error generating plan' })
  }
}
