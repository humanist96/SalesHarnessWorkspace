import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, activities, organizations } from '@/lib/db'
import { eq, desc, and, gte, sql } from 'drizzle-orm'
import { createApiError } from '@/lib/utils/api'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })
  }

  const format = request.nextUrl.searchParams.get('format') || 'csv'
  const period = request.nextUrl.searchParams.get('period') || 'all'
  const orgId = request.nextUrl.searchParams.get('organizationId') || ''

  const filters: ReturnType<typeof eq>[] = [eq(activities.userId, session.user.id)]
  if (orgId) filters.push(eq(activities.organizationId, orgId))
  if (period !== 'all') {
    const days = period === '30d' ? 30 : period === '90d' ? 90 : period === '6m' ? 180 : 365
    filters.push(gte(activities.activityDate, new Date(Date.now() - days * 24 * 60 * 60 * 1000)))
  }

  const rows = await db.select({
    date: sql<string>`to_char(${activities.activityDate}, 'YYYY.MM.DD')`,
    organization: organizations.name,
    type: activities.type,
    rawContent: activities.rawContent,
    intent: sql<string>`${activities.parsedContent}->>'intent'`,
    stage: sql<string>`${activities.parsedContent}->>'stage'`,
    products: sql<string>`${activities.parsedContent}->'products'`,
    sentiment: sql<string>`${activities.parsedContent}->>'sentiment'`,
    summary: sql<string>`${activities.parsedContent}->>'summary'`,
    confidence: activities.aiConfidence,
  })
    .from(activities)
    .leftJoin(organizations, eq(activities.organizationId, organizations.id))
    .where(and(...filters))
    .orderBy(desc(activities.activityDate))

  if (format === 'json') {
    return Response.json(rows, {
      headers: {
        'Content-Disposition': `attachment; filename="activities-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    })
  }

  // CSV export
  const BOM = '\uFEFF' // Excel에서 한글 깨짐 방지
  const header = '날짜,고객사,유형,영업목적,영업단계,감성,AI요약,원문내용'
  const csvRows = rows.map((r) => {
    const escapeCsv = (val: string | null) => {
      if (!val) return ''
      const escaped = val.replace(/"/g, '""')
      return escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')
        ? `"${escaped}"`
        : escaped
    }

    return [
      r.date,
      escapeCsv(r.organization),
      r.type || '',
      r.intent || '',
      r.stage || '',
      r.sentiment || '',
      escapeCsv(r.summary),
      escapeCsv(r.rawContent),
    ].join(',')
  })

  const csv = BOM + [header, ...csvRows].join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="activities-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
