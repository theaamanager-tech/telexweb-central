import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { password } = body

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin'

  if (password === adminPassword) {
    const response = Response.json({ success: true })
    response.headers.set(
      'Set-Cookie',
      `telex_auth=true; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24 * 7}`
    )
    return response
  }

  return Response.json({ success: false, error: 'Password salah' }, { status: 401 })
}
