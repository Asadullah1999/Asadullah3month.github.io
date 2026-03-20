import Head from 'next/head'
import Link from 'next/link'
import { Zap, Home, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function Custom404() {
  return (
    <>
      <Head><title>Page Not Found · FahmiFit</title></Head>
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#05050f' }}>
        {/* Ambient orbs */}
        <div className="fixed top-1/3 left-1/4 w-96 h-96 rounded-full pointer-events-none opacity-10"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.8), transparent)', filter: 'blur(80px)' }} />
        <div className="fixed bottom-1/4 right-1/3 w-80 h-80 rounded-full pointer-events-none opacity-8"
          style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.8), transparent)', filter: 'blur(70px)' }} />

        <div className="text-center relative z-10 max-w-md">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(16,185,129,0.2))',
              border: '1px solid rgba(139,92,246,0.3)',
              boxShadow: '0 0 40px rgba(139,92,246,0.2)',
            }}>
            <Zap size={32} className="text-violet-400" />
          </div>

          <h1 className="text-7xl font-extrabold mb-4" style={{
            background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            404
          </h1>
          <h2 className="text-2xl font-extrabold text-white mb-3">Page not found</h2>
          <p className="text-gray-500 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>

          <div className="flex gap-3 justify-center">
            <Link href="/dashboard">
              <Button>
                <Home size={16} /> Go to Dashboard
              </Button>
            </Link>
            <Link href="/">
              <Button variant="secondary">
                <ArrowLeft size={16} /> Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
