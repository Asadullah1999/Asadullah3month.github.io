/**
 * n8n trigger endpoint — Daily Reminder
 * POST /api/n8n/daily-reminder
 * Headers: x-api-key: <N8N_API_KEY>
 * Body: { type: 'breakfast' | 'lunch' | 'dinner' | 'water' | 'summary' }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDb(): any {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (req.headers['x-api-key'] !== process.env.N8N_API_KEY) return res.status(401).json({ error: 'Unauthorized' })

  const { type = 'meal' } = req.body
  const today = new Date().toISOString().split('T')[0]
  const db = getDb()

  const { data: contacts } = await db.from('whatsapp_contacts').select('user_id, phone_number').eq('is_verified', true).eq('opt_in', true)
  if (!contacts || contacts.length === 0) return res.status(200).json({ users: [], count: 0 })

  const userIds = contacts.map((c: { user_id: string }) => c.user_id)
  const { data: users } = await db.from('users').select('id, full_name, calorie_target').in('id', userIds)
  const { data: logs } = await db.from('daily_logs').select('user_id, total_calories, water_ml, checkin_time').in('user_id', userIds).eq('log_date', today)

  const payload = contacts.map((c: { user_id: string; phone_number: string }) => {
    const user = (users || []).find((u: { id: string }) => u.id === c.user_id)
    const log  = (logs  || []).find((l: { user_id: string }) => l.user_id === c.user_id)
    const consumed = log?.total_calories || 0
    const target = user?.calorie_target || 2000
    const name = ((user?.full_name as string) || 'there').split(' ')[0]

    let message = ''
    if (type === 'breakfast') message = `🌅 Good morning, ${name}! Log your breakfast. Daily goal: ${target} kcal.`
    else if (type === 'lunch') message = `☀️ Lunchtime, ${name}! ${consumed > 0 ? `At ${consumed}/${target} kcal.` : 'Log your meals!'}`
    else if (type === 'dinner') message = `🌙 Evening, ${name}! ${consumed > 0 ? `At ${consumed}/${target} kcal.` : 'Log dinner to complete today!'}`
    else if (type === 'water') { const w = log?.water_ml || 0; message = `💧 Water check, ${name}! ${w}ml done. ${w < 2500 ? `${2500 - w}ml to go!` : 'Goal hit! 🎉'}` }
    else if (type === 'summary') { const on = consumed >= target * 0.85 && consumed <= target * 1.15; message = `📊 Summary, ${name}: ${consumed}/${target} kcal | ${log?.water_ml || 0}ml water\n${on ? '✅ On target!' : consumed < target ? `⬆️ ${target - consumed} kcal short` : `⬇️ ${consumed - target} kcal over`}` }

    return { userId: c.user_id, phone: c.phone_number, name, message, caloriesConsumed: consumed, caloriesTarget: target, hasLoggedToday: !!log?.checkin_time }
  }).filter((u: { message: string }) => u.message)

  return res.status(200).json({ users: payload, count: payload.length })
}
