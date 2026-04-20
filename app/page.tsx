'use client'

import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'

const FEATURED_MOVIES = [
  { title: "Thunderbolts*", year: 2025, rating: '7.3', poster: '/hqcexYHbiTBfDIdDWxrxPtVndBX.jpg', genre: 'Superhero' },
  { title: "Sinners",       year: 2025, rating: '7.5', poster: '/705nQHqe4JGdEisrQmVYmXyjs1U.jpg', genre: 'Drama' },
  { title: "Mickey 17",     year: 2025, rating: '6.8', poster: '/edKpE9B5qN3e559OuMCLZdW1iBZ.jpg', genre: 'Comedy' },
]

export default function LandingPage() {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto w-full">
        <span className="text-xl font-bold tracking-tight">Vibe Watch</span>
        {session ? (
          <div className="flex items-center gap-3">
            {session.user?.image && (
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
            )}
            <button
              onClick={() => router.push('/app')}
              className="px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Open App
            </button>
          </div>
        ) : (
          <button
            onClick={() => signIn('google', { callbackUrl: '/app' })}
            className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Log in
          </button>
        )}
      </header>

      {/* Hero */}
      <main className="flex-1 max-w-6xl mx-auto px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center py-20">

          {/* Left: text */}
          <div className="space-y-8">
            <h1 className="text-5xl font-bold tracking-tight leading-tight">
              Still spending forever{' '}
              <span className="text-amber-500">choosing what to watch?</span>
            </h1>
            <p className="text-lg text-zinc-400 leading-relaxed">
              Tell Vibe Watch your mood — it considers everyone&apos;s preferences and finds the perfect movie for you and your crew in seconds.
            </p>
            <button
              onClick={() => router.push('/app')}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 text-black font-semibold text-lg hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Find my perfect movie →
            </button>
          </div>

          {/* Right: real TMDB posters */}
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-3 gap-3">
              {FEATURED_MOVIES.map((movie) => (
                <div key={movie.title} className="rounded-xl overflow-hidden aspect-[2/3] relative group">
                  <img
                    src={`${TMDB_IMG}${movie.poster}`}
                    alt={movie.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-xs font-semibold text-white leading-tight">{movie.title}</p>
                    <p className="text-xs text-white/60 mt-0.5">{movie.year} · ★ {movie.rating}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Value props */}
        <div className="grid md:grid-cols-2 gap-6 pb-24">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-3">
            <div className="text-3xl">🎬</div>
            <h3 className="text-xl font-semibold">Watching alone?</h3>
            <p className="text-zinc-400 leading-relaxed">
              Too many options that don&apos;t consider your mood. Just tell Vibe Watch what you&apos;re feeling — it picks movies that match exactly what you&apos;re looking for.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-3">
            <div className="text-3xl">👥</div>
            <h3 className="text-xl font-semibold">Watching with friends?</h3>
            <p className="text-zinc-400 leading-relaxed">
              Everyone wants something different and you endlessly scroll streaming services. Vibe Watch considers everyone&apos;s preferences and finds movies you&apos;ll all enjoy.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
