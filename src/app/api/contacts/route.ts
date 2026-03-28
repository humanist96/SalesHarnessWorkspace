import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, contacts } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const orgId = request.nextUrl.searchParams.get('organizationId')

  const result = orgId
    ? await db.select().from(contacts).where(eq(contacts.organizationId, orgId))
    : await db.select().from(contacts)

  return Response.json(createApiResponse(result))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const body = await request.json()

  const [contact] = await db.insert(contacts).values({
    organizationId: body.organizationId,
    name: body.name,
    title: body.title || null,
    email: body.email || null,
    phone: body.phone || null,
    notes: body.notes || null,
  }).returning()

  return Response.json(createApiResponse(contact), { status: 201 })
}
