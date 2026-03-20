import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, Zap, ChevronLeft, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    toast.success('Password reset link sent!')
    setLoading(false)
  }

  return (
    <>
      <Head><title>Reset Password · FahmiFit</title></Head>
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#05050f' }}>
        <div className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.8), transparent)', filter: 'blur(80px)' }} />

        <div className="w-full max-w-sm relative z-10">
          <div className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
              <Zap size={18} className="text-white" fill="white" />
            </div>
            <span className="font-extrabold text-lg gradient-text">FahmiFit</span>
          </div>

          <div className="rounded-2xl p-8" style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
          }}>
            {sent ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                  <CheckCircle2 size={28} style={{ color: '#34d399' }} />
                </div>
                <h2 className="text-xl font-extrabold text-white mb-2">Check your email</h2>
                <p className="text-gray-500 text-sm mb-6">
                  We sent a password reset link to <span className="text-white font-medium">{email}</span>.
                  Click the link in the email to reset your password.
                </p>
                <Link href="/auth/login"
                  className="text-brand-400 font-semibold text-sm hover:text-brand-300 transition-colors flex items-center justify-center gap-1">
                  <ChevronLeft size={16} /> Back to sign in
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-extrabold text-white mb-2">Reset password</h2>
                <p className="text-gray-500 text-sm mb-6">
                  Enter your email and we&apos;ll send you a link to reset your password.
                </p>
                <form onSubmit={handleReset} className="space-y-4">
                  <Input
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    leftIcon={<Mail size={15} />}
                    required
                    autoComplete="email"
                    autoFocus
                  />
                  <Button type="submit" loading={loading} fullWidth size="lg">
                    Send reset link
                  </Button>
                </form>
                <p className="text-center text-sm text-gray-600 mt-6">
                  <Link href="/auth/login" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors flex items-center justify-center gap-1">
                    <ChevronLeft size={16} /> Back to sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
