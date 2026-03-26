import type { NextApiRequest, NextApiResponse } from 'next'

// ExerciseDB via RapidAPI — 1,300+ exercises with muscle groups & GIFs
// Docs: https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb

type ExerciseResult = {
  id: string
  name: string
  bodyPart: string
  target: string
  equipment: string
  gifUrl: string
  cal_per_min: number
  workout_type: 'strength' | 'cardio' | 'flexibility' | 'sports' | 'other'
}

type ErrorResponse = { error: string }

// Map ExerciseDB body parts / targets to calorie burn estimates (kcal/min)
// Based on MET values for average 70kg adult
function estimateCalPerMin(
  bodyPart: string,
  equipment: string
): { cal_per_min: number; workout_type: ExerciseResult['workout_type'] } {
  const bp = bodyPart.toLowerCase()
  const eq = equipment.toLowerCase()

  if (bp === 'cardio' || eq === 'skierg machine' || eq === 'elliptical machine') {
    return { cal_per_min: 10, workout_type: 'cardio' }
  }
  if (bp === 'waist' || bp === 'back' || bp === 'chest') {
    return { cal_per_min: 6, workout_type: 'strength' }
  }
  if (bp === 'upper legs' || bp === 'lower legs') {
    return { cal_per_min: 7, workout_type: 'strength' }
  }
  if (bp === 'upper arms' || bp === 'lower arms' || bp === 'shoulders') {
    return { cal_per_min: 5, workout_type: 'strength' }
  }
  if (bp === 'neck') {
    return { cal_per_min: 4, workout_type: 'flexibility' }
  }
  return { cal_per_min: 5, workout_type: 'other' }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ExerciseResult[] | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { q, limit = '10' } = req.query
  if (!q || typeof q !== 'string' || q.trim().length < 2) {
    return res.status(400).json({ error: 'Query must be at least 2 characters' })
  }

  const rapidApiKey = process.env.RAPIDAPI_KEY
  if (!rapidApiKey) {
    return res.status(503).json({
      error: 'ExerciseDB not configured. Set RAPIDAPI_KEY.',
    })
  }

  try {
    const name = encodeURIComponent(q.trim().toLowerCase())
    const maxLimit = Math.min(parseInt(limit as string) || 10, 20)

    const response = await fetch(
      `https://exercisedb.p.rapidapi.com/exercises/name/${name}?offset=0&limit=${maxLimit}`,
      {
        headers: {
          'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
          'x-rapidapi-key': rapidApiKey,
        },
      }
    )

    if (!response.ok) {
      return res.status(502).json({ error: `ExerciseDB error: ${response.status}` })
    }

    const data = await response.json() as Array<{
      id: string
      name: string
      bodyPart: string
      target: string
      equipment: string
      gifUrl: string
    }>

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(200).json([])
    }

    const results: ExerciseResult[] = data.map((exercise) => {
      const { cal_per_min, workout_type } = estimateCalPerMin(
        exercise.bodyPart,
        exercise.equipment
      )
      return {
        id: exercise.id,
        name: exercise.name
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' '),
        bodyPart: exercise.bodyPart,
        target: exercise.target,
        equipment: exercise.equipment,
        gifUrl: exercise.gifUrl,
        cal_per_min,
        workout_type,
      }
    })

    return res.status(200).json(results)
  } catch (err) {
    console.error('Exercise search error:', err)
    return res.status(500).json({ error: 'Exercise search failed. Please try again.' })
  }
}
