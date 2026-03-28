import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, activities } from '@/lib/db'
import { eq, sql, and } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'
import { classifyActivityBatch } from '@/lib/pipeline/classify'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  // admin만 배치 재분류 가능
  if ((session.user as { role?: string }).role !== 'admin') {
    return Response.json(createApiError('관리자 권한이 필요합니다.'), { status: 403 })
  }

  const body = await request.json()
  const { scope = 'v1_only', dryRun = false, batchSize = 20 } = body as {
    scope?: 'all' | 'v1_only'
    dryRun?: boolean
    batchSize?: number
  }

  // V1 데이터 조회 (intent 필드가 없는 것들)
  const condition = scope === 'v1_only'
    ? sql`${activities.parsedContent}->>'intent' IS NULL`
    : sql`1=1`

  const targets = await db.select({
    id: activities.id,
    rawContent: activities.rawContent,
  })
    .from(activities)
    .where(and(condition, eq(activities.pipelineStatus, 'completed')))
    .orderBy(activities.activityDate)

  if (dryRun) {
    // 미리보기: 처음 5건만 분류해서 보여줌
    const samples = targets.slice(0, 5)
    const sampleResults = []
    for (const sample of samples) {
      const result = await classifyActivityBatch(sample.rawContent)
      sampleResults.push({ id: sample.id, rawContent: sample.rawContent.slice(0, 80), result })
    }
    return Response.json(createApiResponse({
      totalCount: targets.length,
      processedCount: 0,
      status: 'preview',
      sampleResults,
    }))
  }

  // 실제 재분류 (동기 — 프로덕션에서는 큐 기반 비동기 권장)
  let processed = 0
  let failed = 0

  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize)

    for (const target of batch) {
      try {
        const result = await classifyActivityBatch(target.rawContent)
        await db.update(activities).set({
          type: result.type,
          parsedContent: result as unknown as Record<string, unknown>,
          aiClassified: true,
          aiConfidence: result.confidence,
          updatedAt: new Date(),
        }).where(eq(activities.id, target.id))
        processed++
      } catch {
        failed++
      }
    }

    // rate limit: 배치 간 2초 대기
    if (i + batchSize < targets.length) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  return Response.json(createApiResponse({
    totalCount: targets.length,
    processedCount: processed,
    failedCount: failed,
    status: 'completed',
  }))
}
