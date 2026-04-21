'use client'

import { useState, useEffect } from 'react'
import type { Movie } from '../../types'
import { MovieCard } from '../_components/MovieCard'

function useWatchedMovies(): [Movie[], (updater: (prev: Movie[]) => Movie[]) => void] {
  const [watched, setWatched] = useState<Movie[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const item = window.localStorage.getItem('vw-watched')
      return item ? (JSON.parse(item) as Movie[]) : []
    } catch { return [] }
  })
  useEffect(() => {
    try { window.localStorage.setItem('vw-watched', JSON.stringify(watched)) } catch {}
  }, [watched])
  return [watched, setWatched]
}

export default function WatchedPage() {
  const [watchedMovies, setWatchedMovies] = useWatchedMovies()

  const [titleFilter, setTitleFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'movie' | 'series'>('all')
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')

  const unwatch = (movieId: number) => {
    setWatchedMovies((prev) => prev.filter((m) => m.id !== movieId))
  }

  const filtered = watchedMovies.filter((m) => {
    if (titleFilter && !m.title.toLowerCase().includes(titleFilter.toLowerCase())) return false
    if (typeFilter !== 'all' && m.mediaType !== typeFilter) return false
    if (yearFrom && m.year < parseInt(yearFrom)) return false
    if (yearTo && m.year > parseInt(yearTo)) return false
    return true
  })

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

          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="From year"
              value={yearFrom}
              onChange={(e) => setYearFrom(e.target.value)}
              className="w-24 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
            <span className="text-zinc-600 text-sm">–</span>
            <input
              type="number"
              placeholder="To year"
              value={yearTo}
              onChange={(e) => setYearTo(e.target.value)}
              className="w-24 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            />
          </div>

          {(titleFilter || typeFilter !== 'all' || yearFrom || yearTo) && (
            <button
              type="button"
              onClick={() => { setTitleFilter(''); setTypeFilter('all'); setYearFrom(''); setYearTo('') }}
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
