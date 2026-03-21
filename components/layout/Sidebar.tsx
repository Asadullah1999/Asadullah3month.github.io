import Link from 'next/link'
import { useRouter } from 'next/router'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { sounds } from '@/lib/sounds'
import {
  LayoutDashboard, User, MessageCircle, ClipboardList,
  TrendingUp, Settings, LogOut, Bell, ShieldCheck,
  Bot, ShoppingCart, Zap, Dumbbell, Scale, Moon, Crown, MessagesSquare,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard',    color: '#10b981' },
  { href: '/checkin',     icon: ClipboardList,   label: 'Meal Check-in', color: '#f59e0b' },
  { href: '/progress',    icon: TrendingUp,      label: 'Progress',      color: '#06b6d4' },
  { href: '/whatsapp',    icon: MessageCircle,   label: 'WhatsApp',      color: '#25D366' },
  { href: '/reminders',   icon: Bell,            label: 'Reminders',     color: '#f97316' },
  { href: '/profile',     icon: User,            label: 'Profile',       color: '#8b5cf6' },
]

const HEALTH_NAV = [
  { href: '/workout',    icon: Dumbbell, label: 'Workout',    color: '#ef4444' },
  { href: '/weight-log', icon: Scale,    label: 'Weight Log', color: '#06b6d4' },
  { href: '/sleep',      icon: Moon,     label: 'Sleep',      color: '#6366f1' },
]

const AI_NAV = [
  { href: '/ai-chat',      icon: Bot,          label: 'AI Nutritionist', color: '#10b981' },
  { href: '/grocery-list', icon: ShoppingCart, label: 'Grocery List',    color: '#f59e0b' },
]

interface SidebarProps {
  isAdmin?: boolean
  user?: { full_name?: string | null; email?: string; avatar_url?: string | null }
  plan?: string
}

