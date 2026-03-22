// Vercel Cron: Send WhatsApp reminders
// Runs every 15 minutes (schedule configured in vercel.json)
// Auth: CRON_SECRET (auto-provided by Vercel)

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getProvider } from '@/lib/whatsapp/provider'
import { buildReminderMessage } from '@/lib/whatsapp/reminder-messages'

function getDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const db = getDb()
  const provider = getProvider()

  // Current time in PKT (UTC+5) for matching reminders
  const now = new Date()
  const pktHour = (now.getUTCHours() + 5) % 24
  const pktMinute = now.getUTCMinutes()
  const currentTime = `${String(pktHour).padStart(2, '0')}:${String(pktMinute).padStart(2, '0')}`

  // Time window: ±7 minutes to account for cron interval
  const windowStart = new Date(now.getTime() - 7 * 60 * 1000)
  const windowEnd = new Date(now.getTime() + 7 * 60 * 1000)
  const startHour = (windowStart.getUTCHours() + 5) % 24
  const startMin = windowStart.getUTCMinutes()
  const endHour = (windowEnd.getUTCHours() + 5) % 24
  const endMin = windowEnd.getUTCMinutes()
  const timeStart = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`
  const timeEnd = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`

  // Current day of week (0=Sun, 1=Mon, ... 6=Sat)
  const dayOfWeek = now.getDay()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const todayName = dayNames[dayOfWeek]

  try {
    // Find active reminders in the current time window
    const { data: reminders, error: remErr } = await db
      .from('reminders')
      .select('id, user_id, type, title, message, time, days')
      .eq('is_active', true)
      .gte('time', timeStart)
      .lte('time', timeEnd)

    if (remErr || !reminders || reminders.length === 0) {
      return res.status(200).json({ sent: 0, errors: 0, time: currentTime })
    }

    let sent = 0
    let errors = 0

    for (const reminder of reminders) {
      // Check if this reminder should fire today
      if (reminder.days && Array.isArray(reminder.days) && !reminder.days.includes(todayName)) {
        continue
      }

      // Get user's WhatsApp contact (must be verified + opted in)
      const { data: contact } = await db
        .from('whatsapp_contacts')
        .select('phone_number')
        .eq('user_id', reminder.user_id)
        .eq('is_verified', true)
        .eq('opt_in', true)
        .maybeSingle()

      if (!contact) continue

      // Get user info for personalization
      const { data: user } = await db
        .from('users')
        .select('full_name, calorie_target')
        .eq('id', reminder.user_id)
        .single()

      // Get today's log for context
      const today = now.toISOString().split('T')[0]
      const { data: todayLog } = await db
        .from('daily_logs')
        .select('total_calories, water_ml')
        .eq('user_id', reminder.user_id)
        .eq('log_date', today)
        .maybeSingle()

      const message = buildReminderMessage(
        reminder,
        { full_name: user?.full_name || null, calorie_target: user?.calorie_target || null },
        todayLog ? { total_calories: todayLog.total_calories, water_ml: todayLog.water_ml } : null
      )

      const phone = contact.phone_number.replace('+', '')
      const result = await provider.sendText(phone, message)

      if (result.success) {
        sent++
      } else {
        errors++
        console.error(`Failed to send reminder ${reminder.id}:`, result.error)
      }
    }

    return res.status(200).json({ sent, errors, time: currentTime })
  } catch (err) {
    console.error('Cron send-reminders error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
