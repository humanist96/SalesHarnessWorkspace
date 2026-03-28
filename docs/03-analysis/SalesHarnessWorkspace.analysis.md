# SalesHarness Phase 2 Gap Analysis Report

> **Analysis Type**: Design-Implementation Gap Analysis (PDCA Check Phase)
>
> **Project**: SalesHarness
> **Analyst**: bkit-gap-detector
> **Date**: 2026-03-28
> **Plan Doc**: [sales-automation-strategy.plan.md](../01-plan/features/sales-automation-strategy.plan.md)

---

## 1. Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Feature 1: 영업 활동 자동 기록/분류 | 82% | Warning |
| Feature 2: 고객별 히스토리 타임라인 | 40% | Critical |
| Feature 3: 후속조치 자동 추출/알림 | 62% | Warning |
| Data Model Compliance | 72% | Warning |
| Architecture / Pipeline | 75% | Warning |
| **Overall Phase 2** | **66%** | **Critical** |

Score criteria: 90%+ = Pass, 70-89% = Warning, <70% = Critical

---

## 2. Feature 1: 영업 활동 자동 기록/분류 (82%)

| ID | Requirement | Priority | Match | Notes |
|----|-------------|----------|:-----:|-------|
| FR-1.1 | 자유 텍스트 AI 활동 유형 자동 분류 | High | 95% | `classify.ts` GPT-4o-mini 분류 구현 완료. JSON mode 사용 (Function Calling 대신) |
| FR-1.2 | 고객사/담당자 자동 인식 및 연결 | High | 70% | 고객사 매칭 O, 담당자(contactMention) 추출만 하고 contacts 테이블 연결 X |
| FR-1.3 | 날짜/금액/기한 자동 추출 (NER) | High | 85% | 금액 추출 O, 날짜는 후속조치 내에서만 추출 |
| FR-1.4 | CSV 589건 일괄 임포트 + AI 분류 | High | 90% | 배치 추적, 조직 매칭/생성, 파이프라인 실행 완료 |
| FR-1.5 | 음성 메모 -> Whisper 변환 | Low | 0% | 미구현 (Low 우선순위) |

### Gaps
- **Contact Auto-Link** (High): AI가 `contactMention`을 추출하지만 contacts 테이블과 연결하지 않음
- Voice Input (Low): 미구현 — Phase 2 범위 내 수용 가능

---

## 3. Feature 2: 고객별 히스토리 타임라인 (40%) - Critical

| ID | Requirement | Priority | Match | Notes |
|----|-------------|----------|:-----:|-------|
| FR-2.1 | 고객사별 전체 활동 타임라인 뷰 | High | 80% | OrganizationDetail에 타임라인 탭 존재. 50건 제한, 페이지네이션 없음 |
| FR-2.2 | 활동 유형별 필터링 | High | 0% | 필터 UI/API 파라미터 없음 |
| FR-2.3 | 금액 변동 추적 | Medium | 0% | 금액 집계/시각화 없음 |
| FR-2.4 | 관련 문서/딜 링크 표시 | Medium | 0% | 타임라인에 링크 없음 |
| FR-2.5 | AI 요약 ("최근 3개월 활동 요약") | High | 0% | AI 요약 엔드포인트 없음 |

### Gaps
- **Activity Type Filter** (High): API에 type 필터 파라미터 없음
- **AI Customer Summary** (High): GPT-4o 요약 엔드포인트 미구현
- Amount History View (Medium): parsedContent.amounts 데이터는 있으나 시각화 없음
- Document/Deal Links (Medium): dealId 필드 존재하나 미사용 (Phase 3)

---

## 4. Feature 3: 후속조치 자동 추출/알림 (62%)

| ID | Requirement | Priority | Match | Notes |
|----|-------------|----------|:-----:|-------|
| FR-3.1 | 활동 기록에서 후속조치 자동 추출 | Critical | 90% | Pipeline Stage 3에서 AI 추출 + reminders 생성 |
| FR-3.2 | 기한 자동 추론 | High | 85% | parseDueDate()에서 차주/내일/월말 등 처리. "2월 중" 등 일부 패턴 미지원 |
| FR-3.3 | 인앱 알림 (대시보드 + 사이드바 배지) | High | 30% | 대시보드 후속조치 카드가 하드코딩. 사이드바 배지 없음 |
| FR-3.4 | 이메일 알림 (일간 다이제스트) | Medium | 0% | 이메일/크론 미구현 |
| FR-3.5 | 후속조치 완료/연기/취소 상태 관리 | High | 80% | PATCH API 존재. "연기"(새 기한 설정) 미지원 |
| FR-3.6 | 미완료 후속조치 대시보드 위젯 | High | 10% | 하드코딩된 숫자만 표시 |

### Gaps
- **Dashboard 하드코딩** (Critical): 대시보드 전체가 정적 목데이터 — 실제 DB 데이터 미연동
- **Sidebar Reminder Badge** (High): 사이드바에 알림 뱃지 없음
- Email Digest (Medium): 이메일/크론 미구현
- Postpone Action (Medium): 연기(새 기한 설정) 기능 없음

---

## 5. Data Model Gaps

| Plan 테이블 | 구현 | Match | Notes |
|------------|------|:-----:|-------|
| activities | O | 90% | 핵심 필드 완료 |
| meetings | **X** | 0% | 스키마 없음, 페이지는 플레이스홀더 |
| reminders | O | 85% | dealId FK 누락 |
| activity_events | **X** | 0% | activities.pipelineStatus로 단순화 |
| import_batches | O | 90% | 정상 구현 |

---

## 6. Missing Features Summary (13 Gaps)

| # | Gap | Priority | Effort |
|---|-----|----------|--------|
| 1 | **Dashboard 실데이터 연동** | Critical | 4-6h |
| 2 | **활동 유형 필터** | High | 2h |
| 3 | **Contact 자동 연결** | High | 2h |
| 4 | **Sidebar 알림 배지** | High | 1h |
| 5 | **meetings 테이블 + CRUD** | High | 4h |
| 6 | AI 고객 활동 요약 | High | 3h |
| 7 | Reminder 연기/재스케줄 | Medium | 1h |
| 8 | 금액 변동 추적 뷰 | Medium | 3h |
| 9 | 문서/딜 링크 표시 | Medium | 2h |
| 10 | AI 분류 실패 재시도 큐 | Medium | 3h |
| 11 | activity_events 테이블 | Medium | 2h |
| 12 | 이메일 다이제스트 (크론) | Medium | 3h |
| 13 | 음성 입력 (Whisper) | Low | 4h |

---

## 7. Recommended Priority

1~5번 Critical/High 항목 해결 시 **66% -> ~82%** 도달 예상

```
[Plan] ✅ → [Design] ⏭️ → [Do] ✅ → [Check] 66% 🔴 → [Act] 필요
```

**권장**: `/pdca iterate SalesHarnessWorkspace` 실행

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-28 | Initial Phase 2 gap analysis — Match Rate 66% | bkit-gap-detector |
| 2.0 | 2026-03-28 | Act-1: Dashboard 실데이터, 활동필터, Contact연결, Sidebar배지, meetings CRUD — 82% | pdca-iterator |
| 2.1 | 2026-03-28 | Act-2: AI 고객 요약 API, Reminder 연기 기능 — **90%** | pdca-iterator |
