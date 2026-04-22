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
  const [watchlistMovies, setWatchlistMovies] = useState<Movie[]>([])
  const [hideWatched, setHideWatched] = useLocalStorage<boolean>('vw-hideWatched', true)
  const [savedDefaultServices, setSavedDefaultServices] = useState<StreamingService[]>([])
  const [saveAsDefault, setSaveAsDefault] = useState(false)
  const [saveSearch, setSaveSearch] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [cardScrollIndex, setCardScrollIndex] = useState(0)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Migrate old localStorage format: region string → regions array
  useEffect(() => {
    setParticipants((prev) => prev.map((p) => {
      if (Array.isArray(p.regions)) return p
      const legacy = (p as unknown as Record<string, unknown>).region as string | undefined
      return { ...p, regions: (legacy && legacy !== 'any' ? [legacy] : []) as import('../types').Region[] }
    }))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load watched, watchlist, and preferences from API on mount
  useEffect(() => {
    fetch('/api/watched')
      .then((r) => r.ok ? r.json() : { movies: [] })
      .then(({ movies }: { movies: Movie[] }) => setWatchedMovies(movies))
      .catch(() => {})
    fetch('/api/watchlist')
      .then((r) => r.ok ? r.json() : { movies: [] })
      .then(({ movies }: { movies: Movie[] }) => setWatchlistMovies(movies))
      .catch(() => {})
    fetch('/api/preferences')
      .then((r) => r.ok ? r.json() : { services: [] })
      .then(({ services }: { services: StreamingService[] }) => {
        setSavedDefaultServices(services)
        // Apply saved defaults if no services selected locally
        if (services.length > 0) {
          setSharedServices((prev) => prev.length === 0 ? services : prev)
        }
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const dismissedIds = new Set(dismissedArray)
  const setDismissedIds = (next: Set<number>) => setDismissedArray([...next])
  const watchedIds = new Set(watchedMovies.map((m) => m.id))
  const watchlistIds = new Set(watchlistMovies.map((m) => m.id))

  const servicesMatchDefaults =
    sharedServices.length === savedDefaultServices.length &&
    sharedServices.every((s) => savedDefaultServices.includes(s))
  const showSaveDefault = sharedServices.length > 0 && !servicesMatchDefaults

  // Auto-check "Save as default" only on first-ever selection (no saved defaults)
  useEffect(() => {
    if (showSaveDefault) setSaveAsDefault(savedDefaultServices.length === 0)
  }, [showSaveDefault]) // eslint-disable-line react-hooks/exhaustive-deps

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

  // Refs so handleFind always sees current values even in stale closures (autorun)
  const watchedIdsRef = useRef(watchedIds)
  const hideWatchedRef = useRef(hideWatched)
  useEffect(() => { watchedIdsRef.current = watchedIds }, [watchedIds])
  useEffect(() => { hideWatchedRef.current = hideWatched }, [hideWatched])

  const handleFind = async () => {
    if (saveSearch) {
      const toSave = participants.map(({ id, name, year, regions, mediaType, contentType, vibe }) => ({ id, name, year, regions, mediaType, contentType, vibe }))
      fetch('/api/searches', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ participants: toSave }) }).catch(() => {})
      setSaveSearch(false)
    }
    if (saveAsDefault && sharedServices.length > 0) {
      fetch('/api/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ services: sharedServices }) })
        .then((r) => r.ok ? setSavedDefaultServices([...sharedServices]) : null)
        .catch(() => {})
    }
    setChosenMovieId(null)
    setCardScrollIndex(0); setCanScrollRight(false)
    if (scrollRef.current) scrollRef.current.scrollLeft = 0
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
      const eligible = hideWatchedRef.current
        ? movies.filter((m) => !watchedIdsRef.current.has(m.id))
        : movies
      setShownIds(eligible.slice(0, 5).map((m) => m.id))
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCleanAll = () => {
    setAllMovies([]); setShownIds([]); setDismissedIds(new Set())
    setAiRanked(null); setError(null); setChosenMovieId(null)
    setParticipants([makeParticipant('1')])
    setCardScrollIndex(0); setCanScrollRight(false)
    if (scrollRef.current) scrollRef.current.scrollLeft = 0
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
    // Remove from watchlist if present
    if (watchlistIds.has(movie.id)) {
      setWatchlistMovies((prev) => prev.filter((m) => m.id !== movie.id))
      fetch('/api/watchlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tmdbId: movie.id }) }).catch(() => {})
    }
  }

  const toggleWatchlist = (movie: Movie) => {
    if (watchlistIds.has(movie.id)) {
      setWatchlistMovies((prev) => prev.filter((m) => m.id !== movie.id))
      fetch('/api/watchlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tmdbId: movie.id }) }).catch(() => {})
    } else {
      setWatchlistMovies((prev) => [movie, ...prev.filter((m) => m.id !== movie.id)])
      fetch('/api/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(movie) }).catch(() => {})
    }
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

  const hasNonDefaultState = participants.length > 1 || participants.some(
    (p) => p.name || p.vibe || p.year.mode !== 'any' || (p.regions ?? []).length > 0 || p.mediaType !== 'any' || p.contentType !== 'any'
  )

  const shownMovies = shownIds.map((id) => allMovies.find((m) => m.id === id)).filter(Boolean) as Movie[]

  const scrollableMovies = allMovies.filter(
    (m) => !dismissedIds.has(m.id) && (!hideWatched || !watchedIds.has(m.id))
  )

  // Initialize canScrollRight after movies load
  useEffect(() => {
    if (scrollableMovies.length === 0) { setCanScrollRight(false); return }
    requestAnimationFrame(() => {
      const el = scrollRef.current
      if (el) setCanScrollRight(el.scrollWidth > el.clientWidth + 1)
    })
  }, [scrollableMovies.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMovieScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const firstCard = el.children[0] as HTMLElement
    const cardW = (firstCard?.offsetWidth ?? 185) + 16
    setCardScrollIndex(Math.round(el.scrollLeft / cardW))
    setCanScrollRight(Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth)
  }

  const scrollMoviesRight = () => {
    const el = scrollRef.current
    if (!el) return
    const cardW = ((el.children[0] as HTMLElement)?.offsetWidth ?? 185) + 16
    el.scrollBy({ left: cardW, behavior: 'smooth' })
  }

  const scrollMoviesLeft = () => {
    const el = scrollRef.current
    if (!el) return
    const cardW = ((el.children[0] as HTMLElement)?.offsetWidth ?? 185) + 16
    el.scrollBy({ left: -cardW, behavior: 'smooth' })
  }

  const scrollToMovieStart = () => {
    scrollRef.current?.scrollTo({ left: 0, behavior: 'smooth' })
  }

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

      {participants.length < 5 && (
        <div className="mt-4">
          <button type="button" onClick={() => setParticipants((prev) => [...prev, makeParticipant(String(Date.now()))])}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors cursor-pointer">
            + Add person
          </button>
        </div>
      )}

      <div className="mt-4">
        <WatchSection
          watchRegion={sharedWatchRegion}
          onChangeRegion={setSharedWatchRegion}
          services={sharedServices}
          onToggleService={(s) => setSharedServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
          onClearServices={() => setSharedServices([])}
        >
          {showSaveDefault && (
            <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setSaveAsDefault((v) => !v)}>
              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-colors ${saveAsDefault ? 'bg-amber-500 border-amber-500' : 'border-zinc-600 bg-transparent'}`}>
                {saveAsDefault && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 3.5L4 6.5L9 1" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className="text-xs text-zinc-500">
                {savedDefaultServices.length === 0 ? 'Save as default' : 'Update default services'}
              </span>
            </label>
          )}
        </WatchSection>
      </div>

      <div className="mt-4 flex gap-3 items-center flex-wrap">
        {allMovies.length > 0 ? (
          <>
            <button type="button" onClick={handleFind} disabled={isLoading} className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">Search again</button>
            <button type="button" onClick={handleCleanAll} className="px-5 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 transition-colors cursor-pointer">Clear all</button>
          </>
        ) : (
          <>
            {hasNonDefaultState && (
              <button type="button" onClick={handleCleanAll}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 transition-colors cursor-pointer">
                Clear all
              </button>
            )}
            <button type="button" onClick={handleFind} disabled={isLoading}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
              {isLoading ? 'Searching...' : "Let's watch"}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => setSaveSearch((v) => !v)}
          className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
            saveSearch
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'bg-transparent text-zinc-500 border-zinc-700 hover:text-zinc-300 hover:border-zinc-500'
          }`}
        >
          {saveSearch ? '✓ Save search' : 'Save search'}
        </button>

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

      {scrollableMovies.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <h2 className="text-xl font-semibold text-zinc-100">Top picks for your crew</h2>
            {aiRanked === false && (
              <span className="text-xs text-amber-500/70 border border-amber-500/30 rounded-full px-2.5 py-0.5">sorted by rating · AI unavailable</span>
            )}
          </div>
          <div className="flex items-stretch gap-2">
            {/* Left arrow column — always reserves width to avoid layout shift */}
            <div className="w-5 shrink-0 flex flex-col justify-center items-center gap-1">
              {cardScrollIndex > 0 && (
                <>
                  <button type="button" onClick={scrollMoviesLeft}
                    className="text-zinc-600 hover:text-zinc-400 transition-colors text-2xl leading-none cursor-pointer">
                    ‹
                  </button>
                  {cardScrollIndex >= 3 && (
                    <button type="button" onClick={scrollToMovieStart}
                      className="text-[10px] text-zinc-700 hover:text-zinc-500 transition-colors cursor-pointer leading-tight text-center">
                      ↩<br />start
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Scrollable cards */}
            <div className="flex-1 overflow-hidden">
              <div
                ref={scrollRef}
                onScroll={handleMovieScroll}
                className="flex gap-4 overflow-x-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {scrollableMovies.map((movie) => (
                  <div
                    key={movie.id}
                    className="shrink-0 w-[calc((100%-1rem)/2)] sm:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-4rem)/5)]"
                  >
                    <MovieCard
                      movie={movie}
                      isWatched={watchedIds.has(movie.id)}
                      isChosen={chosenMovieId === movie.id}
                      isWatchlisted={watchlistIds.has(movie.id)}
                      hideChoose={chosenMovieId !== null && chosenMovieId !== movie.id}
                      onMarkWatched={() => markWatched(movie)}
                      onUnwatch={() => unwatch(movie.id)}
                      onSkip={() => markDismissed(movie.id)}
                      onChoose={() => handleChoose(movie)}
                      onUnchoose={() => handleUnchoose(movie)}
                      onToggleWatchlist={() => toggleWatchlist(movie)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Right arrow column */}
            <div className="w-5 shrink-0 flex items-center justify-center">
              {canScrollRight && (
                <button type="button" onClick={scrollMoviesRight}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors text-2xl leading-none cursor-pointer">
                  ›
                </button>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
