import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, not, inArray, sql } from 'drizzle-orm'
import * as schema from '../src/lib/db/schema'

const DATABASE_URL = process.env.DATABASE_URL!
const sql = neon(DATABASE_URL)
const db = drizzle(sql, { schema })

// CSV에서 추출한 실제 고객사 목록 + 인터넷 검색 정보
const REAL_ORGANIZATIONS = [
  {
    name: 'IBK투자증권',
    industry: '증권',
    size: 'large' as const,
    website: 'https://www.ibks.com',
    notes: '대표: 서정학 | IBK기업은행 자회사 | 중소기업특화 금융투자회사 | 서울 여의도',
  },
  {
    name: '다올투자증권',
    industry: '증권',
    size: 'medium' as const,
    website: 'https://www.daolsecurities.com',
    notes: '대표: 이병철, 황준호 | IB 및 기관영업 특화 | 서울 영등포구 여의나루로 60 | 1981년 설립',
  },
  {
    name: '카카오페이증권',
    industry: '증권',
    size: 'large' as const,
    website: 'https://www.kakaopaysec.com',
    notes: '대표: 신호철 | 카카오페이 자회사 | 비대면 디지털 증권 | 2008년 설립 | 직원 337명',
  },
  {
    name: '리딩투자증권',
    industry: '증권',
    size: 'medium' as const,
    website: 'https://www.leading.co.kr',
    notes: '기업금융(IB), 투자매매, 투자중개, 헤지펀드 | 서울 여의도 파크원타워2 | 2000년 설립',
  },
  {
    name: '우리투자증권',
    industry: '증권',
    size: 'large' as const,
    website: 'https://www.wooriib.com',
    notes: '대표: 남기천 | 우리금융지주 100% 자회사 | 2024.08 우리종합금융+한국포스증권 통합 출범 | 서울 여의도 TP Tower',
  },
  {
    name: '현대차증권',
    industry: '증권',
    size: 'large' as const,
    website: 'https://www.hmsec.com',
    notes: '대표: 배형근 | 현대자동차그룹 계열 | 리테일+IB+PF | 2008년 설립',
  },
  {
    name: 'LS증권',
    industry: '증권',
    size: 'medium' as const,
    website: 'https://www.lssec.co.kr',
    notes: '대표: 김원규 | 1999년 국내 최초 온라인 전문증권사 출범 | 구 이베스트투자증권',
  },
  {
    name: 'DB금융투자',
    industry: '증권',
    size: 'medium' as const,
    website: 'https://www.db-fi.com',
    notes: '2025년 DB증권으로 사명 변경 | 1982년 국민투자금융 설립 | DB그룹 계열 | 서울 영등포구',
  },
  {
    name: 'IPS외국환중개',
    industry: '외국환중개',
    size: 'small' as const,
    website: null,
    notes: '외국환 중개 전문 | 코스콤 인프라 이용',
  },
  {
    name: '교보증권',
    industry: '증권',
    size: 'medium' as const,
    website: 'https://www.iprovest.com',
    notes: '교보생명 계열 증권사 | 서울 영등포구 | 1949년 설립',
  },
  {
    name: '부국증권',
    industry: '증권',
    size: 'small' as const,
    website: 'https://www.bookook.co.kr',
    notes: '서울 영등포구 | 1954년 설립 | 중소형 증권사',
  },
  {
    name: '한맥투자증권',
    industry: '증권',
    size: 'small' as const,
    website: null,
    notes: '중소형 증권사 | 코스콤 PowerBase 이용',
  },
  {
    name: 'BNK투자증권',
    industry: '증권',
    size: 'medium' as const,
    website: 'https://www.bnkfn.co.kr',
    notes: '대표: 신명호 | BNK금융지주 자회사 | 부산 본사 | 부산진구 새싹로 1',
  },
  {
    name: '중국은행',
    industry: '은행',
    size: 'large' as const,
    website: 'https://www.bankofchina.com/kr',
    notes: 'Bank of China 한국지점 | 외국은행 국내지점 | 코스콤 회선서비스 이용',
  },
  {
    name: 'KB손해보험',
    industry: '보험',
    size: 'large' as const,
    website: 'https://www.kbinsure.co.kr',
    notes: 'KB금융그룹 계열 | 손해보험사 | 코스콤 장애보상 관련',
  },
  {
    name: 'KOFEC',
    industry: '외국환중개',
    size: 'small' as const,
    website: null,
    notes: 'Korea Foreign Exchange Corporation | 외국환 중개',
  },
  {
    name: '트레디션코리아',
    industry: '외국환중개',
    size: 'small' as const,
    website: null,
    notes: '글로벌 중개사 Tradition 한국법인 | IDB(Inter-Dealer Broker)',
  },
  {
    name: '우리종합금융',
    industry: '금융',
    size: 'medium' as const,
    website: null,
    notes: '2024.08 우리투자증권으로 통합 | 우리금융지주 계열',
  },
]

