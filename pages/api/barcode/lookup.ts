import type { NextApiRequest, NextApiResponse } from 'next'

type NutritionData = {
  barcode: string
  name: string
  brand: string
  serving_size: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  image_url: string | null
}

type OpenFoodFactsProduct = {
  product_name?: string
  brands?: string
  serving_size?: string
  image_front_url?: string
  nutriments?: {
    'energy-kcal_serving'?: number
    'energy-kcal_100g'?: number
    proteins_serving?: number
    proteins_100g?: number
    carbohydrates_serving?: number
    carbohydrates_100g?: number
    fat_serving?: number
    fat_100g?: number
    fiber_serving?: number
    fiber_100g?: number
    sugars_serving?: number
    sugars_100g?: number
    sodium_serving?: number
    sodium_100g?: number
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NutritionData | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { barcode } = req.query
  if (!barcode || typeof barcode !== 'string') {
    return res.status(400).json({ error: 'Barcode is required' })
  }

  // Sanitize barcode — only digits allowed
  const cleanBarcode = barcode.replace(/\D/g, '')
  if (cleanBarcode.length < 8 || cleanBarcode.length > 14) {
    return res.status(400).json({ error: 'Invalid barcode format' })
  }

  try {
    // Open Food Facts API — free, no API key required
    const response = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${cleanBarcode}.json`,
      {
        headers: {
          'User-Agent': 'FahmiFit/1.0 (nutrition tracking app)',
        },
      }
    )

    if (!response.ok) {
      return res.status(502).json({ error: 'Could not reach nutrition database.' })
    }

    const data = await response.json() as { status: number; product?: OpenFoodFactsProduct }

    if (data.status !== 1 || !data.product) {
      return res.status(404).json({ error: 'Product not found. Try entering nutrition details manually.' })
    }

    const p = data.product
    const n = p.nutriments || {}

    // Prefer per-serving values, fall back to per-100g
    const calories = Math.round(n['energy-kcal_serving'] ?? n['energy-kcal_100g'] ?? 0)
    const protein = Math.round((n.proteins_serving ?? n.proteins_100g ?? 0) * 10) / 10
    const carbs = Math.round((n.carbohydrates_serving ?? n.carbohydrates_100g ?? 0) * 10) / 10
    const fat = Math.round((n.fat_serving ?? n.fat_100g ?? 0) * 10) / 10
    const fiber = Math.round((n.fiber_serving ?? n.fiber_100g ?? 0) * 10) / 10
    const sugar = Math.round((n.sugars_serving ?? n.sugars_100g ?? 0) * 10) / 10
    const sodium = Math.round((n.sodium_serving ?? n.sodium_100g ?? 0) * 10) / 10

    return res.status(200).json({
      barcode: cleanBarcode,
      name: p.product_name || 'Unknown Product',
      brand: p.brands || 'Unknown Brand',
      serving_size: p.serving_size || '100g',
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium,
      image_url: p.image_front_url || null,
    })
  } catch (err) {
    console.error('Barcode lookup error:', err)
    return res.status(500).json({ error: 'An unexpected error occurred.' })
  }
}
