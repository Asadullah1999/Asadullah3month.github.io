/**
 * POST /api/whatsapp/send-verification
 * Body: { userId: string, phone: string }
 *
 * Generates a 6-digit code, saves it to DB, and sends it directly
 * via the Meta WhatsApp Cloud API (no n8n required).
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, phone } = req.body

  if (!userId || !phone) {
    return res.status(400).json({ error: 'userId and phone are required' })
  }

  const cleanPhone = String(phone).replace(/\s/g, '')
  if (cleanPhone.length < 8) {
    return res.status(400).json({ error: 'Invalid phone number' })
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error: dbError } = await db.from('whatsapp_contacts').upsert({
    user_id: userId,
    phone_number: cleanPhone,
    is_verified: false,
    verification_code: code,
    opt_in: true,
  }, { onConflict: 'user_id' })

  if (dbError) {
    return res.status(500).json({ error: 'Failed to save verification code' })
  }

  // Send via Meta WhatsApp Cloud API
  const phoneForApi = cleanPhone.replace('+', '')
  try {
    const waRes = await fetch(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneForApi,
          type: 'text',
          text: {
            preview_url: false,
            body: `🌿 Your FahmiFit verification code is: *${code}*\n\nEnter this code in the app to connect your WhatsApp.`,
          },
        }),
      }
    )

    const waData = await waRes.json()

    if (!waRes.ok) {
      console.error('WhatsApp API error:', waData)
      return res.status(502).json({ error: waData.error?.message || 'Failed to send WhatsApp message' })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error('WhatsApp send error:', err)
    return res.status(500).json({ error: 'Failed to send WhatsApp message' })
  }
}
