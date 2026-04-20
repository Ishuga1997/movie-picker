'use client'

import { useState, useRef, useEffect } from 'react'
import type { Participant, Movie, Region, MediaType, ContentType, YearMode, StreamingService } from './types'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w342'

const TMDB_LOGO = 'https://image.tmdb.org/t/p/original'

const STREAMING_SERVICES: { id: StreamingService; name: string; url: string; logo: string; providerIds: number[] }[] = [
  { id: 'netflix',   name: 'Netflix',    url: 'https://netflix.com',         logo: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg', providerIds: [8] },
  { id: 'prime',     name: 'Prime',      url: 'https://primevideo.com',      logo: '/pvske1MyAoymrs5bguRfVqYiM9a.jpg',  providerIds: [9] },
  { id: 'disney',    name: 'Disney+',    url: 'https://disneyplus.com',      logo: '/97yvRBw1GzX7fXprcF80er19ot.jpg',  providerIds: [337] },
  { id: 'apple',     name: 'Apple TV+',  url: 'https://tv.apple.com',        logo: '/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg', providerIds: [350] },
  { id: 'paramount', name: 'Paramount+', url: 'https://paramountplus.com',   logo: '/fts6X10Jn4QT0X6ac3udKEn2tJA.jpg', providerIds: [2303, 2616] },
  { id: 'hbo',       name: 'Max',        url: 'https://www.max.com',         logo: '/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg', providerIds: [384, 1899] },
]

const ALL_KNOWN_PROVIDER_IDS = new Set(STREAMING_SERVICES.flatMap((s) => s.providerIds))

const WATCH_REGIONS = [
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'IE', name: 'Ireland' },
  { code: 'DE', name: 'Germany' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgium' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'ES', name: 'Spain' },
  { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'HU', name: 'Hungary' },
  { code: 'RO', name: 'Romania' },
  { code: 'GR', name: 'Greece' },
  { code: 'TR', name: 'Turkey' },
  { code: 'RU', name: 'Russia' },
  { code: 'IN', name: 'India' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'SG', name: 'Singapore' },
  { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'EG', name: 'Egypt' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'UAE' },
  { code: 'IL', name: 'Israel' },
]

function makeParticipant(id: string, watchRegion = 'US'): Participant {
  return { id, year: { mode: 'any' }, region: 'any', mediaType: 'any', contentType: 'any', streamingServices: [], watchRegion, vibe: '' }
}

// ── Pill ────────────────────────────────────────────────────────────────────

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer select-none ${
        active
          ? 'bg-amber-500 text-black'
          : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  )
}

// ── Year input with amber arrows ─────────────────────────────────────────────

function YearInput({
  value,
  placeholder,
  onChange,
}: {
  value: number | undefined
  placeholder: string
  onChange: (v: number | undefined) => void
}) {
  const clamp = (v: number) => Math.max(1900, Math.min(2030, v))
  const step = (dir: 1 | -1) => onChange(clamp((value ?? (dir === 1 ? 1999 : 2025)) + dir))

  return (
    <div className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-800 focus-within:border-amber-500 overflow-hidden">
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); step(-1) }}
        className="px-2.5 py-1.5 text-amber-500 hover:bg-zinc-700 transition-colors cursor-pointer select-none font-bold"
      >
        ‹
      </button>
      <input
        type="number"
        placeholder={placeholder}
        min={1900}
        max={2030}
        value={value ?? ''}
        onChange={(e) => onChange(parseInt(e.target.value) || undefined)}
        className="w-16 py-1.5 bg-transparent text-zinc-100 text-sm text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onMouseDown={(e) => { e.preventDefault(); step(1) }}
        className="px-2.5 py-1.5 text-amber-500 hover:bg-zinc-700 transition-colors cursor-pointer select-none font-bold"
      >
        ›
      </button>
    </div>
  )
}

// ── Year filter ──────────────────────────────────────────────────────────────

function YearFilter({
  year,
  onChange,
}: {
  year: Participant['year']
  onChange: (y: Participant['year']) => void
}) {
  const modes: { value: YearMode; label: string }[] = [
    { value: 'any', label: 'Any' },
    { value: 'from', label: 'From' },
    { value: 'to', label: 'Until' },
    { value: 'range', label: 'Range' },
    { value: 'exact', label: 'Exact' },
  ]

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => (
          <Pill key={m.value} active={year.mode === m.value} onClick={() => onChange({ mode: m.value })}>
            {m.label}
          </Pill>
        ))}
      </div>
      {year.mode !== 'any' && (
        <div className="flex gap-2 items-center">
          {(year.mode === 'from' || year.mode === 'range') && (
            <YearInput
              value={year.from}
              placeholder="From"
              onChange={(v) => onChange({ ...year, from: v })}
            />
          )}
          {year.mode === 'range' && <span className="text-zinc-600">—</span>}
          {(year.mode === 'to' || year.mode === 'range') && (
            <YearInput
              value={year.to}
              placeholder="Until"
              onChange={(v) => onChange({ ...year, to: v })}
            />
          )}
          {year.mode === 'exact' && (
            <YearInput
              value={year.exact}
              placeholder="Year"
              onChange={(v) => onChange({ ...year, exact: v })}
            />
          )}
        </div>
      )}
    </div>
  )
}

