import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, reports } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const type = request.nextUrl.searchParams.get('type')
  const filters = [eq(reports.userId, session.user.id)]
  if (type) filters.push(eq(reports.type, type as 'weekly' | 'monthly'))

  const result = await db.select()
    .from(reports)
    .where(filters.length === 1 ? filters[0] : and(...filters))
    .orderBy(desc(reports.generatedAt))
    .limit(20)

  return Response.json(createApiResponse(result))
}
