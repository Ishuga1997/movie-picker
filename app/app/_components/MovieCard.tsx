'use client'

import { useState, useEffect } from 'react'
import type { Movie } from '../../types'
import { STREAMING_SERVICES, ALL_KNOWN_PROVIDER_IDS, TMDB_IMG, TMDB_LOGO } from '../../lib/filters'

function ProvidersSection({ providers, forceOpen }: { providers: NonNullable<Movie['providers']>; forceOpen?: boolean }) {
  const [open, setOpen] = useState(false)
  const seenServices = new Set<string>()

  useEffect(() => {
    if (forceOpen) setOpen(true)
  }, [forceOpen])

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
      <div className={`overflow-hidden transition-[max-height] duration-200 ease-in-out ${open ? 'max-h-40' : 'max-h-0'}`}>
        <div className="mt-2 flex flex-wrap gap-2">
          {deduped.map(({ provider: p, service }) => (
            <a key={service.id} href={service.url} target="_blank" rel="noopener noreferrer" title={p.name}
              className="block rounded-lg overflow-hidden w-8 h-8 hover:ring-2 hover:ring-amber-500 transition-all">
              <img src={`${TMDB_LOGO}${p.logoPath}`} alt={p.name} className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

interface MovieCardProps {
  movie: Movie
  isWatched?: boolean
  isChosen?: boolean
  isWatchlisted?: boolean
  hideChoose?: boolean
  onMarkWatched?: () => void
  onUnwatch?: () => void
  onSkip?: () => void
  onChoose?: () => void
  onUnchoose?: () => void
  onToggleWatchlist?: () => void
}

export function MovieCard({ movie, isWatched, isChosen, isWatchlisted, hideChoose, onMarkWatched, onUnwatch, onSkip, onChoose, onUnchoose, onToggleWatchlist }: MovieCardProps) {
  const [expanded, setExpanded] = useState(false)

  const filteredProviders = (movie.providers ?? []).filter((p) => ALL_KNOWN_PROVIDER_IDS.has(p.id))

  return (
    <div className={`bg-zinc-900 border rounded-2xl flex flex-col transition-colors ${isChosen ? 'border-amber-500 shadow-lg shadow-amber-500/10' : 'border-zinc-800'}`}>
      <div className="relative aspect-[2/3] bg-zinc-800 overflow-hidden rounded-t-2xl">
        {movie.posterPath ? (
          <img src={`${TMDB_IMG}${movie.posterPath}`} alt={movie.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">No poster</div>
        )}
        <span className="absolute top-2 right-2 bg-black/70 text-zinc-300 text-xs px-2 py-0.5 rounded-full">
          {movie.mediaType === 'series' ? 'Series' : 'Movie'}
        </span>
        {isChosen && (
          <span className="absolute top-2 left-2 bg-amber-500 text-black text-xs px-2 py-0.5 rounded-full font-semibold">
            Tonight
          </span>
        )}
        {!isChosen && isWatched && (
          <span className="absolute top-2 left-2 bg-amber-500/90 text-black text-xs px-2 py-0.5 rounded-full font-medium">
            ✓
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-2">
        <div>
          <a href={movie.tmdbUrl} target="_blank" rel="noopener noreferrer"
            className="font-semibold text-zinc-100 leading-snug hover:text-amber-400 transition-colors">
            {movie.title}
          </a>
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

        <div className="mt-auto flex flex-col gap-2">
          {isChosen ? (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-center">
              <p className="text-sm font-semibold text-amber-400">Tonight&apos;s pick!</p>
              <p className="text-xs text-zinc-500 mt-0.5">Enjoy the show</p>
            </div>
          ) : (
            !hideChoose && onChoose && (
              <button type="button" onClick={onChoose}
                className="w-full py-2 rounded-lg text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-colors cursor-pointer">
                Choose this
              </button>
            )
          )}

          {filteredProviders.length > 0 && (
            <ProvidersSection providers={filteredProviders} forceOpen={isChosen} />
          )}

          <div className="pt-1 flex flex-col gap-1.5">
          {isChosen ? (
            onUnchoose && (
              <button type="button" onClick={onUnchoose}
                className="py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors cursor-pointer">
                Changed my mind
              </button>
            )
          ) : (
            <>
              {onToggleWatchlist && (
                <button type="button" onClick={onToggleWatchlist}
                  className={`py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isWatchlisted
                      ? 'bg-zinc-800 text-amber-500/70 hover:bg-amber-900/30 hover:text-amber-400'
                      : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300'
                  }`}>
                  {isWatchlisted ? 'Remove from watchlist' : 'Watch later'}
                </button>
              )}
              {isWatched ? (
                onUnwatch && (
                  <button type="button" onClick={onUnwatch}
                    className="py-2 rounded-lg text-sm font-medium bg-zinc-800 text-amber-500/70 hover:bg-amber-900/30 hover:text-amber-400 transition-colors cursor-pointer">
                    Unwatch
                  </button>
                )
              ) : (
                onMarkWatched && (
                  <button type="button" onClick={onMarkWatched}
                    className="py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 transition-colors cursor-pointer">
                    Seen it
                  </button>
                )
              )}
              {onSkip && (
                <button type="button" onClick={onSkip}
                  className="py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-500 hover:bg-red-900/40 hover:text-red-400 transition-colors cursor-pointer">
                  Not interested
                </button>
              )}
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  )
}
