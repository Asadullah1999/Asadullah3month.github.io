import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/checkin',
  '/progress',
  '/ai-chat',
  '/profile',
  '/settings',
  '/meal-scanner',
  '/barcode-scanner',
  '/grocery-list',
  '/whatsapp',
  '/reminders',
  '/workout',
  '/weight-log',
  '/sleep',
  '/admin',
]

// Routes that are always public
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/forgot-password',
  '/pricing',
]

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  // Skip API routes and static files
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/') || pathname.includes('.')) {
    return res
  }

  // Skip public routes
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return res
  }

  // Check if this is a protected route
  const isProtected = PROTECTED_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
  if (!isProtected) {
    return res
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => {
              res.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  } catch {
    // If middleware auth check fails, let the page-level auth handle it
    return res
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
