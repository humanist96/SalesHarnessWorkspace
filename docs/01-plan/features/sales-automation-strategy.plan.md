# Sales Automation Strategy Planning Document

> **Summary**: 코스콤 금융영업1팀의 실 영업 데이터(589건) 분석 기반, Phase 2~4 AI 자동화 기능 종합 기획
>
> **Project**: SalesHarness
> **Author**: CTO Lead (bkit-cto-lead)
> **Date**: 2026-03-28
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

금융영업1팀의 실제 영업 활동 데이터(2024.01~2026.03, 589건)를 분석한 결과를 기반으로,
영업직원(정경석, 이경묵)이 반복적 수작업을 AI로 대체하고, 데이터 기반 의사결정을 할 수 있도록
Phase 2(미팅/활동관리), Phase 3(파이프라인/CRM), Phase 4(인텔리전스) 기능을 구체적으로 기획한다.

### 1.2 Background

**현재 상태 (Phase 0+1 완성):**
- AI 제안서/이메일/보고서 생성 (GPT-4o 스트리밍)
- 고객사 CRUD + 담당자 관리
- PB 업무 담당자 검색 (118건)
- Supabase Auth + Neon PostgreSQL + Drizzle ORM
- Vercel 배포 완료

**실 데이터에서 도출된 핵심 문제:**

| 문제 | 데이터 근거 | 영향 |
|------|-------------|------|
| 수동 기록 부담 | 589건을 CSV로 관리, 자유형식 텍스트 | 주당 2-3시간 기록 작업 |
| 히스토리 추적 불가 | IBK 143건, 다올 106건이 시간순 나열만 | 미팅 전 맥락 파악에 30분+ 소요 |
| 후속조치 누락 | "차주 계약 진행 예정" 같은 문장이 묻힘 | 계약 지연, 매출 기회 손실 |
| 파이프라인 비가시성 | "2.45억/년 계약 체결" 금액이 텍스트에 산재 | 매출 예측 불가, 경영진 보고 수작업 |
| 패턴 분석 부재 | 활동 유형/빈도/효과 분석 없음 | 영업 전략 수립 근거 부족 |

### 1.3 Related Documents

- Architecture: [ARCHITECTURE.md](/ARCHITECTURE.md)
- AI Agents: [AGENTS.md](/AGENTS.md)
- Current Roadmap: [PLANS.md](/docs/PLANS.md)
- DB Schema: [schema.ts](/src/lib/db/schema.ts)
- Product Sense: [PRODUCT_SENSE.md](/docs/PRODUCT_SENSE.md)
- Raw Data: [knowledge-base/금융영업1팀 영업활동 현황_2026_정경석.csv](/knowledge-base/)

---

## 2. Scope

### 2.1 In Scope

- [x] 영업 활동 자동 기록/분류 시스템
- [x] 고객별 히스토리 타임라인 UI
- [x] 후속조치 자동 추출 + 알림 엔진
- [x] 계약/매출 파이프라인 관리 (칸반 + AI 분석)
- [x] 영업 인사이트/패턴 분석 대시보드
- [x] 주간/월간 보고서 자동 생성
- [x] 기존 CSV 데이터 마이그레이션 파이프라인

### 2.2 Out of Scope

- 코스콤 SAP 연동 (향후 별도 프로젝트)
- 모바일 앱 (PWA로 대응)
- 다른 팀(금융영업2팀 등) 확장
- 실시간 협업 기능 (1차에서는 개인 사용에 집중)
- 외부 이메일 시스템 연동 (Gmail/Outlook API)

---

## 3. Requirements

### 3.1 Functional Requirements

#### Feature 1: 영업 활동 자동 기록/분류

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-1.1 | 자유 텍스트 입력 시 AI가 활동 유형(메일/전화/방문/계약/품의) 자동 분류 | High | Pending |
| FR-1.2 | 고객사/담당자 자동 인식 및 연결 | High | Pending |
| FR-1.3 | 날짜/금액/기한 자동 추출 (NER) | High | Pending |
| FR-1.4 | 기존 CSV 589건 일괄 임포트 + AI 분류 | High | Pending |
| FR-1.5 | 음성 메모 -> 텍스트 변환 -> 활동 기록 (Whisper API) | Low | Pending |

**사용 시나리오:**
```
1. 정경석 담당자가 IBK투자증권 강용원 이사와 통화 후
2. 앱에 자유형식으로 메모 입력:
   "IBK 강용원 이사 통화, 부산은행 채권매도대행 회선비용 0.06억/년,
    차주 계약 진행 예정"
3. AI가 자동으로:
   - 활동유형: 전화
   - 고객사: IBK투자증권 (자동 매칭)
   - 담당자: 강용원 이사 (자동 매칭)
   - 금액: 0.06억/년
   - 후속조치: "차주 계약 진행" -> Reminder 생성 (기한: 다음 주)
4. 사용자가 확인/수정 후 저장
```

**AI 활용 방식:**
- GPT-4o-mini: 활동 분류, 엔티티 추출 (빠른 응답, 저비용)
- Function Calling: 구조화된 JSON 출력 (고객사ID, 금액, 날짜, 후속조치)
- Few-shot prompting: 실 CSV 데이터를 예시로 사용

**실시간 반영 연동:**
- 활동 저장 즉시 Reactive Pipeline 트리거 (Section 5 참조)
- AI 분류 결과는 Optimistic Update로 즉시 UI 반영, 서버 확정 후 동기화
- 분류 실패 시 `unclassified` 상태로 저장 후 비동기 재시도 큐에 등록
- React Query `queryKey: ['activities']` 자동 invalidation

#### Feature 2: 고객별 히스토리 타임라인

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-2.1 | 고객사별 전체 활동 타임라인 뷰 | High | Pending |
| FR-2.2 | 활동 유형별 필터링 (메일/방문/계약 등) | High | Pending |
| FR-2.3 | 금액 변동 추적 (계약 금액 히스토리) | Medium | Pending |
| FR-2.4 | 관련 문서/딜 링크 표시 | Medium | Pending |
| FR-2.5 | AI 요약: "최근 3개월 IBK 활동 요약해줘" | High | Pending |

**사용 시나리오:**
```
1. 이경묵 담당자가 내일 IBK투자증권 방문 예정
2. "IBK투자증권" 고객 페이지 진입
3. 타임라인에서 143건의 활동이 시간순으로 표시:
   - 2024.01: 중국은행 재계약 3.06억, 채권매도대행 회선비용 협의
   - 2024.01: 환경에너지 해외파생 이용협의 (0.25억 개발비)
   - 2024.01: 지점 회선증속 26,753,000원/월
   - ...
4. AI 요약 버튼 클릭 -> "IBK투자증권 최근 현황":
   "주요 거래: 회선서비스, 채권매도대행, 해외파생.
    총 활동 143건 중 62%가 금액/계약 관련.
    최근 이슈: 지점 회선증속 진행 중, 해외파생 UAT 3월 시작 예정"
```

**AI 활용 방식:**
- GPT-4o: 고객별 활동 요약, 핵심 이슈 도출
- Embedding (text-embedding-3-small): 유사 활동 클러스터링
- Context window: 최근 20건 활동을 컨텍스트로 주입

**실시간 반영 연동:**
- 활동 저장 시 해당 고객사의 타임라인 캐시 자동 invalidation
- React Query `queryKey: ['activities', { organizationId }]` 갱신
- 타임라인 뷰가 열려 있는 경우 새 활동이 실시간 추가 (Optimistic Insert)
- AI 요약은 캐시 TTL 5분, 새 활동 저장 시 캐시 무효화

#### Feature 3: 후속조치 자동 추출/알림

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-3.1 | 활동 기록에서 후속조치 자동 추출 | Critical | Pending |
| FR-3.2 | 기한 자동 추론 ("차주" -> 다음 주 월요일) | High | Pending |
| FR-3.3 | 인앱 알림 (대시보드 + 사이드바 배지) | High | Pending |
| FR-3.4 | 이메일 알림 (일간 다이제스트) | Medium | Pending |
| FR-3.5 | 후속조치 완료/연기/취소 상태 관리 | High | Pending |
| FR-3.6 | 미완료 후속조치 대시보드 위젯 | High | Pending |

