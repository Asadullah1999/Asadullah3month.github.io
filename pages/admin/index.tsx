import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle, StatCard } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { User, DailyLog } from '@/lib/database.types'
import {
  Users, TrendingUp, MessageCircle, Award,
  Search, ChevronRight, CheckCircle2, XCircle,
  Eye, Bell, BarChart2, Flame,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate, todayISO } from '@/lib/utils'

type UserWithStats = User & {
  whatsapp_connected: boolean
  logs_this_week: number
  last_log_date: string | null
  subscription_plan: string
}

export default function AdminPanel() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    whatsappConnected: 0,
    proUsers: 0,
  })
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null)
  const [userLogs, setUserLogs] = useState<DailyLog[]>([])

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.push('/auth/login'); return }

    const { data: me } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single() as { data: { role: string } | null; error: unknown }

    if (!me || !['admin', 'nutritionist'].includes(me.role)) {
      router.push('/dashboard')
      toast.error('Access denied')
      return
    }

    loadAdminData()
  }

  async function loadAdminData() {
    // Load all users
    const { data: allUsers } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false }) as { data: User[] | null }

    // Load whatsapp contacts
    const { data: waContacts } = await supabase
      .from('whatsapp_contacts')
      .select('user_id, is_verified') as { data: { user_id: string; is_verified: boolean }[] | null }

    // Load subscriptions
    const { data: subs } = await supabase
      .from('subscriptions')
      .select('user_id, plan') as { data: { user_id: string; plan: string }[] | null }

    // Load recent logs (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { data: recentLogs } = await supabase
      .from('daily_logs')
      .select('user_id, log_date, total_calories')
      .gte('log_date', sevenDaysAgo.toISOString().split('T')[0]) as { data: { user_id: string; log_date: string; total_calories: number | null }[] | null }

    if (allUsers) {
      const enriched: UserWithStats[] = allUsers.map(u => {
        const wa = waContacts?.find(c => c.user_id === u.id)
        const sub = subs?.find(s => s.user_id === u.id)
        const logs = recentLogs?.filter(l => l.user_id === u.id) || []
        const sortedLogs = [...logs].sort((a, b) => b.log_date.localeCompare(a.log_date))

        return {
          ...u,
          whatsapp_connected: wa?.is_verified || false,
          logs_this_week: logs.length,
          last_log_date: sortedLogs[0]?.log_date || null,
          subscription_plan: sub?.plan || 'free',
        }
      })

      setUsers(enriched)
      setStats({
        totalUsers: enriched.length,
        activeToday: (recentLogs?.filter(l => l.log_date === todayISO()) || [])
          .filter((l, i, arr) => arr.findIndex(x => x.user_id === l.user_id) === i).length,
        whatsappConnected: waContacts?.filter(c => c.is_verified).length || 0,
        proUsers: subs?.filter(s => s.plan !== 'free').length || 0,
      })
    }

    setLoading(false)
  }

  async function loadUserLogs(userId: string) {
    const { data } = await supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', userId)
      .order('log_date', { ascending: false })
      .limit(14) as { data: DailyLog[] | null }

    if (data) setUserLogs(data)
  }

  const filteredUsers = users.filter(u =>
    !search || (u.full_name || '').toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <DashboardLayout pageTitle="Admin"><div className="flex justify-center py-20 text-gray-400">Loading admin panel...</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Admin Panel" title="Nutritionist Admin">
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users"    value={stats.totalUsers}       icon={<Users size={18} />}         color="blue"   sub="All time" />
          <StatCard title="Active Today"   value={stats.activeToday}      icon={<Flame size={18} />}         color="orange" sub="Logged today" />
          <StatCard title="WhatsApp"       value={stats.whatsappConnected} icon={<MessageCircle size={18} />} color="green"  sub="Connected" />
          <StatCard title="Paid Users"     value={stats.proUsers}         icon={<Award size={18} />}         color="purple" sub="Pro / Premium" />
        </div>

        {/* User detail modal */}
        {selectedUser && (
          <Card padding="md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">
                  {selectedUser.full_name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{selectedUser.full_name || 'Unknown'}</p>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(null); setUserLogs([]) }}>
                Close
              </Button>
            </CardHeader>

            <div className="grid md:grid-cols-3 gap-4 mb-5">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Goal</p>
                <p className="font-semibold text-gray-900 capitalize">{selectedUser.goal?.replace('_', ' ') || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Calorie Target</p>
                <p className="font-semibold text-gray-900">{selectedUser.calorie_target || '—'} kcal</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 mb-1">Logs this week</p>
                <p className="font-semibold text-gray-900">{selectedUser.logs_this_week} / 7 days</p>
              </div>
            </div>

            <CardTitle className="mb-3 text-sm">Recent logs</CardTitle>
            {userLogs.length === 0 ? (
              <p className="text-sm text-gray-400">No recent logs</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs text-gray-400 pb-2">Date</th>
                      <th className="text-right text-xs text-gray-400 pb-2">Calories</th>
                      <th className="text-right text-xs text-gray-400 pb-2">Protein</th>
                      <th className="text-right text-xs text-gray-400 pb-2">Water</th>
                      <th className="text-right text-xs text-gray-400 pb-2">Mood</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {userLogs.slice(0, 7).map(log => (
                      <tr key={log.id}>
                        <td className="py-2 text-gray-700">{log.log_date}</td>
                        <td className="py-2 text-right">
                          <span className={`font-semibold ${
                            (log.total_calories || 0) >= (selectedUser.calorie_target || 2000) * 0.85 &&
                            (log.total_calories || 0) <= (selectedUser.calorie_target || 2000) * 1.15
                              ? 'text-green-600' : 'text-orange-500'
                          }`}>
                            {log.total_calories || 0}
                          </span>
                        </td>
                        <td className="py-2 text-right text-gray-500">{Math.round(log.total_protein || 0)}g</td>
                        <td className="py-2 text-right text-gray-500">{log.water_ml || 0}ml</td>
                        <td className="py-2 text-right">
                          {log.mood && (
                            <Badge variant={
                              log.mood === 'great' ? 'green' :
                              log.mood === 'good' ? 'blue' :
                              log.mood === 'bad' ? 'red' : 'gray'
                            }>
                              {log.mood}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* Users table */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>All Users ({filteredUsers.length})</CardTitle>
            <div className="relative w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 pb-3">User</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-3 hidden md:table-cell">Goal</th>
                  <th className="text-center text-xs font-medium text-gray-400 pb-3">WhatsApp</th>
                  <th className="text-center text-xs font-medium text-gray-400 pb-3 hidden sm:table-cell">Logs / week</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-3 hidden lg:table-cell">Last log</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-3">Plan</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm font-semibold text-green-700 flex-shrink-0">
                          {u.full_name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{u.full_name || 'No name'}</p>
                          <p className="text-xs text-gray-400 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 hidden md:table-cell">
                      <span className="text-gray-600 capitalize text-xs">{u.goal?.replace('_', ' ') || '—'}</span>
                    </td>
                    <td className="py-3 text-center">
                      {u.whatsapp_connected
                        ? <CheckCircle2 size={16} className="text-green-500 mx-auto" />
                        : <XCircle size={16} className="text-gray-300 mx-auto" />}
                    </td>
                    <td className="py-3 text-center hidden sm:table-cell">
                      <span className={`text-sm font-semibold ${u.logs_this_week >= 5 ? 'text-green-600' : u.logs_this_week >= 3 ? 'text-orange-500' : 'text-red-400'}`}>
                        {u.logs_this_week}
                      </span>
                      <span className="text-gray-300">/7</span>
                    </td>
                    <td className="py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-400">
                        {u.last_log_date ? formatDate(u.last_log_date) : 'Never'}
                      </span>
                    </td>
                    <td className="py-3">
                      <Badge variant={
                        u.subscription_plan === 'premium' ? 'purple' :
                        u.subscription_plan === 'pro' ? 'blue' :
                        'gray'
                      }>
                        {u.subscription_plan}
                      </Badge>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => { setSelectedUser(u); loadUserLogs(u.id) }}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <Users size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-sm">{search ? 'No users match your search' : 'No users yet'}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
