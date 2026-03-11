import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  Menu, X, LayoutDashboard, User, MessageCircle, ClipboardList,
  TrendingUp, Bell, LogOut, Leaf, ShieldCheck,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/checkin',   icon: ClipboardList,    label: 'Check-in' },
  { href: '/progress',  icon: TrendingUp,       label: 'Progress' },
  { href: '/whatsapp',  icon: MessageCircle,    label: 'WhatsApp' },
  { href: '/reminders', icon: Bell,             label: 'Reminders' },
  { href: '/profile',   icon: User,             label: 'Profile' },
]

export default function Header({
  title,
  isAdmin,
}: {
  title?: string
  isAdmin?: boolean
}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
            <Leaf size={14} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900">NutriCoach</span>
        </div>
        <button onClick={() => setOpen(!open)} className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <nav className="relative flex flex-col w-64 h-full bg-white shadow-elevated animate-slide-up">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-green-600 flex items-center justify-center">
                  <Leaf size={14} className="text-white" />
                </div>
                <span className="font-semibold text-gray-900">NutriCoach</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {NAV.map(({ href, icon: Icon, label }) => {
                const active = router.pathname === href
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                      active ? 'text-green-700 bg-green-50' : 'text-gray-600 hover:bg-gray-50'
                    )}
                  >
                    <Icon size={18} className={active ? 'text-green-600' : 'text-gray-400'} />
                    {label}
                  </Link>
                )
              })}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  <ShieldCheck size={18} className="text-gray-400" />
                  Admin Panel
                </Link>
              )}
            </div>
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut size={18} className="text-gray-400" />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop page title bar */}
      {title && (
        <div className="hidden lg:block ml-60">
          <div className="px-8 py-5 border-b border-gray-100 bg-white">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
          </div>
        </div>
      )}
    </>
  )
}
