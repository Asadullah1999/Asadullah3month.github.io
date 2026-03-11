/**
 * API route to send a WhatsApp message to a user
 * Used by n8n automation or server-side triggers
 *
 * POST /api/whatsapp/send
 * Body: { userId: string, message: string } or { phone: string, message: string }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, message, phone } = req.body

  if (!message) {
    return res.status(400).json({ error: 'message is required' })
  }

  let targetPhone: string | null = phone || null

  if (!targetPhone && userId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db: any = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data } = await db
      .from('whatsapp_contacts')
      .select('phone_number, is_verified, opt_in')
      .eq('user_id', userId)
      .single()

    if (!data || !data.is_verified || !data.opt_in) {
      return res.status(400).json({ error: 'User does not have verified WhatsApp or has opted out' })
    }
    targetPhone = data.phone_number
  }

  if (!targetPhone) {
    return res.status(400).json({ error: 'phone or userId is required' })
  }

  const cleanPhone = (targetPhone as string).replace('+', '')

  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { preview_url: false, body: message },
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'Failed to send message' })
    }

    return res.status(200).json({ success: true, messageId: data.messages?.[0]?.id })
  } catch {
    return res.status(500).json({ error: 'Failed to send WhatsApp message' })
  }
}
