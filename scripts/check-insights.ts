import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  const intents = await sql`
    SELECT parsed_content->>'intent' as intent, COUNT(*)::int as count
    FROM activities WHERE parsed_content->>'intent' IS NOT NULL
    GROUP BY parsed_content->>'intent' ORDER BY count DESC
  `
  console.log('\n=== 영업 목적(Intent) 분포 ===')
  intents.forEach(r => console.log(`  ${r.intent}: ${r.count}건`))

  const stages = await sql`
    SELECT parsed_content->>'stage' as stage, COUNT(*)::int as count
    FROM activities WHERE parsed_content->>'stage' IS NOT NULL
    GROUP BY parsed_content->>'stage' ORDER BY count DESC
  `
  console.log('\n=== 영업 단계(Stage) 분포 ===')
  stages.forEach(r => console.log(`  ${r.stage}: ${r.count}건`))

  const sentiments = await sql`
    SELECT parsed_content->>'sentiment' as sentiment, COUNT(*)::int as count
    FROM activities WHERE parsed_content->>'sentiment' IS NOT NULL
    GROUP BY parsed_content->>'sentiment' ORDER BY count DESC
  `
  console.log('\n=== 감성(Sentiment) 분포 ===')
  sentiments.forEach(r => console.log(`  ${r.sentiment}: ${r.count}건`))

  const products = await sql`
    SELECT p.product, COUNT(*)::int as count
    FROM activities, jsonb_array_elements_text(parsed_content->'products') as p(product)
    WHERE parsed_content->'products' IS NOT NULL
    GROUP BY p.product ORDER BY count DESC LIMIT 10
  `
  console.log('\n=== 상품별 활동 (Top 10) ===')
  products.forEach(r => console.log(`  ${r.product}: ${r.count}건`))

  const risks = await sql`
    SELECT r.flag, COUNT(*)::int as count
    FROM activities, jsonb_array_elements_text(parsed_content->'riskFlags') as r(flag)
    WHERE parsed_content->'riskFlags' IS NOT NULL
      AND jsonb_array_length(parsed_content->'riskFlags') > 0
    GROUP BY r.flag ORDER BY count DESC
  `
  console.log('\n=== 리스크 신호 ===')
  if (risks.length === 0) console.log('  (감지된 리스크 없음)')
  else risks.forEach(r => console.log(`  ${r.flag}: ${r.count}건`))

  const coverage = await sql`
    SELECT COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE parsed_content->>'intent' IS NOT NULL)::int as v2
    FROM activities
  `
  const t = coverage[0].total as number, v = coverage[0].v2 as number
  console.log(`\n=== V2 커버리지 ===`)
  console.log(`  전체: ${t}건, V2 분류: ${v}건 (${Math.round(v/t*100)}%)`)
}

main().catch(console.error)
