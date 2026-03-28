# Phase 3 Design — 파이프라인/CRM + 인텔리전스

> **Project**: SalesHarness
> **Phase**: 3 (Pipeline/CRM + Intelligence)
> **Date**: 2026-03-28
> **Plan Reference**: [sales-automation-strategy.plan.md](../../01-plan/features/sales-automation-strategy.plan.md) — Feature 4, 5, 6

---

## 1. Overview

Phase 2에서 구축한 활동 기록/분류/후속조치 시스템 위에, 딜(Deal) 파이프라인 관리와 영업 인텔리전스를 추가한다.

### 1.1 Scope

| Feature | Plan FR | Priority |
|---------|---------|----------|
| **딜 파이프라인 칸반** | FR-4.1, FR-4.3 | High |
| **금액 자동 추출 → 딜 갱신** | FR-4.2 | High |
| **계약 만기 알림** | FR-4.6 | High |
| **CSV → 딜 자동 생성** | FR-4.7 | High |
| **AI 리드 스코어링** | FR-4.4 | Medium |
| **매출 예측 (best/likely/worst)** | FR-4.5 | Medium |
| **AI 집중 고객 추천** | FR-5.5 | High |
| **활동 통계 대시보드** | FR-5.1~5.3 | Medium |

### 1.2 Out of Scope (Phase 4+)

- FR-5.4: 활동 대비 매출 효율 분석
- FR-5.6: 이상 패턴 탐지
- FR-6.x: 주간/월간 자동 보고서

---

## 2. Data Model

### 2.1 New Table: `deals`

```typescript
export const deals = pgTable('deals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id),
  contactId: uuid('contact_id').references(() => contacts.id),

  title: text('title').notNull(),
  description: text('description'),

  // Pipeline
  stage: text('stage', {
    enum: ['discovery', 'proposal', 'negotiation', 'contract', 'billing', 'closed_won', 'closed_lost'],
  }).notNull().default('discovery'),

  // Financials
  amount: bigint('amount', { mode: 'number' }),   // 원 단위
  currency: text('currency').notNull().default('KRW'),
  term: text('term', { enum: ['one_time', 'monthly', 'yearly'] }).notNull().default('yearly'),

  // AI scoring
  aiScore: integer('ai_score'),          // 0-100 전환 확률
  aiScoreReason: text('ai_score_reason'),

  // Dates
  expectedCloseDate: date('expected_close_date'),
  contractStartDate: date('contract_start_date'),
  contractEndDate: date('contract_end_date'),
  closedAt: timestamp('closed_at', { withTimezone: true }),

  // Source
  source: text('source', { enum: ['manual', 'csv_import', 'ai_extracted'] }).notNull().default('manual'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
```

### 2.2 Existing Table Changes

```typescript
// activities.dealId → FK to deals.id
// (이미 필드 존재, Phase 3에서 실제 FK 연결)

// reminders.dealId → FK to deals.id
// (Plan에 명시, 추가 필요)
```

---

## 3. API Design

### 3.1 Deals CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deals` | 딜 목록 (stage 필터, pipeline view) |
| GET | `/api/deals/[id]` | 딜 상세 |
| POST | `/api/deals` | 딜 생성 |
| PATCH | `/api/deals/[id]` | 딜 수정 (stage 변경 포함) |
| DELETE | `/api/deals/[id]` | 딜 삭제 |

**GET /api/deals query params:**
- `stage`: 파이프라인 단계 필터
- `organizationId`: 고객사 필터
- `view`: `pipeline` (칸반용 stage별 그룹) | `list` (목록)

**GET /api/deals response (pipeline view):**
```json
{
  "success": true,
  "data": {
    "stages": {
      "discovery": [{ "id": "...", "title": "...", "amount": 80000000 }],
      "proposal": [...],
      "negotiation": [...],
      "contract": [...],
      "billing": [...]
    },
    "summary": {
      "totalDeals": 12,
      "totalAmount": 850000000,
      "weightedAmount": 420000000
    }
  }
}
```

### 3.2 AI Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/deals/[id]/score` | AI 리드 스코어링 (GPT-4o) |
| GET | `/api/deals/forecast` | 매출 예측 (best/likely/worst) |
| GET | `/api/intelligence/recommendations` | AI 주간 추천 고객 |

**POST /api/deals/[id]/score response:**
```json
{
  "score": 72,
  "reason": "최근 30일 내 3건의 활동, 금액 협의 진행 중, 계약 기한 4주 내",
  "factors": [
    { "name": "activity_frequency", "value": 85, "weight": 0.3 },
    { "name": "amount_discussed", "value": 70, "weight": 0.25 },
    { "name": "stage_velocity", "value": 60, "weight": 0.25 },
    { "name": "recency", "value": 75, "weight": 0.2 }
  ]
}
```

**GET /api/deals/forecast response:**
```json
{
  "best": 850000000,
  "likely": 620000000,
  "worst": 410000000,
  "deals": [
    { "id": "...", "title": "...", "amount": 306000000, "probability": 85 },
    { "id": "...", "title": "...", "amount": 120000000, "probability": 60 }
  ]
}
```

### 3.3 Pipeline Integration

활동 저장 시 금액 감지 → 딜 자동 갱신:

