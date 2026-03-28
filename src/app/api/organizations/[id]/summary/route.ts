import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { db, activities, organizations } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'
import { openai, AI_MODELS } from '@/lib/openai/client'
import { createApiResponse, createApiError } from '@/lib/utils/api'

const SUMMARY_PROMPT = `당신은 코스콤 금융영업팀의 고객 활동 분석 AI입니다.
고객사의 최근 영업 활동 목록을 분석하여 다음 형식의 JSON을 반환하세요:

{
  "summary": "2-3문장으로 고객사 현황 요약",
  "keyIssues": ["핵심 이슈 1", "핵심 이슈 2", "핵심 이슈 3"],
  "recentHighlights": ["최근 주요 활동 1", "최근 주요 활동 2"],
  "recommendation": "향후 영업 전략 추천 1-2문장",
  "activityStats": {
    "total": 활동 총 건수,
    "topType": "가장 빈번한 활동 유형",
    "period": "데이터 기간 설명"
  }
}

반드시 유효한 JSON만 반환하세요.`

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json(createApiError('인증이 필요합니다.'), { status: 401 })

  const { id: orgId } = await params

  // 고객사 확인
  const [org] = await db.select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1)

  if (!org) return Response.json(createApiError('고객사를 찾을 수 없습니다.'), { status: 404 })

  // 최근 활동 조회 (최대 20건)
  const recentActivities = await db.select()
    .from(activities)
    .where(and(eq(activities.userId, session.user.id), eq(activities.organizationId, orgId)))
    .orderBy(desc(activities.activityDate))
    .limit(20)

  if (recentActivities.length === 0) {
    return Response.json(createApiResponse({
      summary: `${org.name}에 대한 활동 기록이 아직 없습니다.`,
      keyIssues: [],
      recentHighlights: [],
      recommendation: '첫 활동을 기록해보세요.',
      activityStats: { total: 0, topType: null, period: null },
    }))
  }

  // 활동 텍스트 준비
  const activityText = recentActivities.map((a, i) => {
    const parsed = a.parsedContent as Record<string, unknown> | null
    const summary = (parsed?.summary as string) || a.rawContent.slice(0, 200)
    const date = new Date(a.activityDate).toLocaleDateString('ko-KR')
    return `${i + 1}. [${date}] (${a.type || '기타'}) ${summary}`
  }).join('\n')

  try {
    const response = await openai.chat.completions.create({
      model: AI_MODELS.quality,
      messages: [
        { role: 'system', content: SUMMARY_PROMPT },
        { role: 'user', content: `고객사: ${org.name}\n산업: ${org.industry || '미지정'}\n\n최근 활동 (${recentActivities.length}건):\n${activityText}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 1000,
    })

    const text = response.choices[0]?.message?.content
    if (!text) throw new Error('Empty response')

    const result = JSON.parse(text)
    return Response.json(createApiResponse(result))
  } catch {
    return Response.json(createApiError('AI 요약 생성에 실패했습니다.'), { status: 500 })
  }
}