**사용 시나리오:**
```
1. 활동 기록 저장 시, AI가 텍스트에서 후속조치 추출:
   입력: "IBK 강용원 이사, 차주 계약 진행 예정, 품의문 수정 필요"
   추출:
     - Action 1: "계약 진행" | 기한: 2026-04-06 (차주) | 우선순위: High
     - Action 2: "품의문 수정" | 기한: 2026-04-03 | 우선순위: Medium

2. 매일 아침 대시보드에 오늘/이번주 후속조치 표시
3. 기한 초과 시 빨간색 배지로 경고
4. 주간 보고서에 후속조치 완료율 자동 포함
```

**AI 활용 방식:**
- GPT-4o-mini + Function Calling: 후속조치 구조화 추출
- 패턴 매칭: "예정", "진행", "필요", "확인" 등 한국어 액션 키워드
- 상대 날짜 해석: "차주", "월말까지", "2월 중" -> 절대 날짜 변환

**실시간 반영 연동:**
- Pipeline Stage 2 (후속조치 추출) 완료 즉시 reminders 테이블에 INSERT
- 대시보드의 후속조치 위젯 자동 갱신: `queryKey: ['reminders', { status: 'pending' }]`
- 새 후속조치 생성 시 인앱 알림 뱃지 카운터 증가 (Optimistic)
- 기한 도래 체크는 Vercel Cron (매일 09:00 KST)으로 overdue 상태 전환

#### Feature 4: 계약/매출 파이프라인

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-4.1 | 딜(Deal) 파이프라인 칸반 보드 | High | Pending |
| FR-4.2 | 활동 텍스트에서 금액 자동 추출 -> 딜 금액 갱신 | High | Pending |
| FR-4.3 | 파이프라인 단계: 탐색 -> 제안 -> 협상 -> 계약 -> 빌링 | High | Pending |
| FR-4.4 | AI 리드 스코어링 (전환 확률 예측) | Medium | Pending |
| FR-4.5 | 매출 예측 대시보드 (best/likely/worst) | Medium | Pending |
| FR-4.6 | 계약 만기 알림 (자동 갱신 추적) | High | Pending |
| FR-4.7 | 기존 CSV에서 딜 자동 생성 (AI 파싱) | High | Pending |

**사용 시나리오:**
```
1. 기존 CSV 임포트 시, AI가 딜 자동 생성:
   "IPS외국환중개 - 2.45억/년 계약 체결" -> Deal 생성
   Stage: "계약 완료", Amount: 245,000,000, 연간

2. 칸반 보드에서 현재 파이프라인 한눈에:
   [탐색]          [제안]         [협상]         [계약]
   카카오페이증권   리딩투자증권    다올투자증권    IBK투자증권
   ??억            0.8억          1.2억          3.06억

3. AI 매출 예측:
   "이번 분기 예상 매출: Best 8.5억, Likely 6.2억, Worst 4.1억"
   근거: 각 딜의 전환 확률, 과거 패턴
```

**AI 활용 방식:**
- GPT-4o: 비정형 텍스트에서 금액/계약조건 추출
- Function Calling: Deal 구조 (amount, currency, term, stage)
- 리드 스코어링: 활동 빈도, 금액 규모, 최근 활동일, 진행 속도 기반 규칙 + AI 분석

**실시간 반영 연동:**
- Pipeline Stage 3 (딜 업데이트)에서 금액 감지 시 deals 테이블 자동 UPDATE
- 칸반 보드 실시간 반영: `queryKey: ['deals', { view: 'pipeline' }]` invalidation
- 매출 예측 위젯은 딜 변동 시 서버사이드 재계산 후 캐시 갱신
- 딜 stage 변경 이력은 activity_events 테이블에 자동 기록

#### Feature 5: 영업 인사이트/패턴 분석

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-5.1 | 고객사별 활동 빈도/유형 분석 | Medium | Pending |
| FR-5.2 | 담당자별 활동 패턴 비교 | Medium | Pending |
| FR-5.3 | 월별 활동 추이 차트 | Medium | Pending |
| FR-5.4 | 활동 대비 매출 효율 분석 | Medium | Pending |
| FR-5.5 | AI 기반 추천: "이번 주 집중해야 할 고객" | High | Pending |
| FR-5.6 | 이상 패턴 탐지: "다올투자증권 2주간 활동 없음" | Medium | Pending |

**사용 시나리오:**
```
1. 인사이트 대시보드에서:
   - "IBK투자증권: 143건 활동, 추정 매출 ~5억/년 -> 활동당 매출 350만원"
   - "카카오페이증권: 60건 활동, 추정 매출 ~1.2억/년 -> 활동당 매출 200만원"
   - AI 추천: "IBK 대비 카카오페이 효율이 낮습니다. 방문 활동을 늘려보세요."

2. 주간 AI 브리핑:
   "이번 주 집중 고객: 다올투자증권 (계약 갱신 1개월 전),
    IBK투자증권 (해외파생 UAT 진행 중, 추가 과금 기회)"
```

**AI 활용 방식:**
- GPT-4o: 패턴 해석, 추천 생성, 이상 탐지
- 통계 연산: 서버사이드 SQL 집계 (빈도, 추이, 효율)
- 크론잡: 주간 분석 배치 실행

**실시간 반영 연동:**
- 인사이트 대시보드의 통계 위젯은 활동 저장 시 집계 쿼리 재실행
- 무거운 분석(패턴, AI 추천)은 Vercel Cron 배치로 사전 계산, 결과만 캐시 조회
- `queryKey: ['insights', { type }]` -- 활동 변동 시 staleTime 만료로 자연 갱신
- AI 주간 브리핑은 매주 월요일 자동 생성, 대시보드에서 최신 버전 표시

#### Feature 6: 주간/월간 보고서 자동 생성

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-6.1 | 주간 활동 보고서 자동 생성 | High | Pending |
| FR-6.2 | 월간 실적 보고서 자동 생성 | High | Pending |
| FR-6.3 | 파이프라인 현황 포함 | High | Pending |
| FR-6.4 | 후속조치 완료율 포함 | Medium | Pending |
| FR-6.5 | PDF/Word 내보내기 | Medium | Pending |
| FR-6.6 | 이메일로 자동 발송 (스케줄) | Low | Pending |

**사용 시나리오:**
```
1. 매주 금요일 오후, "주간 보고서 생성" 버튼 클릭
2. AI가 이번 주 활동 데이터를 기반으로:
   "[주간 영업 활동 보고서 - 금융영업1팀]
    기간: 2026.03.23 ~ 2026.03.28

    1. 주요 활동 (12건)
       - IBK투자증권: 해외파생 UAT 진행 확인, 회선비용 정산 (3건)
       - 다올투자증권: 계약 갱신 협의, 추가 상품 제안 (2건)
       ...

    2. 파이프라인 변동
       - 신규: 카카오페이증권 SOR 시스템 도입 (추정 0.8억)
       - 진행: 다올투자증권 계약 갱신 (1.2억 -> 1.4억 협상 중)
       - 완료: IBK 지점 회선증속 계약 체결

    3. 후속조치 현황
       - 완료: 8건 / 미완료: 4건 / 지연: 1건
       - 완료율: 67%

    4. 다음 주 주요 일정
       - IBK 방문 (해외파생 최종 검수)
       - 다올투자증권 계약서 날인"
```

