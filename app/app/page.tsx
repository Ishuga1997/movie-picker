'use client'

import { useState, useEffect, useRef } from 'react'
import type { Participant, Movie, StreamingService } from '../types'
import {
  STREAMING_SERVICES, ALL_KNOWN_PROVIDER_IDS, WATCH_REGIONS,
  makeParticipant, ParticipantCard, WatchSection, TMDB_IMG, TMDB_LOGO,
} from '../lib/filters'
import { MovieCard } from './_components/MovieCard'

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
  const [watchedMovies, setWatchedMovies] = useState<Movie[]>([])
  const [hideWatched, setHideWatched] = useLocalStorage<boolean>('vw-hideWatched', true)

  // Load watched from API on mount
  useEffect(() => {
    fetch('/api/watched')
      .then((r) => r.ok ? r.json() : { movies: [] })
      .then(({ movies }: { movies: Movie[] }) => setWatchedMovies(movies))
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dismissedIds = new Set(dismissedArray)
  const setDismissedIds = (next: Set<number>) => setDismissedArray([...next])
  const watchedIds = new Set(watchedMovies.map((m) => m.id))

  const [chosenMovieId, setChosenMovieId] = useState<number | null>(null)
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

  // When hideWatched toggles, recompute shownIds from current allMovies
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    if (allMovies.length === 0) return
    const excluded = new Set([...dismissedIds, ...(hideWatched ? [...watchedIds] : [])])
    const newShown: number[] = []
    for (const m of allMovies) {
      if (newShown.length >= 5) break
      if (!excluded.has(m.id)) newShown.push(m.id)
    }
    setShownIds(newShown)
  }, [hideWatched]) // eslint-disable-line react-hooks/exhaustive-deps

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
      // Read from localStorage directly to avoid stale closure
      const storedWatched = new Set<number>(
        JSON.parse(window.localStorage.getItem('vw-watched') ?? '[]').map((m: Movie) => m.id)
      )
      const hw = JSON.parse(window.localStorage.getItem('vw-hideWatched') ?? 'true') as boolean
      const eligible = hw ? movies.filter((m) => !storedWatched.has(m.id)) : movies
      setShownIds(eligible.slice(0, 5).map((m) => m.id))
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
    setChosenMovieId(null)
    setParticipants((prev) => prev.map((p) => makeParticipant(p.id, p.name)))
  }

  const handleChoose = (movie: Movie) => {
    setChosenMovieId(movie.id)
    // Add to watched without removing from feed
    setWatchedMovies((prev) => [movie, ...prev.filter((m) => m.id !== movie.id)])
    fetch('/api/watched', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(movie) }).catch(() => {})
  }

  const handleUnchoose = (movie: Movie) => {
    setChosenMovieId(null)
    unwatch(movie.id)
  }

  const markWatched = (movie: Movie) => {
    setWatchedMovies((prev) => [movie, ...prev.filter((m) => m.id !== movie.id)])
    fetch('/api/watched', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(movie) }).catch(() => {})
    const newWatchedIds = new Set([...watchedIds, movie.id])
    const newShown = shownIds.filter((id) => id !== movie.id)
    const excluded = new Set([...dismissedIds, ...(hideWatched ? [...newWatchedIds] : [movie.id]), ...newShown])
    const next = allMovies.find((m) => !excluded.has(m.id))
    if (next) newShown.push(next.id)
    setShownIds(newShown)
  }

  const markDismissed = (movieId: number) => {
    const newDismissed = new Set([...dismissedIds, movieId])
    const newShown = shownIds.filter((id) => id !== movieId)
    const excluded = new Set([...newDismissed, ...(hideWatched ? [...watchedIds] : []), ...newShown])
    const next = allMovies.find((m) => !excluded.has(m.id))
    if (next) newShown.push(next.id)
    setDismissedIds(newDismissed)
    setShownIds(newShown)
  }

  const unwatch = (movieId: number) => {
    setWatchedMovies((prev) => prev.filter((m) => m.id !== movieId))
    fetch('/api/watched', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tmdbId: movieId }) }).catch(() => {})
  }

  const shownMovies = shownIds.map((id) => allMovies.find((m) => m.id === id)).filter(Boolean) as Movie[]
  const reserveCount = allMovies.filter(
    (m) => !shownIds.includes(m.id) && !dismissedIds.has(m.id) && (!hideWatched || !watchedIds.has(m.id))
  ).length

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

      <div className="mt-6 flex gap-3 items-center">
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

        {watchedMovies.length > 0 && (
          <label className="ml-auto flex items-center gap-2 cursor-pointer select-none">
            <span className="text-xs text-zinc-500">Hide watched</span>
            <button
              type="button"
              role="switch"
              aria-checked={hideWatched}
              onClick={() => setHideWatched((v) => !v)}
              className={`relative w-9 h-5 rounded-full transition-colors ${hideWatched ? 'bg-amber-500' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${hideWatched ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </label>
        )}
      </div>

      {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
      {isLoading && <div className="mt-12 text-center text-zinc-500 text-sm">Finding the perfect match for your crew...</div>}

      {shownMovies.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <h2 className="text-xl font-semibold text-zinc-100">Top picks for your crew</h2>
            {aiRanked === false && (
              <span className="text-xs text-amber-500/70 border border-amber-500/30 rounded-full px-2.5 py-0.5">sorted by rating · AI unavailable</span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {shownMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                isWatched={watchedIds.has(movie.id)}
                isChosen={chosenMovieId === movie.id}
                hideChoose={chosenMovieId !== null && chosenMovieId !== movie.id}
                onMarkWatched={() => markWatched(movie)}
                onUnwatch={() => unwatch(movie.id)}
                onSkip={() => markDismissed(movie.id)}
                onChoose={() => handleChoose(movie)}
                onUnchoose={() => handleUnchoose(movie)}
              />
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
