import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PlanGate from '@/components/ui/PlanGate'
import { CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { WhatsAppContact } from '@/lib/database.types'
import {
  MessageCircle, Phone, Shield, CheckCircle2,
  RefreshCw, Info, Bell, Zap, ChevronRight, Smartphone,
  Wifi, Clock,
} from 'lucide-react'
import toast from 'react-hot-toast'

const HOW_IT_WORKS = [
  { step: '01', title: 'Enter your WhatsApp number', desc: 'We send you a verification code via WhatsApp.', icon: <Phone size={16} /> },
  { step: '02', title: 'Verify your number', desc: 'Enter the 6-digit code to confirm your identity.', icon: <Shield size={16} /> },
  { step: '03', title: 'Receive daily reminders', desc: 'Meal check-ins, water reminders, and weekly summaries — all via WhatsApp.', icon: <Bell size={16} /> },
]

const REMINDER_EXAMPLES = [
  { time: '8:00 AM',  emoji: '🌅', msg: 'Good morning! Don\'t forget to log your breakfast. Reply with what you ate!' },
  { time: '1:00 PM',  emoji: '☀️',  msg: 'Lunchtime check-in! How many calories so far today?' },
  { time: '3:00 PM',  emoji: '💧', msg: 'Water reminder: You need 1.5L more to hit your daily goal!' },
  { time: '8:00 PM',  emoji: '🌙', msg: 'Evening check-in: Log your dinner and snacks. You\'re at 1,450/2,000 kcal!' },
  { time: 'Weekly',   emoji: '📊', msg: 'Weekly Summary: You hit your calorie goal 5/7 days this week. Great work!' },
]

export default function WhatsAppPage() {
  const [contact, setContact] = useState<Partial<WhatsAppContact> | null>(null)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'enter' | 'verify' | 'connected'>('enter')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => { loadContact() }, [])

  async function loadContact() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('whatsapp_contacts').select('*').eq('user_id', session.user.id).maybeSingle()
    if (data) {
      setContact(data)
      setPhone(data.phone_number || '')
      setStep(data.is_verified ? 'connected' : 'verify')
    }
  }

  async function sendVerification() {
    if (!phone || phone.length < 8) { toast.error('Please enter a valid phone number with country code'); return }
    setSending(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString()
    const { error } = await supabase.from('whatsapp_contacts').upsert({ user_id: session.user.id, phone_number: phone, is_verified: false, verification_code: verifyCode, opt_in: true }, { onConflict: 'user_id' })
    if (error) { toast.error(error.message); setSending(false); return }
    const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
    if (webhookUrl) await fetch(`${webhookUrl}/send-verification`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, code: verifyCode, userId: session.user.id }) }).catch(() => null)
    toast.success('Verification code sent! Check your WhatsApp.')
    setStep('verify')
    setSending(false)
  }

  async function verifyCode() {
    if (!code || code.length !== 6) { toast.error('Enter the 6-digit code from WhatsApp'); return }
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data: contactData } = await supabase.from('whatsapp_contacts').select('verification_code').eq('user_id', session.user.id).single()
    if (!contactData || contactData.verification_code !== code) { toast.error('Invalid code. Please try again.'); setLoading(false); return }
    const { error } = await supabase.from('whatsapp_contacts').update({ is_verified: true, verification_code: null, verified_at: new Date().toISOString() }).eq('user_id', session.user.id)
    if (error) { toast.error(error.message); setLoading(false); return }
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
      <PlanGate requiredPlan="pro">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Connected banner */}
        {step === 'connected' && (
          <div className="flex items-center gap-4 p-5 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(6,182,212,0.08) 100%)',
              border: '1px solid rgba(16,185,129,0.25)',
              boxShadow: '0 4px 20px rgba(16,185,129,0.1)',
            }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
              <CheckCircle2 className="text-brand-400" size={22} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-white">WhatsApp Connected</p>
              <p className="text-sm text-brand-400">{contact?.phone_number} · Reminders active</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Wifi size={12} className="text-brand-400" />
              <span className="text-xs font-bold text-brand-400">Active</span>
            </div>
          </div>
        )}

        {/* Main card */}
        <div className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }}>
          {/* Card header gradient */}
          <div className="p-6 pb-5" style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.05))',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  boxShadow: '0 8px 24px rgba(37,211,102,0.4)',
                }}>
                <MessageCircle size={26} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-white">Connect WhatsApp</h2>
                <p className="text-sm text-gray-400 mt-0.5">Get reminders and check-in via WhatsApp</p>
              </div>
            </div>
          </div>

          <div className="p-6">
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
                <div className="flex gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <Info size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-cyan-300">
                    We sent a 6-digit code to <strong className="text-white">{phone}</strong> via WhatsApp. Enter it below.
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
                    <Shield size={16} /> Verify number
                  </Button>
                  <Button variant="secondary" onClick={() => { setStep('enter'); setCode('') }}>
                    Change
                  </Button>
                </div>
                <button onClick={sendVerification}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-400 transition-colors mx-auto">
                  <RefreshCw size={13} /> Resend code
                </button>
              </div>
            )}

            {step === 'connected' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Connected number', value: contact?.phone_number || '—' },
                    { label: 'Status', value: 'Verified & active', green: true },
                  ].map(item => (
                    <div key={item.label} className="p-4 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <p className="text-xs text-gray-600 mb-1 uppercase tracking-wider font-semibold">{item.label}</p>
                      <p className={`font-bold text-sm ${item.green ? 'text-brand-400' : 'text-white'}`}>{item.value}</p>
                    </div>
                  ))}
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
          </div>
        </div>

        {/* How it works */}
        <div className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <Smartphone size={16} className="text-brand-400" /> How it works
          </h3>
          <div className="space-y-4">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-sm"
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))',
                    border: '1px solid rgba(16,185,129,0.25)',
                    color: '#34d399',
                  }}>
                  {item.step}
                </div>
                <div className="flex-1 pt-1.5">
                  <p className="font-semibold text-white text-sm">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Example messages */}
        <div className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bell size={16} className="text-brand-400" /> Example messages
            </h3>
            <Badge variant="green">Preview</Badge>
          </div>
          <div className="space-y-3">
            {REMINDER_EXAMPLES.map((ex, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="flex flex-col items-center gap-1 w-14 flex-shrink-0">
                  <span className="text-lg">{ex.emoji}</span>
                  <span className="text-[10px] text-gray-600 font-semibold text-center leading-tight">{ex.time}</span>
                </div>
                <div className="flex-1 px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-gray-300"
                  style={{
                    background: 'rgba(37,211,102,0.07)',
                    border: '1px solid rgba(37,211,102,0.15)',
                  }}>
                  {ex.msg}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reminders CTA */}
        <div className="flex items-center justify-between p-5 rounded-2xl transition-all duration-200 cursor-pointer group"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(234,88,12,0.06))',
            border: '1px solid rgba(245,158,11,0.2)',
          }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <Clock size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Customize your reminders</p>
              <p className="text-xs text-gray-500">Set timing, frequency, and reminder types</p>
            </div>
          </div>
          <a href="/reminders" className="flex items-center gap-1 text-sm text-amber-400 font-semibold hover:text-amber-300 transition-colors">
            Manage <ChevronRight size={14} />
          </a>
        </div>
      </div>
      </PlanGate>
    </DashboardLayout>
  )
}
