import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, activities, organizations } from '@/lib/db'
import { eq, desc, and, sql } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })
  }

  const userId = session.user.id
  const q = request.nextUrl.searchParams.get('q') || ''
  const orgId = request.nextUrl.searchParams.get('organizationId') || ''
  const mode = request.nextUrl.searchParams.get('mode') || 'suggest'
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '5')

  // 모드 1: 템플릿 (고객사별 자주 사용하는 패턴)
  if (mode === 'templates' && orgId) {
    const templates = await db.execute(sql`
      SELECT
        ${activities.organizationId} as organization_id,
        ${activities.parsedContent}->>'intent' as intent,
        ${activities.parsedContent}->'products' as products,
        COUNT(*)::int as frequency,
        (array_agg(${activities.rawContent} ORDER BY ${activities.activityDate} DESC))[1] as example_content
      FROM ${activities}
      WHERE ${activities.userId} = ${userId}
        AND ${activities.organizationId} = ${orgId}
        AND ${activities.pipelineStatus} = 'completed'
        AND ${activities.parsedContent}->>'intent' IS NOT NULL
      GROUP BY ${activities.organizationId}, ${activities.parsedContent}->>'intent', ${activities.parsedContent}->'products'
      ORDER BY COUNT(*) DESC
      LIMIT ${limit}
    `)

    return Response.json(createApiResponse({ templates: templates.rows }))
  }

  // 모드 2: 유사 활동 검색
  if (q.length >= 5) {
    // 트라이그램 유사도 + 고객사 보너스 + 최신도 가중 스코어링
    const results = await db.execute(sql`
      SELECT
        ${activities.id},
        ${activities.rawContent} as raw_content,
        ${activities.type},
        ${activities.organizationId} as organization_id,
        ${organizations.name} as organization_name,
        ${activities.activityDate} as activity_date,
        ${activities.parsedContent}->>'summary' as summary,
        ${activities.parsedContent}->>'intent' as intent,
        ${activities.parsedContent}->'products' as products,
        similarity(${activities.rawContent}, ${q}) as text_score,
        (
          similarity(${activities.rawContent}, ${q}) * 0.5
          + CASE WHEN ${activities.organizationId} = ${orgId || null} THEN 0.3 ELSE 0 END
          + (1.0 / (1.0 + EXTRACT(EPOCH FROM NOW() - ${activities.activityDate}) / 7776000)) * 0.2
        ) as total_score
      FROM ${activities}
      LEFT JOIN ${organizations} ON ${activities.organizationId} = ${organizations.id}
      WHERE ${activities.userId} = ${userId}
        AND ${activities.pipelineStatus} = 'completed'
        AND (
          similarity(${activities.rawContent}, ${q}) > 0.08
          ${orgId ? sql`OR ${activities.organizationId} = ${orgId}` : sql``}
        )
      ORDER BY total_score DESC
      LIMIT ${limit}
    `)

    return Response.json(createApiResponse({ suggestions: results.rows }))
  }

  // 모드 3: 짧은 입력 + 고객사 선택됨 → 최근 활동
  if (orgId) {
    const recent = await db.select({
      id: activities.id,
      rawContent: activities.rawContent,
      type: activities.type,
      organizationId: activities.organizationId,
      organizationName: organizations.name,
      activityDate: activities.activityDate,
      summary: sql<string>`${activities.parsedContent}->>'summary'`,
      intent: sql<string>`${activities.parsedContent}->>'intent'`,
      products: sql`${activities.parsedContent}->'products'`,
    })
      .from(activities)
      .leftJoin(organizations, eq(activities.organizationId, organizations.id))
      .where(and(
        eq(activities.userId, userId),
        eq(activities.organizationId, orgId),
        eq(activities.pipelineStatus, 'completed'),
      ))
      .orderBy(desc(activities.activityDate))
      .limit(limit)

    return Response.json(createApiResponse({ suggestions: recent }))
  }

  return Response.json(createApiResponse({ suggestions: [], templates: [] }))
}
