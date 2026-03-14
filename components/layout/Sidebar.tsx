import Link from 'next/link'
import { useRouter } from 'next/router'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { sounds } from '@/lib/sounds'
import {
  LayoutDashboard, User, MessageCircle, ClipboardList,
  TrendingUp, Settings, LogOut, Bell, ShieldCheck,
  Bot, ShoppingCart, Zap, Dumbbell, Scale, Moon, Crown,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/checkin',     icon: ClipboardList,   label: 'Meal Check-in' },
  { href: '/progress',    icon: TrendingUp,      label: 'Progress' },
  { href: '/whatsapp',    icon: MessageCircle,   label: 'WhatsApp' },
  { href: '/reminders',   icon: Bell,            label: 'Reminders' },
  { href: '/profile',     icon: User,            label: 'Profile' },
]

const HEALTH_NAV = [
  { href: '/workout',    icon: Dumbbell, label: 'Workout' },
  { href: '/weight-log', icon: Scale,    label: 'Weight Log' },
  { href: '/sleep',      icon: Moon,     label: 'Sleep' },
]

const AI_NAV = [
  { href: '/ai-chat',      icon: Bot,          label: 'AI Nutritionist' },
  { href: '/grocery-list', icon: ShoppingCart, label: 'Grocery List' },
]

interface SidebarProps {
  isAdmin?: boolean
  user?: { full_name?: string | null; email?: string; avatar_url?: string | null }
}

export default function Sidebar({ isAdmin, user }: SidebarProps) {
  const router = useRouter()

  async function handleSignOut() {
    sounds.click()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 z-30"
      style={{
        background: 'rgba(5,5,15,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(20px)',
      }}>

      {/* Subtle top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.4), rgba(6,182,212,0.3), transparent)' }} />

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center animate-pulse-glow"
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            boxShadow: '0 0 20px rgba(16,185,129,0.5), 0 0 40px rgba(16,185,129,0.2)',
          }}>
          <Zap className="text-white" size={17} fill="white" />
        </div>
        <span className="font-extrabold text-lg tracking-tight gradient-text">FahmiFit</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = router.pathname === href || router.pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => sounds.nav()}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active ? 'nav-link-active' : 'nav-link'
              )}
            >
              <Icon size={17} className={active ? 'text-brand-400' : 'text-gray-600'} />
              {label}
            </Link>
          )
        })}

        {/* Health Tracking */}
        <div className="pt-4 pb-2 px-3">
          <div className="glow-line mb-3" />
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Health</p>
        </div>
        {HEALTH_NAV.map(({ href, icon: Icon, label }) => {
          const active = router.pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => sounds.nav()}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active ? 'nav-link-active' : 'nav-link'
              )}
            >
              <Icon size={17} className={active ? 'text-brand-400' : 'text-gray-600'} />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{ background: '#10b981', boxShadow: '0 0 8px rgba(16,185,129,0.8)' }} />
              )}
            </Link>
          )
        })}

        {/* AI Features */}
        <div className="pt-4 pb-2 px-3">
          <div className="glow-line mb-3" />
          <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">AI Features</p>
        </div>
        {AI_NAV.map(({ href, icon: Icon, label }) => {
          const active = router.pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => sounds.nav()}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active ? 'nav-link-active' : 'nav-link'
              )}
            >
              <Icon size={17} className={active ? 'text-brand-400' : 'text-gray-600'} />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full"
                  style={{
                    background: '#10b981',
                    boxShadow: '0 0 8px rgba(16,185,129,0.8)',
                  }} />
              )}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <div className="glow-line mb-3" />
              <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Admin</p>
            </div>
            <Link
              href="/admin"
              onClick={() => sounds.nav()}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                router.pathname.startsWith('/admin')
                  ? 'text-violet-400 border border-violet-500/20'
                  : 'nav-link'
              )}
              style={router.pathname.startsWith('/admin') ? {
                background: 'rgba(139,92,246,0.1)',
              } : {}}
            >
              <ShieldCheck size={17} className={router.pathname.startsWith('/admin') ? 'text-violet-400' : 'text-gray-600'} />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 space-y-0.5"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <Link
          href="/pricing"
          onClick={() => sounds.click()}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            router.pathname === '/pricing'
              ? 'text-amber-400'
              : 'text-gray-500 hover:text-amber-400 hover:bg-amber-400/[0.06]'
          )}
        >
          <Crown size={17} className={router.pathname === '/pricing' ? 'text-amber-400' : 'text-gray-600'} />
          Upgrade
        </Link>
        <Link
          href="/settings"
          onClick={() => sounds.click()}
          className="nav-link"
        >
          <Settings size={17} className="text-gray-600" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 transition-all duration-200"
          style={{ background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={17} className="text-gray-600" />
          Sign out
        </button>

        {user && (
          <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)',
                boxShadow: '0 0 12px rgba(16,185,129,0.35)',
              }}>
              {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'F'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user.full_name || 'User'}</p>
              <p className="text-xs text-gray-600 truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
