import { useEffect, useRef } from 'react'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'
import ChatBotWidget from '@/components/chatbot/ChatBotWidget'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const mainRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleRouteChange = () => {
      if (mainRef.current) {
        mainRef.current.style.opacity = '0'
        mainRef.current.style.transform = 'translateY(10px)'
      }
    }
    const handleRouteComplete = () => {
      if (mainRef.current) {
        mainRef.current.style.transition = 'opacity 0.28s ease, transform 0.28s ease'
        mainRef.current.style.opacity = '1'
        mainRef.current.style.transform = 'translateY(0)'
      }
    }

    router.events.on('routeChangeStart', handleRouteChange)
    router.events.on('routeChangeComplete', handleRouteComplete)
    router.events.on('routeChangeError', handleRouteComplete)

    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
      router.events.off('routeChangeComplete', handleRouteComplete)
      router.events.off('routeChangeError', handleRouteComplete)
    }
  }, [router])

  return (
    <>
      <div ref={mainRef} style={{ opacity: 1, transform: 'translateY(0)' }}>
        <Component {...pageProps} />
      </div>
      <ChatBotWidget />
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(10,10,20,0.95)',
            color: '#f0f0f0',
            borderRadius: '14px',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(16,185,129,0.1)',
            fontSize: '14px',
            fontWeight: 500,
            backdropFilter: 'blur(20px)',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#0a0a0a' },
            style: {
              border: '1px solid rgba(16,185,129,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(16,185,129,0.15)',
            },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0a0a0a' },
            style: {
              border: '1px solid rgba(239,68,68,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 20px rgba(239,68,68,0.15)',
            },
          },
        }}
      />
    </>
  )
}
