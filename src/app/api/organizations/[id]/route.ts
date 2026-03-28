import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, organizations, contacts } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params
  const [org] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1)
  if (!org) return Response.json(createApiError('고객사를 찾을 수 없습니다.'), { status: 404 })

  const orgContacts = await db.select().from(contacts).where(eq(contacts.organizationId, id))

  return Response.json(createApiResponse({ ...org, contacts: orgContacts }))
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params
  const body = await request.json()

  const [org] = await db.update(organizations).set({ ...body, updatedAt: new Date() }).where(eq(organizations.id, id)).returning()
  if (!org) return Response.json(createApiError('고객사를 찾을 수 없습니다.'), { status: 404 })

  return Response.json(createApiResponse(org))
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id } = await params
  await db.update(organizations).set({ deletedAt: new Date() }).where(eq(organizations.id, id))

  return Response.json(createApiResponse({ deleted: true }))
}
