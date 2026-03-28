import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { openai, AI_MODELS } from '@/lib/openai/client'
import { db, organizations, products, aiLogs } from '@/lib/db'
import { eq, inArray } from 'drizzle-orm'
import { buildProposalMessages, buildEmailMessages, buildReportMessages } from '@/lib/openai/prompt-builder'

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ success: false, error: '인증이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json()
  const { type, data } = body

  if (!type || !data) {
    return Response.json({ success: false, error: '요청 데이터가 올바르지 않습니다.' }, { status: 400 })
  }

  try {
    let messages: { role: 'system' | 'user'; content: string }[]
    let model: string = AI_MODELS.quality

    if (type === 'proposal') {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, data.organizationId)).limit(1)
      if (!org) return Response.json({ success: false, error: '고객사를 찾을 수 없습니다.' }, { status: 404 })

      const prods = data.productIds?.length
        ? await db.select().from(products).where(inArray(products.id, data.productIds))
        : []

      messages = buildProposalMessages(org, prods, data.proposalType, data.context)
    } else if (type === 'email') {
      const [org] = await db.select().from(organizations).where(eq(organizations.id, data.organizationId)).limit(1)
      if (!org) return Response.json({ success: false, error: '고객사를 찾을 수 없습니다.' }, { status: 404 })

      messages = buildEmailMessages(org, data.recipientName, data.recipientTitle, data.purpose, data.context)
      model = AI_MODELS.fast
    } else if (type === 'report') {
      messages = buildReportMessages(data.reportType, data.startDate, data.endDate)
    } else {
      return Response.json({ success: false, error: '지원하지 않는 문서 유형입니다.' }, { status: 400 })
    }

    const startTime = Date.now()

    const stream = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
    })

    let totalOutputTokens = 0
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || ''
            if (text) {
              totalOutputTokens += Math.ceil(text.length / 4) // 대략적 토큰 추정
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()

          // 비동기로 로그 저장 (스트리밍 종료 후)
          const durationMs = Date.now() - startTime
          await db.insert(aiLogs).values({
            userId: session.user!.id!,
            agentType: 'document',
            action: 'generate',
            model,
            inputTokens: Math.ceil(JSON.stringify(messages).length / 4),
            outputTokens: totalOutputTokens,
            durationMs,
          }).catch(() => {}) // 로그 실패는 무시
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '생성 중 오류가 발생했습니다.' })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch {
    return Response.json({ success: false, error: 'AI 생성에 실패했습니다. 다시 시도해주세요.' }, { status: 500 })
  }
}
