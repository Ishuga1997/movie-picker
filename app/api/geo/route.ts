import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const country = request.headers.get('x-vercel-ip-country') ?? 'US'
  return Response.json({ country })
}
