import { NextResponse } from 'next/server'

// ============================================================
// MIDDLEWARE KEAMANAN — simpan sebagai middleware.js di root project
// ============================================================

export function middleware(request) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // ── Security Headers ──────────────────────────────────────
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://app.sandbox.midtrans.com https://app.midtrans.com https://www.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://api.biteship.com https://generativelanguage.googleapis.com https://www.emsifa.com https://kodepos.vercel.app",
      "frame-src https://app.sandbox.midtrans.com https://app.midtrans.com",
    ].join('; ')
  )

  // ── Admin Route Protection ─────────────────────────────────
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('caisy_token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/login?redirect=/admin', request.url))
    }
    // Token validation happens in the API, just check existence here
  }

  // ── Maintenance Mode ──────────────────────────────────────
  // Maintenance mode is handled by the frontend via settings API
  // Admin and API routes are always accessible
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return response
  }

  // ── Webhook route: skip CSRF ──────────────────────────────
  // Midtrans webhook must not be blocked
  if (pathname === '/api/webhook/midtrans') {
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
