/**
 * 기존 589건 활동 데이터의 rawContent를 CSV 원문 전체 맥락으로 업데이트
 * CSV의 날짜/고객사/담당자/방법/비고를 rawContent에 통합
 *
 * 실행: npx tsx scripts/reimport-fullcontent.ts [--dry-run]
 */
import { config } from 'dotenv'
config({ path: '.env.local' })
import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'
import { execSync } from 'child_process'

const dryRun = process.argv.includes('--dry-run')

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

function buildFullRawContent(row: { date: string; customer: string; method: string; customerContact: string; koscomContact: string; content: string; note: string }): string {
  const parts: string[] = []
  const meta: string[] = []
  if (row.date?.trim()) meta.push(row.date.trim())
  if (row.customer?.trim()) meta.push(row.customer.trim())
  if (row.method?.trim()) meta.push(row.method.trim())
  if (row.customerContact?.trim()) meta.push(`담당: ${row.customerContact.trim()}`)
  if (row.koscomContact?.trim()) meta.push(`코스콤: ${row.koscomContact.trim()}`)
  if (meta.length > 0) parts.push(meta.join(' | '))
  if (row.content?.trim()) parts.push(row.content.trim())
  if (row.note?.trim()) parts.push(`[비고] ${row.note.trim()}`)
  return parts.join('\n')
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!)

  console.log(`\n=== 원문 전체 맥락 업데이트 ===`)
  console.log(`모드: ${dryRun ? 'DRY RUN' : '실제 실행'}\n`)

  // CSV 읽기 (CP949 → UTF-8)
  const csvPath = 'knowledge-base/금융영업1팀 영업활동 현황_2026_정경석.csv'
  let csvText: string
  try {
    csvText = execSync(`iconv -f CP949 -t UTF-8 "${csvPath}"`).toString()
  } catch {
    csvText = readFileSync(csvPath, 'utf-8')
  }

  const lines = csvText.split('\n').filter(l => l.trim())
  const csvRows = lines.slice(1).map(line => {
    const cols = parseCSVLine(line)
    return {
      date: cols[0]?.trim() || '',
      customer: cols[1]?.trim() || '',
      method: cols[2]?.trim() || '',
      customerContact: cols[3]?.trim() || '',
      koscomContact: cols[4]?.trim() || '',
      content: cols[5]?.trim() || '',
      note: cols[6]?.trim() || '',
    }
  }).filter(r => r.content)

  console.log(`CSV 행: ${csvRows.length}건`)

  // DB의 기존 활동 조회 (csv_import source)
  const dbActivities = await sql`
    SELECT id, raw_content, activity_date
    FROM activities
    WHERE source = 'csv_import'
    ORDER BY activity_date ASC
  `
  console.log(`DB 활동: ${dbActivities.length}건\n`)

  // 매칭: content가 같은 것을 찾아서 rawContent를 풍부한 버전으로 업데이트
  let matched = 0
  let updated = 0

  for (const csvRow of csvRows) {
    const contentTrimmed = csvRow.content.trim()
    // DB에서 content가 일치하는 레코드 찾기
    const dbMatch = dbActivities.find(a =>
      (a.raw_content as string).trim() === contentTrimmed
    )

    if (dbMatch) {
      matched++
      const fullContent = buildFullRawContent(csvRow)

      // 이미 풍부한 버전이면 skip
      if ((dbMatch.raw_content as string).startsWith('20') && (dbMatch.raw_content as string).includes(' | ')) {
        continue
      }

      if (dryRun) {
        if (matched <= 3) {
          console.log(`--- 미리보기 ${matched} ---`)
          console.log(`현재: ${(dbMatch.raw_content as string).slice(0, 80)}...`)
          console.log(`변경: ${fullContent.slice(0, 120)}...`)
          console.log()
        }
      } else {
        await sql`UPDATE activities SET raw_content = ${fullContent}, updated_at = NOW() WHERE id = ${dbMatch.id as string}`
        updated++
      }
    }

    // 부분 매칭: content의 첫 50자가 rawContent에 포함된 것도 시도
    if (!dbMatch && contentTrimmed.length > 50) {
      const prefix = contentTrimmed.slice(0, 50)
      const partialMatch = dbActivities.find(a =>
        (a.raw_content as string).includes(prefix) && !(a as { _matched?: boolean })._matched
      )
      if (partialMatch) {
        matched++
        ;(partialMatch as { _matched?: boolean })._matched = true
        const fullContent = buildFullRawContent(csvRow)

        if ((partialMatch.raw_content as string).startsWith('20') && (partialMatch.raw_content as string).includes(' | ')) {
          continue
        }

        if (dryRun) {
          if (matched <= 5) {
            console.log(`--- 부분 매칭 ${matched} ---`)
            console.log(`현재: ${(partialMatch.raw_content as string).slice(0, 80)}...`)
            console.log(`변경: ${fullContent.slice(0, 120)}...`)
            console.log()
          }
        } else {
          await sql`UPDATE activities SET raw_content = ${fullContent}, updated_at = NOW() WHERE id = ${partialMatch.id as string}`
          updated++
        }
      }
    }
  }

  console.log(`\n매칭: ${matched}건`)
  console.log(`업데이트: ${dryRun ? '(dry-run)' : updated + '건'}`)

  if (dryRun) {
    console.log(`\n실제 실행: npx tsx scripts/reimport-fullcontent.ts`)
  }
}

main().catch(console.error)
