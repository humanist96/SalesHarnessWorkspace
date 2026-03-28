# Phase 4 Design — 주간/월간 보고서 자동 생성

> **Project**: SalesHarness
> **Phase**: 4 (Auto Reports)
> **Date**: 2026-03-28
> **Plan Reference**: Feature 6 (FR-6.1~6.6)

---

## 1. Overview

Phase 3까지 축적된 활동/딜/후속조치 데이터를 기반으로, AI가 주간/월간 영업 보고서를 자동 생성한다. 경영진 보고용 정형화된 포맷으로 출력하며, 클립보드 복사 및 다운로드를 지원한다.

### 1.1 Scope

| Feature | Plan FR | Priority |
|---------|---------|----------|
| **주간 활동 보고서 생성** | FR-6.1 | High |
| **월간 실적 보고서 생성** | FR-6.2 | High |
| **파이프라인 현황 포함** | FR-6.3 | High |
| **후속조치 완료율 포함** | FR-6.4 | Medium |
| **다운로드 (마크다운/텍스트)** | FR-6.5 simplified | Medium |
| Vercel Cron 자동 생성 | FR-6.6 simplified | Low |

### 1.2 Out of Scope

- PDF/Word 렌더링 (복잡한 의존성, 마크다운 다운로드로 대체)
- 이메일 자동 발송 (SMTP 설정 필요, 향후)

---

## 2. Data Model

### 2.1 New Table: `reports`

```typescript
export const reports = pgTable('reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),

  type: text('type', { enum: ['weekly', 'monthly'] }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),        // AI 생성 마크다운
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),

  // 스냅샷 데이터
  stats: jsonb('stats'),
  // { totalActivities, activityBreakdown, pipelineSummary, reminderStats }

  aiModel: text('ai_model'),
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
```

---

## 3. API Design

### 3.1 Reports CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports` | 보고서 목록 (type 필터) |
| POST | `/api/reports/generate` | AI 보고서 생성 (GPT-4o 스트리밍) |
| GET | `/api/reports/[id]` | 보고서 상세 |
| DELETE | `/api/reports/[id]` | 보고서 삭제 |

### 3.2 POST /api/reports/generate

**Request:**
```json
{
  "type": "weekly",        // weekly | monthly
  "periodStart": "2026-03-23",
  "periodEnd": "2026-03-28"
}
```

**Process:**
1. 기간 내 activities 조회 (고객사별 그룹)
2. 기간 내 deals 변동 조회 (stage 변경, 신규, 완료)
3. reminders 현황 조회 (완료/미완료/지연 카운트)
4. meetings 조회 (다음 주 예정)
5. 모든 데이터를 GPT-4o에 전달 → 보고서 마크다운 생성
6. reports 테이블에 저장

**Response:** 생성된 report 객체

### 3.3 GPT-4o Prompt Structure

```
[주간 영업 활동 보고서 - 금융영업1팀]
기간: {periodStart} ~ {periodEnd}

1. 주요 활동 ({count}건)
   - 고객사별 활동 요약

2. 파이프라인 변동
   - 신규/진행/완료 딜

3. 후속조치 현황
   - 완료: N건 / 미완료: N건 / 지연: N건
   - 완료율: N%

4. 다음 주 주요 일정
   - 예정된 미팅/후속조치
```

---

## 4. UI Design

### 4.1 Reports Page (신규)

```
┌─────────────────────────────────────────────┐
│ 보고서        [주간 보고서 생성] [월간 생성]  │
├─────────────────────────────────────────────┤
│                                              │
│ ┌──────────────────────────────────────┐    │
│ │ 주간 영업 활동 보고서                 │    │
│ │ 2026.03.23 ~ 2026.03.28              │    │
│ │ [보기] [복사] [다운로드] [삭제]        │    │
│ └──────────────────────────────────────┘    │
│                                              │
│ ┌──────────────────────────────────────┐    │
│ │ 월간 실적 보고서                      │    │
│ │ 2026.03.01 ~ 2026.03.31              │    │
│ │ [보기] [복사] [다운로드] [삭제]        │    │
│ └──────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### 4.2 Report Detail (모달 또는 전체 화면)

- 마크다운 렌더링 (prose 스타일)
- "클립보드 복사" 버튼
- "마크다운 다운로드" 버튼 (.md 파일)
- 생성 시간, AI 모델 표시

### 4.3 Sidebar 네비게이션 추가

"보고서" 메뉴를 Sidebar에 추가 (FileBarChart 아이콘)

---

## 5. Implementation Order

```
1. [ ] reports 테이블 스키마 + type export
2. [ ] POST /api/reports/generate (데이터 집계 + GPT-4o)
3. [ ] GET /api/reports + GET /api/reports/[id] + DELETE
4. [ ] Reports 페이지 (목록 + 생성 버튼 + 상세 모달)
5. [ ] 클립보드 복사 + 마크다운 다운로드
6. [ ] Sidebar에 "보고서" 메뉴 추가
```

---

## 6. Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| 마크다운 렌더링 | `react-markdown` + tailwind prose | 가볍고 SSR 호환 |
| 다운로드 포맷 | .md 파일 (Blob + URL.createObjectURL) | 별도 라이브러리 불필요 |
| AI 모델 | GPT-4o (quality) | 보고서는 고품질 필요 |
| 보고서 저장 | DB에 마크다운 텍스트 저장 | 재조회 가능, 히스토리 유지 |

---

## 7. Dependencies

```bash
pnpm add react-markdown
```

---

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-28 | Initial Phase 4 design | bkit-design |
