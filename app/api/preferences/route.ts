import { auth } from '@/auth'
import { db } from '@/app/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const prefs = await db.userPreferences.findUnique({ where: { userId: session.user.id } })
    return Response.json({ services: prefs?.defaultServices ?? [] })
  } catch (err) {
    console.error('[preferences GET]', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const { services }: { services: string[] } = await request.json()

    await db.userPreferences.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id, defaultServices: services },
      update: { defaultServices: services },
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('[preferences PUT]', err)
    return Response.json({ error: 'Server error' }, { status: 500 })
  }
}
