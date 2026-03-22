import type { WhatsAppProvider } from './provider'

export class TwilioProvider implements WhatsAppProvider {
  private accountSid = process.env.TWILIO_ACCOUNT_SID!
  private authToken = process.env.TWILIO_AUTH_TOKEN!
  private fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'

  async sendText(to: string, body: string) {
    const cleanTo = to.startsWith('+') ? to : `+${to}`
    const authHeader = 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')

    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: `whatsapp:${cleanTo}`,
            From: this.fromNumber,
            Body: body,
          }),
        }
      )

      const data = await res.json()
      if (!res.ok) return { success: false, error: data.message || 'Twilio send failed' }
      return { success: true, messageId: data.sid }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  }

  async downloadMedia(mediaUrl: string): Promise<Buffer> {
    const authHeader = 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')
    const res = await fetch(mediaUrl, { headers: { Authorization: authHeader } })
    return Buffer.from(await res.arrayBuffer())
  }
}
