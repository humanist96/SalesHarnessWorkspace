/**
 * CSV 영업활동 데이터 직접 임포트 스크립트
 * AI 파이프라인 없이 DB에 직접 삽입 (비용 절약)
 * 고객사 자동 매칭 포함
 */
import { readFileSync } from 'fs'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, ilike, isNull, and, sql } from 'drizzle-orm'
import * as schema from '../src/lib/db/schema'
import * as iconv from 'iconv-lite'

const DATABASE_URL = process.env.DATABASE_URL!
const neonSql = neon(DATABASE_URL)
const db = drizzle(neonSql, { schema })

const CSV_PATH = 'knowledge-base/금융영업1팀 영업활동 현황_2026_정경석.csv'

// 활동 유형 키워드 매핑 (간단한 규칙 기반 분류)
function classifyType(content: string, method: string): string {
  const m = method?.trim().toLowerCase() || ''
  const c = content?.toLowerCase() || ''

  if (m.includes('전화') || m.includes('통화') || c.includes('전화') || c.includes('통화')) return 'call'
  if (m.includes('메일') || m.includes('이메일') || c.includes('메일 송부') || c.includes('메일로')) return 'email'
  if (m.includes('방문') || c.includes('방문')) return 'visit'
  if (m.includes('미팅') || c.includes('미팅') || c.includes('회의')) return 'meeting'
  if (c.includes('계약') || c.includes('체결') || c.includes('날인') || c.includes('계약서')) return 'contract'
  if (c.includes('빌링') || c.includes('청구') || c.includes('비용')) return 'billing'
  if (c.includes('검수') || c.includes('테스트') || c.includes('uat')) return 'inspection'
  return 'other'
}

function parseCSV(raw: string): string[][] {
  const rows: string[][] = []
  let current: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    const next = raw[i + 1]

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        current.push(field)
        field = ''
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        current.push(field)
        field = ''
        if (current.some(f => f.trim())) rows.push(current)
        current = []
        if (ch === '\r') i++
      } else {
        field += ch
      }
    }
  }
  if (field || current.length) {
    current.push(field)
    if (current.some(f => f.trim())) rows.push(current)
  }

  return rows
}

