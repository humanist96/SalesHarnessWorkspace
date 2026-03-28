import { auth } from '@/lib/auth'
import { db, products } from '@/lib/db'
import { createApiResponse, createApiError } from '@/lib/utils/api'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const result = await db.select().from(products)
  return Response.json(createApiResponse(result))
}
