'use client'

import { useState, useEffect } from 'react'
import type { Participant, Movie, StreamingService } from '../types'
import {
  STREAMING_SERVICES, ALL_KNOWN_PROVIDER_IDS, WATCH_REGIONS,
  makeParticipant, ParticipantCard, WatchSection, TMDB_IMG, TMDB_LOGO,
} from '../lib/filters'

// ── Movie card ───────────────────────────────────────────────────────────────

function ProvidersSection({ providers }: { providers: NonNullable<Movie['providers']> }) {
  const [open, setOpen] = useState(false)
  const seenServices = new Set<string>()
  const deduped = providers.reduce<{ provider: typeof providers[number]; service: typeof STREAMING_SERVICES[number] }[]>((acc, p) => {
    const service = STREAMING_SERVICES.find((s) => s.providerIds.includes(p.id))
    if (service && !seenServices.has(service.id)) {
      seenServices.add(service.id)
      acc.push({ provider: p, service })
    }
    return acc
  }, [])
  if (deduped.length === 0) return null
  return (
    <div className="border-t border-zinc-800 pt-2">
      <button type="button" onClick={() => setOpen((v) => !v)} className="text-xs text-zinc-600 hover:text-amber-500 transition-colors cursor-pointer">
        Where to watch {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="mt-2 flex flex-wrap gap-2">
          {deduped.map(({ provider: p, service }) => (
            <a key={service.id} href={service.url} target="_blank" rel="noopener noreferrer" title={p.name}
              className="block rounded-lg overflow-hidden w-8 h-8 hover:ring-2 hover:ring-amber-500 transition-all">
              <img src={`${TMDB_LOGO}${p.logoPath}`} alt={p.name} className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function MovieCard({ movie, onSeen, onSkip }: { movie: Movie; onSeen: () => void; onSkip: () => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
      <div className="relative aspect-[2/3] bg-zinc-800">
        {movie.posterPath ? (
          <img src={`${TMDB_IMG}${movie.posterPath}`} alt={movie.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">No poster</div>
        )}
        <span className="absolute top-2 right-2 bg-black/70 text-zinc-300 text-xs px-2 py-0.5 rounded-full">
          {movie.mediaType === 'series' ? 'Series' : 'Movie'}
        </span>
      </div>
      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <h3 className="font-semibold text-zinc-100 leading-snug">{movie.title}</h3>
          <div className="flex items-center gap-2">
            <p className="text-sm text-zinc-500">{movie.year}</p>
            {movie.rating && <span className="text-xs font-medium text-amber-500">★ {movie.rating}</span>}
          </div>
          {movie.director && <p className="text-xs text-zinc-500 mt-0.5">Dir. {movie.director}</p>}
          {movie.cast && movie.cast.length > 0 && <p className="text-xs text-zinc-600 mt-0.5">{movie.cast.join(', ')}</p>}
        </div>
        {movie.overview && (
          <div>
            <p className={`text-sm text-zinc-400 leading-relaxed ${expanded ? '' : 'line-clamp-4'}`}>{movie.overview}</p>
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-xs text-zinc-600 hover:text-amber-500 transition-colors cursor-pointer">
              {expanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        )}
        {movie.providers && movie.providers.length > 0 && (
          <ProvidersSection providers={movie.providers.filter((p) => ALL_KNOWN_PROVIDER_IDS.has(p.id))} />
        )}
        <div className="mt-auto pt-3 flex flex-col gap-1.5">
          <a href={movie.tmdbUrl} target="_blank" rel="noopener noreferrer"
            className="text-center py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors">
            View on TMDB
          </a>
          <button type="button" onClick={onSeen} className="py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 transition-colors cursor-pointer">Seen it</button>
          <button type="button" onClick={onSkip} className="py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-500 hover:bg-red-900/40 hover:text-red-400 transition-colors cursor-pointer">Not interested</button>
        </div>
      </div>
    </div>
  )
}

// ── Persistence ──────────────────────────────────────────────────────────────

function useLocalStorage<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try {
      const item = window.localStorage.getItem(key)
      return item !== null ? (JSON.parse(item) as T) : initial
    } catch { return initial }
  })
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }, [key, value])
  return [value, setValue]
}

// ── Page ─────────────────────────────────────────────────────────────────────


export default function Home() {
  const [participants, setParticipants] = useLocalStorage<Participant[]>('vw-participants', [makeParticipant('1')])
  const [sharedWatchRegion, setSharedWatchRegion] = useLocalStorage<string>('vw-watchRegion', 'US')
  const [sharedServices, setSharedServices] = useLocalStorage<StreamingService[]>('vw-services', [])
  const [allMovies, setAllMovies] = useLocalStorage<Movie[]>('vw-movies', [])
  const [shownIds, setShownIds] = useLocalStorage<number[]>('vw-shown', [])
  const [dismissedArray, setDismissedArray] = useLocalStorage<number[]>('vw-dismissed', [])
  const [aiRanked, setAiRanked] = useLocalStorage<boolean | null>('vw-aiRanked', null)

  const dismissedIds = new Set(dismissedArray)
  const setDismissedIds = (next: Set<number>) => setDismissedArray([...next])

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage.getItem('vw-watchRegion') !== null) return
    fetch('/api/geo')
      .then((r) => r.json())
      .then(({ country }: { country: string }) => {
        const validCode = WATCH_REGIONS.find((r) => r.code === country)?.code ?? 'US'
        setSharedWatchRegion(validCode)
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFind = async () => {
    setIsLoading(true)
    setError(null)
    setAiRanked(null)
    setAllMovies([])
    setShownIds([])
    setDismissedIds(new Set())
    try {
      const res = await fetch('/api/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participants: participants.map((p) => ({
            ...p,
            watchRegion: sharedWatchRegion,
            streamingServices: sharedServices,
          })),
        }),
      })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      const movies: Movie[] = data.movies ?? []
      if (movies.length === 0) { setError('No movies found. Try broadening your preferences.'); return }
      setAiRanked(data.aiRanked ?? false)
      setAllMovies(movies)
      setShownIds(movies.slice(0, 5).map((m) => m.id))
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-run search if redirected from landing page after sign-in
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage.getItem('vw-autorun') === 'true') {
      window.localStorage.removeItem('vw-autorun')
      handleFind()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleReset = () => {
    setAllMovies([]); setShownIds([]); setDismissedIds(new Set())
    setAiRanked(null); setError(null); setSharedServices([])
    setParticipants((prev) => prev.map((p) => makeParticipant(p.id, p.name)))
  }

  const replaceMovie = (movieId: number) => {
    const newDismissed = new Set([...dismissedIds, movieId])
    const newShown = shownIds.filter((id) => id !== movieId)
    const next = allMovies.find((m) => !shownIds.includes(m.id) && !newDismissed.has(m.id))
    if (next) newShown.push(next.id)
    setDismissedIds(newDismissed)
    setShownIds(newShown)
  }

  const shownMovies = shownIds.map((id) => allMovies.find((m) => m.id === id)).filter(Boolean) as Movie[]
  const reserveCount = allMovies.filter((m) => !shownIds.includes(m.id) && !dismissedIds.has(m.id)).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="mb-10 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-zinc-100">Vibe Watch</h1>
            <p className="mt-2 text-zinc-500 text-base">Great picks for every vibe in the room</p>
        </header>

        <div className="space-y-4">
          {participants.map((p, i) => (
            <ParticipantCard key={p.id} participant={p} index={i}
              onChange={(updated) => setParticipants((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
              onRemove={() => setParticipants((prev) => prev.filter((x) => x.id !== p.id))}
              canRemove={participants.length > 1}
            />
          ))}
        </div>

        <div className="mt-4">
          <WatchSection
            watchRegion={sharedWatchRegion}
            onChangeRegion={setSharedWatchRegion}
            services={sharedServices}
            onToggleService={(s) => setSharedServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
            onClearServices={() => setSharedServices([])}
          />
        </div>

        <div className="mt-6 flex gap-3">
          {participants.length < 5 && allMovies.length === 0 && (
            <button type="button" onClick={() => setParticipants((prev) => [...prev, makeParticipant(String(Date.now()))])}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors cursor-pointer">
              + Add person
            </button>
          )}
          {allMovies.length > 0 ? (
            <button type="button" onClick={handleReset} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors cursor-pointer">Reset</button>
          ) : (
            <button type="button" onClick={handleFind} disabled={isLoading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {isLoading ? 'Searching...' : "Let's watch"}
            </button>
          )}
        </div>

        {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
        {isLoading && <div className="mt-12 text-center text-zinc-500 text-sm">Finding the perfect match for your crew...</div>}

        {shownMovies.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-semibold text-zinc-100">Top picks for your crew</h2>
              {aiRanked === false && (
                <span className="text-xs text-amber-500/70 border border-amber-500/30 rounded-full px-2.5 py-0.5">sorted by rating · AI unavailable</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {shownMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} onSeen={() => replaceMovie(movie.id)} onSkip={() => replaceMovie(movie.id)} />
              ))}
            </div>
            {reserveCount > 0 && (
              <p className="mt-4 text-center text-zinc-600 text-sm">{reserveCount} more options in reserve</p>
            )}
          </section>
        )}
    </div>
  )
}
