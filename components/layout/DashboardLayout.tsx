import { Component, ReactNode, useEffect, useState } from 'react'
import type { ErrorInfo } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Sidebar from './Sidebar'
import Header from './Header'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/database.types'

// Error Boundary
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard error:', error, errorInfo)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="text-center p-8 rounded-2xl max-w-md" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.25)' }}>
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Something went wrong</h3>
            <p className="text-sm text-gray-500 mb-4">{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)' }}>
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  pageTitle?: string
}

export default function DashboardLayout({ children, title, pageTitle }: DashboardLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<Partial<User> | null>(null)
  const [plan, setPlan] = useState<string>('free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login')
        return
      }

      const { data } = await supabase
        .from('users')
        .select('id, full_name, email, avatar_url, role, onboarded')
        .eq('id', session.user.id)
        .single() as { data: Partial<User> | null; error: unknown }

      if (data) {
        if (!data.onboarded) {
          router.push('/onboarding')
          return
        }
        setUser(data)
      }

      // Load plan
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', session.user.id)
        .maybeSingle() as { data: { plan: string; status: string } | null; error: unknown }
      if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
        setPlan(sub.plan || 'free')
      }

      setLoading(false)
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#05050f' }}>
        <div className="flex flex-col items-center gap-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center animate-pulse-glow"
            style={{
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              boxShadow: '0 0 40px rgba(16,185,129,0.5), 0 0 80px rgba(16,185,129,0.2)',
            }}>
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="text-base font-bold gradient-text mb-1">FahmiFit</p>
            <p className="text-xs text-gray-600 tracking-widest uppercase font-semibold">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'nutritionist'

  return (
    <>
      <Head>
        <title>{pageTitle ? `${pageTitle} · FahmiFit` : 'FahmiFit'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen relative" style={{ background: '#05050f' }}>
        {/* Global ambient background */}
        <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
          {/* Top-right green orb */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, #10b981, transparent)', filter: 'blur(80px)', transform: 'translate(30%, -30%)' }} />
          {/* Bottom-left violet orb */}
          <div className="absolute bottom-0 left-60 w-[400px] h-[400px] rounded-full opacity-[0.04]"
            style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)', filter: 'blur(80px)', transform: 'translateY(30%)' }} />
          {/* Subtle grid */}
          <div className="absolute inset-0 opacity-[0.018]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }} />
        </div>

        <Sidebar isAdmin={isAdmin} user={user || undefined} plan={plan} />
        <Header title={title} isAdmin={isAdmin} />
        <main className="lg:ml-60 pt-14 lg:pt-0 pb-20 lg:pb-0 relative z-10">
          <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 lg:py-8 animate-fade-in">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </>
  )
}
