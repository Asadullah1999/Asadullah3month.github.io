import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { sounds } from '@/lib/sounds'
import {
  Menu, X, LayoutDashboard, User, MessageCircle, ClipboardList,
  TrendingUp, Bell, LogOut, ShieldCheck, Zap, Bot, ShoppingCart,
  Dumbbell, Scale, Moon,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/checkin',      icon: ClipboardList,   label: 'Check-in' },
  { href: '/progress',     icon: TrendingUp,      label: 'Progress' },
  { href: '/whatsapp',     icon: MessageCircle,   label: 'WhatsApp' },
  { href: '/reminders',    icon: Bell,            label: 'Reminders' },
  { href: '/profile',      icon: User,            label: 'Profile' },
  { href: '/workout',      icon: Dumbbell,        label: 'Workout' },
  { href: '/weight-log',   icon: Scale,           label: 'Weight Log' },
  { href: '/sleep',        icon: Moon,            label: 'Sleep' },
  { href: '/ai-chat',      icon: Bot,             label: 'AI Nutritionist' },
  { href: '/grocery-list', icon: ShoppingCart,    label: 'Grocery List' },
]

// 5 key tabs for bottom nav
const BOTTOM_NAV = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { href: '/checkin',   icon: ClipboardList,   label: 'Log' },
  { href: '/progress',  icon: TrendingUp,      label: 'Progress' },
  { href: '/ai-chat',   icon: Bot,             label: 'AI' },
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
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 px-4 h-14 flex items-center justify-between"
        style={{
          background: 'rgba(5,5,15,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              boxShadow: '0 0 16px rgba(16,185,129,0.4)',
            }}>
            <Zap size={14} className="text-white" fill="white" />
          </div>
          <span className="font-extrabold gradient-text">FahmiFit</span>
        </div>
        <button
          onClick={toggleMenu}
          className="p-2 rounded-xl text-gray-400 hover:text-white transition-all"
          style={{ background: open ? 'rgba(255,255,255,0.08)' : 'transparent' }}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { sounds.click(); setOpen(false) }} />
          <nav className="relative flex flex-col w-64 h-full animate-slide-down"
            style={{
              background: 'rgba(5,5,15,0.98)',
              borderRight: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
            }}>
            <div className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 0 14px rgba(16,185,129,0.4)' }}>
                  <Zap size={14} className="text-white" fill="white" />
                </div>
                <span className="font-extrabold gradient-text">FahmiFit</span>
              </div>
              <button onClick={() => { sounds.click(); setOpen(false) }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <X size={16} />
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
                      active ? 'nav-link-active' : 'nav-link'
                    )}
                  >
                    <Icon size={16} className={active ? 'text-brand-400' : 'text-gray-600'} />
                    {label}
                  </Link>
                )
              })}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => { sounds.nav(); setOpen(false) }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium nav-link"
                >
                  <ShieldCheck size={16} className="text-gray-600" />
                  Admin Panel
                </Link>
              )}
            </div>
            <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 transition-all duration-200"
                style={{ background: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={16} className="text-gray-600" />
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Mobile bottom navigation bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
        style={{
          height: '62px',
          background: 'rgba(5,5,15,0.96)',
          backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}>
        {BOTTOM_NAV.map(({ href, icon: Icon, label }) => {
          const active = router.pathname === href || router.pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => sounds.nav()}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200"
              style={{
                minWidth: '54px',
                background: active ? 'rgba(16,185,129,0.1)' : 'transparent',
              }}
            >
              <div className="relative">
                <Icon
                  size={20}
                  className="transition-all duration-200"
                  style={{
                    color: active ? '#10b981' : '#4b5563',
                    filter: active ? 'drop-shadow(0 0 6px rgba(16,185,129,0.7))' : 'none',
                  }}
                />
                {active && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,1)' }} />
                )}
              </div>
              <span
                className="text-[10px] font-semibold tracking-wide transition-colors duration-200"
                style={{ color: active ? '#10b981' : '#4b5563' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Desktop page title bar */}
      {title && (
        <div className="hidden lg:block ml-60">
          <div className="px-8 py-4" style={{
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(5,5,15,0.8)',
            backdropFilter: 'blur(20px)',
          }}>
            <h1 className="text-base font-bold text-white">{title}</h1>
          </div>
        </div>
      )}
    </>
  )
}