export default function Sidebar({ isAdmin, user, plan = 'free' }: SidebarProps) {
  const router = useRouter()

  async function handleSignOut() {
    sounds.click()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const planColor = plan === 'premium' ? '#ec4899' : plan === 'pro' ? '#10b981' : '#6b7280'
  const planLabel = plan === 'premium' ? 'Premium' : plan === 'pro' ? 'Pro' : 'Free'

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 z-30"
      style={{
        background: 'rgba(5,5,15,0.97)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(24px)',
      }}>

      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.6), rgba(6,182,212,0.5), rgba(139,92,246,0.3), transparent)' }} />

      {/* Ambient glow top-left */}
      <div className="absolute top-0 left-0 w-40 h-40 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 20% 10%, rgba(16,185,129,0.08) 0%, transparent 70%)' }} />

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 relative"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="relative">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              boxShadow: '0 0 20px rgba(16,185,129,0.6), 0 0 40px rgba(16,185,129,0.2)',
            }}>
            <Zap className="text-white" size={17} fill="white" />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{ background: '#10b981', borderColor: '#05050f', boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
        </div>
        <div>
          <span className="font-extrabold text-lg tracking-tight gradient-text">FahmiFit</span>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: planColor, boxShadow: `0 0 4px ${planColor}` }} />
            <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: planColor }}>{planLabel} Plan</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label, color }) => {
          const active = router.pathname === href || (href !== '/dashboard' && router.pathname.startsWith(href + '/'))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => sounds.nav()}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active ? '' : 'text-gray-500 hover:text-white'
              )}
              style={active ? {
                background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                border: `1px solid ${color}30`,
                color: color,
                boxShadow: `0 0 20px ${color}10`,
              } : {}}
            >
              <Icon size={17} style={{ color: active ? color : undefined }} className={!active ? 'text-gray-600 group-hover:text-gray-400 transition-colors' : ''} />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              )}
            </Link>
          )
        })}

        {/* Health Tracking */}
        <div className="pt-4 pb-2 px-3">
          <div className="h-px mb-3" style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0.4), rgba(6,182,212,0.3), transparent)' }} />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.8)' }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#ef444480' }}>Health</p>
          </div>
        </div>
        {HEALTH_NAV.map(({ href, icon: Icon, label, color }) => {
          const active = router.pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => sounds.nav()}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active ? '' : 'text-gray-500 hover:text-white'
              )}
              style={active ? {
                background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                border: `1px solid ${color}30`,
                color: color,
                boxShadow: `0 0 20px ${color}10`,
              } : {}}
            >
              <Icon size={17} style={{ color: active ? color : undefined }} className={!active ? 'text-gray-600 group-hover:text-gray-400 transition-colors' : ''} />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              )}
            </Link>
          )
        })}

        {/* AI Features */}
        <div className="pt-4 pb-2 px-3">
          <div className="h-px mb-3" style={{ background: 'linear-gradient(90deg, rgba(16,185,129,0.5), rgba(139,92,246,0.3), transparent)' }} />
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#10b98160' }}>AI Features</p>
          </div>
        </div>
        {AI_NAV.map(({ href, icon: Icon, label, color }) => {
          const active = router.pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={() => sounds.nav()}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                active ? '' : 'text-gray-500 hover:text-white'
              )}
              style={active ? {
                background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                border: `1px solid ${color}30`,
                color: color,
              } : {}}
            >
              <Icon size={17} style={{ color: active ? color : undefined }} className={!active ? 'text-gray-600 group-hover:text-gray-400 transition-colors' : ''} />
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
              )}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="pt-4 pb-2 px-3">
              <div className="h-px mb-3" style={{ background: 'linear-gradient(90deg, rgba(139,92,246,0.5), rgba(236,72,153,0.3), transparent)' }} />
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#8b5cf6', boxShadow: '0 0 6px rgba(139,92,246,0.8)' }} />
                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8b5cf660' }}>Admin</p>
              </div>
            </div>
            {[
              { href: '/admin', icon: ShieldCheck, label: 'Admin Panel' },
              { href: '/admin/conversations', icon: MessagesSquare, label: 'Conversations' },
            ].map(({ href, icon: Icon, label }) => {
              const active = router.pathname === href
              return (
                <Link key={href} href={href} onClick={() => sounds.nav()}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    active ? '' : 'text-gray-500 hover:text-white'
                  )}
                  style={active ? { background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa' } : {}}
                >
                  <Icon size={17} style={{ color: active ? '#a78bfa' : undefined }} className={!active ? 'text-gray-600' : ''} />
                  {label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 space-y-0.5 relative"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Ambient glow bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.06) 0%, transparent 70%)' }} />

        {plan === 'free' && (
          <Link
            href="/pricing"
            onClick={() => sounds.click()}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold mb-1 transition-all duration-200 hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(236,72,153,0.08))',
              border: '1px solid rgba(245,158,11,0.3)',
              color: '#fbbf24',
              boxShadow: '0 0 20px rgba(245,158,11,0.08)',
            }}
          >
            <Crown size={14} style={{ color: '#fbbf24' }} />
            Upgrade to Pro
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md font-bold"
              style={{ background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>↑</span>
          </Link>
        )}
        {plan !== 'free' && (
          <Link
            href="/pricing"
            onClick={() => sounds.click()}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              router.pathname === '/pricing' ? '' : 'text-gray-500 hover:text-amber-400'
            )}
            style={router.pathname === '/pricing' ? { color: '#fbbf24' } : {}}
          >
            <Crown size={17} style={{ color: router.pathname === '/pricing' ? '#fbbf24' : undefined }} className={router.pathname !== '/pricing' ? 'text-gray-600' : ''} />
            My Plan
          </Link>
        )}
        <Link href="/settings" onClick={() => sounds.click()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-white transition-all duration-200">
          <Settings size={17} className="text-gray-600" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 transition-all duration-200"
          style={{ background: 'transparent' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.07)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={17} className="text-gray-600" />
          Sign out
        </button>

        {user && (
          <div className="flex items-center gap-3 px-3 py-3 mt-2 rounded-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(139,92,246,0.04))',
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #8b5cf6 100%)',
                  boxShadow: '0 0 12px rgba(16,185,129,0.4)',
                }}>
                {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'F'}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border"
                style={{ background: '#10b981', borderColor: '#05050f', boxShadow: '0 0 4px rgba(16,185,129,0.8)' }} />
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