**실시간 반영 연동 (Feature 6):**
- 활동 저장 시 해당 기간의 보고서 데이터 풀에 자동 포함 (즉시 반영 불필요)
- 보고서 생성 시 최신 데이터 기준으로 집계 (point-in-time snapshot)
- 보고서 미리보기 화면에서 "데이터 새로고침" 버튼 제공
- 주간 보고서 Vercel Cron: 매주 금요일 17:00 KST 자동 생성

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 활동 기록 저장 < 2초 (AI 분류 포함) | Vercel Analytics |
| Performance | 타임라인 로딩 < 1초 (100건 기준) | Lighthouse |
| Performance | AI 보고서 생성 < 15초 (스트리밍) | Custom timer |
| Performance | Pipeline 전체 완료 < 10초 (단건) | activity_events 소요시간 |
| Performance | CSV 589건 임포트 < 10분 | import_batches 소요시간 |
| Performance | 대시보드 초기 로딩 < 2초 (집계 API) | Vercel Analytics |
| Security | 영업 데이터 RLS (팀 단위 접근 제어) | Supabase RLS test |
| Reliability | AI 분류 정확도 >= 85% | 수동 검증 50건 |
| Scalability | 10,000건 활동 데이터까지 성능 저하 없음 | Load test |
| Cost | AI API 비용 월 $50 이내 (2명 사용 기준) | OpenAI Usage Dashboard |

---

## 4. Data Model Design

### 4.1 Phase 2 신규 테이블

```typescript
// activities - 영업 활동 기록 (핵심 테이블)
activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  contactId: uuid('contact_id').references(() => contacts.id),
  dealId: uuid('deal_id').references(() => deals.id),     // Phase 3 FK

  // AI 자동 분류 필드
  type: text('type', {
    enum: ['call', 'email', 'visit', 'meeting', 'contract', 'billing', 'inspection', 'other']
  }),
  rawContent: text('raw_content'),           // 원본 자유형식 입력
  parsedContent: jsonb('parsed_content'),    // AI 구조화 결과
  //  { summary, keywords, amounts[], dates[], entities[] }

  // 메타데이터
  activityDate: date('activity_date'),
  source: text('source', { enum: ['manual', 'csv_import', 'voice', 'email_sync'] }),
  aiClassified: boolean('ai_classified').default(false),
  aiConfidence: integer('ai_confidence'),    // 0-100

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// meetings - 미팅/상담 관리
meetings = pgTable('meetings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),

  title: text('title'),
  scheduledAt: timestamp('scheduled_at'),
  location: text('location'),
  attendees: jsonb('attendees'),    // [{ contactId, name, role }]
  agenda: text('agenda'),
  notes: text('notes'),             // 미팅 후 메모
  aiSummary: text('ai_summary'),    // AI 정리된 노트
  aiBriefing: text('ai_briefing'),  // AI 생성 브리핑
  status: text('status', { enum: ['scheduled', 'completed', 'cancelled'] }),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

// reminders - 후속조치 알림
reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  activityId: uuid('activity_id').references(() => activities.id),
  dealId: uuid('deal_id').references(() => deals.id),

  title: text('title'),
  description: text('description'),
  dueDate: date('due_date'),
  priority: text('priority', { enum: ['critical', 'high', 'medium', 'low'] }),
  status: text('status', { enum: ['pending', 'completed', 'overdue', 'cancelled'] }),

  // AI 추출 메타데이터
  aiExtracted: boolean('ai_extracted').default(false),
  sourceText: text('source_text'),   // 추출 원문
  completedAt: timestamp('completed_at'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

### 4.1.1 Reactive Pipeline 지원 테이블

```typescript
// activity_events - 활동 이벤트 파이프라인 상태 추적
activityEvents = pgTable('activity_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  activityId: uuid('activity_id').references(() => activities.id),

  // Pipeline 상태 추적
  pipelineStatus: text('pipeline_status', {
    enum: ['pending', 'classifying', 'extracting', 'updating_deals', 'completing', 'completed', 'failed']
  }).default('pending'),

  // 각 단계별 완료 여부
  classificationDone: boolean('classification_done').default(false),
  followUpExtractionDone: boolean('follow_up_extraction_done').default(false),
  dealUpdateDone: boolean('deal_update_done').default(false),
  dashboardInvalidated: boolean('dashboard_invalidated').default(false),

  // 오류 처리
  errorMessage: text('error_message'),
  retryCount: integer('retry_count').default(0),
  maxRetries: integer('max_retries').default(3),

  // 배치 임포트용
  batchId: uuid('batch_id'),              // CSV 임포트 배치 식별자
  batchIndex: integer('batch_index'),      // 배치 내 순서

  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

// import_batches - CSV 임포트 배치 관리
importBatches = pgTable('import_batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),

  fileName: text('file_name'),
  totalRows: integer('total_rows'),
  processedRows: integer('processed_rows').default(0),
  successRows: integer('success_rows').default(0),
  failedRows: integer('failed_rows').default(0),

  status: text('status', {
    enum: ['uploading', 'parsing', 'processing', 'completed', 'failed', 'cancelled']
  }).default('uploading'),

  errors: jsonb('errors'),                 // [{ row, message, data }]

  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow(),
})

// dashboard_cache - 대시보드 위젯 캐시 (서버사이드)
dashboardCache = pgTable('dashboard_cache', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),

  widgetType: text('widget_type', {
    enum: ['activity_count', 'revenue_forecast', 'pending_reminders',
           'pipeline_summary', 'weekly_trend', 'top_customers']
  }),
  data: jsonb('data'),                     // 캐시된 집계 결과
  computedAt: timestamp('computed_at'),    // 마지막 계산 시점
  invalidatedAt: timestamp('invalidated_at'), // 무효화 시점 (null = 유효)

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

### 4.2 Phase 3 신규 테이블

```typescript
// deals - 영업 기회/딜
deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  contactId: uuid('contact_id').references(() => contacts.id),

  title: text('title'),
  description: text('description'),
  stage: text('stage', {
    enum: ['prospect', 'proposal', 'negotiation', 'contract', 'billing', 'closed_won', 'closed_lost']
  }),
  amount: bigint('amount', { mode: 'number' }),          // 원 단위
  amountType: text('amount_type', { enum: ['annual', 'monthly', 'one_time'] }),
  probability: integer('probability'),                    // 0-100, AI 스코어링
  expectedCloseDate: date('expected_close_date'),
  actualCloseDate: date('actual_close_date'),

  // 계약 관련
  contractStartDate: date('contract_start_date'),
  contractEndDate: date('contract_end_date'),
  contractRenewalDate: date('contract_renewal_date'),
  autoRenewal: boolean('auto_renewal').default(false),

  // AI 분석 결과
  aiScore: integer('ai_score'),                           // 리드 스코어
  aiInsights: jsonb('ai_insights'),                       // AI 분석 요약
  //  { win_factors[], risk_factors[], recommended_actions[] }

  source: text('source', { enum: ['manual', 'csv_import', 'ai_detected'] }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

// contracts - 계약 이력
contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  dealId: uuid('deal_id').references(() => deals.id),
  organizationId: uuid('organization_id').references(() => organizations.id),

  contractNumber: text('contract_number'),
  type: text('type', { enum: ['new', 'renewal', 'amendment', 'termination'] }),
  amount: bigint('amount', { mode: 'number' }),
  startDate: date('start_date'),
  endDate: date('end_date'),
  terms: jsonb('terms'),             // 계약 조건 구조화
  status: text('status', { enum: ['draft', 'pending', 'active', 'expired', 'terminated'] }),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

### 4.3 Phase 4 신규 테이블

```typescript
// intelligence_items - 시장 인텔리전스
intelligenceItems = pgTable('intelligence_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: text('type', { enum: ['market_trend', 'competitor', 'regulation', 'technology'] }),
  title: text('title'),
  content: text('content'),
  source: text('source'),
  relevanceScore: integer('relevance_score'),  // AI 평가 관련도
  tags: jsonb('tags'),
  createdAt: timestamp('created_at').defaultNow(),
})

