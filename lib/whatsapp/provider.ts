/**
 * WhatsApp Provider Abstraction
 * Swap between Meta Cloud API and Twilio by changing WHATSAPP_PROVIDER env var
 */

export interface WhatsAppProvider {
  sendText(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }>
  downloadMedia(mediaIdOrUrl: string): Promise<Buffer>
}

export function getProvider(): WhatsAppProvider {
  const provider = process.env.WHATSAPP_PROVIDER || 'meta'

  if (provider === 'twilio') {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TwilioProvider } = require('./twilio-provider')
    return new TwilioProvider()
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MetaProvider } = require('./meta-provider')
  return new MetaProvider()
}
