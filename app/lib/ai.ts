import OpenAI from 'openai'
import type { Movie, Participant } from '../types'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const REGION_LABELS: Record<string, string> = {
  usa_uk: 'USA/UK',
  europe: 'Europe',
  asia: 'Asia',
  india: 'India',
  any: 'any region',
}

export async function rankMovies(movies: Movie[], participants: Participant[]): Promise<Movie[] | null> {
  if (movies.length === 0) return []

  const participantDescriptions = participants
    .map((p, i) => {
      const parts: string[] = [`Person ${i + 1}:`]

      if (p.year.mode !== 'any') {
        if (p.year.mode === 'from') parts.push(`Year: from ${p.year.from}`)
        else if (p.year.mode === 'to') parts.push(`Year: up to ${p.year.to}`)
        else if (p.year.mode === 'range') parts.push(`Year: ${p.year.from}–${p.year.to}`)
        else if (p.year.mode === 'exact') parts.push(`Year: exactly ${p.year.exact}`)
      }

      if (p.region !== 'any') parts.push(`Region: ${REGION_LABELS[p.region]}`)
      if (p.mediaType === 'movie') parts.push('Type: movie')
      else if (p.mediaType === 'series') parts.push('Type: TV series')
      if (p.contentType === 'animation') parts.push('Genre: animation/anime')
      else if (p.contentType === 'live') parts.push('Genre: live-action')
      if (p.vibe.trim()) parts.push(`Vibe: ${p.vibe.trim()}`)

      return parts.join('; ')
    })
    .join('\n')

  const movieList = movies
    .slice(0, 60)
    .map((m) => `ID:${m.id} | ${m.title} (${m.year}) [${m.mediaType}] | ${m.overview.slice(0, 150)}`)
    .join('\n')

  const prompt = `You are a movie recommendation expert. Pick and rank movies that would best satisfy everyone in the group.

Group preferences:
${participantDescriptions}

Movies (ID | Title (year) [type] | Description):
${movieList}

Return a JSON array of movie IDs sorted from best to worst match. Consider each person's vibe and constraints. Pick the 20 best.

Reply ONLY with a valid JSON array of numbers, no explanation. Example: [123, 456, 789]`

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    })

    const text = response.choices[0]?.message?.content ?? '[]'
    const match = text.match(/\[[\d,\s]+\]/)
    if (!match) return movies

    const ids: number[] = JSON.parse(match[0])
    const movieById = new Map(movies.map((m) => [m.id, m]))
    const ranked = ids.map((id) => movieById.get(id)).filter((m): m is Movie => m !== undefined)
    const rankedIds = new Set(ids)
    const unranked = movies.filter((m) => !rankedIds.has(m.id))

    return [...ranked, ...unranked]
  } catch {
    return null // signals AI was unavailable
  }
}
