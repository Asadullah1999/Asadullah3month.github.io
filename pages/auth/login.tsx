import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, Eye, EyeOff, Zap, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error(error.message); setLoading(false); return }
    if (data.session) {
      const { data: user } = await supabase.from('users').select('onboarded').eq('id', data.session.user.id).single() as { data: { onboarded: boolean } | null; error: unknown }
      router.push(user && !user.onboarded ? '/onboarding' : '/dashboard')
    }
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/dashboard` } })
    if (error) toast.error(error.message)
  }

  return (
    <>
      <Head><title>Sign In · FahmiFit</title></Head>
      <div className="min-h-screen flex" style={{ background: '#05050f' }}>
        {/* Left: decorative */}
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center relative overflow-hidden p-12"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(139,92,246,0.06) 100%)' }}>
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-20 animate-aurora"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.8), transparent)', filter: 'blur(60px)' }} />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 animate-aurora"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.8), transparent)', filter: 'blur(80px)', animationDelay: '4s' }} />
          <div className="relative z-10 text-center max-w-md">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
              style={{
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                boxShadow: '0 0 60px rgba(16,185,129,0.5)',
              }}>
              <Zap size={36} className="text-white" fill="white" />
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-4 tracking-tight">
              Welcome to <span className="gradient-text">FahmiFit</span>
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed">
              Your personal AI nutrition coach. Track meals, get WhatsApp reminders, and reach your goals faster.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-10">
              {[['50K+','Users'],['2M+','Meals'],['4.9★','Rating']].map(([v,l]) => (
                <div key={l} className="p-4 rounded-2xl text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-2xl font-extrabold gradient-text-green">{v}</p>
                  <p className="text-xs text-gray-500 mt-1">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: form */}
        <div className="flex-1 lg:max-w-md flex flex-col justify-center px-8 py-12">
          <div className="max-w-sm mx-auto w-full">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2.5 mb-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)', boxShadow: '0 0 20px rgba(16,185,129,0.4)' }}>
                <Zap size={18} className="text-white" fill="white" />
              </div>
              <span className="font-extrabold text-xl gradient-text">FahmiFit</span>
            </div>

            <h2 className="text-3xl font-extrabold text-white mb-2">Welcome back</h2>
            <p className="text-gray-500 mb-8">Sign in to continue your nutrition journey</p>

            {/* Google */}
            <button onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200 mb-6"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)' }}>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs text-gray-600 font-medium">or continue with email</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <Input label="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" leftIcon={<Mail size={15} />} required autoComplete="email" />

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Your password"
                    required autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:shadow-[0_0_0_3px_rgba(16,185,129,0.12)]"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                    }}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link href="/auth/forgot-password" className="text-sm text-brand-400 hover:text-brand-300 font-medium transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" loading={loading} fullWidth size="lg">
                Sign in <ChevronRight size={16} />
              </Button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">
                Create one free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
