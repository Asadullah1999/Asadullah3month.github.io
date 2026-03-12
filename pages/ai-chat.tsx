import { useState, useRef, useEffect, useCallback } from 'react'
import Head from 'next/head'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import toast from 'react-hot-toast'
import { Send, Bot, User, Trash2, Sparkles } from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

const SUGGESTED_PROMPTS = [
  "How can I increase my protein intake without eating more meat?",
  "What should I eat before and after a workout?",
  "I'm craving snacks at night — what are healthy options?",
  "Am I eating enough calories based on my goals?",
  "How can I improve my energy levels through diet?",
  "What foods help reduce inflammation?",
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

      // Always send at least the current message
      const payload = history.length > 0 ? history : [{ role: 'user' as const, content: trimmed }]

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: payload }),
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
  }, [messages, loading])

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
      <Head><title>AI Nutritionist Chat – NutriCoach</title></Head>

      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Nutritionist</h1>
            <p className="text-gray-500 text-sm mt-0.5">Personalized advice based on your profile &amp; data</p>
          </div>
          <Button variant="ghost" onClick={clearChat} className="flex items-center gap-2 text-gray-500">
            <Trash2 size={16} /> Clear chat
          </Button>
        </div>

        {/* Chat area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'assistant' ? 'bg-green-100' : 'bg-blue-100'
                }`}>
                  {msg.role === 'assistant'
                    ? <Bot size={16} className="text-green-600" />
                    : <User size={16} className="text-blue-600" />
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[80%] space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'assistant'
                      ? 'bg-gray-50 text-gray-800 rounded-tl-sm'
                      : 'bg-green-600 text-white rounded-tr-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-xs text-gray-400 px-1">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-green-600" />
                </div>
                <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center h-4">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts */}
          {messages.length <= 1 && (
            <div className="px-4 pb-3">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                <Sparkles size={12} /> Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors border border-green-100"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your AI nutritionist..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent max-h-32 overflow-y-auto"
                style={{ minHeight: '44px' }}
                disabled={loading}
              />
              <Button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-10 h-10 p-0 flex items-center justify-center"
              >
                <Send size={16} />
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
