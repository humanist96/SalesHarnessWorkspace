import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, organizations } from '@/lib/db'
import { isNull, ilike, and } from 'drizzle-orm'
import { createOrganizationSchema } from '@/lib/validations/organization'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const search = request.nextUrl.searchParams.get('search')

  const conditions = search
    ? and(isNull(organizations.deletedAt), ilike(organizations.name, `%${search}%`))
    : isNull(organizations.deletedAt)

  const result = await db.select().from(organizations).where(conditions)

  return Response.json(createApiResponse(result))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const body = await request.json()
  const parsed = createOrganizationSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(createApiError(parsed.error.issues[0].message), { status: 400 })
  }

  const [org] = await db.insert(organizations).values({
    ...parsed.data,
    createdBy: session.user.id,
  }).returning()

  return Response.json(createApiResponse(org), { status: 201 })
}