// ── Country select ───────────────────────────────────────────────────────────

function flagEmoji(code: string) {
  return String.fromCodePoint(...code.split('').map((c) => 0x1f1e6 + c.toUpperCase().charCodeAt(0) - 65))
}

const SORTED_REGIONS = [...WATCH_REGIONS].sort((a, b) => a.name.localeCompare(b.name))

function CountrySelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const search = useRef<{ text: string; timer: ReturnType<typeof setTimeout> | null }>({ text: '', timer: null })

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function scrollToMatch(key: string) {
    const s = search.current
    if (s.timer) clearTimeout(s.timer)
    s.text += key.toLowerCase()
    s.timer = setTimeout(() => { s.text = '' }, 800)
    const match = SORTED_REGIONS.find((r) => r.name.toLowerCase().startsWith(s.text))
    if (match) {
      listRef.current?.querySelector<HTMLElement>(`[data-code="${match.code}"]`)?.scrollIntoView({ block: 'nearest' })
    }
  }

  const selected = SORTED_REGIONS.find((r) => r.code === value) ?? SORTED_REGIONS[0]

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer outline-none"
      >
        <span className="text-base leading-none">{flagEmoji(selected.code)}</span>
        <span>{selected.name}</span>
        <span className="text-zinc-500 text-xs ml-0.5">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          {/* Hidden input captures keyboard so typeahead works regardless of which element has focus */}
          <input
            autoFocus
            readOnly
            value=""
            className="sr-only"
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setOpen(false); return }
              if (e.key.length === 1) scrollToMatch(e.key)
            }}
          />
          <div ref={listRef} className="absolute left-0 top-full mt-1 z-50 w-64 max-h-72 overflow-y-auto rounded-xl bg-zinc-800 border border-zinc-700 shadow-xl">
            {SORTED_REGIONS.map((r) => (
              <button
                key={r.code}
                data-code={r.code}
                type="button"
                onMouseDown={(e) => { e.preventDefault() }}
                onClick={() => { onChange(r.code); setOpen(false) }}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-zinc-700 transition-colors ${
                  r.code === value ? 'text-amber-500' : 'text-zinc-200'
                }`}
              >
                <span className="text-base leading-none">{flagEmoji(r.code)}</span>
                <span>{r.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Participant card ─────────────────────────────────────────────────────────

function ParticipantCard({
  participant,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  participant: Participant
  index: number
  onChange: (p: Participant) => void
  onRemove: () => void
  canRemove: boolean
}) {
  const regions: { value: Region; label: string }[] = [
    { value: 'any', label: 'Anywhere' },
    { value: 'usa_uk', label: 'USA / UK' },
    { value: 'europe', label: 'Europe' },
    { value: 'asia', label: 'Asia' },
    { value: 'india', label: 'India' },
  ]

  const mediaTypes: { value: MediaType; label: string }[] = [
    { value: 'any', label: 'Either' },
    { value: 'movie', label: 'Movie' },
    { value: 'series', label: 'Series' },
  ]

  const contentTypes: { value: ContentType; label: string }[] = [
    { value: 'any', label: 'Either' },
    { value: 'live', label: 'Live-action' },
    { value: 'animation', label: 'Animation' },
  ]

  const [editingName, setEditingName] = useState(false)
  const displayName = participant.name ?? `Person ${index + 1}`

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        {editingName ? (
          <input
            autoFocus
            value={participant.name ?? ''}
            placeholder={`Person ${index + 1}`}
            onChange={(e) => onChange({ ...participant, name: e.target.value })}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditingName(false) }}
            className="text-base font-semibold text-zinc-100 bg-transparent border-b border-amber-500 outline-none w-40 placeholder:text-zinc-600"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingName(true)}
            className="text-base font-semibold text-zinc-100 hover:text-amber-400 transition-colors cursor-pointer"
            title="Click to rename"
          >
            {displayName}
          </button>
        )}
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-zinc-600 hover:text-red-400 text-sm transition-colors cursor-pointer"
          >
            Remove
          </button>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-xs text-zinc-500 uppercase tracking-wide">Year</label>
        <YearFilter year={participant.year} onChange={(y) => onChange({ ...participant, year: y })} />
      </div>

      <div className="space-y-1">
        <label className="text-xs text-zinc-500 uppercase tracking-wide">Region</label>
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => (
            <Pill
              key={r.value}
              active={participant.region === r.value}
              onClick={() => onChange({ ...participant, region: r.value })}
            >
              {r.label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {mediaTypes.map((t) => (
            <Pill
              key={t.value}
              active={participant.mediaType === t.value}
              onClick={() => onChange({ ...participant, mediaType: t.value })}
            >
              {t.label}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {contentTypes.map((t) => (
            <Pill
              key={t.value}
              active={participant.contentType === t.value}
              onClick={() => onChange({ ...participant, contentType: t.value })}
            >
              {t.label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-zinc-500 uppercase tracking-wide">Vibe</label>
        <textarea
          placeholder="Describe the mood, atmosphere, what you want to feel..."
          value={participant.vibe}
          onChange={(e) => onChange({ ...participant, vibe: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-zinc-800 text-zinc-100 text-sm border border-zinc-700 focus:outline-none focus:border-amber-500 resize-none placeholder:text-zinc-600"
        />
      </div>
    </div>
  )
}

// ── Movie card ───────────────────────────────────────────────────────────────

function ProvidersSection({ providers }: { providers: NonNullable<Movie['providers']> }) {
  const [open, setOpen] = useState(false)

  // One icon per service — deduplicate by service id
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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-zinc-600 hover:text-amber-500 transition-colors cursor-pointer"
      >
        Where to watch {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="mt-2 flex flex-wrap gap-2">
          {deduped.map(({ provider: p, service }) => (
            <a
              key={service.id}
              href={service.url}
              target="_blank"
              rel="noopener noreferrer"
              title={p.name}
              className="block rounded-lg overflow-hidden w-8 h-8 hover:ring-2 hover:ring-amber-500 transition-all"
            >
              <img
                src={`${TMDB_LOGO}${p.logoPath}`}
                alt={p.name}
                className="w-full h-full object-cover"
              />
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

function MovieCard({
  movie,
  onSeen,
  onSkip,
}: {
  movie: Movie
  onSeen: () => void
  onSkip: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col">
      <div className="relative aspect-[2/3] bg-zinc-800">
        {movie.posterPath ? (
          <img
            src={`${TMDB_IMG}${movie.posterPath}`}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-600 text-sm">
            No poster
          </div>
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
            {movie.rating && (
              <span className="text-xs font-medium text-amber-500">★ {movie.rating}</span>
            )}
          </div>
          {movie.director && (
            <p className="text-xs text-zinc-500 mt-0.5">Dir. {movie.director}</p>
          )}
          {movie.cast && movie.cast.length > 0 && (
            <p className="text-xs text-zinc-600 mt-0.5">{movie.cast.join(', ')}</p>
          )}
        </div>
        {movie.overview && (
          <div>
            <p className={`text-sm text-zinc-400 leading-relaxed ${expanded ? '' : 'line-clamp-4'}`}>
              {movie.overview}
            </p>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-xs text-zinc-600 hover:text-amber-500 transition-colors cursor-pointer"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          </div>
        )}
        {movie.providers && movie.providers.length > 0 && (
          <ProvidersSection providers={movie.providers} />
        )}

        <div className="mt-auto pt-3 flex flex-col gap-1.5">
          <a
            href={movie.tmdbUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-center py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            View on TMDB
          </a>
          <button
            type="button"
            onClick={onSeen}
            className="py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-500 hover:bg-zinc-700 hover:text-zinc-300 transition-colors cursor-pointer"
          >
            Seen it
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-500 hover:bg-red-900/40 hover:text-red-400 transition-colors cursor-pointer"
          >
            Not interested
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  const [participants, setParticipants] = useState<Participant[]>([makeParticipant('1')])
  const [sharedWatchRegion, setSharedWatchRegion] = useState('US')
  const [sharedServices, setSharedServices] = useState<StreamingService[]>([])
  const [watchOpen, setWatchOpen] = useState(false)

  useEffect(() => {
    fetch('/api/geo')
      .then((r) => r.json())
      .then(({ country }: { country: string }) => {
        const validCode = WATCH_REGIONS.find((r) => r.code === country)?.code ?? 'US'
        setSharedWatchRegion(validCode)
      })
      .catch(() => {})
  }, [])

  const toggleSharedService = (s: StreamingService) =>
    setSharedServices((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])

  const [allMovies, setAllMovies] = useState<Movie[]>([])
  const [shownIds, setShownIds] = useState<number[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiRanked, setAiRanked] = useState<boolean | null>(null)

  const shownMovies = shownIds
    .map((id) => allMovies.find((m) => m.id === id))
    .filter(Boolean) as Movie[]

  const addParticipant = () => {
    if (participants.length >= 5) return
    setParticipants((prev) => [...prev, makeParticipant(String(Date.now()))])
  }

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

      if (movies.length === 0) {
        setError('No movies found. Try broadening your preferences.')
        return
      }

      setAiRanked(data.aiRanked ?? false)
      setAllMovies(movies)
      setShownIds(movies.slice(0, 5).map((m) => m.id))
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const replaceMovie = (movieId: number) => {
    const newDismissed = new Set([...dismissedIds, movieId])
    const newShown = shownIds.filter((id) => id !== movieId)
    const next = allMovies.find((m) => !shownIds.includes(m.id) && !newDismissed.has(m.id))
    if (next) newShown.push(next.id)
    setDismissedIds(newDismissed)
    setShownIds(newShown)
  }

  const reserveCount = allMovies.filter(
    (m) => !shownIds.includes(m.id) && !dismissedIds.has(m.id)
  ).length

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100">Vibe Watch</h1>
          <p className="mt-2 text-zinc-500 text-base">Great picks for every vibe in the room</p>
        </header>

        <div className="space-y-4">
          {participants.map((p, i) => (
            <ParticipantCard
              key={p.id}
              participant={p}
              index={i}
              onChange={(updated) =>
                setParticipants((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
              }
              onRemove={() => setParticipants((prev) => prev.filter((x) => x.id !== p.id))}
              canRemove={participants.length > 1}
            />
          ))}
        </div>

        <div className="mt-4 border border-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => setWatchOpen((v) => !v)}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer hover:bg-zinc-800 transition-colors outline-none ${watchOpen ? '' : 'rounded-xl'}`}
          >
            <span className="text-zinc-400">Where to watch</span>
            <span className="text-zinc-600 text-xs">
              {sharedServices.length === 0
                ? (WATCH_REGIONS.find((r) => r.code === sharedWatchRegion)?.name ?? sharedWatchRegion)
                : `${sharedServices.map((s) => STREAMING_SERVICES.find((x) => x.id === s)?.name).join(', ')} · ${WATCH_REGIONS.find((r) => r.code === sharedWatchRegion)?.name ?? sharedWatchRegion}`
              } {watchOpen ? '▲' : '▼'}
            </span>
          </button>
          {watchOpen && (
            <div className="border-t border-zinc-800">
              <div className="px-4 py-2 border-b border-zinc-800">
                <CountrySelect value={sharedWatchRegion} onChange={setSharedWatchRegion} />
              </div>
              <div className="px-4 py-3 flex flex-wrap gap-2">
                <Pill active={sharedServices.length === 0} onClick={() => setSharedServices([])}>
                  Doesn&apos;t matter
                </Pill>
                {STREAMING_SERVICES.map((s) => (
                  <Pill
                    key={s.id}
                    active={sharedServices.includes(s.id)}
                    onClick={() => toggleSharedService(s.id)}
                  >
                    <span className="flex items-center gap-1.5">
                      <img
                        src={`${TMDB_LOGO}${s.logo}`}
                        alt=""
                        className="w-4 h-4 rounded object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none' }}
                      />
                      {s.name}
                    </span>
                  </Pill>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {participants.length < 5 && (
            <button
              type="button"
              onClick={addParticipant}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              + Add person
            </button>
          )}
          <button
            type="button"
            onClick={handleFind}
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-black hover:bg-amber-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? 'Searching...' : "Let's watch"}
          </button>
        </div>

        {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}

        {isLoading && (
          <div className="mt-12 text-center text-zinc-500 text-sm">
            Finding the perfect match for your crew...
          </div>
        )}

        {shownMovies.length > 0 && (
          <section className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-xl font-semibold text-zinc-100">Top picks for your crew</h2>
              {aiRanked === false && (
                <span className="text-xs text-amber-500/70 border border-amber-500/30 rounded-full px-2.5 py-0.5">
                  sorted by rating · AI unavailable
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {shownMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onSeen={() => replaceMovie(movie.id)}
                  onSkip={() => replaceMovie(movie.id)}
                />
              ))}
            </div>
            {reserveCount > 0 && (
              <p className="mt-4 text-center text-zinc-600 text-sm">
                {reserveCount} more options in reserve
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
