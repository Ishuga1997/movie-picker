import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export const proxy = auth(function proxy(req) {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  if (!isLoggedIn && pathname !== '/signin') {
    return NextResponse.redirect(new URL('/signin', req.nextUrl))
  }
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon\\.svg).*)'],
}
