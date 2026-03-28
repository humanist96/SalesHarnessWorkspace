import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, deals, organizations } from '@/lib/db'
import { eq, and, desc, sql } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

const STAGE_ORDER = ['discovery', 'proposal', 'negotiation', 'contract', 'billing', 'closed_won', 'closed_lost'] as const

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const view = request.nextUrl.searchParams.get('view')
  const stage = request.nextUrl.searchParams.get('stage')
  const orgId = request.nextUrl.searchParams.get('organizationId')

  const filters = [eq(deals.userId, session.user.id)]
  if (stage) filters.push(eq(deals.stage, stage as typeof STAGE_ORDER[number]))
  if (orgId) filters.push(eq(deals.organizationId, orgId))

  const result = await db.select({
    deal: deals,
    organizationName: organizations.name,
  })
    .from(deals)
    .leftJoin(organizations, eq(deals.organizationId, organizations.id))
    .where(filters.length === 1 ? filters[0] : and(...filters))
    .orderBy(desc(deals.updatedAt))

  if (view === 'pipeline') {
    const stages: Record<string, typeof result> = {}
    for (const s of STAGE_ORDER) {
      stages[s] = result.filter((r) => r.deal.stage === s)
    }

    const activeDeals = result.filter((r) => !['closed_won', 'closed_lost'].includes(r.deal.stage))
    const totalAmount = activeDeals.reduce((sum, r) => sum + (r.deal.amount ?? 0), 0)
    const weightedAmount = activeDeals.reduce((sum, r) => sum + (r.deal.amount ?? 0) * ((r.deal.aiScore ?? 50) / 100), 0)

    return Response.json(createApiResponse({
      stages,
      summary: {
        totalDeals: activeDeals.length,
        totalAmount,
        weightedAmount: Math.round(weightedAmount),
      },
    }))
  }

  return Response.json(createApiResponse(result))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const body = await request.json()
  const { title, organizationId, contactId, stage, amount, term, description, expectedCloseDate, contractStartDate, contractEndDate } = body

  if (!title?.trim() || !organizationId) {
    return Response.json(createApiError('제목과 고객사는 필수입니다.'), { status: 400 })
  }

  const [deal] = await db.insert(deals).values({
    userId: session.user.id,
    title: title.trim(),
    organizationId,
    contactId: contactId || null,
    stage: stage || 'discovery',
    amount: amount ? Number(amount) : null,
    term: term || 'yearly',
    description: description || null,
    expectedCloseDate: expectedCloseDate || null,
    contractStartDate: contractStartDate || null,
    contractEndDate: contractEndDate || null,
  }).returning()

  return Response.json(createApiResponse(deal), { status: 201 })
}
