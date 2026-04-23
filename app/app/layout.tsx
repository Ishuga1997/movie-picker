'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { CookieBanner } from './_components/CookieBanner'

const NAV_ITEMS = [
  { href: '/app', label: 'Main', exact: true },
  { href: '/app/watchlist', label: 'Watchlist', exact: false },
  { href: '/app/saved', label: 'Saved', exact: false },
  { href: '/app/watched', label: 'Watched', exact: false },
]

function AppNav() {
  const { data: session } = useSession()
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/app" className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity">
          <img src="/favicon.svg" alt="" className="w-7 h-7" />
          <span className="text-base font-bold tracking-tight text-zinc-100">Vibe Watch</span>
        </Link>

        <div className="flex items-center gap-1 flex-1">
          {NAV_ITEMS.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>

        {session?.user && (
          <Link href="/app/profile" className="flex items-center gap-2 shrink-0 group">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt=""
                className={`w-8 h-8 rounded-full ring-2 transition-all ${
                  pathname === '/app/profile' ? 'ring-amber-500' : 'ring-transparent group-hover:ring-zinc-600'
                }`}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-300">
                {(session.user.name ?? session.user.email ?? '?')[0].toUpperCase()}
              </div>
            )}
          </Link>
        )}
      </div>
    </nav>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <AppNav />
      {children}
      <CookieBanner />
    </div>
  )
}
