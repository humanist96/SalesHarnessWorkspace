import { auth } from '@/lib/auth'
import { db, activities, reminders } from '@/lib/db'
import { eq, and, or, count, gte, sql } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const userId = session.user.id
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [
    totalActivities,
    weekActivities,
    pendingReminders,
    overdueReminders,
    recentActivities,
    recentReminders,
    activityTypeCounts,
  ] = await Promise.all([
    // 전체 활동 수
    db.select({ count: count() })
      .from(activities)
      .where(eq(activities.userId, userId)),

    // 이번 주 활동 수
    db.select({ count: count() })
      .from(activities)
      .where(and(eq(activities.userId, userId), gte(activities.activityDate, weekAgo))),

    // 대기중 후속조치
    db.select({ count: count() })
      .from(reminders)
      .where(and(eq(reminders.userId, userId), eq(reminders.status, 'pending'))),

    // 지연 후속조치
    db.select({ count: count() })
      .from(reminders)
      .where(and(eq(reminders.userId, userId), eq(reminders.status, 'overdue'))),

    // 최근 5건 활동
    db.select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(sql`${activities.activityDate} desc`)
      .limit(5),

    // 긴급 후속조치 (pending + overdue, 최근 5건)
    db.select()
      .from(reminders)
      .where(and(
        eq(reminders.userId, userId),
        or(eq(reminders.status, 'pending'), eq(reminders.status, 'overdue')),
      ))
      .orderBy(sql`${reminders.dueDate} asc`)
      .limit(5),

    // 활동 유형별 카운트 (이번 달)
    db.select({
      type: activities.type,
      count: count(),
    })
      .from(activities)
      .where(and(eq(activities.userId, userId), gte(activities.activityDate, monthAgo)))
      .groupBy(activities.type),
  ])

  return Response.json(createApiResponse({
    stats: {
      totalActivities: totalActivities[0]?.count ?? 0,
      weekActivities: weekActivities[0]?.count ?? 0,
      pendingReminders: pendingReminders[0]?.count ?? 0,
      overdueReminders: overdueReminders[0]?.count ?? 0,
    },
    recentActivities,
    recentReminders,
    activityTypeCounts,
  }))
}
