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
        // Exchange the auth code for a session (handles OAuth & email confirmation)
        const { data: { session }, error: authError } = await supabase.auth.getSession()

        if (authError) {
          setError(authError.message)
          toast.error(authError.message)
          setTimeout(() => router.push('/auth/login'), 3000)
          return
        }

        if (!session) {
          // Try to get session from URL hash (Supabase PKCE flow)
          const hashParams = new URLSearchParams(window.location.hash.substring(1))
          const accessToken = hashParams.get('access_token')
          if (!accessToken) {
            setError('No session found. Please try signing in again.')
            setTimeout(() => router.push('/auth/login'), 3000)
            return
          }
        }

        // Session exists — check if user is onboarded
        const currentSession = session || (await supabase.auth.getSession()).data.session
        if (!currentSession) {
          router.push('/auth/login')
          return
        }

        const { data: user } = await supabase
          .from('users')
          .select('onboarded')
          .eq('id', currentSession.user.id)
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
