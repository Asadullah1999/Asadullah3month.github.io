import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

type GroceryItem = {
  name: string
  quantity: string
  category: 'produce' | 'proteins' | 'grains' | 'dairy' | 'pantry' | 'beverages' | 'other'
  checked: boolean
}

type GroceryListResponse = {
  items: GroceryItem[]
  summary: string
  generated_for: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GroceryListResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI service not configured. Please add ANTHROPIC_API_KEY.' })
  }

  const supabase = createServerSupabaseClient<Database>({ req, res })
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Fetch user profile
  const { data: user } = await supabase
    .from('users')
    .select('full_name, goal, diet_preference, calorie_target, protein_target, carb_target, fat_target')
    .eq('id', session.user.id)
    .single() as { data: any | null; error: unknown }

  // Fetch active diet plan
  const { data: dietPlan } = await supabase
    .from('diet_plans')
    .select('title, description, meals')
    .eq('user_id', session.user.id)
    .eq('is_active', true)
    .single() as { data: any | null; error: unknown }

  // Fetch last 7 days of logged foods for context
  const today = new Date()
  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(today.getDate() - 7)

  const { data: recentLogs } = await supabase
    .from('daily_logs')
    .select('breakfast, lunch, dinner, snacks')
    .eq('user_id', session.user.id)
    .gte('log_date', sevenDaysAgo.toISOString().split('T')[0]) as { data: any[] | null; error: unknown }

  const context = `
User Profile:
- Goal: ${user?.goal?.replace('_', ' ') || 'maintain weight'}
- Diet Preference: ${user?.diet_preference || 'omnivore'}
- Daily Targets: ${user?.calorie_target || 2000} kcal, ${user?.protein_target || 150}g protein, ${user?.carb_target || 200}g carbs, ${user?.fat_target || 65}g fat

${dietPlan ? `Active Diet Plan: "${dietPlan.title}"
Plan Description: ${dietPlan.description || 'Custom meal plan'}
Plan Meals: ${JSON.stringify(dietPlan.meals).slice(0, 500)}` : 'No active diet plan set.'}

Recently consumed foods (last 7 days):
${recentLogs && recentLogs.length > 0
  ? recentLogs.slice(0, 5).map((log, i) =>
      `Day ${i + 1}: breakfast=${JSON.stringify(log.breakfast)?.slice(0, 100)}, lunch=${JSON.stringify(log.lunch)?.slice(0, 100)}`
    ).join('\n')
  : 'No recent food logs.'}
`

  const prompt = `Based on this nutrition profile, generate a comprehensive weekly grocery shopping list.

${context}

Create a practical, budget-friendly grocery list for one week that:
1. Supports the user's nutritional goals and diet preference
2. Includes variety to prevent meal fatigue
3. Focuses on whole, nutritious foods
4. Groups items by store section

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief description of the grocery list focus (e.g., 'High-protein grocery list for muscle building with balanced macros')",
  "generated_for": "Week of [current week description]",
  "items": [
    {
      "name": "Item name",
      "quantity": "Amount needed (e.g., '500g', '1 dozen', '2 bunches')",
      "category": "produce|proteins|grains|dairy|pantry|beverages|other"
    }
  ]
}

Include 25-35 items covering all major food groups appropriate for the diet preference. Each item must have a specific quantity for one week.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      return res.status(502).json({ error: 'AI service error. Please try again.' })
    }

    const data = await response.json() as { content: Array<{ type: string; text: string }> }
    const rawText = data.content?.[0]?.text || ''

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Could not parse AI response.' })
    }

    const parsed = JSON.parse(jsonMatch[0]) as { summary: string; generated_for: string; items: Array<{ name: string; quantity: string; category: GroceryItem['category'] }> }

    const items: GroceryItem[] = (parsed.items || []).map((item) => ({
      name: item.name || 'Unknown item',
      quantity: item.quantity || '1 unit',
      category: item.category || 'other',
      checked: false,
    }))

    return res.status(200).json({
      items,
      summary: parsed.summary || 'Weekly grocery list',
      generated_for: parsed.generated_for || 'This week',
    })
  } catch (err) {
    console.error('Grocery list error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}
