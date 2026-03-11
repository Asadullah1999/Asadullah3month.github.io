import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import { ShieldCheck, CreditCard, Bell, User, MessageCircle, ChevronRight } from 'lucide-react'

const SETTINGS_SECTIONS = [
  {
    icon: <User size={18} className="text-green-600" />,
    title: 'Profile & Goals',
    desc: 'Update your body stats, goals, and diet preference',
    href: '/profile',
    color: 'bg-green-50',
  },
  {
    icon: <Bell size={18} className="text-orange-600" />,
    title: 'Reminders',
    desc: 'Configure meal, water, and weigh-in reminders',
    href: '/reminders',
    color: 'bg-orange-50',
  },
  {
    icon: <MessageCircle size={18} className="text-emerald-600" />,
    title: 'WhatsApp Integration',
    desc: 'Connect your WhatsApp number for reminders',
    href: '/whatsapp',
    color: 'bg-emerald-50',
  },
  {
    icon: <CreditCard size={18} className="text-purple-600" />,
    title: 'Subscription',
    desc: 'Manage your plan and billing',
    href: '/subscription',
    color: 'bg-purple-50',
  },
]

export default function SettingsPage() {
  return (
    <DashboardLayout pageTitle="Settings" title="Settings">
      <div className="max-w-xl mx-auto space-y-4">
        {SETTINGS_SECTIONS.map(s => (
          <Link key={s.href} href={s.href}>
            <Card padding="md" hover>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  {s.icon}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{s.title}</p>
                  <p className="text-sm text-gray-400">{s.desc}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300" />
              </div>
            </Card>
          </Link>
        ))}

        <Card padding="md">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-gray-400" />
              <CardTitle>Privacy & Data</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Your data is stored securely in Supabase and never shared without consent.</p>
            <div className="flex gap-3">
              <Button variant="secondary" size="sm">Export my data</Button>
              <Button variant="danger" size="sm">Delete account</Button>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
