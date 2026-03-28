import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, deals, activities } from '@/lib/db'
import { eq, and, desc, count, gte } from 'drizzle-orm'
import { openai, AI_MODELS } from '@/lib/openai/client'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params

  const [deal] = await db.select()
    .from(deals)
    .where(and(eq(deals.id, id), eq(deals.userId, session.user.id)))
    .limit(1)

  if (!deal) return Response.json(createApiError('딜을 찾을 수 없습니다.'), { status: 404 })

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  // 최근 30일 활동 수
  const [activityCount] = await db.select({ count: count() })
    .from(activities)
    .where(and(
      eq(activities.organizationId, deal.organizationId),
      eq(activities.userId, session.user.id),
      gte(activities.activityDate, thirtyDaysAgo),
    ))

  // 최근 활동
  const recentActivities = await db.select()
    .from(activities)
    .where(and(eq(activities.organizationId, deal.organizationId), eq(activities.userId, session.user.id)))
    .orderBy(desc(activities.activityDate))
    .limit(5)

  // Rule-based scoring factors
  const recentCount = activityCount?.count ?? 0
  const activityFrequency = Math.min(recentCount * 10, 100)
  const amountDiscussed = deal.amount ? Math.min(70 + Math.log10(deal.amount / 100_000_000) * 15, 100) : 30
  const stageProgress = { discovery: 20, proposal: 40, negotiation: 60, contract: 80, billing: 90, closed_won: 100, closed_lost: 0 }
  const stageVelocity = stageProgress[deal.stage as keyof typeof stageProgress] ?? 20
  const lastActivityDate = recentActivities[0]?.activityDate
  const daysSinceLastActivity = lastActivityDate ? Math.floor((Date.now() - new Date(lastActivityDate).getTime()) / (24 * 60 * 60 * 1000)) : 999
  const recency = daysSinceLastActivity <= 3 ? 100 : daysSinceLastActivity <= 7 ? 80 : daysSinceLastActivity <= 14 ? 60 : daysSinceLastActivity <= 30 ? 40 : 20

  const factors = [
    { name: 'activity_frequency', value: Math.round(activityFrequency), weight: 0.3 },
    { name: 'amount_discussed', value: Math.round(amountDiscussed), weight: 0.25 },
    { name: 'stage_velocity', value: Math.round(stageVelocity), weight: 0.25 },
    { name: 'recency', value: Math.round(recency), weight: 0.2 },
  ]

  const score = Math.round(factors.reduce((sum, f) => sum + f.value * f.weight, 0))

  // GPT-4o for human-readable reason
  const activitySummaries = recentActivities.map((a) => {
    const parsed = a.parsedContent as Record<string, unknown> | null
    return (parsed?.summary as string) || a.rawContent.slice(0, 100)
  }).join('; ')

  let reason = `최근 30일 ${recentCount}건 활동, ${deal.stage} 단계`
  try {
    const response = await openai.chat.completions.create({
      model: AI_MODELS.fast,
      messages: [
        { role: 'system', content: '1문장으로 딜의 전환 가능성 근거를 설명하세요. 한국어로.' },
        { role: 'user', content: `딜: ${deal.title}, 금액: ${deal.amount}, 단계: ${deal.stage}, 최근활동: ${activitySummaries}, 점수: ${score}/100` },
      ],
      max_tokens: 100,
    })
    reason = response.choices[0]?.message?.content || reason
  } catch {
    // fallback to rule-based reason
  }

  // Save score to deal
  await db.update(deals).set({
    aiScore: score,
    aiScoreReason: reason,
    updatedAt: new Date(),
  }).where(eq(deals.id, id))

  return Response.json(createApiResponse({ score, reason, factors }))
}
