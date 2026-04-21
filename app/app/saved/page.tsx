'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Participant } from '../../types'
import { makeParticipant } from '../../lib/filters'

type StoredParticipant = Pick<Participant, 'id' | 'name' | 'year' | 'region' | 'mediaType' | 'contentType' | 'vibe'>

interface SavedSearch {
  id: string
  participants: StoredParticipant[]
  createdAt: string
}

const REGION_LABELS: Record<string, string> = {
  usa_uk: 'USA/UK', europe: 'Europe', asia: 'Asia', india: 'India',
}

function filterSummary(p: StoredParticipant): string {
  const parts: string[] = []
  if (p.year.mode === 'from' && p.year.from) parts.push(`From ${p.year.from}`)
  else if (p.year.mode === 'to' && p.year.to) parts.push(`Until ${p.year.to}`)
  else if (p.year.mode === 'range') parts.push(`${p.year.from ?? '?'}–${p.year.to ?? '?'}`)
  else if (p.year.mode === 'exact' && p.year.exact) parts.push(String(p.year.exact))
  if (p.region !== 'any') parts.push(REGION_LABELS[p.region] ?? p.region)
  if (p.mediaType !== 'any') parts.push(p.mediaType === 'movie' ? 'Movie' : 'Series')
  if (p.contentType !== 'any') parts.push(p.contentType === 'live' ? 'Live-action' : 'Animation')
  return parts.join(' · ')
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function SavedPage() {
  const router = useRouter()
  const [searches, setSearches] = useState<SavedSearch[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/searches')
      .then((r) => r.ok ? r.json() : { searches: [] })
      .then(({ searches }: { searches: SavedSearch[] }) => setSearches(searches))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleRestore = (search: SavedSearch) => {
    const participants: Participant[] = search.participants.map((p, i) => ({
      ...makeParticipant(p.id ?? String(i + 1), p.name),
      year: p.year,
      region: p.region,
      mediaType: p.mediaType,
      contentType: p.contentType,
      vibe: p.vibe ?? '',
    }))
    window.localStorage.setItem('vw-participants', JSON.stringify(participants))
    window.localStorage.setItem('vw-autorun', 'true')
    router.push('/app')
  }

  const handleDelete = (id: string) => {
    setSearches((prev) => prev.filter((s) => s.id !== id))
    setDeleteTarget(null)
    fetch('/api/searches', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(() => {})
  }

  if (loading) return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-100 mb-8">Saved searches</h1>
      <div className="text-center py-24 text-zinc-600 text-sm">Loading…</div>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-zinc-100 mb-8">Saved searches</h1>

      {searches.length === 0 ? (
        <div className="text-center py-24 text-zinc-600">
          <p className="text-lg mb-2">No saved searches yet</p>
          <p className="text-sm">Tap ☆ on the main page before searching to save it here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {searches.map((search) => (
            <div
              key={search.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 cursor-pointer hover:border-zinc-700 transition-colors"
              onClick={() => handleRestore(search)}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-600 mb-1">{formatDate(search.createdAt)}</p>
                  <p className="text-sm font-medium text-zinc-100 mb-2">
                    {search.participants.map((p) => p.name || 'Someone').join(' & ')}
                  </p>
                  <div className="space-y-1.5">
                    {search.participants.map((p, i) => {
                      const summary = filterSummary(p)
                      return (
                        <div key={i}>
                          {search.participants.length > 1 && p.name && (
                            <span className="text-xs text-zinc-600 mr-1">{p.name}:</span>
                          )}
                          {summary && <span className="text-xs text-zinc-500">{summary}</span>}
                          {p.vibe && (
                            <p className="text-xs text-zinc-600 italic truncate mt-0.5">&ldquo;{p.vibe}&rdquo;</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(search.id) }}
                  className="text-zinc-700 hover:text-red-400 transition-colors cursor-pointer shrink-0 text-base leading-none pt-0.5"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-zinc-100 font-semibold mb-2">Delete saved search?</h3>
            <p className="text-zinc-500 text-sm mb-6">This action is permanent and cannot be undone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteTarget)}
                className="flex-1 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-500 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
