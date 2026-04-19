import type { Participant, Movie } from '../types'

const BASE = 'https://api.themoviedb.org/3'
const TOKEN = process.env.TMDB_API_TOKEN!

const REGION_COUNTRIES: Record<string, string> = {
  usa_uk: 'US|GB',
  europe: 'FR|DE|IT|ES|SE|DK|NO|FI|NL|PL|PT|BE|CH|AT|GR|RO|CZ|HU|RU',
  asia: 'JP|KR|CN|HK|TW|TH|VN|ID|MY|SG',
  india: 'IN',
}

const ANIMATION_GENRE = '16'

const STOP_WORDS = new Set([
  'want', 'smth', 'something', 'with', 'from', 'that', 'this', 'have', 'like',
  'feel', 'good', 'great', 'some', 'also', 'more', 'very', 'just', 'even',
  'than', 'been', 'when', 'what', 'would', 'could', 'about', 'need', 'looking',
  'watch', 'movie', 'film', 'show', 'series', 'vibe', 'mood', 'classical',
])

// Extract up to N meaningful words from vibe text
function extractVibeWords(vibes: string[], max = 4): string[] {
  const text = vibes.join(' ').toLowerCase()
  const words = text
    .split(/[\s,.\-!?;:()"']+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w) && !/^\d+$/.test(w))

  // Deduplicate preserving order
  return [...new Set(words)].slice(0, max)
}

// Search TMDB keyword index → return matched keyword IDs
async function resolveKeywordIds(words: string[]): Promise<number[]> {
  if (words.length === 0) return []

  const searches = words.map((word) =>
    fetch(`${BASE}/search/keyword?query=${encodeURIComponent(word)}&page=1`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      next: { revalidate: 3600 },
    })
      .then((r) => (r.ok ? r.json() : { results: [] }))
      .catch(() => ({ results: [] }))
  )

  const results = await Promise.all(searches)

  const ids: number[] = []
  for (const { results: kws } of results) {
    // Take the most exact match (first result)
    if (kws?.[0]?.id) ids.push(kws[0].id)
  }

  return [...new Set(ids)]
}

function mergeFilters(participants: Participant[]) {
  let yearGte: string | undefined
  let yearLte: string | undefined

  for (const { year: y } of participants) {
    if (y.mode === 'any') continue
    if ((y.mode === 'from' || y.mode === 'range') && y.from) {
      if (!yearGte || y.from < parseInt(yearGte)) yearGte = String(y.from)
    }
    if ((y.mode === 'to' || y.mode === 'range') && y.to) {
      if (!yearLte || y.to > parseInt(yearLte)) yearLte = String(y.to)
    }
    if (y.mode === 'exact' && y.exact) {
      if (!yearGte || y.exact < parseInt(yearGte)) yearGte = String(y.exact)
      if (!yearLte || y.exact > parseInt(yearLte)) yearLte = String(y.exact)
    }
  }

  const selectedRegions = participants.map((p) => p.region).filter((r) => r !== 'any')
  const countryCodes =
    selectedRegions.length === 0
      ? undefined
      : [...new Set(selectedRegions)].map((r) => REGION_COUNTRIES[r]).join('|')

  const wantsMovie = participants.some((p) => p.mediaType === 'any' || p.mediaType === 'movie')
  const wantsSeries = participants.some((p) => p.mediaType === 'any' || p.mediaType === 'series')
  const wantsAnimation = participants.some((p) => p.contentType === 'any' || p.contentType === 'animation')
  const wantsLive = participants.some((p) => p.contentType === 'any' || p.contentType === 'live')

  return { yearGte, yearLte, countryCodes, wantsMovie, wantsSeries, wantsAnimation, wantsLive }
}

async function fetchDiscover(
  endpoint: 'movie' | 'tv',
  params: Record<string, string>,
  pages = 2
): Promise<Movie[]> {
  const results: Movie[] = []

  for (let page = 1; page <= pages; page++) {
    const qs = new URLSearchParams({
      ...params,
      page: String(page),
      sort_by: 'vote_average.desc',
      'vote_count.gte': '200',
      include_adult: 'false',
    })

    const res = await fetch(`${BASE}/discover/${endpoint}?${qs}`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
      next: { revalidate: 0 },
    })

    if (!res.ok) break

    const data = await res.json()
    const items: Movie[] = (data.results ?? []).map((item: Record<string, unknown>) => {
      const isMovie = endpoint === 'movie'
      const title = isMovie ? (item.title as string) : (item.name as string)
      const date = isMovie ? (item.release_date as string) : (item.first_air_date as string)
      const year = date ? parseInt(date.slice(0, 4)) : 0
      const id = item.id as number
      return {
        id,
        title,
        year,
        posterPath: (item.poster_path as string | null) ?? null,
        overview: (item.overview as string) ?? '',
        tmdbUrl: isMovie
          ? `https://www.themoviedb.org/movie/${id}`
          : `https://www.themoviedb.org/tv/${id}`,
        mediaType: isMovie ? 'movie' : 'series',
      } satisfies Movie
    })

    results.push(...items)
  }

  return results
}

export async function fetchMovies(participants: Participant[]): Promise<Movie[]> {
  const { yearGte, yearLte, countryCodes, wantsMovie, wantsSeries, wantsAnimation, wantsLive } =
    mergeFilters(participants)

  // Resolve vibe → TMDB keyword IDs in parallel with nothing else blocking
  const vibeWords = extractVibeWords(participants.map((p) => p.vibe))
  const keywordIds = await resolveKeywordIds(vibeWords)

  const buildParams = (isMovie: boolean): Record<string, string> => {
    const p: Record<string, string> = {}
    if (yearGte) p[isMovie ? 'primary_release_date.gte' : 'first_air_date.gte'] = `${yearGte}-01-01`
    if (yearLte) p[isMovie ? 'primary_release_date.lte' : 'first_air_date.lte'] = `${yearLte}-12-31`
    if (countryCodes) p['with_origin_country'] = countryCodes

    // Animation filter
    if (wantsAnimation && !wantsLive) p['with_genres'] = ANIMATION_GENRE
    else if (!wantsAnimation && wantsLive) p['without_genres'] = ANIMATION_GENRE

    // Keyword filter from vibe (OR logic — movie must match at least one keyword)
    if (keywordIds.length > 0) p['with_keywords'] = keywordIds.join('|')

    return p
  }

  const fetches: Promise<Movie[]>[] = []
  if (wantsMovie) fetches.push(fetchDiscover('movie', buildParams(true), 3))
  if (wantsSeries) fetches.push(fetchDiscover('tv', buildParams(false), 2))

  const arrays = await Promise.all(fetches)
  const all = arrays.flat()

  // If keyword filtering returned too few results, fall back without keywords
  const MIN_RESULTS = 10
  if (all.length < MIN_RESULTS && keywordIds.length > 0) {
    const fallbackFetches: Promise<Movie[]>[] = []
    const fallbackMovie = buildParams(true)
    delete fallbackMovie['with_keywords']
    const fallbackTv = buildParams(false)
    delete fallbackTv['with_keywords']
    if (wantsMovie) fallbackFetches.push(fetchDiscover('movie', fallbackMovie, 2))
    if (wantsSeries) fallbackFetches.push(fetchDiscover('tv', fallbackTv, 1))
    const fallback = (await Promise.all(fallbackFetches)).flat()
    all.push(...fallback)
  }

  const seen = new Set<string>()
  return all.filter((m) => {
    const key = `${m.mediaType}-${m.id}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
