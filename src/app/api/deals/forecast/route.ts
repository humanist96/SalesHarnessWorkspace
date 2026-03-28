import { auth } from '@/lib/auth'
import { db, deals, organizations } from '@/lib/db'
import { eq, and, notInArray } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const activeDeals = await db.select({
    deal: deals,
    organizationName: organizations.name,
  })
    .from(deals)
    .leftJoin(organizations, eq(deals.organizationId, organizations.id))
    .where(and(
      eq(deals.userId, session.user.id),
      notInArray(deals.stage, ['closed_won', 'closed_lost']),
    ))

  const dealForecasts = activeDeals.map(({ deal, organizationName }) => {
    const probability = deal.aiScore ?? 50
    const amount = deal.amount ?? 0
    return {
      id: deal.id,
      title: deal.title,
      organizationName,
      stage: deal.stage,
      amount,
      probability,
      weighted: Math.round(amount * probability / 100),
    }
  })

  const best = dealForecasts.reduce((sum, d) => sum + d.amount, 0)
  const likely = dealForecasts.reduce((sum, d) => sum + d.weighted, 0)
  const worst = Math.round(likely * 0.6)

  return Response.json(createApiResponse({
    best,
    likely,
    worst,
    deals: dealForecasts.sort((a, b) => b.weighted - a.weighted),
  }))
}
