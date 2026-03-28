import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, contacts } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params
  const body = await request.json()

  const [contact] = await db.update(contacts).set({ ...body, updatedAt: new Date() }).where(eq(contacts.id, id)).returning()
  if (!contact) return Response.json(createApiError('담당자를 찾을 수 없습니다.'), { status: 404 })

  return Response.json(createApiResponse(contact))
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params
  await db.delete(contacts).where(eq(contacts.id, id))

  return Response.json(createApiResponse({ deleted: true }))
}
