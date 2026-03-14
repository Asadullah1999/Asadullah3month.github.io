/**
 * WhatsApp Cloud API Webhook
 *
 * GET  — Verification challenge from Meta
 * POST — Incoming messages from users
 *
 * Setup in Meta Developer Console:
 *  Callback URL: https://your-domain.com/api/whatsapp/webhook
 *  Verify Token: set WHATSAPP_VERIFY_TOKEN in .env.local
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDb(): any {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const mode  = req.query['hub.mode']
    const token = req.query['hub.verify_token']
    const challenge = req.query['hub.challenge']

    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge)
    }
    return res.status(403).json({ error: 'Verification failed' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const body = req.body
  try {
    const entry = body?.entry?.[0]
    const value = entry?.changes?.[0]?.value

    if (!value?.messages?.[0]) {
      return res.status(200).json({ status: 'no_message' })
    }

    const message = value.messages[0]
    const phone   = message.from
    const text    = message.text?.body || ''

    const db = getDb()

    // Find user by phone
    const { data: waContact } = await db
      .from('whatsapp_contacts')
      .select('user_id, is_verified')
      .eq('phone_number', `+${phone}`)
      .maybeSingle()

    if (!waContact?.is_verified) {
      // Verification code check
      const { data: pending } = await db
        .from('whatsapp_contacts')
        .select('user_id, verification_code')
        .eq('phone_number', `+${phone}`)
        .maybeSingle()

      if (pending && text.trim() === pending.verification_code) {
        await db.from('whatsapp_contacts').update({
          is_verified: true,
          verification_code: null,
          verified_at: new Date().toISOString(),
        }).eq('user_id', pending.user_id)

        await sendWhatsAppMessage(phone, '✅ Your WhatsApp is now connected to NutriCoach! You will receive daily meal reminders.')
      }
      return res.status(200).json({ status: 'ok' })
    }

    const userId = waContact.user_id
    await db.from('whatsapp_contacts').update({ last_message_at: new Date().toISOString() }).eq('user_id', userId)

    const lowerText = text.trim().toLowerCase()

    if (lowerText === 'help' || lowerText === '?') {
      await sendWhatsAppMessage(phone,
        '🌿 *NutriCoach Commands*\n\n' +
        '• *water <ml>* — Log water (e.g. water 500)\n' +
        '• *status* — Today\'s calorie progress\n' +
        '• *stop* — Pause reminders\n' +
        '• *start* — Resume reminders'
      )
    } else if (lowerText === 'status') {
      const today = new Date().toISOString().split('T')[0]
      const [{ data: log }, { data: user }] = await Promise.all([
        db.from('daily_logs').select('total_calories, water_ml').eq('user_id', userId).eq('log_date', today).maybeSingle() as Promise<{ data: any | null; error: unknown }>,
        db.from('users').select('calorie_target').eq('id', userId).single() as Promise<{ data: any | null; error: unknown }>,
      ])

      const consumed = log?.total_calories || 0
      const target   = user?.calorie_target || 2000
      const water    = log?.water_ml || 0

      await sendWhatsAppMessage(phone,
        `📊 *Today's Progress*\n\n` +
        `🔥 Calories: ${consumed} / ${target} kcal (${Math.round((consumed / target) * 100)}%)\n` +
        `💧 Water: ${water}ml / 2500ml\n\n` +
        (consumed < target ? `You still have ${target - consumed} kcal to go!` : 'Great job hitting your target! 🎉')
      )
    } else if (lowerText.startsWith('water ')) {
      const ml = parseInt(lowerText.split(' ')[1])
      if (!isNaN(ml) && ml > 0) {
        const today = new Date().toISOString().split('T')[0]
        const { data: existing } = await (db.from('daily_logs').select('id, water_ml').eq('user_id', userId).eq('log_date', today).maybeSingle() as Promise<{ data: any | null; error: unknown }>)
        const newWater = (existing?.water_ml || 0) + ml

        if (existing) {
          await db.from('daily_logs').update({ water_ml: newWater }).eq('id', existing.id)
        } else {
          await db.from('daily_logs').insert({ user_id: userId, log_date: today, water_ml: newWater })
        }
        await sendWhatsAppMessage(phone, `💧 Logged ${ml}ml! Total today: ${newWater}ml`)
      }
    } else if (lowerText === 'stop') {
      await db.from('whatsapp_contacts').update({ opt_in: false }).eq('user_id', userId)
      await sendWhatsAppMessage(phone, '🔕 Reminders paused. Reply *start* to resume anytime.')
    } else if (lowerText === 'start') {
      await db.from('whatsapp_contacts').update({ opt_in: true }).eq('user_id', userId)
      await sendWhatsAppMessage(phone, '🔔 Reminders reactivated!')
    }

    return res.status(200).json({ status: 'ok' })
  } catch (err) {
    console.error('WhatsApp webhook error:', err)
    return res.status(200).json({ status: 'error' })
  }
}

async function sendWhatsAppMessage(to: string, text: string) {
  const url = `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    }),
  })
}
