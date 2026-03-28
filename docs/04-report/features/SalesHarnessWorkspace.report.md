# SalesHarnessWorkspace — Phase 2+3 PDCA Completion Report

> **Report Type**: PDCA Cycle Completion Report
>
> **Project**: SalesHarness (코스콤 금융영업 AI 자동화)
> **Date**: 2026-03-28
> **Author**: report-generator
> **Phases**: Phase 2 (활동/후속조치) + Phase 3 (파이프라인/인텔리전스)

---

## 1. Executive Summary

코스콤 금융영업1팀의 AI 영업 자동화 시스템 Phase 2~3을 단일 세션에서 완료했습니다.
실 영업 데이터(589건) 기반의 6개 핵심 기능(활동 자동 기록, 히스토리 타임라인, 후속조치 추출, 딜 파이프라인, AI 스코어링, 인텔리전스)을 구현하고, PDCA 반복 개선을 통해 모두 90%+ Match Rate를 달성했습니다.

### Key Metrics

| Metric | Phase 2 | Phase 3 | Total |
|--------|:-------:|:-------:|:-----:|
| Match Rate | 66% → **90%** | 88% → **92%** | — |
| PDCA Iterations | 2회 | 1회 | 3회 |
| Commits | 2개 | 2개 | **4개** |
| 신규 API Endpoints | 5개 | 8개 | **13개** |
| DB 테이블 추가 | 1개 (meetings) | 1개 (deals) | **2개** |
| Lines Changed | +1,251 | +1,816 | **+3,067** |

---

## 2. PDCA Cycle Summary

### Phase 2: 활동 기록 + AI 분류 + 후속조치

```
[Plan] ✅ → [Do] ✅ → [Check] 66% → [Act-1] 82% → [Act-2] 90% ✅
```

| Iteration | Action | Match Rate |
|:---------:|--------|:----------:|
| Initial | 활동 기록, AI 분류, 후속조치 추출, CSV 임포트 | 66% |
| Act-1 | Dashboard 실데이터, 활동 필터, Contact 연결, Sidebar 배지, meetings CRUD | 82% |
| Act-2 | AI 고객 요약 API, Reminder 연기 기능 | **90%** |

### Phase 3: 파이프라인/CRM + 인텔리전스

```
[Plan] ✅ → [Design] ✅ → [Do] ✅ → [Check] 88% → [Act] 92% ✅
```

| Iteration | Action | Match Rate |
|:---------:|--------|:----------:|
| Initial | deals 스키마, CRUD API, 칸반 UI, AI 스코어링, 매출 예측, Intelligence 대시보드 | 88% |
| Act-1 | FK 제약조건, 계약 만기 cron, CSV 딜 자동 생성, 폼 필드 추가 | **92%** |

---

## 3. Implementation Overview

### 3.1 Architecture

```
┌─────────────────────────────────────────────────┐
│ Client (Next.js App Router + React Query)        │
│ ├── Dashboard (실시간 통계)                       │
│ ├── Activities (AI 분류 + 유형 필터)              │
│ ├── Pipeline (칸반 보드 + Deal CRUD)              │
│ ├── Intelligence (차트 + AI 추천)                 │
│ ├── Meetings (CRUD + 상태관리)                    │
│ └── Organizations (타임라인 + AI 요약)            │
├─────────────────────────────────────────────────┤
│ API Layer (21 endpoints)                         │
│ ├── /api/dashboard       ← 통계 집계             │
│ ├── /api/activities      ← CRUD + type 필터      │
│ ├── /api/deals           ← CRUD + pipeline view  │
│ ├── /api/deals/[id]/score ← AI 리드 스코어링     │
│ ├── /api/deals/forecast  ← 매출 예측             │
│ ├── /api/intelligence    ← 통계 + AI 추천        │
│ ├── /api/meetings        ← CRUD                  │
│ ├── /api/reminders       ← 관리 + postpone       │
│ ├── /api/cron/contract-expiry ← 만기 알림        │
│ └── /api/organizations/[id]/summary ← AI 요약    │
├─────────────────────────────────────────────────┤
│ Pipeline (Reactive, Synchronous)                 │
│ Stage 0: Activity INSERT                         │
│ Stage 1: AI Classification (GPT-4o-mini)         │
│ Stage 2: Organization Matching                   │
│ Stage 2b: Contact Matching                       │
│ Stage 3: Follow-up Extraction → Reminders        │
│ Stage 3b: Amount → Deal Auto-Update              │
│ Stage 4: Pipeline Complete                       │
├─────────────────────────────────────────────────┤
│ Database (Neon PostgreSQL + Drizzle ORM)         │
│ users, organizations, contacts, products,        │
│ documents, activities, reminders, meetings,      │
│ deals, import_batches, ai_logs                   │
└─────────────────────────────────────────────────┘
```

