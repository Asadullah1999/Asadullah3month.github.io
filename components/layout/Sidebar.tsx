import Link from 'next/link'
import { useRouter } from 'next/router'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { sounds } from '@/lib/sounds'
import {
  LayoutDashboard, User, MessageCircle, ClipboardList,
  TrendingUp, Settings, LogOut, Bell, ShieldCheck,
  Bot, ShoppingCart, Zap,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/checkin',     icon: ClipboardList,   label: 'Meal Check-in' },
  { href: '/progress',    icon: TrendingUp,      label: 'Progress' },
  { href: '/whatsapp',    icon: MessageCircle,   label: 'WhatsApp' },
  { href: '/reminders',   icon: Bell,            label: 'Reminders' },
  { href: '/profile',     icon: User,            label: 'Profile' },
]

const AI_NAV = [
  { href: '/ai-chat',       icon: Bot,          label: 'AI Nutritionist' },
  { href: '/grocery-list',  icon: ShoppingCart, label: 'Grocery List' },
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
    <aside className="hidden lg:flex flex-col w-60 h-screen bg-[#0d0d0d] border-r border-[#1a1a1a] fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[#1a1a1a]">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center shadow-[0_0_16px_rgba(6,182,212,0.4)] animate-pulse-glow">
          <Zap className="text-white" size={16} fill="white" />
        </div>
        <span className="font-bold text-lg tracking-tight gradient-text">FahmiFit</span>
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

        {/* AI Features */}
        <div className="pt-4 pb-1.5 px-3">
          <div className="glow-line mb-2" />
          <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">AI Features</p>
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
                active
                  ? 'text-brand-400 bg-brand-500/10 border border-brand-500/20'
                  : 'text-gray-500 hover:text-white hover:bg-white/[0.05]'
              )}
            >
              <Icon size={17} className={active ? 'text-brand-400' : 'text-gray-600'} />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-400 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
              )}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-1.5 px-3">
              <div className="glow-line mb-2" />
              <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">Admin</p>
            </div>
            <Link
              href="/admin"
              onClick={() => sounds.nav()}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                router.pathname.startsWith('/admin')
                  ? 'text-violet-400 bg-violet-500/10 border border-violet-500/20'
                  : 'text-gray-500 hover:text-white hover:bg-white/[0.05]'
              )}
            >
              <ShieldCheck size={17} className={router.pathname.startsWith('/admin') ? 'text-violet-400' : 'text-gray-600'} />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#1a1a1a] space-y-0.5">
        <Link
          href="/settings"
          onClick={() => sounds.click()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-white hover:bg-white/[0.05] transition-all duration-200"
        >
          <Settings size={17} className="text-gray-600" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          <LogOut size={17} className="text-gray-600" />
          Sign out
        </button>
        {user && (
          <div className="flex items-center gap-3 px-3 py-3 mt-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
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
