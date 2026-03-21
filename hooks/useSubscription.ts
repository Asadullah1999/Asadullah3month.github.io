import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export type PlanTier = 'free' | 'pro' | 'premium'

export interface SubscriptionState {
  plan: PlanTier
  status: string
  loading: boolean
}

const PLAN_RANK: Record<PlanTier, number> = { free: 0, pro: 1, premium: 2 }

/** Returns true if the user's plan meets or exceeds the required plan */
export function planAtLeast(userPlan: PlanTier, required: PlanTier): boolean {
  return PLAN_RANK[userPlan] >= PLAN_RANK[required]
}

export function useSubscription(): SubscriptionState {
  const [state, setState] = useState<SubscriptionState>({
    plan: 'free',
    status: 'active',
    loading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (!cancelled) setState(s => ({ ...s, loading: false }))
        return
      }

      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', session.user.id)
        .single()

      if (!cancelled) {
        setState({
          plan: (data?.plan as PlanTier) || 'free',
          status: data?.status || 'active',
          loading: false,
        })
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return state
}
