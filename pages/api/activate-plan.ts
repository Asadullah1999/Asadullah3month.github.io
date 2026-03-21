import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const PRO_CODE = process.env.PLAN_CODE_PRO || 'FAHMIFIT-PRO-2025'
const PREMIUM_CODE = process.env.PLAN_CODE_PREMIUM || 'FAHMIFIT-PREM-2025'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { code, userId } = req.body
  if (!code || !userId) return res.status(400).json({ error: 'Missing code or userId' })

  const trimmedCode = code.trim().toUpperCase()

  let plan: 'pro' | 'premium' | null = null
  if (trimmedCode === PRO_CODE.toUpperCase()) plan = 'pro'
  else if (trimmedCode === PREMIUM_CODE.toUpperCase()) plan = 'premium'

  if (!plan) {
    return res.status(400).json({ error: 'Invalid activation code. Please contact the owner for the correct code.' })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan,
      status: 'active',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_start: now.toISOString(),
      current_period_end: expires.toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json({ plan, message: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan activated!` })
}
