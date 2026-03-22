import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { MessageCircle, X, ArrowLeft, CheckCircle2, Loader2, ChevronRight, Ticket, Zap, Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import {
  getNode, getRootNode, BotOption, ChatMessage,
  getSmartSuggestions, getProactiveGreeting, getAIPrompt,
} from '@/lib/chatbot-data'

type WidgetPhase = 'closed' | 'chat' | 'ticket'
type TicketStatus = 'idle' | 'submitting' | 'success' | 'error'

function newId() {
  return Math.random().toString(36).slice(2)
}

function makeBotMsg(node: ReturnType<typeof getNode>): ChatMessage {
  return {
    id: newId(),
    role: 'bot',
    text: node.text,
    timestamp: new Date(),
    options: node.options,
    link: node.link,
  }
}

// Typing indicator component
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ background: 'rgba(16,185,129,0.6)' }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

// Quick stats bar
function QuickStats({ calories, target, protein, proteinTarget }: {
  calories: number; target: number; protein: number; proteinTarget: number
}) {
  const pct = Math.min(Math.round((calories / target) * 100), 100)
  const protPct = Math.min(Math.round((protein / proteinTarget) * 100), 100)
  return (
    <div className="flex items-center gap-3 px-4 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
      <div className="flex-1">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-gray-400">Calories</span>
          <span className="text-emerald-400 font-medium">{calories}/{target}</span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)' }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
      <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.08)' }} />
      <div className="text-center" style={{ minWidth: '60px' }}>
        <div className="text-xs text-gray-400">Protein</div>
        <div className="text-xs font-medium" style={{ color: protPct >= 80 ? '#10b981' : '#9ca3af' }}>{protein}/{proteinTarget}g</div>
      </div>
    </div>
  )
}

