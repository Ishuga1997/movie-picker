'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import type { Participant, StreamingService } from './types'
import {
  TMDB_IMG, WATCH_REGIONS, makeParticipant,
  ParticipantCard, WatchSection,
} from './lib/filters'

const FEATURED_MOVIES = [
  { title: "Thunderbolts*", year: 2025, rating: '7.3', poster: '/hqcexYHbiTBfDIdDWxrxPtVndBX.jpg', genre: 'Superhero' },
  { title: "Sinners",       year: 2025, rating: '7.5', poster: '/705nQHqe4JGdEisrQmVYmXyjs1U.jpg', genre: 'Drama' },
  { title: "Mickey 17",     year: 2025, rating: '6.8', poster: '/edKpE9B5qN3e559OuMCLZdW1iBZ.jpg', genre: 'Comedy' },
]

const BLURRED_POSTERS = [
  '/hqcexYHbiTBfDIdDWxrxPtVndBX.jpg',
  '/705nQHqe4JGdEisrQmVYmXyjs1U.jpg',
  '/edKpE9B5qN3e559OuMCLZdW1iBZ.jpg',
  '/41dfWUWtg1kUZcJYe6Zk6ewxzMu.jpg',
  '/vqBmyAj0Xm9LnS1xe1MSlMAJyHq.jpg',
]

