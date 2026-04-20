import { NextRequest } from 'next/server'
import type { SearchRequest, SearchResponse } from '../../types'
import { fetchMovies, enrichWithCredits } from '../../lib/tmdb'
import { rankMovies } from '../../lib/ai'

export async function POST(request: NextRequest) {
  try {
    const body: SearchRequest = await request.json()
    const { participants } = body

    if (!participants?.length) {
      return Response.json({ error: 'No participants' }, { status: 400 })
    }

    const movies = await fetchMovies(participants)

    if (movies.length === 0) {
      return Response.json({ movies: [], aiRanked: false } satisfies SearchResponse)
    }

    const ranked = await rankMovies(movies, participants)
    const aiRanked = ranked !== null
    const ordered = ranked ?? movies

    // Enrich top 15 with credits, leave the rest as-is
    const top = await enrichWithCredits(ordered.slice(0, 15))
    const rest = ordered.slice(15)

    return Response.json({
      movies: [...top, ...rest],
      aiRanked,
    } satisfies SearchResponse)
  } catch (err) {
    console.error('API error:', err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