```
Pipeline Stage 3b (NEW):
  IF parsedContent.amounts.length > 0 AND activity.dealId
  THEN UPDATE deals SET amount = extracted_amount
  AND INSERT stage change event
```

### 3.4 CSV → 딜 자동 생성

기존 import API 확장:
- CSV 행에서 금액 + "계약"/"체결" 키워드 감지 시 자동으로 Deal 생성
- `source: 'csv_import'`로 마킹
- 기존 활동의 `dealId`에 연결

---

## 4. UI Design

### 4.1 Pipeline Page (칸반)

```
┌─────────────────────────────────────────────────────────┐
│ 영업 현황         [+ 새 딜] [AI 매출 예측] [필터 ▼]     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ [발굴]        [제안]       [협상]      [계약]    [빌링]  │
│ ┌──────┐  ┌──────┐   ┌──────┐   ┌──────┐  ┌──────┐     │
│ │카카오 │  │리딩  │   │다올  │   │IBK   │  │한화  │     │
│ │??억   │  │0.8억 │   │1.2억 │   │3.06억│  │0.5억 │     │
│ │AI: 25%│  │AI:45%│   │AI:60%│   │AI:85%│  │AI:90%│     │
│ └──────┘  └──────┘   └──────┘   └──────┘  └──────┘     │
│                                                          │
│ ─── Summary ──────────────────────────────────────────  │
│ 총 12딜 | 예상 매출 8.5억 | 가중 매출 4.2억             │
├─────────────────────────────────────────────────────────┤
│ 매출 예측: Best 8.5억 | Likely 6.2억 | Worst 4.1억      │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Deal Card (칸반 카드)

```
┌────────────────────┐
│ IBK투자증권         │
│ 채권매도대행 회선   │
│ ₩3.06억/년         │
│ ┌──────────────┐   │
│ │ AI Score: 85%│   │
│ └──────────────┘   │
│ 계약종료: 2026-12  │
│ 최근활동: 2일 전    │
└────────────────────┘
```

### 4.3 Deal Form (생성/수정)

Fields:
- 제목 (required)
- 고객사 (select, required)
- 파이프라인 단계 (select)
- 금액 + 통화 + 기간
- 예상 계약일
- 계약 시작/종료일
- 설명 (textarea)

### 4.4 Intelligence Page

```
┌─────────────────────────────────────────┐
│ 인텔리전스                [새로고침]     │
├─────────────────────────────────────────┤
│                                          │
│ ◆ AI 추천 (이번 주 집중 고객)           │
│ ┌──────────────────────────────────┐    │
│ │ 1. 다올투자증권 - 계약 갱신 1개월전│    │
│ │ 2. IBK투자증권 - UAT 추가과금 기회│    │
│ └──────────────────────────────────┘    │
│                                          │
│ ◆ 활동 통계 (이번 달)                   │
│ [전화: 45건] [방문: 12건] [계약: 3건]   │
│                                          │
│ ◆ 고객사별 활동 빈도 (Top 5)            │
│ IBK투자증권    ████████████  143건       │
│ 다올투자증권   ███████       106건       │
│ 카카오페이증권 ████          60건        │
│                                          │
│ ◆ 월별 활동 추이                        │
│ [Bar chart: Jan-Mar 2026]               │
└─────────────────────────────────────────┘
```

---

## 5. Implementation Order

### Priority 1 — Core Pipeline (High)

```
1. [ ] deals 테이블 스키마 추가 + reminders.dealId FK
2. [ ] GET/POST/PATCH/DELETE /api/deals CRUD
3. [ ] Pipeline 칸반 보드 UI (DnD stage 변경)
4. [ ] Deal 생성/수정 폼
5. [ ] Pipeline orchestrator Stage 3b (금액→딜 갱신)
6. [ ] CSV import 확장 (딜 자동 생성)
```

### Priority 2 — AI Features (High/Medium)

```
7. [ ] AI 리드 스코어링 endpoint (GPT-4o)
8. [ ] 매출 예측 API (best/likely/worst 계산)
9. [ ] AI 집중 고객 추천 endpoint
10. [ ] Deal card에 AI score 표시
```

### Priority 3 — Intelligence Dashboard (Medium)

```
11. [ ] 활동 통계 API (유형별, 고객별, 월별)
12. [ ] Intelligence 페이지 UI (차트 + 추천)
13. [ ] 계약 만기 알림 (기존 reminders 확장)
```

---

## 6. Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 칸반 DnD | `@dnd-kit/core` | 가볍고 React 18 호환, Next.js App Router 지원 |
| 차트 라이브러리 | `recharts` | React 기반, SSR 호환, 번들 크기 합리적 |
| 금액 단위 | 원(KRW) 저장, 억 단위 표시 | 정밀도 유지, UI에서 변환 |
| AI Score 계산 | Rule-based + GPT-4o hybrid | 4개 팩터 가중 평균 (rules) + GPT 해석 |
| 매출 예측 | 확률 가중 합계 | best=sum(amount), likely=sum(amount*score), worst=sum(amount*score*0.6) |

---

## 7. Dependencies

```bash
# 새로 필요한 패키지
pnpm add @dnd-kit/core @dnd-kit/sortable recharts
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-28 | Initial Phase 3 design | bkit-design |
