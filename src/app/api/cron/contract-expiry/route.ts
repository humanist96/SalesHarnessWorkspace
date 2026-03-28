import { db, deals, reminders } from '@/lib/db'
import { and, lte, gte, eq, notInArray, isNotNull } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

// Vercel Cron: 매일 09:00 KST 실행
// vercel.json: { "crons": [{ "path": "/api/cron/contract-expiry", "schedule": "0 0 * * *" }] }

export async function GET(request: Request) {
  // Verify cron secret (Vercel cron adds this header)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return Response.json(createApiError('Unauthorized'), { status: 401 })
  }

  const now = new Date()
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const todayStr = now.toISOString().split('T')[0]
  const futureStr = thirtyDaysLater.toISOString().split('T')[0]

  // 30일 이내 만기 도래하는 활성 딜 조회
  const expiringDeals = await db.select()
    .from(deals)
    .where(and(
      isNotNull(deals.contractEndDate),
      lte(deals.contractEndDate, futureStr),
      gte(deals.contractEndDate, todayStr),
      notInArray(deals.stage, ['closed_won', 'closed_lost']),
    ))

  let remindersCreated = 0

  for (const deal of expiringDeals) {
    // 이미 이 딜에 대한 만기 알림이 있는지 확인
    const [existing] = await db.select()
      .from(reminders)
      .where(and(
        eq(reminders.dealId, deal.id),
        eq(reminders.title, `계약 만기 알림: ${deal.title}`),
        eq(reminders.status, 'pending'),
      ))
      .limit(1)

    if (!existing) {
      await db.insert(reminders).values({
        userId: deal.userId,
        dealId: deal.id,
        organizationId: deal.organizationId,
        title: `계약 만기 알림: ${deal.title}`,
        description: `계약 종료일: ${deal.contractEndDate}. 갱신 협의를 시작하세요.`,
        dueDate: new Date(deal.contractEndDate!),
        priority: 'high',
        status: 'pending',
        aiExtracted: true,
        sourceText: '계약 만기 자동 감지',
      })
      remindersCreated++
    }
  }

  return Response.json(createApiResponse({
    checked: expiringDeals.length,
    remindersCreated,
  }))
}
