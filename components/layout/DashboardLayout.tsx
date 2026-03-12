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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-[0_0_24px_rgba(6,182,212,0.4)] animate-pulse-glow">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600 tracking-wider uppercase text-[11px] font-semibold">Loading FahmiFit...</p>
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
      <div className="min-h-screen bg-[#0a0a0a]">
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
