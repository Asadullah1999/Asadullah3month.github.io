import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { Zap, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    async function handleCallback() {
      try {
        let session = null

        // Check for PKCE auth code in query params (Supabase v2 default flow)
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')

        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            setError(exchangeError.message)
            toast.error(exchangeError.message)
            setTimeout(() => router.push('/auth/login'), 3000)
            return
          }
          session = data.session
        } else {
          // Fall back to implicit flow (hash tokens) or existing session
          const { data: { session: existingSession }, error: authError } = await supabase.auth.getSession()
          if (authError) {
            setError(authError.message)
            toast.error(authError.message)
            setTimeout(() => router.push('/auth/login'), 3000)
            return
          }
          session = existingSession
        }

        if (!session) {
          setError('No session found. Please try signing in again.')
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }

        const { data: user } = await supabase
          .from('users')
          .select('onboarded')
          .eq('id', session.user.id)
          .single() as { data: { onboarded: boolean } | null; error: unknown }

        if (user && !user.onboarded) {
          toast.success('Welcome! Let\'s set up your profile.')
          router.push('/onboarding')
        } else {
          toast.success('Welcome back!')
          router.push('/dashboard')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('Something went wrong. Redirecting to login...')
        setTimeout(() => router.push('/auth/login'), 3000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#05050f' }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            boxShadow: '0 0 40px rgba(16,185,129,0.4)',
          }}>
          <Zap size={28} className="text-white" fill="white" />
        </div>
        {error ? (
          <>
            <p className="text-red-400 text-lg font-semibold mb-2">{error}</p>
            <p className="text-gray-500 text-sm">Redirecting to login...</p>
          </>
        ) : (
          <>
            <Loader2 size={24} className="text-brand-400 animate-spin mx-auto mb-4" />
            <p className="text-white text-lg font-semibold mb-1">Signing you in...</p>
            <p className="text-gray-500 text-sm">Please wait while we verify your account.</p>
          </>
        )}
      </div>
    </div>
  )
}