// sales_reports - 자동 생성 보고서
salesReports = pgTable('sales_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  type: text('type', { enum: ['weekly', 'monthly', 'quarterly'] }),
  periodStart: date('period_start'),
  periodEnd: date('period_end'),
  content: text('content'),               // 생성된 보고서 본문
  metrics: jsonb('metrics'),              // 정량 데이터
  //  { totalActivities, dealsPipeline, revenue, followUpRate }
  aiGenerated: boolean('ai_generated').default(true),
  createdAt: timestamp('created_at').defaultNow(),
})
```

### 4.4 CSV 데이터 -> 스키마 매핑

```
CSV Column          -> Target Table.Field
-----------------------------------------------
날자               -> activities.activityDate
고객사             -> organizations.name (lookup/create)
활동방법           -> activities.type (AI 분류 보완)
고객사 담당자      -> contacts.name (lookup/create)
코스콤 담당자      -> users.name (lookup)
내용               -> activities.rawContent
                   -> activities.parsedContent (AI 파싱)
                   -> reminders (후속조치 추출)
                   -> deals (금액/계약 추출)
```

---

## 5. Reactive Pipeline Architecture

### 5.1 Activity Event Pipeline 전체 흐름

활동 하나가 저장될 때 트리거되는 전체 이벤트 파이프라인:

```
┌────────────────────────────────────────────────────────────────────────┐
│                    Activity Event Pipeline                              │
│                                                                         │
│  [사용자 입력] ──▶ [활동 저장 (동기)] ──▶ [Pipeline Trigger]             │
│                         │                        │                      │
│                         │ (즉시 반환)             │ (비동기 시작)         │
│                         ▼                        ▼                      │
│                   ┌──────────┐          ┌──────────────────┐           │
│                   │ Response │          │  Stage 1: AI 분류  │           │
│                   │ to User  │          │  (GPT-4o-mini)    │           │
│                   │          │          │  ~1-2초            │           │
│                   └──────────┘          └────────┬─────────┘           │
│                                                  │                      │
│                                    ┌─────────────┼─────────────┐       │
│                                    ▼             ▼             ▼       │
│                             ┌───────────┐ ┌───────────┐ ┌──────────┐  │
│                             │ Stage 2   │ │ Stage 3   │ │ Stage 4  │  │
│                             │ 후속조치   │ │ 딜 업데이트│ │ 타임라인 │  │
│                             │ 추출      │ │ (금액감지) │ │ 갱신     │  │
│                             │ ~1초      │ │ ~1초      │ │ 즉시     │  │
│                             └─────┬─────┘ └─────┬─────┘ └────┬─────┘  │
│                                   │             │            │         │
│                                   ▼             ▼            ▼         │
│                             ┌─────────────────────────────────────┐    │
│                             │    Stage 5: Dashboard Invalidation   │    │
│                             │    - React Query cache invalidation  │    │
│                             │    - Dashboard cache 갱신 마킹        │    │
│                             │    - 보고서 데이터 풀 갱신            │    │
│                             └─────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────┘
```

### 5.2 동기/비동기 처리 전략

| 단계 | 처리 방식 | 이유 | 타임아웃 |
|------|-----------|------|----------|
| 활동 저장 (DB INSERT) | **동기** | 사용자에게 즉시 확인 필요 | 2초 |
| AI 분류 (Stage 1) | **동기 (Optimistic)** | UI에서 분류 결과를 즉시 보여줘야 함 | 5초 |
| 후속조치 추출 (Stage 2) | **비동기** | 백그라운드 처리 가능, UI 블로킹 불필요 | 10초 |
| 딜 업데이트 (Stage 3) | **비동기** | 금액 감지 시에만 트리거, 드문 이벤트 | 10초 |
| 타임라인 갱신 (Stage 4) | **즉시 (Cache Invalidation)** | DB 이미 저장됨, 캐시만 무효화 | - |
| 대시보드 갱신 (Stage 5) | **즉시 (Cache Invalidation)** | 통계 재계산은 다음 조회 시 | - |

### 5.3 Pipeline Orchestrator 설계

```typescript
// lib/pipeline/activity-pipeline.ts

interface PipelineContext {
  activityId: string
  rawContent: string
  userId: string
  organizationId?: string
  source: 'manual' | 'csv_import' | 'voice'
}

interface PipelineResult {
  classification: ClassificationResult
  followUps: FollowUpResult[]
  dealUpdate: DealUpdateResult | null
  invalidatedQueries: string[]
}

// Pipeline Orchestrator (Server-side)
async function executeActivityPipeline(ctx: PipelineContext): Promise<PipelineResult> {
  // Stage 1: AI 분류 (동기 - 사용자 응답에 포함)
  const classification = await classifyActivity(ctx.rawContent)

  // Stage 2-4: 비동기 병렬 실행 (사용자 응답 후 백그라운드)
  // Vercel Serverless 환경에서는 waitUntil() 사용
  const backgroundTasks = Promise.allSettled([
    extractFollowUps(ctx.activityId, ctx.rawContent),
    detectAndUpdateDeals(ctx.activityId, classification),
    invalidateRelatedCaches(ctx.userId, ctx.organizationId),
  ])

  // waitUntil로 응답 후에도 실행 지속
  // (Next.js 15 unstable_after 또는 Vercel waitUntil)
  return { classification, backgroundTasks }
}
```

### 5.4 단계별 의존성 그래프

```
활동 저장 (필수 선행)
    │
    ├──▶ Stage 1: AI 분류 (동기)
    │        │
    │        ├──▶ Stage 2: 후속조치 추출 (분류 결과 참조)
    │        │        └──▶ reminders INSERT
    │        │              └──▶ Dashboard: 후속조치 위젯 invalidation
    │        │
    │        ├──▶ Stage 3: 딜 업데이트 (금액 감지 시에만)
    │        │        └──▶ deals UPDATE/INSERT
    │        │              └──▶ Dashboard: 파이프라인 위젯 invalidation
    │        │
    │        └──▶ Stage 4: 타임라인 캐시 invalidation (즉시)
    │
    └──▶ Stage 5: Dashboard 집계 캐시 invalidation (즉시)
              └──▶ 보고서 데이터 풀 dirty flag 설정
```

**의존성 규칙:**
- Stage 1은 반드시 활동 저장 완료 후 실행
- Stage 2, 3은 Stage 1 결과(분류, 금액 정보)에 의존
- Stage 4, 5는 독립적으로 즉시 실행 가능
- Stage 2와 3은 서로 독립적, 병렬 실행 가능

### 5.5 실패 처리 및 폴백

| 실패 지점 | 폴백 전략 | 사용자 영향 |
|-----------|-----------|-------------|
| AI 분류 실패 (Stage 1) | `type: 'other'`, `aiClassified: false` 로 저장. 수동 분류 UI 표시. 비동기 재시도 큐 등록 | 활동은 저장됨, "AI 분류 실패 - 수동 선택" 안내 |
| 후속조치 추출 실패 (Stage 2) | activity_events에 에러 기록. retry 3회. 사용자에게 "수동 후속조치 추가" 프롬프트 | 없음 (비동기). 대시보드에 미반영은 1-2분 내 재시도 |
| 딜 업데이트 실패 (Stage 3) | 에러 로그 + 수동 딜 연결 UI 안내 | 없음 (비동기). 파이프라인 보드에 미반영 |
| DB 트랜잭션 실패 | 전체 롤백 + 사용자에게 "저장 실패, 다시 시도" | 활동 미저장 안내 |
| OpenAI API Rate Limit | 지수 백오프 재시도 (1s, 2s, 4s). 3회 실패 시 큐에 보관 | Stage 1: 수동 분류 폴백. Stage 2-3: 지연 처리 |

### 5.6 재시도 메커니즘

```typescript
// lib/pipeline/retry.ts

const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,          // 1초
  maxDelay: 30000,          // 30초
  backoffMultiplier: 2,     // 지수 백오프
}

