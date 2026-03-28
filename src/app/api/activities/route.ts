import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, activities } from '@/lib/db'
import { eq, desc, and } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'
import { executeActivityPipeline } from '@/lib/pipeline/orchestrator'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const orgId = request.nextUrl.searchParams.get('organizationId')
  const type = request.nextUrl.searchParams.get('type')
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50')

  const filters = [eq(activities.userId, session.user.id)]
  if (orgId) filters.push(eq(activities.organizationId, orgId))
  if (type) filters.push(eq(activities.type, type as typeof activities.type.enumValues[number]))
  const conditions = filters.length === 1 ? filters[0] : and(...filters)

  const result = await db.select()
    .from(activities)
    .where(conditions)
    .orderBy(desc(activities.activityDate))
    .limit(limit)

  return Response.json(createApiResponse(result))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const body = await request.json()
  const { rawContent, organizationId, activityDate } = body

  if (!rawContent?.trim()) {
    return Response.json(createApiError('활동 내용을 입력해주세요.'), { status: 400 })
  }

  // Stage 0: 활동 저장 (동기)
  const [activity] = await db.insert(activities).values({
    userId: session.user.id,
    rawContent: rawContent.trim(),
    organizationId: organizationId || null,
    activityDate: activityDate ? new Date(activityDate) : new Date(),
    source: 'manual',
    pipelineStatus: 'pending',
  }).returning()

  // Stage 1-4: 리액티브 파이프라인 실행 (동기 — 분류 결과를 즉시 반환)
  try {
    const pipelineResult = await executeActivityPipeline({
      activityId: activity.id,
      rawContent: rawContent.trim(),
      userId: session.user.id,
      organizationId: organizationId || null,
    })

    // 최신 활동 데이터 반환 (파이프라인 결과 포함)
    const [updated] = await db.select()
      .from(activities)
      .where(eq(activities.id, activity.id))
      .limit(1)

    return Response.json(createApiResponse({
      activity: updated,
      pipeline: {
        classification: pipelineResult.classification,
        remindersCreated: pipelineResult.remindersCreated,
        organizationMatched: pipelineResult.organizationMatched,
      },
    }), { status: 201 })
  } catch {
    // 파이프라인 실패해도 활동은 저장됨
    return Response.json(createApiResponse({
      activity,
      pipeline: { error: 'AI 분류를 처리하지 못했습니다. 수동으로 분류해주세요.' },
    }), { status: 201 })
  }
}
