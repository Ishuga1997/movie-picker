'use client'

import { useState, useRef, useEffect } from 'react'
import type { Participant, Region, MediaType, ContentType, YearMode, StreamingService } from '../types'

export const TMDB_IMG  = 'https://image.tmdb.org/t/p/w342'
export const TMDB_LOGO = 'https://image.tmdb.org/t/p/original'

export const STREAMING_SERVICES: { id: StreamingService; name: string; url: string; logo: string; providerIds: number[] }[] = [
  { id: 'netflix',   name: 'Netflix',    url: 'https://netflix.com',       logo: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg', providerIds: [8] },
  { id: 'prime',     name: 'Prime',      url: 'https://primevideo.com',    logo: '/pvske1MyAoymrs5bguRfVqYiM9a.jpg',  providerIds: [9] },
  { id: 'disney',    name: 'Disney+',    url: 'https://disneyplus.com',    logo: '/97yvRBw1GzX7fXprcF80er19ot.jpg',  providerIds: [337] },
  { id: 'apple',     name: 'Apple TV+',  url: 'https://tv.apple.com',      logo: '/mcbz1LgtErU9p4UdbZ0rG6RTWHX.jpg', providerIds: [350] },
  { id: 'paramount', name: 'Paramount+', url: 'https://paramountplus.com', logo: '/fts6X10Jn4QT0X6ac3udKEn2tJA.jpg', providerIds: [2303, 2616] },
  { id: 'hbo',       name: 'Max',        url: 'https://www.max.com',       logo: '/Ajqyt5aNxNGjmF9uOfxArGrdf3X.jpg', providerIds: [384, 1899] },
]

export const ALL_KNOWN_PROVIDER_IDS = new Set(STREAMING_SERVICES.flatMap((s) => s.providerIds))

export const WATCH_REGIONS = [
  { code: 'GB', name: 'United Kingdom' }, { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },         { code: 'AU', name: 'Australia' },
  { code: 'NZ', name: 'New Zealand' },    { code: 'IE', name: 'Ireland' },
  { code: 'DE', name: 'Germany' },        { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },    { code: 'FR', name: 'France' },
  { code: 'BE', name: 'Belgium' },        { code: 'NL', name: 'Netherlands' },
  { code: 'ES', name: 'Spain' },          { code: 'IT', name: 'Italy' },
  { code: 'PT', name: 'Portugal' },       { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },         { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },        { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' }, { code: 'HU', name: 'Hungary' },
  { code: 'RO', name: 'Romania' },        { code: 'GR', name: 'Greece' },
  { code: 'TR', name: 'Turkey' },         { code: 'RU', name: 'Russia' },
  { code: 'IN', name: 'India' },          { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },    { code: 'HK', name: 'Hong Kong' },
  { code: 'SG', name: 'Singapore' },      { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' },      { code: 'MY', name: 'Malaysia' },
  { code: 'PH', name: 'Philippines' },    { code: 'TW', name: 'Taiwan' },
  { code: 'BR', name: 'Brazil' },         { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },      { code: 'CO', name: 'Colombia' },
  { code: 'CL', name: 'Chile' },          { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },        { code: 'EG', name: 'Egypt' },
  { code: 'SA', name: 'Saudi Arabia' },   { code: 'AE', name: 'UAE' },
  { code: 'IL', name: 'Israel' },
]

export const SORTED_REGIONS = [...WATCH_REGIONS].sort((a, b) => a.name.localeCompare(b.name))

export function makeParticipant(id: string, name?: string): Participant {
  return { id, name, year: { mode: 'any' }, region: 'any', mediaType: 'any', contentType: 'any', streamingServices: [], watchRegion: 'US', vibe: '' }
}

export function flagEmoji(code: string) {
  return String.fromCodePoint(...code.split('').map((c) => 0x1f1e6 + c.toUpperCase().charCodeAt(0) - 65))
}

// ── Pill ──────────────────────────────────────────────────────────────────────

export function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer select-none ${
        active ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  )
}

// ── YearInput ─────────────────────────────────────────────────────────────────

export function YearInput({ value, placeholder, onChange }: { value: number | undefined; placeholder: string; onChange: (v: number | undefined) => void }) {
  const clamp = (v: number) => Math.max(1900, Math.min(2030, v))
  const step = (dir: 1 | -1) => onChange(clamp((value ?? (dir === 1 ? 1999 : 2025)) + dir))
  return (
    <div className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-800 focus-within:border-amber-500 overflow-hidden">
      <button type="button" onMouseDown={(e) => { e.preventDefault(); step(-1) }} className="px-2.5 py-1.5 text-amber-500 hover:bg-zinc-700 transition-colors cursor-pointer select-none font-bold">‹</button>
      <input
        type="number" placeholder={placeholder} min={1900} max={2030} value={value ?? ''}
        onChange={(e) => onChange(parseInt(e.target.value) || undefined)}
        className="w-16 py-1.5 bg-transparent text-zinc-100 text-sm text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button type="button" onMouseDown={(e) => { e.preventDefault(); step(1) }} className="px-2.5 py-1.5 text-amber-500 hover:bg-zinc-700 transition-colors cursor-pointer select-none font-bold">›</button>
    </div>
  )
}

// ── YearFilterControl ─────────────────────────────────────────────────────────

export function YearFilterControl({ year, onChange }: { year: Participant['year']; onChange: (y: Participant['year']) => void }) {
  const modes: { value: YearMode; label: string }[] = [
    { value: 'any', label: 'Any' }, { value: 'from', label: 'From' },
    { value: 'to', label: 'Until' }, { value: 'range', label: 'Range' },
    { value: 'exact', label: 'Exact' },
  ]
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {modes.map((m) => (
          <Pill key={m.value} active={year.mode === m.value} onClick={() => onChange({ mode: m.value })}>{m.label}</Pill>
        ))}
      </div>
      {year.mode !== 'any' && (
        <div className="flex gap-2 items-center">
          {(year.mode === 'from' || year.mode === 'range') && <YearInput value={year.from} placeholder="From" onChange={(v) => onChange({ ...year, from: v })} />}
          {year.mode === 'range' && <span className="text-zinc-600">—</span>}
          {(year.mode === 'to' || year.mode === 'range') && <YearInput value={year.to} placeholder="Until" onChange={(v) => onChange({ ...year, to: v })} />}
          {year.mode === 'exact' && <YearInput value={year.exact} placeholder="Year" onChange={(v) => onChange({ ...year, exact: v })} />}
        </div>
      )}
    </div>
  )
}

// ── CountrySelect ─────────────────────────────────────────────────────────────

export function CountrySelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
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
    if (match) listRef.current?.querySelector<HTMLElement>(`[data-code="${match.code}"]`)?.scrollIntoView({ block: 'nearest' })
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
          <input autoFocus readOnly value="" className="sr-only"
            onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); return } if (e.key.length === 1) scrollToMatch(e.key) }}
          />
          <div ref={listRef} className="absolute left-0 top-full mt-1 z-50 w-64 max-h-72 overflow-y-auto rounded-xl bg-zinc-800 border border-zinc-700 shadow-xl">
            {SORTED_REGIONS.map((r) => (
              <button key={r.code} data-code={r.code} type="button"
                onMouseDown={(e) => { e.preventDefault() }}
                onClick={() => { onChange(r.code); setOpen(false) }}
                className={`w-full text-left flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-zinc-700 transition-colors ${r.code === value ? 'text-amber-500' : 'text-zinc-200'}`}
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

// ── ParticipantCard ───────────────────────────────────────────────────────────

export function ParticipantCard({
  participant, index, onChange, onRemove, canRemove,
}: {
  participant: Participant; index: number
  onChange: (p: Participant) => void; onRemove: () => void; canRemove: boolean
}) {
  const regions: { value: Region; label: string }[] = [
    { value: 'any', label: 'Anywhere' }, { value: 'usa_uk', label: 'USA / UK' },
    { value: 'europe', label: 'Europe' }, { value: 'asia', label: 'Asia' }, { value: 'india', label: 'India' },
  ]
  const mediaTypes: { value: MediaType; label: string }[] = [
    { value: 'any', label: 'Either' }, { value: 'movie', label: 'Movie' }, { value: 'series', label: 'Series' },
  ]
  const contentTypes: { value: ContentType; label: string }[] = [
    { value: 'any', label: 'Either' }, { value: 'live', label: 'Live-action' }, { value: 'animation', label: 'Animation' },
  ]
  const [editingName, setEditingName] = useState(false)
  const displayName = participant.name ?? `Person ${index + 1}`

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        {editingName ? (
          <input autoFocus value={participant.name ?? ''} placeholder={`Person ${index + 1}`}
            onChange={(e) => onChange({ ...participant, name: e.target.value })}
            onBlur={() => setEditingName(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') setEditingName(false) }}
            className="text-base font-semibold text-zinc-100 bg-transparent border-b border-amber-500 outline-none w-40 placeholder:text-zinc-600"
          />
        ) : (
          <button type="button" onClick={() => setEditingName(true)}
            className="text-base font-semibold text-zinc-100 hover:text-amber-400 transition-colors cursor-pointer" title="Click to rename">
            {displayName}
          </button>
        )}
        {canRemove && (
          <button type="button" onClick={onRemove} className="text-zinc-600 hover:text-red-400 text-sm transition-colors cursor-pointer">Remove</button>
        )}
      </div>
      <div className="space-y-1">
        <label className="text-xs text-zinc-500 uppercase tracking-wide">Year</label>
        <YearFilterControl year={participant.year} onChange={(y) => onChange({ ...participant, year: y })} />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-zinc-500 uppercase tracking-wide">Region</label>
        <div className="flex flex-wrap gap-2">
          {regions.map((r) => <Pill key={r.value} active={participant.region === r.value} onClick={() => onChange({ ...participant, region: r.value })}>{r.label}</Pill>)}
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {mediaTypes.map((t) => <Pill key={t.value} active={participant.mediaType === t.value} onClick={() => onChange({ ...participant, mediaType: t.value })}>{t.label}</Pill>)}
        </div>
        <div className="flex flex-wrap gap-2">
          {contentTypes.map((t) => <Pill key={t.value} active={participant.contentType === t.value} onClick={() => onChange({ ...participant, contentType: t.value })}>{t.label}</Pill>)}
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

// ── WatchSection ──────────────────────────────────────────────────────────────

export function WatchSection({
  watchRegion, onChangeRegion, services, onToggleService, onClearServices,
}: {
  watchRegion: string; onChangeRegion: (code: string) => void
  services: StreamingService[]; onToggleService: (s: StreamingService) => void; onClearServices: () => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-zinc-800 rounded-xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer hover:bg-zinc-800 transition-colors outline-none ${open ? '' : 'rounded-xl'}`}
      >
        <span className="text-zinc-400">Where to watch</span>
        <span className="text-zinc-600 text-xs">
          {services.length === 0
            ? (WATCH_REGIONS.find((r) => r.code === watchRegion)?.name ?? watchRegion)
            : `${services.map((s) => STREAMING_SERVICES.find((x) => x.id === s)?.name).join(', ')} · ${WATCH_REGIONS.find((r) => r.code === watchRegion)?.name ?? watchRegion}`
          } {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div className="border-t border-zinc-800">
          <div className="px-4 py-2 border-b border-zinc-800">
            <CountrySelect value={watchRegion} onChange={onChangeRegion} />
          </div>
          <div className="px-4 py-3 flex flex-wrap gap-2">
            <Pill active={services.length === 0} onClick={onClearServices}>Doesn&apos;t matter</Pill>
            {STREAMING_SERVICES.map((s) => (
              <Pill key={s.id} active={services.includes(s.id)} onClick={() => onToggleService(s.id)}>
                <span className="flex items-center gap-1.5">
                  <img src={`${TMDB_LOGO}${s.logo}`} alt="" className="w-4 h-4 rounded object-cover" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                  {s.name}
                </span>
              </Pill>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