async function withRetry<T>(
  fn: () => Promise<T>,
  config = RETRY_CONFIG
): Promise<T> {
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === config.maxRetries) throw error
      const delay = Math.min(
        config.baseDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      )
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Unreachable')
}
```

---

## 6. Real-time Update Strategy

### 6.1 기술 비교 분석

Next.js 15 App Router + Vercel + Neon Free Tier 환경에서의 실시간 갱신 방식 비교:

| 방식 | 비용 | 복잡도 | UX 품질 | Vercel 호환 | Neon Free Tier | 추천 |
|------|------|--------|---------|-------------|----------------|------|
| **React Query Invalidation** | 무료 | 낮음 | 좋음 | 완전 | 완전 | **1순위** |
| **Optimistic Updates** | 무료 | 중간 | 최상 | 완전 | 완전 | **1순위 (병용)** |
| **Smart Polling** | 무료 | 낮음 | 양호 | 완전 | 완전 | **2순위 (보조)** |
| Server-Sent Events | 무료 | 높음 | 좋음 | 제한적* | 완전 | 3순위 |
| WebSocket | 무료~유료 | 높음 | 최상 | 미지원** | 완전 | 비추천 |
| Supabase Realtime | 무료 | 낮음 | 최상 | 완전 | N/A*** | 비추천 |

> \* Vercel Serverless Functions는 SSE 스트리밍은 가능하나, 장시간 연결 유지 제한 (최대 25초)
> \*\* Vercel은 WebSocket 미지원 (별도 서버 필요)
> \*\*\* Neon PostgreSQL 사용 중이므로 Supabase Realtime 불가

### 6.2 추천 전략: Layered Reactivity

비용 0원, 복잡도 최소화, UX 최적화를 위한 3계층 실시간 전략:

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Optimistic Updates (즉각 반응)                      │
│  - 사용자 액션 즉시 UI 반영                                    │
│  - 서버 확정 전까지 pending 상태 표시                           │
│  - 실패 시 자동 롤백                                           │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Query Invalidation (서버 확정)                      │
│  - 서버 응답 후 관련 쿼리 자동 갱신                             │
│  - 파이프라인 완료 시 연쇄 invalidation                        │
│  - staleTime/gcTime 기반 효율적 캐시 관리                      │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Smart Polling (백그라운드 동기화)                    │
│  - 대시보드: 30초 간격 polling (탭 포커스 시에만)               │
│  - 파이프라인 진행 상태: 5초 polling (처리 중일 때만)           │
│  - refetchOnWindowFocus: true (탭 전환 시 자동 갱신)          │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 React Query 설정

```typescript
// lib/query/config.ts

export const queryConfig = {
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,           // 30초 (기본)
      gcTime: 5 * 60 * 1000,          // 5분
      refetchOnWindowFocus: true,      // 탭 전환 시 자동 갱신
      retry: 2,
    },
  },
}

// 쿼리별 staleTime 전략
export const QUERY_STALE_TIMES = {
  activities: 30 * 1000,              // 30초 - 자주 변경됨
  reminders: 60 * 1000,               // 1분 - 중간 빈도
  deals: 2 * 60 * 1000,               // 2분 - 상대적으로 안정적
  dashboardStats: 60 * 1000,          // 1분 - 요약 통계
  insights: 5 * 60 * 1000,            // 5분 - 무거운 연산, 덜 빈번
  reports: 10 * 60 * 1000,            // 10분 - 거의 변경 안됨
}
```

### 6.4 Optimistic Update 패턴

```typescript
// hooks/useCreateActivity.ts

export function useCreateActivity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createActivity,

    // Optimistic: 서버 응답 전에 즉시 UI 반영
    onMutate: async (newActivity) => {
      // 관련 쿼리 취소 (충돌 방지)
      await queryClient.cancelQueries({ queryKey: ['activities'] })

      // 이전 상태 스냅샷
      const previous = queryClient.getQueryData(['activities'])

      // Optimistic insert (임시 ID, pending 상태)
      queryClient.setQueryData(['activities'], (old) => ({
        ...old,
        items: [{
          ...newActivity,
          id: `temp-${Date.now()}`,
          aiClassified: false,
          _optimistic: true,
        }, ...(old?.items ?? [])],
      }))

      return { previous }
    },

    // 서버 성공: 실제 데이터로 교체 + 연쇄 invalidation
    onSuccess: (data) => {
      // 활동 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['activities'] })
      // 해당 고객사 타임라인 갱신
      if (data.organizationId) {
        queryClient.invalidateQueries({
          queryKey: ['activities', { organizationId: data.organizationId }]
        })
      }
      // 대시보드 위젯들 갱신
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      // 후속조치 목록 (파이프라인 완료 후 추가될 수 있음)
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      // 딜 파이프라인 (금액 감지 시)
      queryClient.invalidateQueries({ queryKey: ['deals'] })
    },

    // 서버 실패: 롤백
    onError: (err, variables, context) => {
      queryClient.setQueryData(['activities'], context?.previous)
    },
  })
}
```

### 6.5 Pipeline 진행 상태 Polling

비동기 파이프라인 단계(Stage 2-4)의 진행 상태를 추적하는 Smart Polling:

```typescript
// hooks/usePipelineStatus.ts

export function usePipelineStatus(activityId: string | null) {
  return useQuery({
    queryKey: ['pipeline-status', activityId],
    queryFn: () => fetchPipelineStatus(activityId!),
    enabled: !!activityId,

    // 파이프라인 진행 중일 때만 polling
    refetchInterval: (query) => {
      const status = query.state.data?.pipelineStatus
      if (status === 'completed' || status === 'failed') return false
      return 3000  // 3초 간격 polling
    },
  })
}
```

### 6.6 Query Invalidation 연쇄 맵

활동 저장 시 어떤 쿼리들이 연쇄적으로 갱신되는지:

```
Activity Saved
    │
    ├── ['activities']                    -- 활동 목록
    ├── ['activities', { orgId }]         -- 고객사별 타임라인
    ├── ['dashboard', 'activity-count']   -- 활동 수 위젯
    ├── ['dashboard', 'weekly-trend']     -- 주간 추이 위젯
    │
    └── Pipeline Complete (비동기)
         │
         ├── ['reminders']                -- 후속조치 목록
         ├── ['reminders', { status }]    -- 상태별 후속조치
         ├── ['dashboard', 'pending-reminders'] -- 미완료 후속조치 수
         │
         ├── ['deals']                    -- (금액 감지 시)
         ├── ['deals', { view }]          -- 파이프라인 보드
         ├── ['dashboard', 'revenue']     -- 매출 예측 위젯
         │
         └── ['insights']                 -- (staleTime 만료 시 자연 갱신)