export default function ChatBotWidget() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<WidgetPhase>('closed')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasUnread, setHasUnread] = useState(false)
  const [inputText, setInputText] = useState('')

  // Ticket state
  const [ticketName, setTicketName] = useState('')
  const [ticketEmail, setTicketEmail] = useState('')
  const [ticketIssue, setTicketIssue] = useState('')
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>('idle')
  const [ticketError, setTicketError] = useState('')

  // AI & user state
  const [aiLoading, setAiLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('there')
  const [userPlan, setUserPlan] = useState('free')
  const [todayCalories, setTodayCalories] = useState(0)
  const [calorieTarget, setCalorieTarget] = useState(2000)
  const [todayProtein, setTodayProtein] = useState(0)
  const [proteinTarget, setProteinTarget] = useState(150)
  const [fabGlowing, setFabGlowing] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load user data on mount
  useEffect(() => {
    setMounted(true)
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return
      setUserId(session.user.id)
      if (session.user.email) setTicketEmail(session.user.email)

      // Fetch profile + today's log + subscription
      const today = new Date().toISOString().split('T')[0]
      const [{ data: profile }, { data: log }, { data: sub }] = await Promise.all([
        supabase.from('users').select('full_name, calorie_target, protein_target').eq('id', session.user.id).single(),
        supabase.from('daily_logs').select('total_calories, total_protein').eq('user_id', session.user.id).eq('log_date', today).maybeSingle(),
        supabase.from('subscriptions').select('plan, status').eq('user_id', session.user.id).maybeSingle(),
      ])

      if (profile) {
        const firstName = (profile.full_name as string)?.split(' ')[0] || 'there'
        setUserName(firstName)
        if (profile.calorie_target) setCalorieTarget(profile.calorie_target as number)
        if (profile.protein_target) setProteinTarget(profile.protein_target as number)
      }
      if (log) {
        setTodayCalories((log.total_calories as number) || 0)
        setTodayProtein((log.total_protein as number) || 0)
      }
      if (sub && (sub.status === 'active' || sub.status === 'trialing')) {
        setUserPlan(sub.plan as string)
      }
    }
    loadUser()
    const t = setTimeout(() => setHasUnread(true), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Typewriter effect
  const typewriterReveal = useCallback((msgId: string, fullText: string) => {
    let idx = 0
    const interval = setInterval(() => {
      idx++
      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, text: fullText.slice(0, idx), isStreaming: idx < fullText.length } : m
      ))
      if (idx >= fullText.length) clearInterval(interval)
    }, 18)
  }, [])

  // Send message to AI
  const sendToAI = useCallback(async (text: string) => {
    if (!userId) return
    setAiLoading(true)
    setFabGlowing(true)

    // Add typing indicator
    const typingId = newId()
    setMessages(prev => [...prev, { id: typingId, role: 'bot', text: '...', timestamp: new Date(), isStreaming: true }])

    try {
      const resp = await fetch('/api/chatbot/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: text, userId, currentPage: router.asPath }),
      })
      const data = await resp.json()

      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== typingId))

      if (data.gated) {
        const gatedMsg: ChatMessage = {
          id: newId(), role: 'bot', text: data.reply, timestamp: new Date(), isAI: true,
          link: { label: 'View Plans', href: '/pricing' },
        }
        setMessages(prev => [...prev, gatedMsg])
      } else {
        const aiMsgId = newId()
        const aiMsg: ChatMessage = {
          id: aiMsgId, role: 'bot', text: '', timestamp: new Date(), isAI: true, isStreaming: true,
        }
        setMessages(prev => [...prev, aiMsg])
        typewriterReveal(aiMsgId, data.reply)

        // Update quick stats if returned
        if (data.quickStats) {
          setTodayCalories(data.quickStats.calories)
          setCalorieTarget(data.quickStats.target)
          setTodayProtein(data.quickStats.protein)
          setProteinTarget(data.quickStats.proteinTarget)
        }
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== typingId))
      setMessages(prev => [...prev, {
        id: newId(), role: 'bot', text: 'Oops, something went wrong. Try again!', timestamp: new Date(), isAI: true,
      }])
    } finally {
      setAiLoading(false)
      setFabGlowing(false)
    }
  }, [userId, router.asPath, typewriterReveal])

  function open() {
    setPhase('chat')
    setHasUnread(false)
    if (!initialized.current) {
      initialized.current = true
      const hour = new Date().getHours()
      const greeting = getProactiveGreeting(userName, todayCalories, calorieTarget, hour)
      const suggestions = getSmartSuggestions(router.asPath, hour, todayCalories, calorieTarget)

      // Merge smart suggestions with core actions
      const coreActions: BotOption[] = [
        { label: 'Browse pages', emoji: '🗺️', nextId: 'pages' },
        { label: 'Raise a ticket', emoji: '🎫', nextId: 'ticket', action: 'ticket' },
      ]

      setMessages([{
        id: newId(),
        role: 'bot',
        text: greeting,
        timestamp: new Date(),
        options: [...suggestions, ...coreActions],
      }])
    }
  }

  function close() {
    setPhase('closed')
  }

  function addUserMsg(text: string) {
    setMessages(prev => [...prev, { id: newId(), role: 'user', text, timestamp: new Date() }])
  }

  function handleSend() {
    const text = inputText.trim()
    if (!text || aiLoading) return
    setInputText('')
    addUserMsg(text)
    sendToAI(text)
  }

  function selectOption(opt: BotOption) {
    addUserMsg(opt.label.replace(/^[^\w\s]+\s*/, ''))

    if (opt.action === 'back') {
      const hour = new Date().getHours()
      const greeting = getProactiveGreeting(userName, todayCalories, calorieTarget, hour)
      const suggestions = getSmartSuggestions(router.asPath, hour, todayCalories, calorieTarget)
      const coreActions: BotOption[] = [
        { label: 'Browse pages', emoji: '🗺️', nextId: 'pages' },
        { label: 'Raise a ticket', emoji: '🎫', nextId: 'ticket', action: 'ticket' },
      ]
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: newId(), role: 'bot', text: greeting, timestamp: new Date(),
          options: [...suggestions, ...coreActions],
        }])
      }, 400)
      return
    }

    if (opt.action === 'ticket') {
      setTimeout(() => setPhase('ticket'), 400)
      return
    }

    if (opt.action === 'ai-prompt') {
      const prompt = getAIPrompt(opt.nextId)
      sendToAI(prompt)
      return
    }

    if (opt.action === 'navigate' && opt.href) {
      const node = getNode(opt.nextId)
      setTimeout(() => {
        setMessages(prev => [...prev, { ...makeBotMsg(node), options: undefined }])
        setTimeout(() => {
          router.push(opt.href!)
          close()
        }, 800)
      }, 400)
      return
    }

    const node = getNode(opt.nextId)
    setTimeout(() => {
      setMessages(prev => [...prev, makeBotMsg(node)])
    }, 400)
  }

  async function submitTicket() {
    if (!ticketName.trim() || !ticketEmail.trim() || !ticketIssue.trim()) {
      setTicketError('Please fill in all fields.')
      return
    }
    setTicketStatus('submitting')
    setTicketError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('support_tickets').insert({
        name: ticketName.trim(),
        email: ticketEmail.trim(),
        issue: ticketIssue.trim(),
        user_id: session?.user?.id ?? null,
        source: 'chatbot',
        status: 'open',
      })
      if (error) throw error
      setTicketStatus('success')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit. Please try again.'
      setTicketError(message)
      setTicketStatus('error')
    }
  }

  if (!mounted) return null

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '10px 14px',
    color: 'white',
    fontSize: '13px',
    outline: 'none',
  }

  const isPro = userPlan === 'pro' || userPlan === 'premium'

  return (
    <>
      {/* FAB Button */}
      <motion.button
        onClick={phase === 'closed' ? open : close}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.5 }}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #10b981, #059669)',
          boxShadow: fabGlowing
            ? '0 0 0 4px rgba(16,185,129,0.3), 0 0 20px rgba(16,185,129,0.6), 0 8px 24px rgba(16,185,129,0.5)'
            : '0 0 0 1px rgba(16,185,129,0.4), 0 8px 24px rgba(16,185,129,0.5)',
          transition: 'box-shadow 0.3s ease',
        }}
        aria-label="Open chat"
      >
        {fabGlowing && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
        <AnimatePresence mode="wait">
          {phase === 'closed' ? (
            <motion.div key="open" initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 30, opacity: 0 }} transition={{ duration: 0.15 }} className="relative z-10">
              <MessageCircle size={22} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="close" initial={{ rotate: 30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -30, opacity: 0 }} transition={{ duration: 0.15 }} className="relative z-10">
              <X size={22} className="text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {hasUnread && phase === 'closed' && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-gray-950 flex items-center justify-center text-white" style={{ fontSize: '9px', fontWeight: 700 }}>1</span>
        )}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {phase !== 'closed' && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            className="fixed bottom-36 right-4 lg:bottom-24 lg:right-6 z-50 flex flex-col"
            style={{
              width: 'min(360px, calc(100vw - 2rem))',
              maxHeight: '560px',
              background: 'rgba(6, 6, 18, 0.97)',
              backdropFilter: 'blur(28px)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04), 0 0 40px rgba(16,185,129,0.08)',
              overflow: 'hidden',
            }}
          >
            {/* Top accent line */}
            <div style={{ height: '2px', background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.7), rgba(6,182,212,0.5), transparent)', flexShrink: 0 }} />

            {/* Aurora Header */}
            <div
              className="flex items-center gap-3 px-4 py-3 relative overflow-hidden"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}
            >
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(120deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06), rgba(139,92,246,0.04), rgba(16,185,129,0.08))',
                  backgroundSize: '300% 100%',
                }}
                animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              />
              {phase === 'ticket' && (
                <button onClick={() => setPhase('chat')} className="text-gray-400 hover:text-white transition-colors mr-1 relative z-10">
                  <ArrowLeft size={16} />
                </button>
              )}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center relative z-10" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                <Zap size={14} className="text-white" fill="white" />
              </div>
              <div className="flex-1 min-w-0 relative z-10">
                <p className="text-white font-semibold text-sm">{phase === 'ticket' ? 'Raise a Ticket' : 'FahmiFit AI'}</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #10b981' }} />
                  <span className="text-gray-500 text-xs">{aiLoading ? 'Thinking...' : 'Online'}</span>
                </div>
              </div>
              <button onClick={close} className="text-gray-500 hover:text-white transition-colors relative z-10">
                <X size={16} />
              </button>
            </div>

            {/* Quick Stats Bar */}
            {phase === 'chat' && userId && todayCalories > 0 && (
              <QuickStats calories={todayCalories} target={calorieTarget} protein={todayProtein} proteinTarget={proteinTarget} />
            )}

            {/* Body */}
            <AnimatePresence mode="wait">
              {phase === 'ticket' ? (
                <motion.div key="ticket" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}
                  className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {ticketStatus === 'success' ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                      <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <CheckCircle2 size={28} className="text-emerald-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-white font-semibold mb-1">Ticket Submitted!</p>
                        <p className="text-gray-400 text-xs">We&apos;ll reply to <span className="text-emerald-400">{ticketEmail}</span> soon.</p>
                      </div>
                      <button onClick={() => { setTicketStatus('idle'); setTicketIssue(''); setPhase('chat') }}
                        className="text-xs text-gray-500 hover:text-white transition-colors underline">Back to chat</button>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-400 text-xs mb-1">Fill in your details and we&apos;ll get back to you.</p>
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Your name</label>
                        <input value={ticketName} onChange={e => setTicketName(e.target.value)} placeholder="e.g. Ahmad" style={inputStyle}
                          onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Email address</label>
                        <input value={ticketEmail} onChange={e => setTicketEmail(e.target.value)} type="email" placeholder="you@email.com" style={inputStyle}
                          onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                      </div>
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">Describe your issue</label>
                        <textarea value={ticketIssue} onChange={e => setTicketIssue(e.target.value)} placeholder="What&apos;s going wrong? We&apos;ll help fix it." rows={3}
                          style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }}
                          onFocus={e => (e.target.style.borderColor = 'rgba(16,185,129,0.5)')}
                          onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')} />
                      </div>
                      {ticketError && <p className="text-red-400 text-xs">{ticketError}</p>}
                      <button onClick={submitTicket} disabled={ticketStatus === 'submitting'}
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-all"
                        style={{ background: ticketStatus === 'submitting' ? 'rgba(16,185,129,0.5)' : 'linear-gradient(135deg, #10b981, #059669)', cursor: ticketStatus === 'submitting' ? 'not-allowed' : 'pointer' }}>
                        {ticketStatus === 'submitting' ? <Loader2 size={14} className="animate-spin" /> : <Ticket size={14} />}
                        {ticketStatus === 'submitting' ? 'Submitting...' : 'Submit Ticket'}
                      </button>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div key="chat" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }}
                  className="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style={{ minHeight: 0 }}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm" style={
                        msg.role === 'user'
                          ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#d1fae5', borderBottomRightRadius: '4px' }
                          : msg.isAI
                            ? { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb', borderBottomLeftRadius: '4px', borderLeft: '2px solid', borderImage: 'linear-gradient(to bottom, #10b981, #06b6d4) 1' }
                            : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb', borderBottomLeftRadius: '4px', borderLeft: '2px solid rgba(16,185,129,0.5)' }
                      }>
                        {msg.isStreaming && msg.text === '...' ? (
                          <TypingDots />
                        ) : (
                          <p className="whitespace-pre-wrap leading-relaxed" style={{ fontSize: '13px' }}>{msg.text}</p>
                        )}
                        {msg.link && (
                          <Link href={msg.link.href} onClick={close}
                            className="flex items-center gap-1 mt-2 text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                            style={{ fontSize: '12px' }}>
                            {msg.link.label} <ChevronRight size={12} />
                          </Link>
                        )}
                      </div>
                      {/* Timestamp */}
                      <span className="text-gray-600 mt-1" style={{ fontSize: '10px' }}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.options && msg.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2 max-w-full">
                          {msg.options.map((opt) => (
                            <motion.button
                              key={opt.nextId + opt.label}
                              onClick={() => selectOption(opt)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="text-xs px-3 py-1.5 rounded-xl transition-all"
                              style={{
                                background: opt.action === 'ai-prompt'
                                  ? 'rgba(16,185,129,0.1)'
                                  : 'rgba(255,255,255,0.06)',
                                border: opt.action === 'ai-prompt'
                                  ? '1px solid rgba(16,185,129,0.3)'
                                  : '1px solid rgba(255,255,255,0.12)',
                                color: opt.action === 'ai-prompt' ? '#6ee7b7' : '#d1d5db',
                                cursor: 'pointer',
                              }}
                            >
                              {opt.emoji && <span className="mr-1">{opt.emoji}</span>}{opt.label}
                            </motion.button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Bar (chat mode only) */}
            {phase === 'chat' && (
              <div className="px-3 pb-3 pt-1" style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}>
                  <input
                    ref={inputRef}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                    placeholder={isPro ? 'Ask me anything...' : 'Ask a question or pick an option...'}
                    className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
                    disabled={aiLoading}
                  />
                  <motion.button
                    onClick={handleSend}
                    disabled={!inputText.trim() || aiLoading}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      background: inputText.trim() ? 'linear-gradient(135deg, #10b981, #059669)' : 'rgba(255,255,255,0.06)',
                      cursor: inputText.trim() && !aiLoading ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {aiLoading
                      ? <Loader2 size={14} className="text-gray-400 animate-spin" />
                      : <Send size={14} className={inputText.trim() ? 'text-white' : 'text-gray-600'} />
                    }
                  </motion.button>
                </div>
                {!isPro && (
                  <p className="text-center mt-1.5" style={{ fontSize: '10px', color: 'rgba(156,163,175,0.6)' }}>
                    AI chat is a Pro feature &middot; <Link href="/pricing" onClick={close} className="text-emerald-500 hover:text-emerald-400">Upgrade</Link>
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
