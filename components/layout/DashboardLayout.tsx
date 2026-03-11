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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center animate-pulse">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  const isAdmin = user?.role === 'admin' || user?.role === 'nutritionist'

  return (
    <>
      <Head>
        <title>{pageTitle ? `${pageTitle} · NutriCoach` : 'NutriCoach'}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-gray-50">
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