```

---

## 7. CSV Import Pipeline

### 7.1 배치 처리 아키텍처

589건 CSV를 기존 Activity Event Pipeline과 동일한 경로로 처리하되, 배치 최적화 적용:

```
┌────────────────────────────────────────────────────────────────┐
│                    CSV Import Pipeline                          │
│                                                                 │
│  [파일 업로드] ──▶ [파싱] ──▶ [검증] ──▶ [배치 처리] ──▶ [완료]  │
│                                                                 │
│  Phase 1: Upload & Parse (동기, ~2초)                           │
│  ┌──────────────────────────────────────────┐                  │
│  │ 1. 파일 수신 (FormData)                   │                  │
│  │ 2. 인코딩 감지/변환 (EUC-KR -> UTF-8)     │                  │
│  │ 3. CSV 파싱 (Papa Parse)                  │                  │
│  │ 4. 행 단위 기본 검증                       │                  │
│  │ 5. import_batches 레코드 생성              │                  │
│  │ 6. 미리보기 데이터 반환 (첫 5행)           │                  │
│  └──────────────────────────────────────────┘                  │
│                         │                                       │
│                         ▼                                       │
│  Phase 2: Batch Processing (비동기, ~5-10분)                   │
│  ┌──────────────────────────────────────────┐                  │
│  │ for each chunk (10건씩):                  │                  │
│  │   1. Organization 매칭/생성               │                  │
│  │   2. Contact 매칭/생성                    │                  │
│  │   3. AI 배치 분류 (10건 한 번에)           │                  │
│  │   4. 후속조치 추출 (배치)                  │                  │
│  │   5. 딜 감지/생성                          │                  │
│  │   6. DB 트랜잭션 INSERT                   │                  │
│  │   7. 진행률 업데이트                       │                  │
│  └──────────────────────────────────────────┘                  │
│                         │                                       │
│                         ▼                                       │
│  Phase 3: Finalization (동기, ~1초)                            │
│  ┌──────────────────────────────────────────┐                  │
│  │ 1. 전체 Dashboard 캐시 invalidation       │                  │
│  │ 2. 임포트 결과 리포트 생성                 │                  │
│  │ 3. import_batches 상태 -> completed       │                  │
│  └──────────────────────────────────────────┘                  │
└────────────────────────────────────────────────────────────────┘
```

### 7.2 배치 처리 전략

| 항목 | 단건 처리 | CSV 배치 처리 | 이유 |
|------|-----------|---------------|------|
| AI 호출 | 1건/요청 | 10건/요청 | API 호출 수 절감, 비용 60% 절약 |
| DB INSERT | 건별 트랜잭션 | 청크별 트랜잭션 (10건) | 트랜잭션 오버헤드 감소 |
| Org 매칭 | 실시간 조회 | 사전 로드 후 메모리 매칭 | DB 쿼리 90% 절감 |
| 캐시 갱신 | 건별 invalidation | 배치 완료 후 일괄 invalidation | 불필요한 중간 갱신 제거 |
| 에러 처리 | 즉시 사용자 알림 | 스킵 후 에러 로그 수집 | 전체 임포트 중단 방지 |

### 7.3 진행률 표시

```typescript
// API: GET /api/activities/import/[batchId]/status
interface ImportProgress {
  batchId: string
  status: 'uploading' | 'parsing' | 'processing' | 'completed' | 'failed'
  totalRows: number
  processedRows: number
  successRows: number
  failedRows: number
  progress: number            // 0-100
  currentChunk: number
  totalChunks: number
  estimatedTimeLeft: number   // seconds
  errors: ImportError[]       // 최근 에러 목록
}

// Client: Smart Polling으로 진행률 추적
export function useImportProgress(batchId: string | null) {
  return useQuery({
    queryKey: ['import-progress', batchId],
    queryFn: () => fetchImportProgress(batchId!),
    enabled: !!batchId,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      if (status === 'completed' || status === 'failed') return false
      return 2000  // 2초 간격
    },
  })
}
```

### 7.4 오류 처리 전략

```
개별 행 실패 시:
├── 파싱 에러 (잘못된 날짜, 인코딩 깨짐)
│   └── 해당 행 스킵, errors 배열에 기록
│       └── 사용자에게 실패 행 목록 + 원본 데이터 표시
│
├── AI 분류 실패 (API 에러, 타임아웃)
│   └── type: 'other', aiClassified: false 로 저장
│       └── 나중에 수동 분류 또는 재분류 배치 실행
│
├── Organization 매칭 실패 (이름 불일치)
│   └── 유사도 기반 후보 3개 제시 (Levenshtein)
│       └── 임포트 후 "미매칭 고객사" 목록에서 수동 연결
│
└── DB INSERT 실패 (제약조건 위반)
    └── 해당 청크 롤백, 에러 기록
        └── 나머지 청크는 계속 진행

전체 배치 실패 시:
├── API Rate Limit -> 지수 백오프 재시도 (최대 3회)
├── DB 연결 실패 -> 5분 후 재시도 큐
└── 알 수 없는 에러 -> 배치 상태 'failed', 부분 결과 보존
```

### 7.5 임포트 결과 리포트

```typescript
// 임포트 완료 후 사용자에게 표시할 결과 요약
interface ImportReport {
  summary: {
    total: number              // 589
    success: number            // 572
    failed: number             // 17
    duration: string           // "7분 23초"
  }
  created: {
    activities: number         // 572
    organizations: number      // 12 (신규 생성)
    contacts: number           // 35 (신규 생성)
    deals: number              // 28 (AI 감지)
    reminders: number          // 89 (AI 추출)
  }
  errors: Array<{
    row: number
    originalData: string
    errorType: string
    message: string
  }>
  aiStats: {
    classificationAccuracy: number  // 예상 정확도
    amountsDetected: number
    followUpsExtracted: number
  }
}
```

### 7.6 비용 및 시간 예측

| 항목 | 수치 |
|------|------|
| 총 행 수 | 589건 |
| 배치 크기 | 10건 |
| API 호출 수 | ~60회 (분류) + ~60회 (후속조치) = ~120회 |
| 예상 API 비용 | ~$0.60 (GPT-4o-mini) |
| 예상 소요 시간 | 5-10분 (병렬 제한 고려) |
| 동시 API 요청 | 최대 3개 (Rate Limit 안전) |

---

## 8. Data Consistency (데이터 일관성)

### 8.1 문제 정의

하나의 활동이 저장될 때 최대 4개 테이블에 영향:

```
Activity Save --> activities (INSERT)
             --> reminders (INSERT, 0~N건)
             --> deals (UPDATE/INSERT, 0~1건)
             --> organizations (UPDATE: lastActivityAt)
             --> activity_events (INSERT: 파이프라인 추적)
```

### 8.2 일관성 보장 전략

**Level 1: 핵심 데이터 - DB 트랜잭션 (Strong Consistency)**

```typescript
// 활동 저장 + 이벤트 레코드는 반드시 같은 트랜잭션
await db.transaction(async (tx) => {
  const activity = await tx.insert(activities).values(activityData).returning()
  await tx.insert(activityEvents).values({
    activityId: activity.id,
    pipelineStatus: 'pending',
  })
  return activity
})
```

**Level 2: 파생 데이터 - Eventual Consistency (최종 일관성)**

```
reminders, deals 업데이트는 비동기 파이프라인에서 처리:
- 실패 시 activity_events.retryCount 증가
- 3회 실패 시 수동 처리 플래그
- Dashboard는 약간의 지연(최대 수 초) 허용
```

**Level 3: 캐시 데이터 - Best Effort**

```
dashboard_cache, React Query 캐시:
- invalidation 실패해도 데이터 무결성에 영향 없음
- staleTime 만료 시 자동으로 최신 데이터 조회
- 최악의 경우 사용자가 새로고침하면 해결
```

### 8.3 Idempotency (멱등성)

CSV 임포트 시 중복 방지:

```typescript
// 동일 활동 중복 감지 기준
const isDuplicate = await db.query.activities.findFirst({
  where: and(
    eq(activities.userId, userId),
    eq(activities.activityDate, row.date),
    eq(activities.organizationId, orgId),
    eq(activities.rawContent, row.content),
  ),
})
```

---

## 9. Event-Driven Dashboard (이벤트 기반 대시보드)

### 9.1 위젯별 데이터 소스 및 갱신 전략

| 위젯 | 데이터 소스 | Query Key | 갱신 트리거 | staleTime |
|------|-------------|-----------|-------------|-----------|
| 이번 주 활동 수 | `COUNT(activities) WHERE date >= weekStart` | `['dashboard', 'activity-count']` | 활동 저장 | 30초 |
| 매출 예측 (Forecast) | `SUM(deals.amount * probability/100)` | `['dashboard', 'revenue']` | 딜 변동 | 2분 |
| 미완료 후속조치 | `COUNT(reminders) WHERE status = 'pending'` | `['dashboard', 'pending-reminders']` | 후속조치 추가/완료 | 1분 |
| 파이프라인 요약 | `GROUP BY deals.stage, SUM(amount)` | `['dashboard', 'pipeline']` | 딜 stage 변경 | 2분 |
| 주간 활동 추이 | `GROUP BY DATE(activityDate), COUNT(*)` | `['dashboard', 'weekly-trend']` | 활동 저장 | 5분 |
| 오늘 할 일 | `reminders WHERE dueDate = today` | `['dashboard', 'today-tasks']` | 후속조치 변동 | 1분 |
| 고객사 Top 5 | `GROUP BY orgId ORDER BY COUNT(*) DESC LIMIT 5` | `['dashboard', 'top-customers']` | 활동 저장 | 5분 |
| 최근 활동 피드 | `activities ORDER BY createdAt DESC LIMIT 10` | `['dashboard', 'recent-feed']` | 활동 저장 | 30초 |

### 9.2 Dashboard 갱신 흐름

```typescript
// hooks/useDashboard.ts

