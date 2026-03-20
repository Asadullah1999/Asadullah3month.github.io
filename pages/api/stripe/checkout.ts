/**
 * POST /api/stripe/checkout
 * Body: { plan: 'pro' | 'premium', userId: string, userEmail: string }
 *
 * Creates a Stripe Checkout Session and returns the URL.
 * Price IDs must be set in .env: STRIPE_PRO_PRICE_ID, STRIPE_PREMIUM_PRICE_ID
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const PRICE_IDS: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRO_PRICE_ID,
  premium: process.env.STRIPE_PREMIUM_PRICE_ID,
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { plan, userId, userEmail } = req.body

  if (!plan || !userId) {
    return res.status(400).json({ error: 'plan and userId are required' })
  }

  const priceId = PRICE_IDS[plan]
  if (!priceId) {
    return res.status(400).json({ error: `No price ID configured for plan: ${plan}` })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
    || (req.headers.host ? `https://${req.headers.host}` : null)
    || 'http://localhost:3000'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: userEmail || undefined,
      metadata: { userId, plan },
      success_url: `${baseUrl}/pricing?success=1&plan=${plan}`,
      cancel_url: `${baseUrl}/pricing?canceled=1`,
    })

    return res.status(200).json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return res.status(500).json({ error: 'Failed to create checkout session' })
  }
}
