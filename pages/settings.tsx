import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import PageHero from '@/components/ui/PageHero'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Link from 'next/link'
import { ShieldCheck, CreditCard, Bell, User, MessageCircle, ChevronRight } from 'lucide-react'

const SETTINGS_SECTIONS = [
  {
    icon: <User size={18} />,
    title: 'Profile & Goals',
    desc: 'Update your body stats, goals, and diet preference',
    href: '/profile',
    iconBg: 'rgba(139,92,246,0.15)',
    iconBorder: 'rgba(139,92,246,0.25)',
    iconColor: '#a78bfa',
    accentColor: 'rgba(139,92,246,0.08)',
  },
  {
    icon: <Bell size={18} />,
    title: 'Reminders',
    desc: 'Configure meal, water, and weigh-in reminders',
    href: '/reminders',
    iconBg: 'rgba(245,158,11,0.15)',
    iconBorder: 'rgba(245,158,11,0.25)',
    iconColor: '#fbbf24',
    accentColor: 'rgba(245,158,11,0.06)',
  },
  {
    icon: <MessageCircle size={18} />,
    title: 'WhatsApp Integration',
    desc: 'Connect your WhatsApp number for reminders',
    href: '/whatsapp',
    iconBg: 'rgba(37,211,102,0.15)',
    iconBorder: 'rgba(37,211,102,0.25)',
    iconColor: '#34d399',
    accentColor: 'rgba(37,211,102,0.06)',
  },
  {
    icon: <CreditCard size={18} />,
    title: 'Subscription',
    desc: 'Manage your plan and billing',
    href: '/subscription',
    iconBg: 'rgba(59,130,246,0.15)',
    iconBorder: 'rgba(59,130,246,0.25)',
    iconColor: '#60a5fa',
    accentColor: 'rgba(59,130,246,0.06)',
  },
]

const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }
const cardAnim: Variants = { hidden: { opacity: 0, y: 20, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } } }

export default function SettingsPage() {
  return (
    <DashboardLayout pageTitle="Settings" title="Settings">
      <PageHero
        badge="Preferences"
        badgeColor="#6b7280"
        title="Account Settings"
        highlight="Settings"
        subtitle="Manage your account, notifications, and app preferences"
        orbColors={['rgba(107,114,128,0.25)', 'rgba(255,255,255,0.05)']}
      />
      <motion.div className="max-w-xl mx-auto space-y-3" initial="hidden" animate="visible" variants={stagger}>
        {SETTINGS_SECTIONS.map(s => (
          <motion.div key={s.href} variants={cardAnim}>
          <Link href={s.href} className="block group">
            <div
              className="flex items-center gap-4 p-5 rounded-2xl transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = s.accentColor
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.12)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'
                ;(e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.08)'
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: s.iconBg, border: `1px solid ${s.iconBorder}`, color: s.iconColor }}
              >
                {s.icon}
              </div>
              <div className="flex-1">
                <p className="font-bold text-white text-sm">{s.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
              </div>
              <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
            </div>
          </Link>
          </motion.div>
        ))}

        {/* Privacy section */}
        <motion.div variants={cardAnim}
          className="p-5 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <ShieldCheck size={15} className="text-gray-400" />
            </div>
            <p className="font-bold text-white text-sm">Privacy & Data</p>
          </div>
          <p className="text-sm text-gray-500 mb-4">Your data is stored securely in Supabase and never shared without consent.</p>
          <div className="flex gap-3">
            <Button variant="secondary" size="sm">Export my data</Button>
            <Button variant="danger" size="sm">Delete account</Button>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  )
}
