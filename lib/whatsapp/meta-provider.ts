import type { WhatsAppProvider } from './provider'

export class MetaProvider implements WhatsAppProvider {
  private phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!
  private accessToken = process.env.WHATSAPP_ACCESS_TOKEN!

  async sendText(to: string, body: string) {
    const cleanTo = to.replace('+', '')
    try {
      const res = await fetch(
        `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanTo,
            type: 'text',
            text: { preview_url: false, body },
          }),
        }
      )

      const data = await res.json()
      if (!res.ok) return { success: false, error: data.error?.message || 'Meta send failed' }
      return { success: true, messageId: data.messages?.[0]?.id }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  async downloadMedia(mediaId: string): Promise<Buffer> {
    // Step 1: get media URL from Meta
    const urlRes = await fetch(`https://graph.facebook.com/v20.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    })
    const urlData = await urlRes.json()

    // Step 2: download the actual media
    const mediaRes = await fetch(urlData.url, {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    })
    return Buffer.from(await mediaRes.arrayBuffer())
  }
}
