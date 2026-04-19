export type YearMode = 'any' | 'from' | 'to' | 'range' | 'exact'

export interface YearFilter {
  mode: YearMode
  from?: number
  to?: number
  exact?: number
}

export type Region = 'any' | 'usa_uk' | 'europe' | 'asia' | 'india'
export type MediaType = 'any' | 'movie' | 'series'
export type ContentType = 'any' | 'live' | 'animation'

export interface Participant {
  id: string
  year: YearFilter
  region: Region
  mediaType: MediaType
  contentType: ContentType
  vibe: string
}

export interface Movie {
  id: number
  title: string
  year: number
  posterPath: string | null
  overview: string
  tmdbUrl: string
  mediaType: 'movie' | 'series'
}

export interface SearchRequest {
  participants: Participant[]
}

export interface SearchResponse {
  movies: Movie[]
  aiRanked: boolean
}