### 3.2 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React Query, Framer Motion, recharts |
| Backend | Next.js API Routes, Drizzle ORM |
| Database | Neon PostgreSQL (11 tables) |
| AI | GPT-4o (요약/스코어링), GPT-4o-mini (분류/추천) |
| Auth | NextAuth.js (Credentials) |
| Deploy | Vercel |

### 3.3 Database Schema (Phase 2+3)

| Table | Phase | Purpose |
|-------|:-----:|---------|
| `activities` | 2 | 영업 활동 기록 + AI 분류 |
| `reminders` | 2 | 후속조치 알림 (dealId FK 추가) |
| `meetings` | 2 | 미팅 관리 |
| `import_batches` | 2 | CSV 임포트 추적 |
| `deals` | 3 | 딜 파이프라인 (7-stage, AI score) |

### 3.4 API Endpoints (Phase 2+3 신규 13개)

| Method | Endpoint | Phase | Purpose |
|--------|----------|:-----:|---------|
| GET | `/api/dashboard` | 2 | 대시보드 통계 (7 병렬 쿼리) |
| GET/POST | `/api/activities` | 2 | 활동 CRUD + type 필터 |
| GET/PATCH | `/api/reminders` | 2 | 후속조치 (postpone 포함) |
| GET/POST/PATCH | `/api/meetings` | 2 | 미팅 CRUD |
| GET | `/api/organizations/[id]/summary` | 2 | AI 고객 요약 |
| GET/POST | `/api/deals` | 3 | 딜 CRUD + pipeline view |
| GET/PATCH/DELETE | `/api/deals/[id]` | 3 | 딜 상세/수정/삭제 |
| POST | `/api/deals/[id]/score` | 3 | AI 리드 스코어링 |
| GET | `/api/deals/forecast` | 3 | 매출 예측 (best/likely/worst) |
| GET | `/api/intelligence` | 3 | 통계 + AI 추천 |
| GET | `/api/cron/contract-expiry` | 3 | 계약 만기 알림 |

---

## 4. Plan FR Coverage

### Feature 1: 영업 활동 자동 기록/분류 — 88%

| FR | Status | Notes |
|----|:------:|-------|
| FR-1.1 AI 자동 분류 | ✅ | GPT-4o-mini, 8 activity types |
| FR-1.2 고객사/담당자 연결 | ✅ | Stage 2 + 2b |
| FR-1.3 날짜/금액 추출 | ✅ | parsedContent JSON |
| FR-1.4 CSV 임포트 | ✅ | 589건 + 딜 자동 생성 |
| FR-1.5 음성 (Whisper) | ⏸️ | Low priority, 이연 |

### Feature 2: 히스토리 타임라인 — 68%

| FR | Status | Notes |
|----|:------:|-------|
| FR-2.1 타임라인 뷰 | ✅ | OrganizationDetail |
| FR-2.2 유형 필터 | ✅ | API + UI 필터 |
| FR-2.3 금액 변동 추적 | ⏸️ | Phase 4+ |
| FR-2.4 문서/딜 링크 | ⏸️ | Phase 4+ |
| FR-2.5 AI 고객 요약 | ✅ | GPT-4o endpoint |

### Feature 3: 후속조치 알림 — 82%

| FR | Status | Notes |
|----|:------:|-------|
| FR-3.1 자동 추출 | ✅ | Pipeline Stage 3 |
| FR-3.2 기한 추론 | ✅ | parseDueDate() |
| FR-3.3 인앱 알림 | ✅ | Dashboard + Sidebar badge |
| FR-3.4 이메일 다이제스트 | ⏸️ | SMTP 필요, 이연 |
| FR-3.5 상태 관리 | ✅ | complete/cancel/postpone |
| FR-3.6 대시보드 위젯 | ✅ | 실데이터 |

