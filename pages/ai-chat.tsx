import { useState, useRef, useEffect, useCallback } from 'react'
import Head from 'next/head'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Send, Bot, User, Trash2, Sparkles, Zap, Brain, Leaf, Dumbbell, Heart } from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED_PROMPTS = [
  { text: "How can I increase my protein intake?", icon: <Dumbbell size={13} /> },
  { text: "What should I eat before a workout?", icon: <Zap size={13} /> },
  { text: "Healthy late-night snack options?", icon: <Leaf size={13} /> },
  { text: "Am I eating enough calories?", icon: <Heart size={13} /> },
  { text: "How to improve energy through diet?", icon: <Brain size={13} /> },
  { text: "Foods that reduce inflammation?", icon: <Sparkles size={13} /> },
]

export default function AIChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your personal AI nutritionist. I have access to your profile and recent food logs, so I can give you personalized advice. What would you like to know?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const history = [...messages, userMsg]
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }))

      const payload = history.length > 0 ? history : [{ role: 'user' as const, content: trimmed }]

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload, userId }),
      })

      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'Failed to get a response.')
        setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
        return
      }

      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch {
      toast.error('Network error. Please try again.')
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id))
    } finally {
      setLoading(false)
    }
  }, [messages, loading, userId])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Hi! I'm your personal AI nutritionist. I have access to your profile and recent food logs, so I can give you personalized advice. What would you like to know?",
      timestamp: new Date(),
    }])
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <DashboardLayout title="AI Nutritionist Chat">
      <Head><title>AI Nutritionist · FahmiFit</title></Head>

      <div className="max-w-3xl mx-auto flex flex-col" style={{ height: 'calc(100vh - 8rem)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                boxShadow: '0 0 24px rgba(16,185,129,0.4)',
              }}>
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">AI Nutritionist</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-400"
                  style={{ boxShadow: '0 0 6px rgba(16,185,129,0.8)' }} />
                <span className="text-xs text-brand-400 font-semibold">Online · Personalized to your data</span>
              </div>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 transition-all duration-200"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          >
            <Trash2 size={14} /> Clear chat
          </button>
        </div>

        {/* Chat container */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
          }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                {msg.role === 'assistant' ? (
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                      boxShadow: '0 0 12px rgba(16,185,129,0.4)',
                    }}>
                    <Bot size={15} className="text-white" />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                      boxShadow: '0 0 12px rgba(139,92,246,0.4)',
                    }}>
                    <User size={15} className="text-white" />
                  </div>
                )}

                {/* Bubble */}
                <div className={`max-w-[78%] flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className="rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap"
                    style={msg.role === 'assistant' ? {
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#e2e8f0',
                      borderTopLeftRadius: '4px',
                    } : {
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                      borderTopRightRadius: '4px',
                    }}
                  >
                    {msg.content}
                  </div>
                  <span className="text-xs text-gray-600 px-1">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 0 12px rgba(16,185,129,0.4)' }}>
                  <Bot size={15} className="text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="flex gap-1.5 items-center h-5">
                    {[0, 150, 300].map((delay) => (
                      <div
                        key={delay}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ background: '#10b981', animationDelay: `${delay}ms`, opacity: 0.8 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts */}
          {messages.length <= 1 && (
            <div className="px-5 pb-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs text-gray-500 mb-3 pt-3 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                <Sparkles size={11} className="text-brand-400" /> Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => sendMessage(prompt.text)}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200"
                    style={{
                      background: 'rgba(16,185,129,0.08)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      color: '#6ee7b7',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'rgba(16,185,129,0.15)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(16,185,129,0.2)'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(16,185,129,0.08)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    {prompt.icon}
                    {prompt.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your AI nutritionist..."
                  rows={1}
                  disabled={loading}
                  className="w-full resize-none text-sm text-white placeholder:text-gray-600 focus:outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    minHeight: '48px',
                    maxHeight: '120px',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                  }}
                />
              </div>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  boxShadow: input.trim() ? '0 4px 14px rgba(16,185,129,0.4)' : 'none',
                }}
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
            <p className="text-xs text-gray-700 mt-2 text-center">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
