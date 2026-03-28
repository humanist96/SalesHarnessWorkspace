import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, documents } from '@/lib/db'
import { eq, desc } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const result = await db
    .select()
    .from(documents)
    .where(eq(documents.userId, session.user.id))
    .orderBy(desc(documents.createdAt))

  return Response.json(createApiResponse(result))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const body = await request.json()

  const [doc] = await db.insert(documents).values({
    userId: session.user.id,
    type: body.type,
    title: body.title,
    content: body.content,
    organizationId: body.organizationId || null,
    aiGenerated: body.aiGenerated ?? true,
    aiModel: body.aiModel || null,
    aiPromptVersion: body.aiPromptVersion || null,
  }).returning()

  return Response.json(createApiResponse(doc), { status: 201 })
}