export default function LandingPage() {
  const { data: session } = useSession()
  const router = useRouter()

  // Screen: 'hero' | 'filters' | 'results'
  const [screen, setScreen] = useState<'hero' | 'filters' | 'results'>('hero')

  // Filter state (mirrors app's localStorage keys, saved on Find)
  const [participant, setParticipant] = useState<Participant>(() => makeParticipant('1'))
  const [watchRegion, setWatchRegion] = useState('US')
  const [services, setServices] = useState<StreamingService[]>([])

  const filtersRef = useRef<HTMLDivElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  // Fix 3: auto-detect country via IP on first load
  useEffect(() => {
    fetch('/api/geo')
      .then((r) => r.json())
      .then(({ country }: { country: string }) => {
        const validCode = WATCH_REGIONS.find((r) => r.code === country)?.code ?? 'US'
        setWatchRegion(validCode)
      })
      .catch(() => {})
  }, [])

  const handleHeroCTA = () => {
    if (session) { router.push('/app'); return }
    setScreen('filters')
    scrollTo(filtersRef)
  }

  // Save filters to localStorage (same keys the app uses) and set autorun flag
  const handleFind = () => {
    try {
      localStorage.setItem('vw-participants', JSON.stringify([{ ...participant, watchRegion, streamingServices: services }]))
      localStorage.setItem('vw-watchRegion', JSON.stringify(watchRegion))
      localStorage.setItem('vw-services', JSON.stringify(services))
      localStorage.setItem('vw-autorun', 'true')
    } catch {}
    setScreen('results')
    scrollTo(resultsRef)
  }

  const handleSignIn = () => signIn('google', { callbackUrl: '/app' })

  return (
    <div className="bg-zinc-950 text-zinc-100">

      {/* ── SCREEN 1: Hero ──────────────────────────────────────────────────── */}
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto w-full">
          <span className="text-xl font-bold tracking-tight">Vibe Watch</span>
          {session ? (
            <div className="flex items-center gap-3">
              {session.user?.image && <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />}
              <button onClick={() => router.push('/app')} className="px-4 py-2 rounded-lg bg-amber-500 text-black text-sm font-semibold hover:bg-amber-400 transition-colors cursor-pointer">Open App</button>
            </div>
          ) : (
            <button onClick={() => signIn('google', { callbackUrl: '/app' })} className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 text-sm font-medium hover:bg-zinc-800 transition-colors cursor-pointer">Log in</button>
          )}
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-8 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center py-20">
            <div className="space-y-8">
              <h1 className="text-5xl font-bold tracking-tight leading-tight">
                Still spending forever{' '}
                <span className="text-amber-500">choosing what to watch?</span>
              </h1>
              <p className="text-lg text-zinc-400 leading-relaxed">
                Tell Vibe Watch your mood — it considers everyone&apos;s preferences and finds the perfect watch for you and your crew in seconds
              </p>
              <button onClick={handleHeroCTA} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-amber-500 text-black font-semibold text-lg hover:bg-amber-400 transition-colors cursor-pointer">
                Find my perfect watch →
              </button>
            </div>
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-3 gap-3">
                {FEATURED_MOVIES.map((movie) => (
                  <div key={movie.title} className="rounded-xl overflow-hidden aspect-[2/3] relative">
                    <img src={`${TMDB_IMG}${movie.poster}`} alt={movie.title} className="w-full h-full object-cover" />
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

          <div className="grid md:grid-cols-2 gap-6 pb-24">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-3">
              <div className="text-3xl">🎬</div>
              <h3 className="text-xl font-semibold">Watching alone?</h3>
              <p className="text-zinc-400 leading-relaxed">Too many options that don&apos;t consider your mood. Just tell Vibe Watch what you&apos;re feeling — it picks movies that match exactly what you&apos;re looking for</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 space-y-3">
              <div className="text-3xl">👥</div>
              <h3 className="text-xl font-semibold">Watching with friends?</h3>
              <p className="text-zinc-400 leading-relaxed">Everyone wants something different and you endlessly scroll streaming services. Vibe Watch considers everyone&apos;s preferences and finds movies you&apos;ll all enjoy</p>
            </div>
          </div>
        </main>
      </div>

      {/* ── SCREEN 2: Filters ───────────────────────────────────────────────── */}
      {screen !== 'hero' && (
        <div ref={filtersRef} className="min-h-screen flex flex-col justify-center py-20 border-t border-zinc-800/50">
          <div className="max-w-2xl mx-auto px-8 w-full space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">What are you in the mood for?</h2>
              <p className="text-zinc-500">Set your preferences and we&apos;ll find the perfect match</p>
            </div>
            <ParticipantCard
              participant={participant}
              index={0}
              onChange={setParticipant}
              onRemove={() => {}}
              canRemove={false}
            />
            <WatchSection
              watchRegion={watchRegion}
              onChangeRegion={setWatchRegion}
              services={services}
              onToggleService={(s) => setServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
              onClearServices={() => setServices([])}
            />
            <button
              onClick={handleFind}
              className="w-full py-3.5 rounded-xl bg-amber-500 text-black font-semibold text-lg hover:bg-amber-400 transition-colors cursor-pointer"
            >
              Find my perfect watch →
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN 3: Blurred results + sign-in CTA ─────────────────────────── */}
      {screen === 'results' && (
        <div ref={resultsRef} className="min-h-screen flex flex-col justify-center py-20 border-t border-zinc-800/50">
          <div className="max-w-5xl mx-auto px-8 w-full space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tight">We found your perfect picks!</h2>
              <p className="text-zinc-500">Sign in to see your personalised results</p>
            </div>

            {/* Blurred cards with overlay */}
            <div className="relative">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 select-none pointer-events-none">
                {BLURRED_POSTERS.map((poster, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden aspect-[2/3] bg-zinc-800">
                    <img
                      src={`${TMDB_IMG}${poster}`}
                      alt=""
                      className="w-full h-full object-cover blur-xl scale-110"
                    />
                  </div>
                ))}
              </div>
              {/* Sign-in overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-zinc-950/60 rounded-2xl backdrop-blur-sm">
                <div className="text-center space-y-2">
                  <div className="text-4xl">🔒</div>
                  <p className="text-xl font-semibold text-zinc-100">Sign in to reveal your results</p>
                  <p className="text-sm text-zinc-400">Your preferences are saved — no need to re-enter them</p>
                </div>
                <button
                  onClick={handleSignIn}
                  className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-white text-zinc-900 font-medium text-sm hover:bg-zinc-100 transition-colors cursor-pointer shadow-lg"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
