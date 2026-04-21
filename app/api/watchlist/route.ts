import { auth } from '@/auth'
import { db } from '@/app/lib/db'
import type { Movie } from '@/app/types'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const rows = await db.watchlistMovie.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ movies: rows.map((r) => r.movieData as unknown as Movie) })
  } catch (err) {
    console.error('[watchlist GET]', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const movie: Movie = await request.json()

    await db.watchlistMovie.upsert({
      where: { userId_tmdbId: { userId: session.user.id, tmdbId: movie.id } },
      create: { userId: session.user.id, tmdbId: movie.id, movieData: movie as object },
      update: { movieData: movie as object },
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[watchlist POST]', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { tmdbId }: { tmdbId: number } = await request.json()

    await db.watchlistMovie.deleteMany({
      where: { userId: session.user.id, tmdbId },
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[watchlist DELETE]', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
