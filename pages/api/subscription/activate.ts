import type { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabase } from '@/lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createServerSupabase()

  // Verify auth
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const token = authHeader.slice(7)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { code, plan } = req.body as { code: string; plan: string }

  if (!code || !plan) return res.status(400).json({ error: 'Missing code or plan' })
  if (!['pro', 'premium'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' })

  // Validate secret code
  const proCode = process.env.PRO_SECRET_CODE
  const premiumCode = process.env.PREMIUM_SECRET_CODE

  let valid = false
  if (plan === 'pro' && proCode && code.trim() === proCode.trim()) valid = true
  if (plan === 'premium' && premiumCode && code.trim() === premiumCode.trim()) valid = true

  if (!valid) return res.status(400).json({ error: 'Invalid activation code' })

  // Update subscription
  const { error: updateError } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: user.id,
      plan,
      status: 'active',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (updateError) return res.status(500).json({ error: 'Failed to update subscription' })

  return res.status(200).json({ success: true, plan })
}
