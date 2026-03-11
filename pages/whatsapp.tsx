import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { WhatsAppContact } from '@/lib/database.types'
import {
  MessageCircle, Phone, Shield, CheckCircle2,
  RefreshCw, Info, Bell, Zap, ChevronRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

const HOW_IT_WORKS = [
  { icon: '1', title: 'Enter your WhatsApp number', desc: 'We send you a verification code via WhatsApp.' },
  { icon: '2', title: 'Verify your number',          desc: 'Enter the 6-digit code to confirm.' },
  { icon: '3', title: 'Receive daily reminders',     desc: 'Meal check-ins, water reminders, and weekly summaries — all via WhatsApp.' },
]

const REMINDER_EXAMPLES = [
  { time: '8:00 AM',  msg: '🌅 Good morning! Don\'t forget to log your breakfast. Reply with what you ate!' },
  { time: '1:00 PM',  msg: '☀️ Lunchtime check-in! How many calories so far today?' },
  { time: '3:00 PM',  msg: '💧 Water reminder: You need 1.5L more to hit your daily goal!' },
  { time: '8:00 PM',  msg: '🌙 Evening check-in: Log your dinner and snacks. You\'re at 1,450/2,000 kcal!' },
  { time: 'Sunday',   msg: '📊 Weekly Summary: You hit your calorie goal 5/7 days this week. Great work!' },
]

export default function WhatsAppPage() {
  const [contact, setContact] = useState<Partial<WhatsAppContact> | null>(null)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'enter' | 'verify' | 'connected'>('enter')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadContact()
  }, [])

  async function loadContact() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data } = await supabase
      .from('whatsapp_contacts')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()

    if (data) {
      setContact(data)
      setPhone(data.phone_number || '')
      setStep(data.is_verified ? 'connected' : 'verify')
    }
  }

  async function sendVerification() {
    if (!phone || phone.length < 8) {
      toast.error('Please enter a valid phone number with country code')
      return
    }
    setSending(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    // Generate 6-digit code
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()

    // Upsert contact record
    const { error } = await supabase.from('whatsapp_contacts').upsert({
      user_id: session.user.id,
      phone_number: phone,
      is_verified: false,
      verification_code: verifyCode,
      opt_in: true,
    }, { onConflict: 'user_id' })

    if (error) {
      toast.error(error.message)
      setSending(false)
      return
    }

    // Trigger n8n webhook to send WhatsApp message
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
    if (webhookUrl) {
      await fetch(`${webhookUrl}/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code: verifyCode,
          userId: session.user.id,
        }),
      }).catch(() => null)
    }

    toast.success('Verification code sent! Check your WhatsApp.')
    setStep('verify')
    setSending(false)
  }

  async function verifyCode() {
    if (!code || code.length !== 6) {
      toast.error('Enter the 6-digit code from WhatsApp')
      return
    }
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    const { data: contactData } = await supabase
      .from('whatsapp_contacts')
      .select('verification_code')
      .eq('user_id', session.user.id)
      .single()

    if (!contactData || contactData.verification_code !== code) {
      toast.error('Invalid code. Please try again.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('whatsapp_contacts')
      .update({
        is_verified: true,
        verification_code: null,
        verified_at: new Date().toISOString(),
      })
      .eq('user_id', session.user.id)

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('WhatsApp connected successfully!')
    setStep('connected')
    loadContact()
    setLoading(false)
  }

  async function disconnect() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return

    await supabase.from('whatsapp_contacts').update({ is_verified: false, opt_in: false }).eq('user_id', session.user.id)
    toast.success('WhatsApp disconnected')
    setStep('enter')
    setContact(null)
    setCode('')
  }

  return (
    <DashboardLayout pageTitle="WhatsApp" title="WhatsApp Integration">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Status banner */}
        {step === 'connected' && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="text-green-600" size={20} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-800">WhatsApp Connected</p>
              <p className="text-sm text-green-600">{contact?.phone_number} · Reminders active</p>
            </div>
            <Badge variant="green">Active</Badge>
          </div>
        )}

        {/* Connection card */}
        <Card padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center">
              <MessageCircle className="text-green-600" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Connect WhatsApp</h2>
              <p className="text-sm text-gray-500">Get reminders and check-in via WhatsApp</p>
            </div>
          </div>

          {step === 'enter' && (
            <div className="space-y-4">
              <Input
                label="WhatsApp phone number"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+92 300 1234567"
                leftIcon={<Phone size={16} />}
                hint="Include country code (e.g. +92 for Pakistan, +1 for USA)"
              />
              <Button onClick={sendVerification} loading={sending} fullWidth size="lg">
                <MessageCircle size={16} />
                Send verification code
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 flex gap-3">
                <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                  We sent a 6-digit code to <strong>{phone}</strong> via WhatsApp. Enter it below.
                </p>
              </div>
              <Input
                label="Verification code"
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                hint="6-digit code from WhatsApp"
              />
              <div className="flex gap-3">
                <Button onClick={verifyCode} loading={loading} fullWidth>
                  <Shield size={16} />
                  Verify number
                </Button>
                <Button variant="secondary" onClick={() => { setStep('enter'); setCode('') }}>
                  Change number
                </Button>
              </div>
              <button
                onClick={sendVerification}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mx-auto"
              >
                <RefreshCw size={14} /> Resend code
              </button>
            </div>
          )}

          {step === 'connected' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Connected number</p>
                  <p className="font-semibold text-gray-900">{contact?.phone_number}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <p className="font-semibold text-green-600">Verified & active</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" fullWidth onClick={() => setStep('enter')}>
                  Change number
                </Button>
                <Button variant="danger" fullWidth onClick={disconnect}>
                  Disconnect
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* How it works */}
        <Card padding="md">
          <CardTitle className="mb-4">How it works</CardTitle>
          <div className="space-y-4">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {step.icon}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Example messages */}
        <Card padding="md">
          <CardHeader>
            <CardTitle>Example messages you&apos;ll receive</CardTitle>
            <Bell size={16} className="text-gray-400" />
          </CardHeader>
          <div className="space-y-3">
            {REMINDER_EXAMPLES.map((ex, i) => (
              <div key={i} className="flex gap-3 items-start">
                <span className="text-xs text-gray-400 font-medium w-16 flex-shrink-0 pt-0.5">{ex.time}</span>
                <div className="flex-1 bg-green-50 rounded-2xl rounded-tl-sm px-4 py-2.5">
                  <p className="text-sm text-gray-700">{ex.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Reminders link */}
        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-2xl border border-orange-100">
          <div className="flex items-center gap-3">
            <Zap size={18} className="text-orange-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Customize your reminders</p>
              <p className="text-xs text-gray-500">Set timing, frequency, and reminder types</p>
            </div>
          </div>
          <a href="/reminders" className="flex items-center gap-1 text-sm text-orange-600 font-medium hover:text-orange-700">
            Manage <ChevronRight size={14} />
          </a>
        </div>
      </div>
    </DashboardLayout>
  )
}
