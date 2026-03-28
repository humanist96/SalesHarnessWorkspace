import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, reminders } from '@/lib/db'
import { eq, desc, and, or } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const status = request.nextUrl.searchParams.get('status')

  const conditions = status
    ? and(eq(reminders.userId, session.user.id), eq(reminders.status, status as 'pending' | 'completed' | 'overdue' | 'cancelled'))
    : and(eq(reminders.userId, session.user.id), or(eq(reminders.status, 'pending'), eq(reminders.status, 'overdue')))

  const result = await db.select()
    .from(reminders)
    .where(conditions)
    .orderBy(desc(reminders.dueDate))

  return Response.json(createApiResponse(result))
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const body = await request.json()
  const { id, status } = body

  const [updated] = await db.update(reminders).set({
    status,
    completedAt: status === 'completed' ? new Date() : null,
    updatedAt: new Date(),
  }).where(and(eq(reminders.id, id), eq(reminders.userId, session.user.id))).returning()

  if (!updated) return Response.json(createApiError('후속조치를 찾을 수 없습니다.'), { status: 404 })
  return Response.json(createApiResponse(updated))
}
