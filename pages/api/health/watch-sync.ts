import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers['x-sync-token']
  if (!token || token !== process.env.WATCH_SYNC_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const userId = req.headers['x-user-id'] as string
  if (!userId) return res.status(400).json({ error: 'x-user-id header required' })

  const body = req.body
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) {
    return res.status(400).json({ error: 'Valid date (YYYY-MM-DD) required' })
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  ) as any

  const { error } = await db.from('watch_health_logs').upsert(
    {
      user_id: userId,
      date: body.date,
      steps: body.steps ?? null,
      heart_rate_resting: body.heart_rate_resting ?? null,
      heart_rate_max: body.heart_rate_max ?? null,
      active_calories: body.active_calories ?? null,
      hrv: body.hrv ?? null,
      spo2: body.spo2 ?? null,
      distance_km: body.distance_km ?? null,
      sleep_score: body.sleep_score ?? null,
      source: body.source || 'apple_health',
      notes: body.notes ?? null,
    },
    { onConflict: 'user_id,date,source' }
  )

  if (error) {
    console.error('watch-sync error:', error)
    return res.status(500).json({ error: 'Database error' })
  }

  return res.status(200).json({ ok: true })
}
