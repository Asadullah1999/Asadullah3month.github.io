/**
 * Parse natural language meal descriptions into structured MealItem[]
 * Uses Groq LLM for parsing
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
  const foods = await parseWithGroq(text)
  return { foods, mealCategory }
}
