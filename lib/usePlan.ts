import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type PlanTier = 'free' | 'pro' | 'premium'

interface PlanState {
  plan: PlanTier
  loading: boolean
  isPro: boolean
  isPremium: boolean
}

export function usePlan(): PlanState {
  const [plan, setPlan] = useState<PlanTier>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setLoading(false); return }
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', session.user.id)
        .maybeSingle() as { data: { plan: string; status: string } | null; error: unknown }
      if (data && (data.status === 'active' || data.status === 'trialing')) {
        setPlan((data.plan as PlanTier) || 'free')
      }
      setLoading(false)
    }
    load()
  }, [])

  return { plan, loading, isPro: plan === 'pro' || plan === 'premium', isPremium: plan === 'premium' }
}
