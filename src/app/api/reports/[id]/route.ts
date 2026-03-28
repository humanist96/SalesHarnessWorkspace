import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, reports } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params
  const [report] = await db.select()
    .from(reports)
    .where(and(eq(reports.id, id), eq(reports.userId, session.user.id)))
    .limit(1)

  if (!report) return Response.json(createApiError('보고서를 찾을 수 없습니다.'), { status: 404 })
  return Response.json(createApiResponse(report))
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params
  const [deleted] = await db.delete(reports)
    .where(and(eq(reports.id, id), eq(reports.userId, session.user.id)))
    .returning()

  if (!deleted) return Response.json(createApiError('보고서를 찾을 수 없습니다.'), { status: 404 })
  return Response.json(createApiResponse({ deleted: true }))
}
