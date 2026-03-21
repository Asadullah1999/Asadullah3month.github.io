import { GetServerSidePropsContext } from 'next'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Zap, Loader2 } from 'lucide-react'

// Server-side: exchange the PKCE code using cookies from the request
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { query, req, res } = context
  const code = query.code as string | undefined
  const error = query.error as string | undefined
  const errorDescription = query.error_description as string | undefined

  if (error) {
    return {
      redirect: {
        destination: `/auth/login?error=${encodeURIComponent(errorDescription || error)}`,
        permanent: false,
      },
    }
  }

  if (code) {
    const setCookieHeaders: string[] = []

    const serverSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () =>
            Object.entries(req.cookies || {}).map(([name, value]) => ({
              name,
              value: value || '',
            })),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              const parts = [`${name}=${value}`, 'Path=/']
              if (options?.maxAge != null) parts.push(`Max-Age=${options.maxAge}`)
              if (options?.httpOnly) parts.push('HttpOnly')
              if (options?.secure || process.env.NODE_ENV === 'production') parts.push('Secure')
              parts.push(`SameSite=${options?.sameSite ?? 'Lax'}`)
              setCookieHeaders.push(parts.join('; '))
            })
          },
        },
      }
    )

    const { error: exchangeError } = await serverSupabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      if (setCookieHeaders.length > 0) {
        res.setHeader('Set-Cookie', setCookieHeaders)
      }

      // Check if user needs onboarding
      try {
        const { data: { session } } = await serverSupabase.auth.getSession()
        if (session?.user?.id) {
          const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          )
          const { data: user } = await adminClient
            .from('users')
            .select('onboarded')
            .eq('id', session.user.id)
            .single()

          if (user && !user.onboarded) {
            return { redirect: { destination: '/onboarding', permanent: false } }
          }
        }
      } catch {
        // ignore — fall through to dashboard
      }

      return { redirect: { destination: '/dashboard', permanent: false } }
    }

    // Exchange failed — redirect to login with error
    return {
      redirect: {
        destination: '/auth/login?error=Authentication+failed.+Please+try+again.',
        permanent: false,
      },
    }
  }

  // No code param — let client-side handle hash-based implicit flow tokens
  return { props: {} }
}

// Client-side fallback (handles edge cases / hash-based tokens)
export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Signing you in...')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/dashboard')
      } else {
        setStatus('No session found. Redirecting...')
        setTimeout(() => router.push('/auth/login'), 2000)
      }
    })
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#05050f' }}>
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: 'linear-gradient(135deg, #10b981, #06b6d4)',
            boxShadow: '0 0 40px rgba(16,185,129,0.4)',
          }}
        >
          <Zap size={28} className="text-white" fill="white" />
        </div>
        <Loader2 size={24} className="text-brand-400 animate-spin mx-auto mb-4" />
        <p className="text-white text-lg font-semibold mb-1">{status}</p>
        <p className="text-gray-500 text-sm">Please wait while we verify your account.</p>
      </div>
    </div>
  )
}
