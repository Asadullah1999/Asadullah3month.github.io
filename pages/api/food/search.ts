import type { NextApiRequest, NextApiResponse } from 'next'

// FatSecret Platform API — OAuth 2.0 Client Credentials
// Docs: https://platform.fatsecret.com/rest/server.api

type FoodServing = {
  serving_description: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

type FoodResult = {
  id: string
  name: string
  brand: string
  servings: FoodServing[]
}

type ErrorResponse = { error: string }

let cachedToken: { value: string; expiresAt: number } | null = null

async function getFatSecretToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.value
  }

  const clientId = process.env.FATSECRET_CLIENT_ID
  const clientSecret = process.env.FATSECRET_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error('FatSecret credentials not configured')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const response = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials&scope=basic',
  })

  if (!response.ok) {
    throw new Error(`FatSecret token error: ${response.status}`)
  }

  const data = await response.json() as { access_token: string; expires_in: number }
  cachedToken = {
    value: data.access_token,
    // Expire 60 seconds early to be safe
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }
  return cachedToken.value
}

function parseServing(serving: Record<string, string>): FoodServing {
  return {
    serving_description: serving.serving_description || '1 serving',
    calories: Math.round(parseFloat(serving.calories) || 0),
    protein: Math.round((parseFloat(serving.protein) || 0) * 10) / 10,
    carbs: Math.round((parseFloat(serving.carbohydrate) || 0) * 10) / 10,
    fat: Math.round((parseFloat(serving.fat) || 0) * 10) / 10,
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FoodResult[] | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { q, max_results = '10' } = req.query
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' })
  }

  try {
    const token = await getFatSecretToken()
    const maxRes = Math.min(parseInt(max_results as string) || 10, 20)

    // Search foods
    const searchUrl = new URL('https://platform.fatsecret.com/rest/server.api')
    searchUrl.searchParams.set('method', 'foods.search.v3')
    searchUrl.searchParams.set('search_expression', q.trim())
    searchUrl.searchParams.set('max_results', String(maxRes))
    searchUrl.searchParams.set('format', 'json')
    searchUrl.searchParams.set('include_food_images', 'false')

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { 'Authorization': `Bearer ${token}` },
    })

    if (!searchRes.ok) {
      return res.status(502).json({ error: 'Food search failed' })
    }

    const searchData = await searchRes.json() as {
      foods_search?: {
        results?: {
          food?: Array<{
            food_id: string
            food_name: string
            brand_name?: string
            food_description?: string
            servings?: { serving: Record<string, string> | Array<Record<string, string>> }
          }>
        }
      }
      error?: { message: string }
    }

    if (searchData.error) {
      return res.status(502).json({ error: searchData.error.message })
    }

    const foods = searchData.foods_search?.results?.food ?? []
    if (foods.length === 0) {
      return res.status(200).json([])
    }

    // For each food, get detailed serving info. FatSecret v3 search already includes
    // food_description like "Per 100g - Calories: 350kcal | Fat: 5g | Carbs: 12g | Protein: 22g"
    // We parse that if available, otherwise call food.get.v4
    const results: FoodResult[] = foods.map((food) => {
      let servings: FoodServing[] = []

      if (food.servings?.serving) {
        const rawServings = Array.isArray(food.servings.serving)
          ? food.servings.serving
          : [food.servings.serving]
        servings = rawServings.map(parseServing)
      } else if (food.food_description) {
        // Parse description: "Per 100g - Calories: 350kcal | Fat: 5g | Carbs: 12g | Protein: 22g"
        const cal = food.food_description.match(/Calories:\s*([\d.]+)/i)
        const fat = food.food_description.match(/Fat:\s*([\d.]+)/i)
        const carbs = food.food_description.match(/Carbs:\s*([\d.]+)/i)
        const protein = food.food_description.match(/Protein:\s*([\d.]+)/i)
        const per = food.food_description.match(/^Per\s+(.+?)\s+-/i)
        servings = [{
          serving_description: per ? per[1] : '1 serving',
          calories: Math.round(parseFloat(cal?.[1] ?? '0')),
          fat: Math.round((parseFloat(fat?.[1] ?? '0')) * 10) / 10,
          carbs: Math.round((parseFloat(carbs?.[1] ?? '0')) * 10) / 10,
          protein: Math.round((parseFloat(protein?.[1] ?? '0')) * 10) / 10,
        }]
      }

      return {
        id: food.food_id,
        name: food.food_name,
        brand: food.brand_name || '',
        servings,
      }
    })

    return res.status(200).json(results)
  } catch (err) {
    console.error('Food search error:', err)
    const message = err instanceof Error ? err.message : 'Unexpected error'
    if (message.includes('credentials not configured')) {
      return res.status(503).json({ error: 'Food search service not configured. Set FATSECRET_CLIENT_ID and FATSECRET_CLIENT_SECRET.' })
    }
    return res.status(500).json({ error: 'Food search failed. Please try again.' })
  }
}
