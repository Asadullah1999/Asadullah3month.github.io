/**
 * Parse natural language meal descriptions into structured MealItem[]
 * Primary: Nutritionix Natural Language API (accurate, real data)
 * Fallback: Groq LLM (used when Nutritionix is unavailable or returns nothing)
 */

type MealItem = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantity?: string
}

type ParseResult = {
  foods: MealItem[]
  mealCategory?: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
}

const MEAL_KEYWORDS: Record<'breakfast' | 'lunch' | 'dinner' | 'snacks', string[]> = {
  breakfast: ['breakfast', 'morning', 'suhoor', 'sehri'],
  lunch:     ['lunch', 'afternoon', 'duphar'],
  dinner:    ['dinner', 'evening', 'raat', 'iftar', 'supper'],
  snacks:    ['snack', 'snacks', 'tea time', 'chai time', 'evening snack'],
}

function detectMealCategory(text: string): 'breakfast' | 'lunch' | 'dinner' | 'snacks' | undefined {
  const lower = text.toLowerCase()
  for (const [category, keywords] of Object.entries(MEAL_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category as 'breakfast' | 'lunch' | 'dinner' | 'snacks'
    }
  }
  return undefined
}

async function parseWithNutritionix(text: string): Promise<MealItem[]> {
  const appId = process.env.NUTRITIONIX_APP_ID
  const appKey = process.env.NUTRITIONIX_APP_KEY
  if (!appId || !appKey) return []

  try {
    const res = await fetch('https://trackapi.nutritionix.com/v2/natural/nutrients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-app-id': appId,
        'x-app-key': appKey,
      },
      body: JSON.stringify({ query: text }),
    })

    if (!res.ok) return []

    const data = await res.json() as {
      foods?: Array<{
        food_name: string
        serving_qty: number
        serving_unit: string
        nf_calories: number
        nf_protein: number
        nf_total_carbohydrate: number
        nf_total_fat: number
      }>
    }

    if (!data.foods?.length) return []

    return data.foods.map(f => ({
      name: f.food_name,
      quantity: `${f.serving_qty} ${f.serving_unit}`,
      calories: Math.round(f.nf_calories || 0),
      protein: Math.round((f.nf_protein || 0) * 10) / 10,
      carbs: Math.round((f.nf_total_carbohydrate || 0) * 10) / 10,
      fat: Math.round((f.nf_total_fat || 0) * 10) / 10,
    }))
  } catch {
    return []
  }
}

async function parseWithGroq(text: string): Promise<MealItem[]> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return []

  const prompt = `You are a nutrition parser. Extract food items from this message and estimate calories and macros.

User said: "${text}"

Return ONLY valid JSON (no markdown, no explanation):
{
  "foods": [
    {"name": "Food name", "quantity": "amount", "calories": 0, "protein": 0, "carbs": 0, "fat": 0}
  ]
}

Rules:
- Use standard Pakistani/Indian serving sizes when relevant
- Be accurate with nutritional values
- Always return at least one food item if the message describes food
- If the message is NOT about food, return {"foods": []}`

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 512,
      }),
    })

    if (!res.ok) return []

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return []

    const parsed = JSON.parse(jsonMatch[0])
    return (parsed.foods || []).map((f: MealItem) => ({
      name: f.name || 'Unknown food',
      quantity: f.quantity || '1 serving',
      calories: Math.round(Number(f.calories) || 0),
      protein: Math.round(Number(f.protein) || 0),
      carbs: Math.round(Number(f.carbs) || 0),
      fat: Math.round(Number(f.fat) || 0),
    }))
  } catch {
    return []
  }
}

export async function parseMealText(text: string): Promise<ParseResult> {
  const mealCategory = detectMealCategory(text)

  // Try Nutritionix first (real data, more accurate)
  let foods = await parseWithNutritionix(text)

  // Fall back to Groq if Nutritionix returned nothing
  if (foods.length === 0) {
    foods = await parseWithGroq(text)
  }

  return { foods, mealCategory }
}
