import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PageHero from '@/components/ui/PageHero'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { supabase } from '@/lib/supabase'
import { WhatsAppContact } from '@/lib/database.types'
import {
  MessageCircle, Phone, Shield, CheckCircle2,
  Info, Bell, Zap, ChevronRight, Smartphone,
  Wifi, Clock, ExternalLink, Send,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { usePlan } from '@/lib/usePlan'
import PlanGate from '@/components/ui/PlanGate'

const WA_PHONE = process.env.NEXT_PUBLIC_WA_BUSINESS_PHONE || '14155238886'

const SANDBOX_NUMBER = '+14155238886'
const SANDBOX_CODE = 'join grandmother-likely'
const SANDBOX_LINK = `https://wa.me/14155238886?text=${encodeURIComponent('join grandmother-likely')}`

const HOW_IT_WORKS = [
  { step: '01', title: 'Join our WhatsApp', desc: 'Tap the button below to send "join grandmother-likely" to our number. Required once.', icon: <MessageCircle size={16} /> },
  { step: '02', title: 'Enter your number & connect', desc: 'Enter your WhatsApp number and tap Connect — we\'ll send a verification link.', icon: <Phone size={16} /> },
  { step: '03', title: 'Verify & you\'re done!', desc: 'Send the pre-filled message — your account auto-connects instantly.', icon: <Zap size={16} /> },
]

const FEATURES = [
  { emoji: '📝', title: 'Log meals by text', desc: 'Just type "2 roti and dal for lunch" — AI parses it instantly' },
  { emoji: '📸', title: 'Send food photos', desc: 'Snap a photo of your plate — AI identifies and logs it' },
  { emoji: '💧', title: 'Track water', desc: 'Type "water 500" to log 500ml — updates your dashboard' },
  { emoji: '📊', title: 'Check status', desc: 'Type "status" for today\'s calories, macros, and water progress' },
  { emoji: '🔔', title: 'Smart reminders', desc: 'Personalized meal and water reminders at your preferred times' },
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
  const [step, setStep] = useState<'enter' | 'pending' | 'connected'>('enter')
  const [loading, setLoading] = useState(false)
  const [verifyToken, setVerifyToken] = useState<string | null>(null)
  const { plan, loading: planLoading } = usePlan()

  const loadContact = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase.from('whatsapp_contacts').select('*').eq('user_id', session.user.id).maybeSingle()
    if (data) {
      setContact(data)
      setPhone(data.phone_number || '')
      if (data.is_verified) {
        setStep('connected')
      } else {
        setVerifyToken(data.verification_code || null)
        setStep('pending')
      }
    }
  }, [])

  useEffect(() => { loadContact() }, [loadContact])

  // Real-time subscription: auto-detect when webhook verifies the user
  useEffect(() => {
    if (step !== 'pending') return

    let cancelled = false

    async function subscribe() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || cancelled) return

      const channel = supabase
        .channel('wa-verify')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_contacts',
          filter: `user_id=eq.${session.user.id}`,
        }, (payload) => {
          const updated = payload.new as Record<string, unknown>
          if (updated.is_verified) {
            toast.success('WhatsApp connected successfully!')
            setStep('connected')
            setContact(prev => ({ ...prev, is_verified: true }))
          }
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    }

    const cleanup = subscribe()
    return () => {
      cancelled = true
      cleanup.then(fn => fn?.())
    }
  }, [step])

  async function connectWhatsApp() {
    if (!phone || phone.length < 8) {
      toast.error('Please enter a valid phone number with country code')
      return
    }
    setLoading(true)

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setLoading(false); return }

    // Generate a verification token
    const token = crypto.randomUUID().split('-')[0].toUpperCase()

    // Normalize phone
    const cleanPhone = phone.startsWith('+') ? phone : `+${phone}`

    // Upsert to whatsapp_contacts
    const { error } = await supabase.from('whatsapp_contacts').upsert({
      user_id: session.user.id,
      phone_number: cleanPhone,
      is_verified: false,
      verification_code: token,
      opt_in: false,
    }, { onConflict: 'user_id' })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setVerifyToken(token)
    setStep('pending')
    setLoading(false)
    toast.success('Now tap the WhatsApp button to verify!')
  }

  async function disconnect() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    await supabase.from('whatsapp_contacts').update({ is_verified: false, opt_in: false }).eq('user_id', session.user.id)
    toast.success('WhatsApp disconnected')
    setStep('enter')
    setContact(null)
    setVerifyToken(null)
  }

  const waLink = verifyToken
    ? `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(`VERIFY ${verifyToken}`)}`
    : '#'

  const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } } }
  const cardAnim: Variants = { hidden: { opacity: 0, y: 20, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: 'easeOut' } } }

  return (
    <DashboardLayout pageTitle="WhatsApp" title="WhatsApp Integration">
      <PageHero
        badge="WhatsApp"
        badgeColor="#25D366"
        title="WhatsApp Connect"
        highlight="WhatsApp"
        subtitle="Log meals, get reminders, and track nutrition — all via WhatsApp"
        orbColors={['rgba(37,211,102,0.3)', 'rgba(16,185,129,0.2)']}
      />
      <PlanGate requires="pro" currentPlan={plan} loading={planLoading} featureName="WhatsApp Reminders">
      <motion.div className="max-w-2xl mx-auto space-y-5" initial="hidden" animate="visible" variants={stagger}>

        {/* Step 1: Join sandbox banner */}
        <motion.div variants={cardAnim} className="rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(37,211,102,0.08), rgba(16,185,129,0.05))',
            border: '1px solid rgba(37,211,102,0.25)',
          }}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-sm"
              style={{ background: 'rgba(37,211,102,0.2)', border: '1px solid rgba(37,211,102,0.35)', color: '#25D366' }}>
              1
            </div>
            <div>
              <p className="font-bold text-white text-sm">First: Join our WhatsApp</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Before connecting, you must join our WhatsApp sandbox once. Tap the button and send the message.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl mb-3"
            style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-0.5">Send this to <span className="text-white font-mono">{SANDBOX_NUMBER}</span></p>
              <p className="font-mono font-bold text-green-400 text-sm">{SANDBOX_CODE}</p>
            </div>
          </div>
          <a href={SANDBOX_LINK} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white text-sm transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #25D366, #128C7E)',
              boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
            }}>
            <ExternalLink size={15} />
            Tap to Join on WhatsApp
          </a>
          <p className="text-xs text-gray-600 text-center mt-2">Only required once. Sandbox membership lasts 72 hours.</p>
        </motion.div>

        {/* Connected banner */}
        {step === 'connected' && (
          <motion.div variants={cardAnim} className="flex items-center gap-4 p-5 rounded-2xl"
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
        </motion.div>
        )}

        {/* Main card */}
        <motion.div variants={cardAnim} className="rounded-2xl overflow-hidden"
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
                <p className="text-sm text-gray-400 mt-0.5">Log meals, track water, get reminders via WhatsApp</p>
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
                <Button onClick={connectWhatsApp} loading={loading} fullWidth size="lg">
                  <MessageCircle size={16} />
                  Connect WhatsApp
                </Button>
              </div>
            )}

            {step === 'pending' && (
              <div className="space-y-4">
                <div className="flex gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)' }}>
                  <Info size={16} className="text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-300">
                    Tap the button below to send a verification message to our WhatsApp.
                    Your page will <strong className="text-white">auto-update</strong> once verified.
                  </p>
                </div>

                <a href={waLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl font-bold text-white text-base transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #25D366, #128C7E)',
                    boxShadow: '0 8px 24px rgba(37,211,102,0.4)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,211,102,0.5)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,211,102,0.4)' }}>
                  <ExternalLink size={16} />
                  Open WhatsApp to Verify
                </a>

                <div className="flex gap-3 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <Shield size={14} className="text-gray-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-500">
                    Your verification code: <span className="font-mono font-bold text-gray-400">VERIFY {verifyToken}</span>
                    <br />This page will auto-connect once you send it.
                  </p>
                </div>

                <button onClick={() => { setStep('enter'); setVerifyToken(null) }}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-400 transition-colors mx-auto">
                  <Phone size={13} /> Change number
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
        </motion.div>

        {/* Features */}
        <motion.div variants={cardAnim} className="rounded-2xl p-6"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 className="text-base font-bold text-white mb-5 flex items-center gap-2">
            <Zap size={16} className="text-brand-400" /> What you can do
          </h3>
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex gap-3 items-start p-3 rounded-xl transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                <span className="text-xl flex-shrink-0">{f.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div variants={cardAnim} className="rounded-2xl p-6"
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
        </motion.div>

        {/* Example messages */}
        <motion.div variants={cardAnim} className="rounded-2xl p-6"
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
        </motion.div>

        {/* Reminders CTA */}
        <motion.div variants={cardAnim} className="flex items-center justify-between p-5 rounded-2xl transition-all duration-200 cursor-pointer group"
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
        </motion.div>
      </motion.div>
      </PlanGate>
    </DashboardLayout>
  )
}
