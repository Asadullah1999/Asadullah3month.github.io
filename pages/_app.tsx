import type { AppProps } from 'next/app'
import { Toaster } from 'react-hot-toast'
import '@/styles/globals.css'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#111111',
            color: '#f0f0f0',
            borderRadius: '12px',
            border: '1px solid #1e1e1e',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#06b6d4', secondary: '#0a0a0a' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#0a0a0a' },
          },
        }}
      />
    </>
  )
}
