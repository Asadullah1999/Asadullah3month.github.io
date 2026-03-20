/**
 * POST /api/stripe/portal
 * Body: { userId: string }
 *
 * Creates a Stripe Customer Portal session for managing subscriptions.
 * Requires the user to already have a stripe_customer_id in the subscriptions table.
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.body
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: sub } = await db
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!sub?.stripe_customer_id) {
    return res.status(400).json({ error: 'No active subscription found' })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (req.headers.host ? `https://${req.headers.host}` : null)
    || 'http://localhost:3000'

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${baseUrl}/pricing`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Stripe portal error:', err)
    return res.status(500).json({ error: 'Failed to create billing portal session' })
  }
}
