import { auth } from '@/auth'
import { db } from '@/app/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const searches = await db.savedSearch.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json({ searches })
  } catch (err) {
    console.error('[searches GET]', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { participants } = await request.json()

    const search = await db.savedSearch.create({
      data: { userId: session.user.id, participants },
    })

    return Response.json({ search })
  } catch (err) {
    console.error('[searches POST]', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { id }: { id: string } = await request.json()

    await db.savedSearch.deleteMany({
      where: { id, userId: session.user.id },
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[searches DELETE]', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
