import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, activities, organizations, importBatches } from '@/lib/db'
import { eq, ilike, isNull, and } from 'drizzle-orm'
import { createApiResponse, createApiError } from '@/lib/utils/api'
import { executeActivityPipeline } from '@/lib/pipeline/orchestrator'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const body = await request.json()
  const { rows, fileName } = body as { rows: CsvRow[]; fileName: string }

  if (!rows || !Array.isArray(rows) || rows.length === 0) {
    return Response.json(createApiError('임포트할 데이터가 없습니다.'), { status: 400 })
  }

  // 배치 생성
  const [batch] = await db.insert(importBatches).values({
    userId: session.user.id,
    fileName,
    totalRows: rows.length,
    status: 'processing',
    startedAt: new Date(),
  }).returning()

  let successCount = 0
  let failedCount = 0
  const errors: { row: number; message: string }[] = []

  // 기존 고객사 캐시
  const existingOrgs = await db.select()
    .from(organizations)
    .where(isNull(organizations.deletedAt))

  const orgMap = new Map(existingOrgs.map((o) => [o.name.toLowerCase(), o.id]))

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      if (!row.content?.trim()) {
        failedCount++
        errors.push({ row: i + 1, message: '내용이 비어있습니다' })
        continue
      }

      // 고객사 매칭/생성
      let organizationId: string | null = null
      if (row.customer?.trim()) {
        const key = row.customer.trim().toLowerCase()
        if (orgMap.has(key)) {
          organizationId = orgMap.get(key)!
        } else {
          // 유사 이름 검색
          const [matched] = await db.select()
            .from(organizations)
            .where(and(ilike(organizations.name, `%${row.customer.trim()}%`), isNull(organizations.deletedAt)))
            .limit(1)

          if (matched) {
            organizationId = matched.id
            orgMap.set(key, matched.id)
          } else {
            // 새 고객사 생성
            const [newOrg] = await db.insert(organizations).values({
              name: row.customer.trim(),
              createdBy: session.user.id,
            }).returning()
            organizationId = newOrg.id
            orgMap.set(key, newOrg.id)
          }
        }
      }

      // 활동 저장
      const [activity] = await db.insert(activities).values({
        userId: session.user.id,
        rawContent: row.content.trim(),
        organizationId,
        activityDate: row.date ? new Date(row.date.replace(/\./g, '-')) : new Date(),
        source: 'csv_import',
        pipelineStatus: 'pending',
      }).returning()

      // AI 파이프라인 실행 (실패해도 계속)
      try {
        await executeActivityPipeline({
          activityId: activity.id,
          rawContent: row.content.trim(),
          userId: session.user.id,
          organizationId,
        })
      } catch {
        // AI 실패는 무시, 활동 자체는 저장됨
      }

      successCount++

      // 진행률 업데이트 (10건마다)
      if (i % 10 === 0) {
        await db.update(importBatches).set({
          processedRows: i + 1,
          successRows: successCount,
          failedRows: failedCount,
        }).where(eq(importBatches.id, batch.id))
      }
    } catch (err) {
      failedCount++
      errors.push({ row: i + 1, message: err instanceof Error ? err.message : '알 수 없는 오류' })
    }
  }

  // 배치 완료
  await db.update(importBatches).set({
    processedRows: rows.length,
    successRows: successCount,
    failedRows: failedCount,
    status: failedCount === rows.length ? 'failed' : 'completed',
    errors: errors.length > 0 ? errors : null,
    completedAt: new Date(),
  }).where(eq(importBatches.id, batch.id))

  return Response.json(createApiResponse({
    batchId: batch.id,
    totalRows: rows.length,
    successRows: successCount,
    failedRows: failedCount,
    errors: errors.slice(0, 20), // 최대 20개 에러만 반환
  }))
}

interface CsvRow {
  date: string
  customer: string
  method: string
  customerContact: string
  koscomContact: string
  content: string
  note: string
}
