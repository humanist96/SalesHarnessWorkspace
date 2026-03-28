import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, reports, activities, deals, reminders, meetings, organizations } from '@/lib/db'
import { eq, and, gte, lte, desc, count, or, notInArray } from 'drizzle-orm'
import { openai, AI_MODELS } from '@/lib/openai/client'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const body = await request.json()
  const { type, periodStart, periodEnd } = body as { type: 'weekly' | 'monthly'; periodStart: string; periodEnd: string }

  if (!type || !periodStart || !periodEnd) {
    return Response.json(createApiError('보고서 유형, 시작일, 종료일이 필요합니다.'), { status: 400 })
  }

  const userId = session.user.id
  const startDate = new Date(periodStart)
  const endDate = new Date(periodEnd + 'T23:59:59Z')

  // 1. 기간 내 활동 조회
  const periodActivities = await db.select({
    activity: activities,
    orgName: organizations.name,
  })
    .from(activities)
    .leftJoin(organizations, eq(activities.organizationId, organizations.id))
    .where(and(
      eq(activities.userId, userId),
      gte(activities.activityDate, startDate),
      lte(activities.activityDate, endDate),
    ))
    .orderBy(desc(activities.activityDate))

  // 2. 활성 딜 현황
  const activeDeals = await db.select({
    deal: deals,
    orgName: organizations.name,
  })
    .from(deals)
    .leftJoin(organizations, eq(deals.organizationId, organizations.id))
    .where(and(
      eq(deals.userId, userId),
      notInArray(deals.stage, ['closed_won', 'closed_lost']),
    ))

  // 3. 후속조치 현황
  const [pendingCount] = await db.select({ count: count() })
    .from(reminders)
    .where(and(eq(reminders.userId, userId), eq(reminders.status, 'pending')))

  const [completedCount] = await db.select({ count: count() })
    .from(reminders)
    .where(and(
      eq(reminders.userId, userId),
      eq(reminders.status, 'completed'),
      gte(reminders.completedAt, startDate),
    ))

  const [overdueCount] = await db.select({ count: count() })
    .from(reminders)
    .where(and(eq(reminders.userId, userId), eq(reminders.status, 'overdue')))

  // 4. 다음 주 미팅
  const nextWeekEnd = new Date(endDate.getTime() + 7 * 24 * 60 * 60 * 1000)
  const upcomingMeetings = await db.select()
    .from(meetings)
    .where(and(
      eq(meetings.userId, userId),
      eq(meetings.status, 'scheduled'),
      gte(meetings.scheduledAt, endDate),
      lte(meetings.scheduledAt, nextWeekEnd),
    ))
    .orderBy(meetings.scheduledAt)
    .limit(5)

  // Stats snapshot
  const totalCompleted = completedCount?.count ?? 0
  const totalPending = pendingCount?.count ?? 0
  const totalOverdue = overdueCount?.count ?? 0
  const totalReminders = totalCompleted + totalPending + totalOverdue
  const completionRate = totalReminders > 0 ? Math.round((totalCompleted / totalReminders) * 100) : 0

  const stats = {
    totalActivities: periodActivities.length,
    activityBreakdown: groupBy(periodActivities, (a) => a.orgName || '미분류'),
    pipelineSummary: {
      activeDeals: activeDeals.length,
      totalAmount: activeDeals.reduce((s, d) => s + (d.deal.amount ?? 0), 0),
    },
    reminderStats: { completed: totalCompleted, pending: totalPending, overdue: totalOverdue, completionRate },
  }

  // 5. GPT-4o 보고서 생성
  const activityText = periodActivities.slice(0, 30).map((a) => {
    const parsed = a.activity.parsedContent as Record<string, unknown> | null
    return `[${a.orgName || '미분류'}] (${a.activity.type || '기타'}) ${(parsed?.summary as string) || a.activity.rawContent.slice(0, 100)}`
  }).join('\n')

  const dealText = activeDeals.map((d) =>
    `[${d.orgName}] ${d.deal.title} | ${d.deal.stage} | ${d.deal.amount ? `${(d.deal.amount / 100_000_000).toFixed(2)}억` : '금액 미정'}${d.deal.aiScore ? ` | AI ${d.deal.aiScore}%` : ''}`
  ).join('\n')

  const meetingText = upcomingMeetings.map((m) => {
    const date = new Date(m.scheduledAt)
    return `${date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })} ${date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} — ${m.title}`
  }).join('\n')

  const periodLabel = type === 'weekly' ? '주간' : '월간'
  const prompt = `코스콤 금융영업1팀의 ${periodLabel} 영업 활동 보고서를 작성하세요.
기간: ${periodStart} ~ ${periodEnd}

## 데이터

### 활동 (${periodActivities.length}건)
${activityText || '활동 없음'}

### 파이프라인 (${activeDeals.length}건, 총 ${(stats.pipelineSummary.totalAmount / 100_000_000).toFixed(1)}억)
${dealText || '활성 딜 없음'}

### 후속조치
완료: ${totalCompleted}건 / 미완료: ${totalPending}건 / 지연: ${totalOverdue}건
완료율: ${completionRate}%

### 다음 주 주요 일정
${meetingText || '예정 미팅 없음'}

## 보고서 형식 (마크다운)
1. 요약 (2-3문장)
2. 주요 활동 (고객사별 그룹, 핵심만)
3. 파이프라인 변동 (신규/진행/완료)
4. 후속조치 현황 (완료율, 주의 필요 항목)
5. 다음 주 주요 일정
6. 특이사항 및 건의

경영진이 5분 안에 읽을 수 있도록 간결하게 작성하세요. 한국어로.`

  let content = ''
  try {
    const response = await openai.chat.completions.create({
      model: AI_MODELS.quality,
      messages: [
        { role: 'system', content: '당신은 금융영업팀의 주간/월간 보고서를 작성하는 AI입니다. 마크다운 형식으로 정확하고 간결한 보고서를 생성합니다.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })
    content = response.choices[0]?.message?.content || '보고서 생성 실패'
  } catch {
    content = `# ${periodLabel} 영업 활동 보고서\n\n기간: ${periodStart} ~ ${periodEnd}\n\n> AI 보고서 생성에 실패했습니다. 수동으로 작성해주세요.`
  }

  const title = `${periodLabel} 영업 활동 보고서 (${periodStart} ~ ${periodEnd})`

  // 6. DB 저장
  const [report] = await db.insert(reports).values({
    userId,
    type,
    title,
    content,
    periodStart,
    periodEnd,
    stats,
    aiModel: AI_MODELS.quality,
  }).returning()

  return Response.json(createApiResponse(report), { status: 201 })
}

function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, number> {
  const result: Record<string, number> = {}
  for (const item of arr) {
    const key = keyFn(item)
    result[key] = (result[key] || 0) + 1
  }
  return result
}