export function useDashboardStats(userId: string) {
  const queryClient = useQueryClient()

  // 각 위젯별 독립 쿼리 (필요한 것만 로딩)
  const activityCount = useQuery({
    queryKey: ['dashboard', 'activity-count', userId],
    queryFn: () => fetchActivityCount(userId),
    staleTime: 30 * 1000,
  })

  const revenue = useQuery({
    queryKey: ['dashboard', 'revenue', userId],
    queryFn: () => fetchRevenueForecast(userId),
    staleTime: 2 * 60 * 1000,
  })

  const pendingReminders = useQuery({
    queryKey: ['dashboard', 'pending-reminders', userId],
    queryFn: () => fetchPendingReminders(userId),
    staleTime: 60 * 1000,
  })

  // ... 기타 위젯

  // 전체 갱신 (수동 새로고침)
  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  return { activityCount, revenue, pendingReminders, refreshAll }
}
```

### 9.3 서버사이드 집계 최적화

```sql
-- 대시보드 통계를 단일 쿼리로 집계 (N+1 방지)
-- /api/dashboard/stats API에서 사용

WITH activity_stats AS (
  SELECT
    COUNT(*) as total_activities,
    COUNT(*) FILTER (WHERE activity_date >= date_trunc('week', CURRENT_DATE)) as this_week,
    COUNT(*) FILTER (WHERE activity_date >= date_trunc('month', CURRENT_DATE)) as this_month
  FROM activities
  WHERE user_id = $1
),
reminder_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as pending,
    COUNT(*) FILTER (WHERE status = 'overdue') as overdue,
    COUNT(*) FILTER (WHERE status = 'completed'
      AND completed_at >= date_trunc('week', CURRENT_DATE)) as completed_this_week
  FROM reminders
  WHERE user_id = $1
),
deal_stats AS (
  SELECT
    COUNT(*) as total_deals,
    SUM(amount) FILTER (WHERE stage NOT IN ('closed_lost')) as pipeline_value,
    SUM(amount * probability / 100) as weighted_forecast
  FROM deals
  WHERE user_id = $1 AND deleted_at IS NULL
)
SELECT * FROM activity_stats, reminder_stats, deal_stats;
```

---

## 10. AI/ML Architecture

### 5.1 AI Pipeline Design

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Processing Pipeline                    │
│                                                              │
│  [사용자 입력]                                                │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  Stage 1     │    │  Stage 2     │    │  Stage 3     │   │
│  │  NER +       │───▶│  Activity    │───▶│  Follow-up   │   │
│  │  분류         │    │  Structuring │    │  Extraction  │   │
│  │              │    │              │    │              │   │
│  │  GPT-4o-mini │    │  GPT-4o-mini │    │  GPT-4o-mini │   │
│  │  Function    │    │  Function    │    │  Function    │   │
│  │  Calling     │    │  Calling     │    │  Calling     │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
│       │                    │                    │            │
│       ▼                    ▼                    ▼            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Structured Data Store                    │   │
│  │  activities | deals | reminders | organizations      │   │
│  └──────────────────────────────────────────────────────┘   │
│                            │                                 │
│                            ▼                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐   │
│  │  Stage 4     │    │  Stage 5     │    │  Stage 6     │   │
│  │  Insights    │    │  Report Gen  │    │  Lead Score  │   │
│  │              │    │              │    │              │   │
│  │  GPT-4o     │    │  GPT-4o     │    │  Rule-based  │   │
│  │  분석/요약   │    │  보고서 생성  │    │  + GPT-4o    │   │
│  └──────────────┘    └──────────────┘    └──────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Function Calling Schema

```typescript
// Stage 1: 활동 분류 + NER
const activityClassifyFunction = {
  name: "classify_activity",
  parameters: {
    type: "object",
    properties: {
      activityType: {
        type: "string",
        enum: ["call", "email", "visit", "meeting", "contract", "billing", "inspection", "other"]
      },
      organizationName: { type: "string" },
      contactName: { type: "string" },
      contactTitle: { type: "string" },
      amounts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            value: { type: "number" },
            unit: { type: "string", enum: ["억", "만원", "원"] },
            period: { type: "string", enum: ["년", "월", "일회성"] },
            context: { type: "string" }
          }
        }
      },
      keywords: { type: "array", items: { type: "string" } },
      summary: { type: "string" }
    }
  }
}

