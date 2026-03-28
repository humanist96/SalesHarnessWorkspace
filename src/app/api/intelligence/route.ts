import { auth } from '@/lib/auth'
import { db, activities, organizations, deals } from '@/lib/db'
import { eq, and, desc, count, gte, sql, notInArray } from 'drizzle-orm'
import { openai, AI_MODELS } from '@/lib/openai/client'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const userId = session.user.id
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    activityTypeCounts,
    orgActivityCounts,
    monthlyTrend,
    activeDeals,
    recentActivities,
  ] = await Promise.all([
    // 활동 유형별 카운트 (이번 달)
    db.select({ type: activities.type, count: count() })
      .from(activities)
      .where(and(eq(activities.userId, userId), gte(activities.activityDate, thirtyDaysAgo)))
      .groupBy(activities.type),

    // 고객사별 활동 카운트 (Top 10)
    db.select({
      organizationId: activities.organizationId,
      organizationName: organizations.name,
      count: count(),
    })
      .from(activities)
      .leftJoin(organizations, eq(activities.organizationId, organizations.id))
      .where(eq(activities.userId, userId))
      .groupBy(activities.organizationId, organizations.name)
      .orderBy(desc(count()))
      .limit(10),

    // 최근 6개월 월별 추이
    db.select({
      month: sql<string>`to_char(${activities.activityDate}, 'YYYY-MM')`,
      count: count(),
    })
      .from(activities)
      .where(and(
        eq(activities.userId, userId),
        gte(activities.activityDate, new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)),
      ))
      .groupBy(sql`to_char(${activities.activityDate}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${activities.activityDate}, 'YYYY-MM')`),

    // 활성 딜
    db.select()
      .from(deals)
      .where(and(
        eq(deals.userId, userId),
        notInArray(deals.stage, ['closed_won', 'closed_lost']),
      )),

    // 최근 활동 10건 (AI 추천용)
    db.select({
      activity: activities,
      orgName: organizations.name,
    })
      .from(activities)
      .leftJoin(organizations, eq(activities.organizationId, organizations.id))
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.activityDate))
      .limit(10),
  ])

  // AI 추천 고객 생성
  let recommendations: { customer: string; reason: string; urgency: string }[] = []
  try {
    const context = recentActivities.map((r) => {
      const parsed = r.activity.parsedContent as Record<string, unknown> | null
      return `${r.orgName}: ${(parsed?.summary as string) || r.activity.rawContent.slice(0, 80)}`
    }).join('\n')

    const dealContext = activeDeals.map((d) =>
      `${d.title}: ${d.stage}, ${d.amount ? `${(d.amount / 100_000_000).toFixed(2)}억` : '금액 미정'}`
    ).join('\n')

    const response = await openai.chat.completions.create({
      model: AI_MODELS.fast,
      messages: [
        {
          role: 'system',
          content: `코스콤 금융영업팀 AI 어드바이저입니다. 최근 활동과 딜 현황을 보고 이번 주 집중해야 할 고객 3곳을 추천하세요.
JSON 형식: [{"customer":"고객사명","reason":"추천 이유","urgency":"high|medium|low"}]
반드시 유효한 JSON 배열만 반환.`,
        },
        { role: 'user', content: `최근 활동:\n${context}\n\n활성 딜:\n${dealContext}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 500,
    })

    const text = response.choices[0]?.message?.content
    if (text) {
      const parsed = JSON.parse(text)
      recommendations = Array.isArray(parsed) ? parsed : parsed.recommendations ?? []
    }
  } catch {
    // fallback: no recommendations
  }

  return Response.json(createApiResponse({
    activityTypeCounts,
    orgActivityCounts,
    monthlyTrend,
    recommendations,
    activeDealsCount: activeDeals.length,
  }))
}
