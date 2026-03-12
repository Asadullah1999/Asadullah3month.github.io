import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { sounds } from '@/lib/sounds'
import {
  Menu, X, LayoutDashboard, User, MessageCircle, ClipboardList,
  TrendingUp, Bell, LogOut, ShieldCheck, Zap,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/checkin',   icon: ClipboardList,   label: 'Check-in' },
  { href: '/progress',  icon: TrendingUp,      label: 'Progress' },
  { href: '/whatsapp',  icon: MessageCircle,   label: 'WhatsApp' },
  { href: '/reminders', icon: Bell,            label: 'Reminders' },
  { href: '/profile',   icon: User,            label: 'Profile' },
]

export default function Header({ title, isAdmin }: { title?: string; isAdmin?: boolean }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    sounds.click()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  function toggleMenu() {
    sounds.click()
    setOpen(!open)
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0d0d0d]/90 backdrop-blur-md border-b border-[#1a1a1a] px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.4)]">
            <Zap size={13} className="text-white" fill="white" />
          </div>
          <span className="font-bold gradient-text">FahmiFit</span>
        </div>
        <button
          onClick={toggleMenu}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { sounds.click(); setOpen(false) }} />
          <nav className="relative flex flex-col w-64 h-full bg-[#0d0d0d] border-r border-[#1a1a1a] shadow-elevated animate-slide-down">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                  <Zap size={13} className="text-white" fill="white" />
                </div>
                <span className="font-bold gradient-text">FahmiFit</span>
              </div>
              <button onClick={() => { sounds.click(); setOpen(false) }} className="p-1 text-gray-500 hover:text-white transition-colors">
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
                    onClick={() => { sounds.nav(); setOpen(false) }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      active
                        ? 'text-brand-400 bg-brand-500/10 border border-brand-500/20'
                        : 'text-gray-500 hover:text-white hover:bg-white/[0.05]'
                    )}
                  >
                    <Icon size={17} className={active ? 'text-brand-400' : 'text-gray-600'} />
                    {label}
                  </Link>
                )
              })}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => { sounds.nav(); setOpen(false) }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-white hover:bg-white/[0.05] transition-all"
                >
                  <ShieldCheck size={17} className="text-gray-600" />
                  Admin Panel
                </Link>
              )}
            </div>
            <div className="p-3 border-t border-[#1a1a1a]">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogOut size={17} className="text-gray-600" />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop page title bar */}
      {title && (
        <div className="hidden lg:block ml-60">
          <div className="px-8 py-4 border-b border-[#1a1a1a] bg-[#0a0a0a]/80 backdrop-blur-md">
            <h1 className="text-lg font-bold text-white">{title}</h1>
          </div>
        </div>
      )}
    </>
  )
}
