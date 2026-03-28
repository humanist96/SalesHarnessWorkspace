import { db, activities, reminders, organizations, contacts } from '@/lib/db'
import { eq, ilike, isNull, and } from 'drizzle-orm'
import { classifyActivity, type ClassificationResult } from './classify'

interface PipelineContext {
  activityId: string
  rawContent: string
  userId: string
  organizationId?: string | null
}

interface PipelineResult {
  classification: ClassificationResult
  remindersCreated: number
  organizationMatched: boolean
}

export async function executeActivityPipeline(ctx: PipelineContext): Promise<PipelineResult> {
  // Stage 1: AI 분류 (동기)
  const classification = await classifyActivity(ctx.rawContent)

  // 활동 레코드 업데이트 (분류 결과 반영)
  await db.update(activities).set({
    type: classification.type,
    parsedContent: classification as unknown as Record<string, unknown>,
    aiClassified: true,
    aiConfidence: classification.confidence,
    pipelineStatus: 'processing',
    updatedAt: new Date(),
  }).where(eq(activities.id, ctx.activityId))

  // Stage 2: 고객사 자동 매칭 (언급된 고객사명으로 검색)
  let organizationMatched = !!ctx.organizationId
  if (!ctx.organizationId && classification.organizationMention) {
    const [matchedOrg] = await db.select()
      .from(organizations)
      .where(and(
        ilike(organizations.name, `%${classification.organizationMention}%`),
        isNull(organizations.deletedAt),
      ))
      .limit(1)

    if (matchedOrg) {
      await db.update(activities).set({
        organizationId: matchedOrg.id,
      }).where(eq(activities.id, ctx.activityId))
      organizationMatched = true
    }
  }

  // Stage 2b: 담당자 자동 매칭 (contactMention으로 contacts 테이블 검색)
  if (classification.contactMention) {
    const orgFilter = ctx.organizationId
      ? and(
          ilike(contacts.name, `%${classification.contactMention}%`),
          eq(contacts.organizationId, ctx.organizationId),
        )
      : ilike(contacts.name, `%${classification.contactMention}%`)

    const [matchedContact] = await db.select()
      .from(contacts)
      .where(orgFilter)
      .limit(1)

    if (matchedContact) {
      await db.update(activities).set({
        contactId: matchedContact.id,
      }).where(eq(activities.id, ctx.activityId))
    }
  }

  // Stage 3: 후속조치 자동 추출 → reminders 생성
  let remindersCreated = 0
  if (classification.followUps.length > 0) {
    const reminderValues = classification.followUps.map((fu) => ({
      userId: ctx.userId,
      activityId: ctx.activityId,
      organizationId: ctx.organizationId || null,
      title: fu.action,
      description: `출처: "${ctx.rawContent.slice(0, 100)}..."`,
      dueDate: parseDueDate(fu.dueDescription),
      priority: fu.priority,
      status: 'pending' as const,
      aiExtracted: true,
      sourceText: fu.dueDescription,
    }))

    await db.insert(reminders).values(reminderValues)
    remindersCreated = reminderValues.length
  }

  // Stage 4: 파이프라인 완료 마킹
  await db.update(activities).set({
    pipelineStatus: 'completed',
    updatedAt: new Date(),
  }).where(eq(activities.id, ctx.activityId))

  return { classification, remindersCreated, organizationMatched }
}

function parseDueDate(dueDescription: string): Date {
  const now = new Date()
  const desc = dueDescription.toLowerCase()

  if (desc.includes('즉시') || desc.includes('오늘')) {
    return now
  }
  if (desc.includes('내일')) {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000)
  }
  if (desc.includes('차주') || desc.includes('다음주') || desc.includes('다음 주')) {
    const nextMonday = new Date(now)
    nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7 || 7))
    return nextMonday
  }
  if (desc.includes('월말') || desc.includes('말까지')) {
    return new Date(now.getFullYear(), now.getMonth() + 1, 0)
  }
  if (desc.includes('2주')) {
    return new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  }
  // 기본값: 1주 후
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
}
