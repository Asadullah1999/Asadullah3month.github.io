import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
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

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI service not configured. Please add GROQ_API_KEY.' })
  }

  const { userId } = req.body as { userId?: string }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient<Database>(supabaseUrl, serviceKey)

  let context = `
User Profile:
- Goal: maintain weight
- Diet Preference: omnivore
- Daily Targets: 2000 kcal, 150g protein, 200g carbs, 65g fat
No active diet plan. No recent food logs.`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let userForHealth: any = null

  if (userId) {
    const { data: userRaw } = await supabase
      .from('users')
      .select('goal, diet_preference, calorie_target, protein_target, carb_target, fat_target, diabetes_type, bp_status, allergies, medications')
      .eq('id', userId)
      .single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = userRaw as any
    userForHealth = user

    const { data: dietPlanRaw } = await supabase
      .from('diet_plans')
      .select('title, description')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dietPlan = dietPlanRaw as any

    const today = new Date()
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 7)

    const { data: recentLogsRaw } = await supabase
      .from('daily_logs')
      .select('breakfast, lunch, dinner, snacks')
      .eq('user_id', userId)
      .gte('log_date', sevenDaysAgo.toISOString().split('T')[0])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentLogs = recentLogsRaw as any[] | null

    context = `
User Profile:
- Goal: ${user?.goal?.replace('_', ' ') || 'maintain weight'}
- Diet Preference: ${user?.diet_preference || 'omnivore'}
- Daily Targets: ${user?.calorie_target || 2000} kcal, ${user?.protein_target || 150}g protein, ${user?.carb_target || 200}g carbs, ${user?.fat_target || 65}g fat

${dietPlan ? `Active Diet Plan: "${dietPlan.title}" — ${dietPlan.description || ''}` : 'No active diet plan.'}

Recently consumed foods (last 7 days):
${recentLogs && recentLogs.length > 0
  ? recentLogs.slice(0, 5).map((log: any, i: number) =>
      `Day ${i + 1}: breakfast=${JSON.stringify(log.breakfast)?.slice(0, 80)}, lunch=${JSON.stringify(log.lunch)?.slice(0, 80)}`
    ).join('\n')
  : 'No recent food logs.'}`
  }

  // Build health context
  const healthContext = userId && userForHealth ? `
Health Information:
- Diabetes: ${userForHealth.diabetes_type && userForHealth.diabetes_type !== 'none' ? userForHealth.diabetes_type : 'None'}
- Blood Pressure: ${userForHealth.bp_status && userForHealth.bp_status !== 'normal' ? userForHealth.bp_status : 'Normal'}
- Allergies: ${userForHealth.allergies?.length ? userForHealth.allergies.join(', ') : 'None'}
- Medications: ${userForHealth.medications?.length ? userForHealth.medications.join(', ') : 'None'}` : ''

  const isSouthIndian = context.includes('south_indian')
  const prompt = `Based on this nutrition profile, generate a comprehensive weekly grocery shopping list.

${context}
${healthContext}
${isSouthIndian ? `
South Indian cuisine focus — prioritise these staples:
- Grains: idli rice, parboiled rice, semolina (rava), poha
- Lentils/Dal: toor dal, urad dal, chana dal, moong dal
- Fresh: coconut, curry leaves, drumstick, raw banana, brinjal, bottle gourd, tomatoes, onions, green chillies
- Pantry: tamarind, sambar powder, rasam powder, mustard seeds, dried red chillies, asafoetida (hing), turmeric
- Fats: coconut oil, ghee
- Beverages: filter coffee decoction, buttermilk` : ''}

IMPORTANT health-based adjustments:
- For diabetics: prioritize low-GI foods (millets, whole grains, legumes), avoid sugary items, refined flour
- For high BP: include potassium-rich foods (bananas, spinach, sweet potatoes), avoid high-sodium items, pickles, papad
- For allergies: STRICTLY exclude any items containing listed allergens

Create a practical, budget-friendly grocery list for one week that supports the user's goals, diet preference, and health conditions.

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Brief description of the grocery list focus",
  "generated_for": "Week of [current week description]",
  "items": [
    {
      "name": "Item name",
      "quantity": "Amount needed (e.g., '500g', '1 dozen', '2 bunches')",
      "category": "produce|proteins|grains|dairy|pantry|beverages|other"
    }
  ]
}

Include 25-35 items covering all major food groups appropriate for the diet preference.`

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2048,
        temperature: 0.4,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Groq API error:', errorText)
      return res.status(502).json({ error: 'AI service error. Please try again.' })
    }

    const data = await response.json() as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const rawText = data.choices?.[0]?.message?.content || ''

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Could not parse AI response.' })
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      summary: string
      generated_for: string
      items: Array<{ name: string; quantity: string; category: GroceryItem['category'] }>
    }

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
