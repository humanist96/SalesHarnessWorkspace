import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, activities } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'
import type { SalesIntent, SalesStage, ActivitySentiment } from '@/lib/pipeline/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params
  const body = await request.json()
  const { intent, stage, products, sentiment } = body as {
    intent?: SalesIntent
    stage?: SalesStage
    products?: string[]
    sentiment?: ActivitySentiment
  }

  // 본인 활동만 수정 가능
  const [existing] = await db.select()
    .from(activities)
    .where(and(eq(activities.id, id), eq(activities.userId, session.user.id)))
    .limit(1)

  if (!existing) {
    return Response.json(createApiError('활동을 찾을 수 없습니다.'), { status: 404 })
  }

  // parsedContent JSONB 내 필드만 업데이트
  const currentParsed = (existing.parsedContent ?? {}) as Record<string, unknown>
  const updatedParsed = {
    ...currentParsed,
    ...(intent !== undefined && { intent }),
    ...(stage !== undefined && { stage }),
    ...(products !== undefined && { products }),
    ...(sentiment !== undefined && { sentiment }),
    manualOverride: true,
  }

  const [updated] = await db.update(activities).set({
    parsedContent: updatedParsed,
    updatedAt: new Date(),
  }).where(eq(activities.id, id)).returning()

  return Response.json(createApiResponse(updated))
}
