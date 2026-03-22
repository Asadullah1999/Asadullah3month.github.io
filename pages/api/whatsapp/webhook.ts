/**
 * WhatsApp Cloud API Webhook (Meta)
 *
 * GET  — Verification challenge from Meta
 * POST — Incoming messages from users → delegates to shared processor
 *
 * Setup in Meta Developer Console:
 *  Callback URL: https://your-domain.com/api/whatsapp/webhook
 *  Verify Token: set WHATSAPP_VERIFY_TOKEN in .env.local
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { processIncomingMessage } from '@/lib/whatsapp/process-message'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // GET — Meta webhook verification
  if (req.method === 'GET') {
    const mode = req.query['hub.mode']
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

  // POST — Incoming message from Meta Cloud API
  try {
    const body = req.body
    const entry = body?.entry?.[0]
    const value = entry?.changes?.[0]?.value

    if (!value?.messages?.[0]) {
      return res.status(200).json({ status: 'no_message' })
    }

    const message = value.messages[0]
    const phone = message.from
    const text = message.text?.body || ''

    // Check for image
    const hasImage = message.type === 'image'
    const imageId = message.image?.id
    const imageMimeType = message.image?.mime_type

    await processIncomingMessage({
      phone,
      text,
      hasImage,
      imageUrl: imageId, // Meta uses media IDs, provider.downloadMedia handles the rest
      imageMimeType,
    })

    return res.status(200).json({ status: 'ok' })
  } catch (err) {
    console.error('WhatsApp webhook error:', err)
    return res.status(200).json({ status: 'error' })
  }
}
