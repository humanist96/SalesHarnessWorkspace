/**
 * 기존 V1 활동 데이터를 V2 분류로 일괄 재분류하는 스크립트
 * 실행: npx tsx scripts/reclassify-v2.ts [--dry-run] [--batch-size=20]
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, sql } from 'drizzle-orm'
import OpenAI from 'openai'
import * as schema from '../src/lib/db/schema'

const DATABASE_URL = process.env.DATABASE_URL
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!DATABASE_URL || !OPENAI_API_KEY) {
  console.error('DATABASE_URL and OPENAI_API_KEY required')
  process.exit(1)
}

const neonSql = neon(DATABASE_URL)
const db = drizzle(neonSql, { schema })
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const batchSize = parseInt(args.find(a => a.startsWith('--batch-size='))?.split('=')[1] ?? '20')

const CLASSIFY_PROMPT = `당신은 코스콤 금융영업 활동을 다차원으로 분석하는 AI입니다.
코스콤은 PowerBase(증권사/은행용 금융IT 시스템)를 판매하는 금융IT 기업입니다.

영업직원이 입력한 자유형식 텍스트를 분석하여 JSON으로 반환하세요.

=== 분류 차원 ===
1. type: call | email | visit | meeting | contract | billing | inspection | other
2. intent: new_business | contract_renewal | cross_sell | upsell | issue_resolution | relationship | info_gathering | negotiation | delivery | billing_payment
3. stage: prospecting | needs_analysis | proposal | negotiation | contracting | implementation | post_care
4. products: 관련 PowerBase 상품/서비스 (원장서비스, 투자정보계, 백업서비스, 전송서비스, 시세정보, 회선서비스, 채권매도대행, 장비유지보수, 시장조성, 파생상품, 외국환, FEP 등)
5. sentiment: positive | neutral | negative
6. riskFlags: 해당 시만 (할인 요구, 경쟁사 언급, 결정 지연, 담당자 변경, 예산 축소, 해지 검토, 내부규정 변경, 적자 발생, 시스템 장애)

=== JSON 형식 ===
{"type":"...","intent":"...","stage":"...","products":["상품"],"sentiment":"...","riskFlags":["리스크"],"summary":"1-2문장","keywords":["키워드 3-5개"],"amounts":[{"value":숫자,"unit":"억/만/원","description":"설명"}],"followUps":[{"action":"후속조치","dueDescription":"차주/월말","priority":"critical|high|medium|low"}],"organizationMention":"고객사명 또는 null","contactMention":"담당자명 또는 null","confidence":0-100,"reasoning":"분류 이유 1-2문장"}

반드시 유효한 JSON만 반환.`

async function classify(rawContent: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: CLASSIFY_PROMPT },
      { role: 'user', content: rawContent },
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1,
    max_tokens: 1500,
  })
  return JSON.parse(response.choices[0]?.message?.content ?? '{}')
}

async function main() {
  console.log(`\n=== V2 재분류 시작 ===`)
  console.log(`모드: ${dryRun ? 'DRY RUN (미리보기)' : '실제 실행'}`)
  console.log(`배치 크기: ${batchSize}\n`)

  // V1 데이터 조회 (intent 필드 없는 것들)
  const targets = await db.select({
    id: schema.activities.id,
    rawContent: schema.activities.rawContent,
  })
    .from(schema.activities)
    .where(sql`${schema.activities.parsedContent}->>'intent' IS NULL AND ${schema.activities.pipelineStatus} = 'completed'`)
    .orderBy(schema.activities.activityDate)

  console.log(`대상: ${targets.length}건\n`)

  if (targets.length === 0) {
    console.log('재분류할 V1 데이터가 없습니다.')
    return
  }

  if (dryRun) {
    console.log('--- 미리보기 (첫 3건) ---\n')
    for (const t of targets.slice(0, 3)) {
      const result = await classify(t.rawContent)
      console.log(`원문: ${t.rawContent.slice(0, 80)}...`)
      console.log(`→ intent: ${result.intent}, stage: ${result.stage}`)
      console.log(`→ products: ${result.products?.join(', ') || '없음'}`)
      console.log(`→ sentiment: ${result.sentiment}, risks: ${result.riskFlags?.join(', ') || '없음'}`)
      console.log(`→ reasoning: ${result.reasoning}\n`)
    }
    console.log(`\n전체 ${targets.length}건 재분류하려면: npx tsx scripts/reclassify-v2.ts`)
    return
  }

  // 실제 실행
  let processed = 0
  let failed = 0
  const startTime = Date.now()

  for (let i = 0; i < targets.length; i += batchSize) {
    const batch = targets.slice(i, i + batchSize)

    for (const target of batch) {
      try {
        const result = await classify(target.rawContent)
        await db.update(schema.activities).set({
          type: result.type,
          parsedContent: result,
          aiClassified: true,
          aiConfidence: result.confidence,
          updatedAt: new Date(),
        }).where(eq(schema.activities.id, target.id))
        processed++
      } catch (err) {
        failed++
        console.error(`실패 [${target.id}]: ${(err as Error).message}`)
      }
    }

    const pct = Math.round(((i + batch.length) / targets.length) * 100)
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0)
    console.log(`[${pct}%] ${processed + failed}/${targets.length} (성공: ${processed}, 실패: ${failed}) — ${elapsed}초`)

    // rate limit: 배치 간 2초 대기
    if (i + batchSize < targets.length) {
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`\n=== 완료 ===`)
  console.log(`총 처리: ${processed + failed}건 (성공: ${processed}, 실패: ${failed})`)
  console.log(`소요 시간: ${totalTime}초`)
}

main().catch(console.error)
