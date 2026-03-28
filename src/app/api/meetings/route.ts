import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, meetings } from '@/lib/db'
import { eq, desc, and, gte } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const status = request.nextUrl.searchParams.get('status')
  const upcoming = request.nextUrl.searchParams.get('upcoming')

  const filters = [eq(meetings.userId, session.user.id)]
  if (status) filters.push(eq(meetings.status, status as 'scheduled' | 'completed' | 'cancelled'))
  if (upcoming === 'true') filters.push(gte(meetings.scheduledAt, new Date()))

  const result = await db.select()
    .from(meetings)
    .where(filters.length === 1 ? filters[0] : and(...filters))
    .orderBy(desc(meetings.scheduledAt))
    .limit(50)

  return Response.json(createApiResponse(result))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const body = await request.json()
  const { title, scheduledAt, location, organizationId, attendees, agenda } = body

  if (!title?.trim() || !scheduledAt) {
    return Response.json(createApiError('제목과 일정은 필수입니다.'), { status: 400 })
  }

  const [meeting] = await db.insert(meetings).values({
    userId: session.user.id,
    title: title.trim(),
    scheduledAt: new Date(scheduledAt),
    location: location || null,
    organizationId: organizationId || null,
    attendees: attendees || null,
    agenda: agenda || null,
  }).returning()

  return Response.json(createApiResponse(meeting), { status: 201 })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) return Response.json(createApiError('미팅 ID가 필요합니다.'), { status: 400 })

  const [updated] = await db.update(meetings).set({
    ...updates,
    updatedAt: new Date(),
  }).where(and(eq(meetings.id, id), eq(meetings.userId, session.user.id))).returning()

  if (!updated) return Response.json(createApiError('미팅을 찾을 수 없습니다.'), { status: 404 })
  return Response.json(createApiResponse(updated))
}