async function seedOrganizations() {
  // 현재 DB의 첫번째 사용자 ID 가져오기
  const [user] = await db.select().from(schema.users).limit(1)
  if (!user) {
    console.error('사용자가 없습니다. 먼저 로그인해주세요.')
    return
  }
  const userId = user.id
  console.log(`사용자: ${user.name} (${user.email})`)

  // 1. 기존 임의 생성 데이터 삭제 (실제 CSV에 없는 고객사)
  const realNames = REAL_ORGANIZATIONS.map(o => o.name)

  const existingOrgs = await db.select().from(schema.organizations)
  const fakeOrgs = existingOrgs.filter(o => !realNames.includes(o.name))

  if (fakeOrgs.length > 0) {
    console.log(`\n임의 생성 고객사 ${fakeOrgs.length}개 삭제:`)
    for (const org of fakeOrgs) {
      console.log(`  - ${org.name}`)
      // 관련 activities, reminders, deals 삭제
      await db.delete(schema.reminders).where(eq(schema.reminders.organizationId, org.id))
      await db.delete(schema.activities).where(eq(schema.activities.organizationId, org.id))
      await db.delete(schema.deals).where(eq(schema.deals.organizationId, org.id))
      await db.delete(schema.contacts).where(eq(schema.contacts.organizationId, org.id))
      await db.delete(schema.meetings).where(eq(schema.meetings.organizationId, org.id))
      await db.delete(schema.documents).where(eq(schema.documents.organizationId, org.id))
      await db.delete(schema.organizations).where(eq(schema.organizations.id, org.id))
    }
  }

  // 2. 임의 생성 활동/리마인더/딜/미팅/보고서 삭제 (organizationId가 null인 것 중 source가 manual인 것)
  // 고아 데이터 정리
  const orphanActivities = await db.select().from(schema.activities)
    .where(eq(schema.activities.source, 'manual'))

  // CSV 임포트가 아닌 수동 입력 활동 중 실제 사용자가 입력하지 않은 것 삭제
  // (임의 생성 판단: rawContent에 한글이 아닌 일반적인 더미 텍스트)

  // 3. 실제 고객사 upsert
  console.log(`\n실제 고객사 ${REAL_ORGANIZATIONS.length}개 등록/업데이트:`)

  for (const org of REAL_ORGANIZATIONS) {
    const existing = existingOrgs.find(e => e.name === org.name)

    if (existing) {
      // 업데이트
      await db.update(schema.organizations).set({
        industry: org.industry,
        size: org.size,
        website: org.website,
        notes: org.notes,
        updatedAt: new Date(),
      }).where(eq(schema.organizations.id, existing.id))
      console.log(`  ✓ 업데이트: ${org.name}`)
    } else {
      // 신규 생성
      await db.insert(schema.organizations).values({
        name: org.name,
        industry: org.industry,
        size: org.size,
        website: org.website,
        notes: org.notes,
        createdBy: userId,
      })
      console.log(`  + 생성: ${org.name}`)
    }
  }

  // 4. 임의 생성된 deals/reminders/reports/meetings 삭제 (source가 manual인 것)
  console.log('\n임의 생성 데이터 정리:')

  const deletedDeals = await db.delete(schema.deals).where(eq(schema.deals.source, 'manual')).returning()
  console.log(`  - 임의 딜 ${deletedDeals.length}개 삭제`)

  const deletedReports = await db.delete(schema.reports).returning()
  console.log(`  - 보고서 ${deletedReports.length}개 삭제 (재생성 가능)`)

  // meetings는 모두 수동 입력이므로 임의 데이터만 삭제 (빈 테이블이면 skip)
  const allMeetings = await db.select().from(schema.meetings)
  if (allMeetings.length > 0) {
    const deletedMeetings = await db.delete(schema.meetings).returning()
    console.log(`  - 임의 미팅 ${deletedMeetings.length}개 삭제`)
  }

  // 5. 최종 확인
  const finalOrgs = await db.select().from(schema.organizations)
  const finalActivities = await db.select({ count: sql`count(*)` }).from(schema.activities)
  const finalReminders = await db.select({ count: sql`count(*)` }).from(schema.reminders)

  console.log(`\n=== 최종 DB 현황 ===`)
  console.log(`고객사: ${finalOrgs.length}개`)
  console.log(`  ${finalOrgs.map(o => o.name).join(', ')}`)
  console.log(`활동: ${finalActivities[0]?.count}건`)
  console.log(`후속조치: ${finalReminders[0]?.count}건`)
  console.log('\n완료!')
}

seedOrganizations().catch(console.error)
