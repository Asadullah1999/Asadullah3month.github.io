import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Sidebar from './Sidebar'
import Header from './Header'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/database.types'

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
  pageTitle?: string
}

export default function DashboardLayout({ children, title, pageTitle }: DashboardLayoutProps) {
  const router = useRouter()
  const [user, setUser] = useState<Partial<User> | null>(null)
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
      <div className="min-h-screen" style={{ background: '#05050f' }}>
        <Sidebar isAdmin={isAdmin} user={user || undefined} />
        <Header title={title} isAdmin={isAdmin} />
        <main className="lg:ml-60 pt-14 lg:pt-0">
          <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 lg:py-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}
