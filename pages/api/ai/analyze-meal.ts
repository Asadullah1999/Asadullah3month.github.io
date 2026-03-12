import type { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

type NutritionItem = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantity: string
}

type AnalyzeResponse = {
  foods: NutritionItem[]
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  description: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyzeResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'AI service not configured. Please add GEMINI_API_KEY to your environment.' })
  }

  const { image, mimeType = 'image/jpeg' } = req.body as { image: string; mimeType?: string }
  if (!image) {
    return res.status(400).json({ error: 'Image is required' })
  }

  const prompt = `You are a nutrition expert AI. Analyze this food image and identify all visible food items.

For each food item you can see, provide accurate nutritional estimates.

Respond ONLY with valid JSON in this exact format:
{
  "description": "Brief description of what you see (e.g., 'A plate of grilled chicken breast with steamed broccoli and brown rice')",
  "foods": [
    {
      "name": "Food item name",
      "quantity": "Estimated quantity (e.g., '150g', '1 medium', '1 cup')",
      "calories": <number>,
      "protein": <number in grams>,
      "carbs": <number in grams>,
      "fat": <number in grams>
    }
  ]
}

Be precise with nutritional values based on standard serving sizes. Always return valid JSON with at least one food item.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { inline_data: { mime_type: mimeType, data: image } },
              { text: prompt },
            ],
          }],
          generationConfig: { maxOutputTokens: 1024, temperature: 0.1 },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', errorText)
      return res.status(502).json({ error: 'AI analysis failed. Please try again.' })
    }

    const data = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    const jsonMatch = rawText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Could not parse AI response. Please try again.' })
    }

    const parsed = JSON.parse(jsonMatch[0]) as { description: string; foods: NutritionItem[] }

    const foods: NutritionItem[] = (parsed.foods || []).map((f) => ({
      name: f.name || 'Unknown food',
      quantity: f.quantity || '1 serving',
      calories: Math.round(Number(f.calories) || 0),
      protein: Math.round(Number(f.protein) || 0),
      carbs: Math.round(Number(f.carbs) || 0),
      fat: Math.round(Number(f.fat) || 0),
    }))

    const totals = foods.reduce(
      (acc, f) => ({
        total_calories: acc.total_calories + f.calories,
        total_protein: acc.total_protein + f.protein,
        total_carbs: acc.total_carbs + f.carbs,
        total_fat: acc.total_fat + f.fat,
      }),
      { total_calories: 0, total_protein: 0, total_carbs: 0, total_fat: 0 }
    )

    return res.status(200).json({
      foods,
      description: parsed.description || 'Food analysis complete',
      ...totals,
    })
  } catch (err) {
    console.error('Meal analysis error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' })
  }
}
