import Link from 'next/link'
import { useRouter } from 'next/router'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, User, MessageCircle, ClipboardList,
  TrendingUp, Settings, LogOut, Leaf, Bell, ShieldCheck,
  Camera, Bot, ShoppingCart, Scan,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/checkin',         icon: ClipboardList,   label: 'Meal Check-in' },
  { href: '/progress',        icon: TrendingUp,      label: 'Progress' },
  { href: '/whatsapp',        icon: MessageCircle,   label: 'WhatsApp' },
  { href: '/reminders',       icon: Bell,            label: 'Reminders' },
  { href: '/profile',         icon: User,            label: 'Profile' },
]

const AI_NAV = [
  { href: '/meal-scanner',    icon: Camera,          label: 'AI Meal Scanner' },
  { href: '/ai-chat',         icon: Bot,             label: 'AI Nutritionist' },
  { href: '/grocery-list',    icon: ShoppingCart,    label: 'Grocery List' },
  { href: '/barcode-scanner', icon: Scan,            label: 'Barcode Scanner' },
]

interface SidebarProps {
  isAdmin?: boolean
  user?: { full_name?: string | null; email?: string; avatar_url?: string | null }
}

export default function Sidebar({ isAdmin, user }: SidebarProps) {
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen bg-white border-r border-gray-100 fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-gray-100">
        <div className="w-8 h-8 rounded-xl bg-green-600 flex items-center justify-center">
          <Leaf className="w-4.5 h-4.5 text-white" size={18} />
        </div>
        <span className="font-semibold text-gray-900 text-lg tracking-tight">NutriCoach</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = router.pathname === href || router.pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
                active
                  ? 'text-green-700 bg-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon size={18} className={active ? 'text-green-600' : 'text-gray-400'} />
              {label}
            </Link>
          )
        })}

        {/* AI Features section */}
        <div className="pt-3 pb-1 px-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">AI Features</p>
        </div>
        {AI_NAV.map(({ href, icon: Icon, label }) => {
          const active = router.pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-150',
                active
                  ? 'text-green-700 bg-green-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <Icon size={18} className={active ? 'text-green-600' : 'text-gray-400'} />
              {label}
            </Link>
          )
        })}

        {isAdmin && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Admin</p>
            </div>
            <Link
              href="/admin"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                router.pathname.startsWith('/admin')
                  ? 'text-purple-700 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              <ShieldCheck size={18} className={router.pathname.startsWith('/admin') ? 'text-purple-600' : 'text-gray-400'} />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        >
          <Settings size={18} className="text-gray-400" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} className="text-gray-400" />
          Sign out
        </button>
        {user && (
          <div className="flex items-center gap-3 px-3 py-3 mt-1">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-700 flex-shrink-0">
              {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.full_name || 'User'}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
