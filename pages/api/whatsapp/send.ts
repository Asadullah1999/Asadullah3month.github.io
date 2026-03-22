/**
 * API route to send a WhatsApp message to a user
 * Used by n8n automation or server-side triggers
 *
 * POST /api/whatsapp/send
 * Body: { userId: string, message: string } or { phone: string, message: string }
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { getProvider } from '@/lib/whatsapp/provider'

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
    const db = createClient(
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
    const provider = getProvider()
    const result = await provider.sendText(cleanPhone, message)

    if (!result.success) {
      return res.status(400).json({ error: result.error || 'Failed to send message' })
    }

    return res.status(200).json({ success: true, messageId: result.messageId })
  } catch {
    return res.status(500).json({ error: 'Failed to send WhatsApp message' })
  }
}
