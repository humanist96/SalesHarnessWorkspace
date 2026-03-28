import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, deals, activities, organizations } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params

  const [deal] = await db.select({
    deal: deals,
    organizationName: organizations.name,
  })
    .from(deals)
    .leftJoin(organizations, eq(deals.organizationId, organizations.id))
    .where(and(eq(deals.id, id), eq(deals.userId, session.user.id)))
    .limit(1)

  if (!deal) return Response.json(createApiError('딜을 찾을 수 없습니다.'), { status: 404 })

  const relatedActivities = await db.select()
    .from(activities)
    .where(and(eq(activities.dealId, id), eq(activities.userId, session.user.id)))
    .orderBy(desc(activities.activityDate))
    .limit(10)

  return Response.json(createApiResponse({ ...deal, activities: relatedActivities }))
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params
  const body = await request.json()

  const closedStages = ['closed_won', 'closed_lost']
  const updateData: Record<string, unknown> = { ...body, updatedAt: new Date() }

  if (body.stage && closedStages.includes(body.stage)) {
    updateData.closedAt = new Date()
  }

  const [updated] = await db.update(deals)
    .set(updateData)
    .where(and(eq(deals.id, id), eq(deals.userId, session.user.id)))
    .returning()

  if (!updated) return Response.json(createApiError('딜을 찾을 수 없습니다.'), { status: 404 })
  return Response.json(createApiResponse(updated))
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params

  const [deleted] = await db.delete(deals)
    .where(and(eq(deals.id, id), eq(deals.userId, session.user.id)))
    .returning()

  if (!deleted) return Response.json(createApiError('딜을 찾을 수 없습니다.'), { status: 404 })
  return Response.json(createApiResponse({ deleted: true }))
}
