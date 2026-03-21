import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { MessageCircle, X, ArrowLeft, CheckCircle2, Loader2, ChevronRight, Ticket, Zap } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getNode, getRootNode, BotOption, ChatMessage } from '@/lib/chatbot-data'

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

export default function ChatBotWidget() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [phase, setPhase] = useState<WidgetPhase>('closed')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [hasUnread, setHasUnread] = useState(false)
  const [ticketName, setTicketName] = useState('')
  const [ticketEmail, setTicketEmail] = useState('')
  const [ticketIssue, setTicketIssue] = useState('')
  const [ticketStatus, setTicketStatus] = useState<TicketStatus>('idle')
  const [ticketError, setTicketError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    setMounted(true)
    // Pre-fill email if logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) setTicketEmail(session.user.email)
    })
    // Show unread dot after 3s to draw attention
    const t = setTimeout(() => setHasUnread(true), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function open() {
    setPhase('chat')
    setHasUnread(false)
    if (!initialized.current) {
      initialized.current = true
      setMessages([makeBotMsg(getRootNode())])
    }
  }

  function close() {
    setPhase('closed')
  }

  function addUserMsg(text: string) {
    setMessages(prev => [...prev, { id: newId(), role: 'user', text, timestamp: new Date() }])
  }

  function selectOption(opt: BotOption) {
    addUserMsg(opt.label.replace(/^[^\w\s]+\s*/, '')) // strip emoji prefix

    if (opt.action === 'back') {
      setTimeout(() => {
        setMessages(prev => [...prev, makeBotMsg(getRootNode())])
      }, 400)
      return
    }

    if (opt.action === 'ticket') {
      setTimeout(() => setPhase('ticket'), 400)
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
          boxShadow: '0 0 0 1px rgba(16,185,129,0.4), 0 8px 24px rgba(16,185,129,0.5)',
        }}
        aria-label="Open chat"
      >
        <AnimatePresence mode="wait">
          {phase === 'closed' ? (
            <motion.div key="open" initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 30, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle size={22} className="text-white" />
            </motion.div>
          ) : (
            <motion.div key="close" initial={{ rotate: 30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -30, opacity: 0 }} transition={{ duration: 0.15 }}>
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
              maxHeight: '520px',
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

            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
              {phase === 'ticket' && (
                <button onClick={() => setPhase('chat')} className="text-gray-400 hover:text-white transition-colors mr-1">
                  <ArrowLeft size={16} />
                </button>
              )}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                <Zap size={14} className="text-white" fill="white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{phase === 'ticket' ? 'Raise a Ticket' : 'FahmiFit Assistant'}</p>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ boxShadow: '0 0 6px #10b981' }} />
                  <span className="text-gray-500 text-xs">Online</span>
                </div>
              </div>
              <button onClick={close} className="text-gray-500 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>

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
                  className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                  {messages.map((msg) => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm" style={
                        msg.role === 'user'
                          ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', color: '#d1fae5', borderBottomRightRadius: '4px' }
                          : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#e5e7eb', borderBottomLeftRadius: '4px', borderLeft: '2px solid rgba(16,185,129,0.5)' }
                      }>
                        <p className="whitespace-pre-wrap leading-relaxed" style={{ fontSize: '13px' }}>{msg.text}</p>
                        {msg.link && (
                          <Link href={msg.link.href} onClick={close}
                            className="flex items-center gap-1 mt-2 text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                            style={{ fontSize: '12px' }}>
                            {msg.link.label} <ChevronRight size={12} />
                          </Link>
                        )}
                      </div>
                      {msg.options && msg.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2 max-w-full">
                          {msg.options.map((opt) => (
                            <button key={opt.nextId + opt.label} onClick={() => selectOption(opt)}
                              className="text-xs px-3 py-1.5 rounded-xl transition-all hover:scale-105"
                              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#d1d5db', cursor: 'pointer' }}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
