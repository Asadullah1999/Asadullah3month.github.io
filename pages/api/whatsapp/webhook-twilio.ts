/**
 * Twilio WhatsApp Webhook
 *
 * Twilio sends form-encoded POST requests (not JSON like Meta).
 * This handler normalizes the Twilio format and delegates to the shared processor.
 *
 * Set this as your Twilio Sandbox webhook URL:
 *   https://your-domain.com/api/whatsapp/webhook-twilio
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { processIncomingMessage } from '@/lib/whatsapp/process-message'

export const config = {
  api: { bodyParser: true },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('<Response></Response>')
  }

  try {
    const body = req.body

    // Twilio sends form-encoded: From, Body, NumMedia, MediaUrl0, MediaContentType0
    const from = (body.From || '').replace('whatsapp:', '')
    const text = body.Body || ''
    const numMedia = parseInt(body.NumMedia || '0')

    const hasImage = numMedia > 0
    const imageUrl = hasImage ? body.MediaUrl0 : undefined
    const imageMimeType = hasImage ? body.MediaContentType0 : undefined

    await processIncomingMessage({
      phone: from,
      text,
      hasImage,
      imageUrl,
      imageMimeType,
    })

    // Twilio expects TwiML response — empty response means no auto-reply from Twilio
    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send('<Response></Response>')
  } catch (err) {
    console.error('Twilio webhook error:', err)
    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send('<Response></Response>')
  }
}