async function importCSV() {
  // 1. CSV 읽기 (EUC-KR → UTF-8)
  const rawBytes = readFileSync(CSV_PATH)
  const csvText = iconv.decode(rawBytes, 'euc-kr')
  const allRows = parseCSV(csvText)

  // 헤더 확인
  const header = allRows[0]
  console.log('헤더:', header?.slice(0, 6).join(' | '))
  const dataRows = allRows.slice(1)
  console.log(`총 ${dataRows.length}행 발견\n`)

  // 2. 사용자 가져오기
  const [user] = await db.select().from(schema.users).limit(1)
  if (!user) { console.error('사용자 없음'); return }
  console.log(`사용자: ${user.name}`)

  // 3. 고객사 매핑 캐시
  const orgs = await db.select().from(schema.organizations).where(isNull(schema.organizations.deletedAt))
  const orgMap = new Map<string, string>()
  for (const org of orgs) {
    orgMap.set(org.name.toLowerCase(), org.id)
    // 축약형 매핑
    if (org.name === 'IBK투자증권') orgMap.set('ibk', org.id)
    if (org.name === '다올투자증권') orgMap.set('다올', org.id)
    if (org.name === '카카오페이증권') { orgMap.set('카카오페이', org.id); orgMap.set('카카오', org.id); orgMap.set('카카오페이투증권', org.id) }
    if (org.name === '리딩투자증권') orgMap.set('리딩', org.id)
    if (org.name === 'LS증권') orgMap.set('ls투자증권', org.id)
    if (org.name === 'DB금융투자') { orgMap.set('db금투', org.id); orgMap.set('db투자증권', org.id); orgMap.set('db증권', org.id); orgMap.set('db', org.id) }
    if (org.name === '우리투자증권') orgMap.set('우리종합금융', org.id)
    if (org.name === '부국증권') orgMap.set('부국', org.id)
    if (org.name === 'IPS외국환중개') orgMap.set('ips외국환중개', org.id)
    if (org.name === '이베스트') orgMap.set('이베스트', org.id)
  }

  function findOrgId(customerName: string): string | null {
    if (!customerName?.trim()) return null
    const key = customerName.trim().toLowerCase()
    if (orgMap.has(key)) return orgMap.get(key)!

    // 부분 매칭
    for (const [name, id] of orgMap) {
      if (key.includes(name) || name.includes(key)) return id
    }
    return null
  }

  // 4. 배치 생성
  const [batch] = await db.insert(schema.importBatches).values({
    userId: user.id,
    fileName: CSV_PATH,
    totalRows: dataRows.length,
    status: 'processing',
    startedAt: new Date(),
  }).returning()

  // 5. 행별 임포트
  let success = 0
  let failed = 0
  let skipped = 0
  const errors: { row: number; msg: string }[] = []

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i]
    const [dateStr, customer, method, customerContact, koscomContact, content] = row

    if (!content?.trim() || content.trim().length < 5) {
      skipped++
      continue
    }

    try {
      const orgId = findOrgId(customer)
      const actType = classifyType(content, method)

      // 날짜 파싱
      let actDate = new Date()
      if (dateStr?.trim()) {
        const cleaned = dateStr.trim().replace(/\./g, '-')
        const parsed = new Date(cleaned)
        if (!isNaN(parsed.getTime())) actDate = parsed
      }

      await db.insert(schema.activities).values({
        userId: user.id,
        rawContent: content.trim(),
        organizationId: orgId,
        type: actType,
        activityDate: actDate,
        source: 'csv_import',
        aiClassified: false,
        aiConfidence: actType !== 'other' ? 60 : 0,
        pipelineStatus: 'completed',
        parsedContent: {
          summary: content.trim().slice(0, 200),
          keywords: [],
          amounts: [],
          customerContact: customerContact?.trim() || null,
          koscomContact: koscomContact?.trim() || null,
        },
      })

      success++

      if ((i + 1) % 50 === 0) {
        console.log(`  진행: ${i + 1}/${dataRows.length} (성공 ${success}, 실패 ${failed}, 스킵 ${skipped})`)
      }
    } catch (err) {
      failed++
      errors.push({ row: i + 1, msg: err instanceof Error ? err.message : String(err) })
    }
  }

  // 6. 배치 완료
  await db.update(schema.importBatches).set({
    processedRows: dataRows.length,
    successRows: success,
    failedRows: failed,
    status: 'completed',
    completedAt: new Date(),
    errors: errors.length > 0 ? errors.slice(0, 20) : null,
  }).where(eq(schema.importBatches.id, batch.id))

  console.log(`\n=== CSV 임포트 완료 ===`)
  console.log(`전체: ${dataRows.length}행`)
  console.log(`성공: ${success}건`)
  console.log(`실패: ${failed}건`)
  console.log(`스킵: ${skipped}건 (내용 없음)`)

  if (errors.length > 0) {
    console.log(`\n에러 (상위 5건):`)
    errors.slice(0, 5).forEach(e => console.log(`  Row ${e.row}: ${e.msg}`))
  }

  // 7. 최종 집계
  const [actCount] = await db.select({ count: sql`count(*)` }).from(schema.activities)
  const orgCounts = await db.select({
    orgId: schema.activities.organizationId,
    count: sql<number>`count(*)`,
  }).from(schema.activities).groupBy(schema.activities.organizationId)

  const matched = orgCounts.filter(o => o.orgId).reduce((s, o) => s + o.count, 0)
  const unmatched = orgCounts.filter(o => !o.orgId).reduce((s, o) => s + o.count, 0)

  console.log(`\n고객사 매칭: ${matched}건 매칭됨, ${unmatched}건 미매칭`)
  console.log(`DB 총 활동: ${actCount?.count}건`)
}

importCSV().catch(console.error)