// Stage 3: 후속조치 추출
const extractFollowUpsFunction = {
  name: "extract_follow_ups",
  parameters: {
    type: "object",
    properties: {
      followUps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            action: { type: "string" },
            dueDate: { type: "string", description: "ISO date or relative (차주, 월말)" },
            priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
            assignee: { type: "string" }
          }
        }
      }
    }
  }
}
```

### 5.3 비용 최적화 전략

| 처리 단계 | 모델 | 이유 | 예상 비용 |
|-----------|------|------|-----------|
| 활동 분류 (Stage 1-3) | GPT-4o-mini | 구조화 작업, 빠른 응답 | ~$0.01/건 |
| 인사이트 분석 (Stage 4) | GPT-4o | 복잡한 추론 필요 | ~$0.05/분석 |
| 보고서 생성 (Stage 5) | GPT-4o | 긴 형식 고품질 출력 | ~$0.10/보고서 |
| 리드 스코어링 (Stage 6) | Rule + GPT-4o | 규칙 기반 1차, AI 2차 | ~$0.03/딜 |

**월간 예상 비용 (2명 사용):**
- 활동 기록: 22건/월 x $0.01 = $0.22
- 인사이트: 4회/월 x $0.05 = $0.20
- 보고서: 4주간 + 1월간 = $0.50
- 리드 스코어링: 10딜 x $0.03 = $0.30
- 기타 (요약, 검색 등): $5.00
- **합계: ~$6.22/월** (충분히 $50 이내)

---

## 11. Implementation Phases

### 11.1 Phase 2: 활동 기록 + 미팅 준비 (2주)

**Week 1: 핵심 인프라 + Reactive Pipeline**
- [ ] activities, meetings, reminders 테이블 생성 (Drizzle migration)
- [ ] activity_events, import_batches, dashboard_cache 테이블 생성
- [ ] Activity Pipeline Orchestrator 구현 (`lib/pipeline/activity-pipeline.ts`)
- [ ] AI 활동 분류 API (`/api/ai/classify-activity`)
- [ ] 후속조치 추출 API (`/api/ai/extract-followups`)
- [ ] 활동 기록 입력 UI (자유형식 + AI 분류 결과 확인)
- [ ] React Query 설정 + Optimistic Update 패턴 구현
- [ ] CSV 임포트 파이프라인 (배치 처리 + 진행률 API)

**Week 2: 타임라인 + 알림 + 실시간 갱신**
- [ ] 고객별 히스토리 타임라인 UI (실시간 활동 추가 반영)
- [ ] AI 고객 요약 API (`/api/ai/summarize-customer`)
- [ ] 후속조치 대시보드 위젯 (자동 갱신)
- [ ] 알림 시스템 (인앱 배지 + Pipeline 연동)
- [ ] 미팅 브리핑 생성 UI
- [ ] Pipeline 진행 상태 Polling UI
- [ ] 대시보드 통합 집계 API (`/api/dashboard/stats`)

### 11.2 Phase 3: 파이프라인/CRM (2주)

**Week 3: 딜 관리**
- [ ] deals, contracts 테이블 생성
- [ ] 딜 파이프라인 칸반 UI
- [ ] CSV에서 딜 자동 생성 (AI 파싱)
- [ ] 금액 자동 추출 + 딜 연결
- [ ] 딜 상세 페이지 (히스토리, 문서, 활동)

**Week 4: AI 분석**
- [ ] 리드 스코어링 엔진
- [ ] 매출 예측 대시보드
- [ ] 계약 만기 알림
- [ ] 파이프라인 요약 위젯

### 11.3 Phase 4: 인텔리전스 + 보고서 (2주)

**Week 5: 인사이트**
- [ ] 영업 인사이트 분석 API
- [ ] 활동 패턴 대시보드 (차트)
- [ ] 고객 집중도 추천
- [ ] 이상 패턴 탐지

**Week 6: 보고서 자동화**
- [ ] 주간/월간 보고서 자동 생성
- [ ] 보고서 템플릿 커스터마이징
- [ ] PDF 내보내기
- [ ] 보고서 히스토리 관리

---

## 12. Success Criteria

### 12.1 Definition of Done

- [ ] 6개 핵심 기능 모두 구현 완료
- [ ] Activity Event Pipeline 전체 흐름 동작 (5단계)
- [ ] 활동 저장 -> 대시보드 갱신까지 5초 이내
- [ ] CSV 589건 배치 임포트 성공 (성공률 95% 이상)
- [ ] 기존 CSV 589건 데이터 마이그레이션 완료
- [ ] AI 분류 정확도 85% 이상 (50건 수동 검증)
- [ ] 영업직원 2명(정경석, 이경묵) 실사용 테스트 완료
- [ ] 치명적 버그 0건

### 12.2 기대 효과 (정량)

| 업무 | 현재 소요 시간 | 도입 후 | 절감 |
|------|---------------|---------|------|
| 활동 기록 | 주 2-3시간 (CSV 수작업) | 주 30분 (자유입력+AI) | **83% 절감** |
| 미팅 준비 | 30분/건 (히스토리 검색) | 5분/건 (AI 브리핑) | **83% 절감** |
| 후속조치 추적 | 수동 (누락 빈번) | 자동 추출+알림 | **누락률 90% 감소** |
| 주간 보고서 | 1-2시간 | 5분 (AI 생성) | **92% 절감** |
| 파이프라인 파악 | 불가능 (비구조화) | 실시간 대시보드 | **신규 역량** |
| 매출 예측 | 감에 의존 | AI 데이터 기반 | **신규 역량** |

### 12.3 Quality Criteria

- [ ] 테스트 커버리지 80% 이상 (핵심 AI 파싱 로직)
- [ ] Lighthouse 성능 점수 90+
- [ ] Zero lint errors
- [ ] Build 성공

---

## 13. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| AI 분류 정확도 부족 (한국어 금융 용어) | High | Medium | Few-shot 예시 30건 이상, 프롬프트 반복 개선 |
| CSV 데이터 파싱 실패 (인코딩, 다중행) | Medium | High | EUC-KR 전처리, 멀티라인 파서 별도 구현 |
| OpenAI API 비용 초과 | Medium | Low | GPT-4o-mini 우선, 캐싱, 배치 처리 |
| 사용자 채택 저조 | High | Medium | 기존 CSV 워크플로와 유사한 UX, 점진적 도입 |
| Supabase 무료 티어 한계 | Medium | Medium | 데이터량 모니터링, Pro 전환 계획 |
| 후속조치 추출 오탐 | Medium | Medium | 사용자 확인 단계 필수, 피드백 루프 |
| 비동기 Pipeline 실패 누적 | Medium | Medium | activity_events 모니터링, 3회 실패 시 수동 처리 플래그, 관리자 알림 |
| Vercel Serverless 타임아웃 (10초) | High | Medium | waitUntil/unstable_after로 응답 분리, AI 호출은 5초 타임아웃 |
| CSV 대량 임포트 시 Neon 연결 한계 | Medium | Low | 동시 DB 연결 3개 제한, 청크 순차 처리, connection pooling |
| React Query 캐시 불일치 | Low | Medium | staleTime 만료로 자연 해소, 수동 새로고침 버튼 제공 |

---

## 14. Architecture Considerations

### 14.1 Project Level: Dynamic

현재 프로젝트는 Dynamic 레벨에 해당:
- Supabase BaaS 기반
- Next.js 풀스택 단일 앱
- Feature 기반 모듈 구조

### 14.2 Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| AI Processing | Server-side API Routes | API 키 보안, 스트리밍 지원 |
| Activity Parser | GPT-4o-mini + Function Calling | 구조화 출력 보장, 저비용 |
| Real-time Updates | React Query Invalidation + Optimistic Update + Smart Polling | Vercel/Neon 무료 티어 호환, WebSocket/SSE 불필요 (Section 6 참조) |
| Cron Jobs | Vercel Cron | 보고서 자동 생성, 알림 발송 |
| Chart Library | Recharts | shadcn 호환, 경량 |
| CSV Parser | Papa Parse + iconv-lite | 한국어 인코딩 처리 |

### 14.3 API 구조 확장

```
/api
├── /activities
│   ├── /route.ts          # GET (목록), POST (생성 + Pipeline 트리거)
│   ├── /[id]/route.ts     # GET, PUT, DELETE
│   ├── /import/route.ts   # CSV 업로드 + 배치 시작
│   └── /import/[batchId]/status/route.ts  # 임포트 진행률
├── /deals
│   ├── /route.ts          # GET, POST
│   ├── /[id]/route.ts     # GET, PUT, DELETE
│   └── /pipeline/route.ts # 파이프라인 집계
├── /meetings
│   ├── /route.ts
│   └── /[id]/route.ts
├── /reminders
│   ├── /route.ts
│   └── /[id]/route.ts
├── /dashboard
│   └── /stats/route.ts    # 대시보드 통합 집계 API
├── /pipeline
│   └── /[activityId]/status/route.ts  # Pipeline 진행 상태
├── /reports
│   ├── /generate/route.ts # AI 보고서 생성
│   └── /route.ts          # 보고서 목록
├── /ai
│   ├── /classify-activity/route.ts
│   ├── /extract-followups/route.ts
│   ├── /summarize-customer/route.ts
│   ├── /score-lead/route.ts
│   ├── /forecast/route.ts
│   ├── /generate/route.ts  # (기존)
│   └── /insights/route.ts
└── /intelligence
    └── /route.ts
```

---

## 15. CSV Migration Strategy

### 15.1 Migration Pipeline

```
[Raw CSV (EUC-KR)]
    │
    ▼ iconv-lite (EUC-KR -> UTF-8)
[UTF-8 CSV]
    │
    ▼ Papa Parse (multiline, delimiter handling)
[Parsed Rows: 589건]
    │
    ▼ Organization Matcher (fuzzy matching)
    │  "IBK투자증권 " -> "IBK투자증권" (trim, normalize)
[Org-linked Rows]
    │
    ▼ AI Batch Classifier (GPT-4o-mini, batch of 10)
    │  - Activity type classification
    │  - Amount extraction
    │  - Follow-up detection
    │  - Contact matching
[Structured Activities]
    │
    ▼ Deal Detector (금액 + 계약 키워드 -> Deal 생성)
[Activities + Deals + Reminders]
    │
    ▼ DB Insert (transaction)
[Complete]
```

### 15.2 Migration Cost Estimate

- 589건 / 10건 배치 = ~60 API 호출
- GPT-4o-mini: ~$0.60 (전체 마이그레이션)
- 예상 소요 시간: 5-10분

---

## 16. Next Steps

1. [ ] 이 Plan 문서 리뷰 및 승인
2. [ ] Design 문서 작성 (`sales-automation-strategy.design.md`)
3. [ ] Phase 2 DB 마이그레이션 시작
4. [ ] CSV 임포트 파이프라인 프로토타입
5. [ ] AI 활동 분류 프롬프트 튜닝 (실 데이터 30건으로 테스트)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-28 | Initial draft - 6 features, data model, AI pipeline, phases | CTO Lead |
| 0.2 | 2026-03-28 | Reactive Pipeline Architecture, Real-time Update Strategy, CSV Import Pipeline, Data Consistency, Event-Driven Dashboard 추가. Section 3 Features에 실시간 반영 연동 추가. Section 4 Data Model에 activity_events, import_batches, dashboard_cache 테이블 추가 | CTO Lead |
