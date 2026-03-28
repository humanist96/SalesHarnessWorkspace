import { auth } from '@/lib/auth'
import { db, activities, organizations } from '@/lib/db'
import { eq, and, gte, count, sql, desc } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

function getPeriodStart(period: string): Date {
  const now = Date.now()
  const ms: Record<string, number> = {
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '6m': 180 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000,
  }
  return new Date(now - (ms[period] ?? ms['30d']))
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const url = new URL(request.url)
  const period = url.searchParams.get('period') || '30d'
  const userId = session.user.id
  const periodStart = getPeriodStart(period)
  const baseFilter = and(eq(activities.userId, userId), gte(activities.activityDate, periodStart))

  const [
    intentDistribution,
    stageFunnel,
    sentimentDistribution,
    orgIntentRaw,
    productTrend,
    riskRaw,
  ] = await Promise.all([
    // 1. 영업 목적별 분포
    db.select({
      intent: sql<string>`${activities.parsedContent}->>'intent'`,
      count: count(),
    })
      .from(activities)
      .where(and(baseFilter, sql`${activities.parsedContent}->>'intent' IS NOT NULL`))
      .groupBy(sql`${activities.parsedContent}->>'intent'`),

    // 2. 영업 단계별 분포
    db.select({
      stage: sql<string>`${activities.parsedContent}->>'stage'`,
      count: count(),
    })
      .from(activities)
      .where(and(baseFilter, sql`${activities.parsedContent}->>'stage' IS NOT NULL`))
      .groupBy(sql`${activities.parsedContent}->>'stage'`),

    // 3. 감성 분포
    db.select({
      sentiment: sql<string>`${activities.parsedContent}->>'sentiment'`,
      count: count(),
    })
      .from(activities)
      .where(and(baseFilter, sql`${activities.parsedContent}->>'sentiment' IS NOT NULL`))
      .groupBy(sql`${activities.parsedContent}->>'sentiment'`),

    // 4. 고객사 × 목적 (top 10 고객사)
    db.select({
      organizationId: activities.organizationId,
      organizationName: organizations.name,
      intent: sql<string>`${activities.parsedContent}->>'intent'`,
      count: count(),
    })
      .from(activities)
      .leftJoin(organizations, eq(activities.organizationId, organizations.id))
      .where(and(baseFilter, sql`${activities.parsedContent}->>'intent' IS NOT NULL`))
      .groupBy(activities.organizationId, organizations.name, sql`${activities.parsedContent}->>'intent'`),

    // 5. 상품별 월간 트렌드
    db.select({
      month: sql<string>`to_char(${activities.activityDate}, 'YYYY-MM')`,
      products: sql<string>`jsonb_array_elements_text(${activities.parsedContent}->'products')`,
      count: count(),
    })
      .from(activities)
      .where(and(
        baseFilter,
        sql`${activities.parsedContent}->'products' IS NOT NULL`,
        sql`jsonb_array_length(${activities.parsedContent}->'products') > 0`,
      ))
      .groupBy(
        sql`to_char(${activities.activityDate}, 'YYYY-MM')`,
        sql`jsonb_array_elements_text(${activities.parsedContent}->'products')`,
      )
      .orderBy(sql`to_char(${activities.activityDate}, 'YYYY-MM')`),

    // 6. 리스크 플래그
    db.select({
      flag: sql<string>`jsonb_array_elements_text(${activities.parsedContent}->'riskFlags')`,
      orgName: organizations.name,
      count: count(),
    })
      .from(activities)
      .leftJoin(organizations, eq(activities.organizationId, organizations.id))
      .where(and(
        baseFilter,
        sql`${activities.parsedContent}->'riskFlags' IS NOT NULL`,
        sql`jsonb_array_length(${activities.parsedContent}->'riskFlags') > 0`,
      ))
      .groupBy(
        sql`jsonb_array_elements_text(${activities.parsedContent}->'riskFlags')`,
        organizations.name,
      ),
  ])

  // 집계 가공: intent distribution
  const totalIntent = intentDistribution.reduce((s, r) => s + Number(r.count), 0)
  const intentDist = intentDistribution.map((r) => ({
    intent: r.intent,
    count: Number(r.count),
    percentage: totalIntent > 0 ? Math.round((Number(r.count) / totalIntent) * 100) : 0,
  }))

  // 집계 가공: sentiment distribution
  const totalSentiment = sentimentDistribution.reduce((s, r) => s + Number(r.count), 0)
  const sentimentDist = sentimentDistribution.map((r) => ({
    sentiment: r.sentiment,
    count: Number(r.count),
    percentage: totalSentiment > 0 ? Math.round((Number(r.count) / totalSentiment) * 100) : 0,
  }))

  // 집계 가공: org × intent matrix
  const orgMap = new Map<string, { organizationName: string; intents: Record<string, number> }>()
  for (const row of orgIntentRaw) {
    if (!row.organizationId) continue
    const key = row.organizationId
    if (!orgMap.has(key)) {
      orgMap.set(key, { organizationName: row.organizationName ?? '미분류', intents: {} })
    }
    const entry = orgMap.get(key)!
    entry.intents[row.intent] = Number(row.count)
  }
  // top 10 고객사 (활동 총합 기준)
  const orgIntentMatrix = [...orgMap.entries()]
    .map(([id, data]) => ({
      organizationId: id,
      ...data,
      total: Object.values(data.intents).reduce((s, v) => s + v, 0),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  // 집계 가공: product trend
  const productTrendMap = new Map<string, Record<string, number>>()
  for (const row of productTrend) {
    if (!productTrendMap.has(row.month)) {
      productTrendMap.set(row.month, {})
    }
    productTrendMap.get(row.month)![row.products] = Number(row.count)
  }
  const productTrendResult = [...productTrendMap.entries()].map(([month, products]) => ({
    month,
    products,
  }))

  // 집계 가공: risk summary
  const riskMap = new Map<string, { count: number; orgs: Set<string> }>()
  for (const row of riskRaw) {
    if (!riskMap.has(row.flag)) {
      riskMap.set(row.flag, { count: 0, orgs: new Set() })
    }
    const entry = riskMap.get(row.flag)!
    entry.count += Number(row.count)
    if (row.orgName) entry.orgs.add(row.orgName)
  }
  const riskSummary = [...riskMap.entries()]
    .map(([flag, data]) => ({
      flag,
      count: data.count,
      recentOrgs: [...data.orgs].slice(0, 3),
    }))
    .sort((a, b) => b.count - a.count)

  return Response.json(createApiResponse({
    intentDistribution: intentDist,
    stageFunnel: stageFunnel.map((r) => ({ stage: r.stage, count: Number(r.count) })),
    sentimentDistribution: sentimentDist,
    orgIntentMatrix,
    productTrend: productTrendResult,
    riskSummary,
  }))
}
