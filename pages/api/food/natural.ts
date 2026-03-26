import type { NextApiRequest, NextApiResponse } from 'next'

// Nutritionix Natural Language API
// Docs: https://trackapi.nutritionix.com/docs
// Best-in-class for parsing food descriptions like "2 roti and dal makhani"

type ParsedFood = {
  name: string
  quantity: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  serving_weight_grams: number
}

type ErrorResponse = { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ParsedFood[] | ErrorResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { query } = req.body as { query?: string }
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.status(400).json({ error: 'Food query is required' })
  }

  const appId = process.env.NUTRITIONIX_APP_ID
  const appKey = process.env.NUTRITIONIX_APP_KEY

  if (!appId || !appKey) {
    return res.status(503).json({
      error: 'Nutritionix not configured. Set NUTRITIONIX_APP_ID and NUTRITIONIX_APP_KEY.',
    })
  }

  try {
    const response = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': appId,
        'x-app-key': appKey,
      },
      body: JSON.stringify({ query: query.trim() }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { message?: string }
      const msg = errorData.message || `Nutritionix error: ${response.status}`
      return res.status(502).json({ error: msg })
    }

    const data = await response.json() as {
      foods?: Array<{
        food_name: string
        serving_qty: number
        serving_unit: string
        nf_calories: number
        nf_protein: number
        nf_total_carbohydrate: number
        nf_total_fat: number
        nf_dietary_fiber: number
        serving_weight_grams: number
      }>
    }

    if (!data.foods || data.foods.length === 0) {
      return res.status(200).json([])
    }

    const results: ParsedFood[] = data.foods.map((food) => ({
      name: food.food_name,
      quantity: `${food.serving_qty} ${food.serving_unit}`,
      calories: Math.round(food.nf_calories || 0),
      protein: Math.round((food.nf_protein || 0) * 10) / 10,
      carbs: Math.round((food.nf_total_carbohydrate || 0) * 10) / 10,
      fat: Math.round((food.nf_total_fat || 0) * 10) / 10,
      fiber: Math.round((food.nf_dietary_fiber || 0) * 10) / 10,
      serving_weight_grams: Math.round(food.serving_weight_grams || 0),
    }))

    return res.status(200).json(results)
  } catch (err) {
    console.error('Nutritionix natural language error:', err)
    return res.status(500).json({ error: 'Food parsing failed. Please try again.' })
  }
}
