'use client'

import { useState, useEffect } from 'react'
import type { Movie } from '../../types'
import type { YearFilter } from '../../types'
import { YearFilterControl } from '../../lib/filters'
import { MovieCard } from '../_components/MovieCard'

export default function WatchedPage() {
  const [watchedMovies, setWatchedMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/watched')
      .then((r) => r.ok ? r.json() : { movies: [] })
      .then(({ movies }: { movies: Movie[] }) => setWatchedMovies(movies))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const [titleFilter, setTitleFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'series'>('all')
  const [yearFilter, setYearFilter] = useState<YearFilter>({ mode: 'any' })

  const unwatch = (movieId: number) => {
    setWatchedMovies((prev) => prev.filter((m) => m.id !== movieId))
    fetch('/api/watched', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tmdbId: movieId }) }).catch(() => {})
  }

  const filtered = watchedMovies.filter((m) => {
    if (titleFilter && !m.title.toLowerCase().includes(titleFilter.toLowerCase())) return false
    if (typeFilter !== 'all' && m.mediaType !== typeFilter) return false
    if (yearFilter.mode === 'from' && yearFilter.from != null && m.year < yearFilter.from) return false
    if (yearFilter.mode === 'to' && yearFilter.to != null && m.year > yearFilter.to) return false
    if (yearFilter.mode === 'range') {
      if (yearFilter.from != null && m.year < yearFilter.from) return false
      if (yearFilter.to != null && m.year > yearFilter.to) return false
    }
    if (yearFilter.mode === 'exact' && yearFilter.exact != null && m.year !== yearFilter.exact) return false
    return true
  })

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Watched</h1>
      </div>
      <div className="text-center py-24 text-zinc-600 text-sm">Loading…</div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Watched</h1>
        <p className="text-zinc-500 text-sm">{watchedMovies.length} title{watchedMovies.length !== 1 ? 's' : ''} marked as watched</p>
      </div>

      {watchedMovies.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search by title…"
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            className="px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 w-48"
          />

          <div className="flex rounded-lg overflow-hidden border border-zinc-800">
            {(['all', 'movie', 'series'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-2 text-xs font-medium transition-colors cursor-pointer capitalize ${
                  typeFilter === t ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'Series'}
              </button>
            ))}
          </div>

          <YearFilterControl year={yearFilter} onChange={setYearFilter} />

          {(titleFilter || typeFilter !== 'all' || yearFilter.mode !== 'any') && (
            <button
              type="button"
              onClick={() => { setTitleFilter(''); setTypeFilter('all'); setYearFilter({ mode: 'any' }) }}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {watchedMovies.length === 0 ? (
        <div className="text-center py-24 text-zinc-600">
          <p className="text-lg mb-2">Nothing here yet</p>
          <p className="text-sm">Mark movies as &ldquo;Seen it&rdquo; on the Main tab to build your watched list</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24 text-zinc-600">
          <p className="text-sm">No matches for your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {filtered.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isWatched
              onUnwatch={() => unwatch(movie.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