### Feature 4: 계약/매출 파이프라인 — 92%

| FR | Status | Notes |
|----|:------:|-------|
| FR-4.1 칸반 보드 | ✅ | 5-stage, dropdown 변경 |
| FR-4.2 금액 자동 추출 → 딜 | ✅ | Stage 3b |
| FR-4.3 파이프라인 단계 | ✅ | 7-stage enum |
| FR-4.4 AI 스코어링 | ✅ | 4-factor + GPT |
| FR-4.5 매출 예측 | ✅ | best/likely/worst |
| FR-4.6 계약 만기 알림 | ✅ | Cron endpoint |
| FR-4.7 CSV → 딜 생성 | ✅ | 계약 키워드 감지 |

### Feature 5: 인텔리전스 — 75%

| FR | Status | Notes |
|----|:------:|-------|
| FR-5.1 고객사별 분석 | ✅ | Top 10 빈도 |
| FR-5.2 담당자별 비교 | ⏸️ | 단일 사용자 기준 |
| FR-5.3 월별 추이 | ✅ | recharts 차트 |
| FR-5.5 AI 추천 고객 | ✅ | GPT-4o-mini |

---

## 5. Commit History

| Commit | Type | Description |
|--------|------|-------------|
| `b3d7a05` | feat | Phase 2 — 활동 기록 + AI 분류 + 후속조치 + CSV |
| `1ef8b2c` | feat | Phase 2 Act — 대시보드 + meetings + AI 요약 (90%) |
| `9dc2019` | feat | Phase 3 — 칸반 + AI 스코어링 + Intelligence |
| `641b3ef` | fix | Phase 3 Act — FK + 만기알림 + CSV 딜 (92%) |

---

## 6. Deferred Items (Phase 4+)

| Item | Priority | Target |
|------|----------|--------|
| FR-1.5: 음성 입력 (Whisper) | Low | Phase 4+ |
| FR-2.3: 금액 변동 추적 | Medium | Phase 4 |
| FR-3.4: 이메일 다이제스트 | Medium | Phase 4 |
| FR-5.2: 담당자별 비교 | Medium | 다중 사용자 시 |
| FR-5.6: 이상 패턴 탐지 | Medium | Phase 4 |
| FR-6.x: 주간/월간 자동 보고서 | High | **Phase 4** |
| DnD 칸반 (dnd-kit) | Low | UX 개선 시 |

---

## 7. Lessons Learned

### What Went Well

1. **PDCA 반복 효율** — 3회 iteration으로 Phase 2+3 모두 90%+ 달성. Gap detector가 정확한 우선순위 제공.
2. **Design-first 접근** — Phase 3에서 Design 문서를 먼저 작성하니 구현 편차가 줄어듦 (88% vs Phase 2의 66%).
3. **리액티브 파이프라인 확장성** — Stage 2b(Contact), Stage 3b(Deal) 추가가 기존 구조를 깨지 않고 자연스럽게 확장됨.
4. **recharts + React Query** — 인텔리전스 대시보드가 빠르게 구현됨. 차트 라이브러리 선택이 적절.

### What Could Be Improved

1. **DnD 미적용** — `@dnd-kit` 설치만 하고 실제 칸반에 미적용. 드롭다운으로 대체했으나 UX 차이가 있음.
2. **테스트 부재** — 단위/통합 테스트 없이 구현. Phase 4에서 TDD 적용 권장.
3. **AI API 비용 모니터링** — 스코어링/추천/요약 등 AI 호출이 늘어남. 비용 추적 필요.

---

## 8. Next Steps: Phase 4

Plan 문서 기준 Feature 6 (FR-6.1~6.6):
- 주간/월간 활동 보고서 자동 생성
- 파이프라인 현황 포함
- 후속조치 완료율 포함
- PDF/Word 내보내기

```
/pdca design SalesHarnessWorkspace  → Phase 4 Design
/pdca do SalesHarnessWorkspace      → Phase 4 구현
```

---

*Generated by bkit report-generator | Session: 2026-03-28*
*Phase 2: Plan → Do → Check(66%) → Act×2 → 90%*
*Phase 3: Plan → Design → Do → Check(88%) → Act → 92%*
