import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { MessageSquare, Search, Bot, User, ChevronLeft } from 'lucide-react'
import toast from 'react-hot-toast'

type ChatUser = {
  user_id: string
  full_name: string | null
  email: string
  message_count: number
  last_message_at: string
}

type ChatMsg = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export default function ConversationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ChatUser | null>(null)
  const [convo, setConvo] = useState<ChatMsg[]>([])
  const [loadingConvo, setLoadingConvo] = useState(false)

  useEffect(() => { checkAdmin() }, [])

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

    loadData()
  }

  async function loadData() {
    // Get all chat messages with user info
    const { data: msgs } = await supabase
      .from('chat_messages')
      .select('user_id, created_at') as { data: { user_id: string; created_at: string }[] | null }

    if (!msgs || msgs.length === 0) { setLoading(false); return }

    // Aggregate per user
    const byUser: Record<string, { count: number; last: string }> = {}
    for (const m of msgs) {
      if (!byUser[m.user_id]) byUser[m.user_id] = { count: 0, last: m.created_at }
      byUser[m.user_id].count++
      if (m.created_at > byUser[m.user_id].last) byUser[m.user_id].last = m.created_at
    }

    const userIds = Object.keys(byUser)
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name, email')
      .in('id', userIds) as { data: { id: string; full_name: string | null; email: string }[] | null }

    if (users) {
      const result: ChatUser[] = users.map(u => ({
        user_id: u.id,
        full_name: u.full_name,
        email: u.email,
        message_count: byUser[u.id]?.count || 0,
        last_message_at: byUser[u.id]?.last || '',
      })).sort((a, b) => b.last_message_at.localeCompare(a.last_message_at))
      setChatUsers(result)
    }

    setLoading(false)
  }

  async function openConversation(user: ChatUser) {
    setSelected(user)
    setLoadingConvo(true)
    const { data } = await supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('user_id', user.user_id)
      .order('created_at', { ascending: true }) as { data: ChatMsg[] | null }
    setConvo(data || [])
    setLoadingConvo(false)
  }

  const filtered = chatUsers.filter(u =>
    !search ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  function formatTime(iso: string) {
    const d = new Date(iso)
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return <DashboardLayout pageTitle="Conversations"><div className="flex justify-center py-20 text-gray-400">Loading conversations...</div></DashboardLayout>
  }

  return (
    <DashboardLayout pageTitle="Conversations" title="AI Chat Conversations">
      <div className="space-y-6">

        {/* Conversation viewer */}
        {selected ? (
          <Card padding="none">
            {/* Header */}
            <div className="flex items-center gap-3 p-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <button
                onClick={() => { setSelected(null); setConvo([]) }}
                className="p-2 rounded-xl text-gray-400 hover:text-white transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)' }}
              >
                <ChevronLeft size={16} />
              </button>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #10b981, #8b5cf6)' }}>
                {selected.full_name?.[0]?.toUpperCase() || selected.email[0].toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-white">{selected.full_name || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{selected.email} · {convo.length} messages</p>
              </div>
            </div>

            {/* Messages */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {loadingConvo ? (
                <p className="text-center text-gray-500 py-10">Loading...</p>
              ) : convo.length === 0 ? (
                <p className="text-center text-gray-500 py-10">No messages found</p>
              ) : (
                convo.map(msg => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center"
                      style={msg.role === 'assistant'
                        ? { background: 'linear-gradient(135deg, #10b981, #06b6d4)' }
                        : { background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }
                      }>
                      {msg.role === 'assistant'
                        ? <Bot size={13} className="text-white" />
                        : <User size={13} className="text-white" />
                      }
                    </div>
                    <div className={`max-w-[75%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
                        style={msg.role === 'assistant' ? {
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#e2e8f0',
                          borderTopLeftRadius: '4px',
                        } : {
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff',
                          borderTopRightRadius: '4px',
                        }}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-600 px-1">{formatTime(msg.created_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        ) : (
          /* Users list */
          <Card padding="md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={16} className="text-brand-400" />
                All Conversations ({filtered.length})
              </CardTitle>
              <div className="relative w-48">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#e2e8f0',
                  }}
                />
              </div>
            </CardHeader>

            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare size={32} className="mx-auto mb-3 text-gray-700" />
                <p className="text-sm text-gray-500">
                  {search ? 'No users match your search' : 'No conversations yet'}
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                {filtered.map(u => (
                  <div key={u.user_id}
                    className="flex items-center gap-4 py-4 cursor-pointer group"
                    onClick={() => openConversation(u)}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #10b981, #8b5cf6)' }}>
                      {u.full_name?.[0]?.toUpperCase() || u.email[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{u.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 truncate">{u.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-brand-400">{u.message_count} msgs</p>
                      <p className="text-xs text-gray-600">{formatTime(u.last_message_at)}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      View →
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
