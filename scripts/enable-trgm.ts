/**
 * pg_trgm 확장 활성화 + 유사 검색용 인덱스 생성
 * 실행: npx tsx scripts/enable-trgm.ts
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  console.log('1. pg_trgm 확장 활성화...')
  await sql`CREATE EXTENSION IF NOT EXISTS pg_trgm`
  console.log('   ✓ pg_trgm enabled')

  console.log('2. GIN 트라이그램 인덱스 생성 (raw_content)...')
  await sql`CREATE INDEX IF NOT EXISTS idx_activities_raw_trgm ON activities USING gin (raw_content gin_trgm_ops)`
  console.log('   ✓ idx_activities_raw_trgm created')

  console.log('3. 복합 인덱스 생성 (organization_id + activity_date)...')
  await sql`CREATE INDEX IF NOT EXISTS idx_activities_org_date ON activities (organization_id, activity_date DESC)`
  console.log('   ✓ idx_activities_org_date created')

  // 확인
  console.log('\n=== 검증 ===')
  const test = await sql`
    SELECT raw_content, similarity(raw_content, 'IBK 원장서비스') as score
    FROM activities
    WHERE similarity(raw_content, 'IBK 원장서비스') > 0.05
    ORDER BY score DESC
    LIMIT 3
  `
  test.forEach((r, i) => {
    console.log(`${i + 1}. score=${(r.score as number).toFixed(3)} | ${(r.raw_content as string).slice(0, 80)}...`)
  })

  console.log('\n완료!')
}

main().catch(console.error)
