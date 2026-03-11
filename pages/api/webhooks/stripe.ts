/**
 * Stripe webhook handler
 *
 * Add this endpoint in your Stripe dashboard:
 * https://your-domain.com/api/webhooks/stripe
 *
 * Events handled:
 *  - checkout.session.completed
 *  - customer.subscription.updated
 *  - customer.subscription.deleted
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: { bodyParser: false },
}

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// Use untyped client for API routes to avoid Database type inference issues
function getAdminClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) as any
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
  const sig = req.headers['stripe-signature'] as string
  const rawBody = await getRawBody(req)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err)
    return res.status(400).json({ error: 'Invalid signature' })
  }

  const db = getAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan || 'pro'

        if (userId && session.subscription) {
          await db.from('subscriptions').upsert({
            user_id: userId,
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan,
            status: 'active',
          }, { onConflict: 'user_id' })
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await db.from('subscriptions').update({
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end:   new Date(sub.current_period_end   * 1000).toISOString(),
        }).eq('stripe_subscription_id', sub.id)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await db.from('subscriptions').update({ status: 'canceled', plan: 'free' })
          .eq('stripe_subscription_id', sub.id)
        break
      }

      default:
        console.log(`Unhandled Stripe event: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('Stripe webhook processing error:', err)
    return res.status(500).json({ error: 'Webhook processing failed' })
  }
}
