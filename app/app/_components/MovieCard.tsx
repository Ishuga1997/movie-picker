'use client'

import { useState } from 'react'
import type { Movie } from '../../types'
import { STREAMING_SERVICES, ALL_KNOWN_PROVIDER_IDS, TMDB_IMG, TMDB_LOGO } from '../../lib/filters'

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

interface MovieCardProps {
  movie: Movie
  isWatched?: boolean
  onMarkWatched?: () => void
  onUnwatch?: () => void
  onSkip?: () => void
}

export function MovieCard({ movie, isWatched, onMarkWatched, onUnwatch, onSkip }: MovieCardProps) {
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
        {isWatched && (
          <span className="absolute top-2 left-2 bg-amber-500/90 text-black text-xs px-2 py-0.5 rounded-full font-medium">
            ✓
          </span>
        )}
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
        </div>
      </div>
    </div>
  )
}
