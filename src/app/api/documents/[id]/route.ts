import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, documents } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params
  const [doc] = await db.select().from(documents).where(and(eq(documents.id, id), eq(documents.userId, session.user.id))).limit(1)

  if (!doc) return Response.json(createApiError('문서를 찾을 수 없습니다.'), { status: 404 })
  return Response.json(createApiResponse(doc))
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params
  const body = await request.json()

  const [doc] = await db
    .update(documents)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(documents.id, id), eq(documents.userId, session.user.id)))
    .returning()

  if (!doc) return Response.json(createApiError('문서를 찾을 수 없습니다.'), { status: 404 })
  return Response.json(createApiResponse(doc))
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params
  await db.delete(documents).where(and(eq(documents.id, id), eq(documents.userId, session.user.id)))

  return Response.json(createApiResponse({ deleted: true }))
}
