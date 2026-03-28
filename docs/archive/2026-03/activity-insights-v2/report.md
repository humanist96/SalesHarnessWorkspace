# PDCA Completion Report: 영업활동 인사이트 v2

> Feature: activity-insights-v2
> Date: 2026-03-28
> Match Rate: **96.4%** (27/28)
> PDCA Iterations: 1회 (78.6% → 96.4%)

---

## 1. Executive Summary

영업활동 시스템의 3가지 핵심 문제를 해결했습니다:

| Before | After |
|--------|-------|
| AI 요약만 표시, 원문 접근 불가 | 1클릭으로 원문 전체 조회 + 금액/고객사/날짜 하이라이팅 |
| 단일 분류 (call/email/visit 등 **수단** 8종) | 4차원 분류 (**수단** + **영업목적** 10종 + **단계** 7종 + **상품**) |
| 건수 집계 3개 차트 | 전략적 인사이트 6종 (도넛, 퍼널, 히트맵, 트렌드, 리스크, 감성) |

---

## 2. Deliverables

### 신규 파일 (22개)

| 카테고리 | 파일 | 목적 |
|----------|------|------|
| **타입/유틸** | `src/lib/pipeline/types.ts` | SalesIntent, SalesStage, ClassificationResultV2, UI config |
| | `src/lib/pipeline/parse-content.ts` | V1/V2 호환 접근자, 하이라이트 패턴 |
| **UI 컴포넌트** | `src/components/ui/sheet.tsx` | shadcn/ui Sheet (설치) |
| | `src/features/activities/components/ActivityCard.tsx` | 활동 카드 (클릭→Sheet) |
| | `src/features/activities/components/ActivityDetailSheet.tsx` | 원문 상세 + AI 분석 + 수정 |
| | `src/features/activities/components/ClassificationBadges.tsx` | intent/stage/product/sentiment 뱃지 |
| | `src/features/activities/components/ClassificationEditor.tsx` | 수동 분류 수정 에디터 |
| | `src/features/activities/components/ReclassifyPanel.tsx` | 배치 재분류 UI |
| **인사이트 차트** | `src/features/insights/hooks/useInsights.ts` | React Query 훅 |
| | `src/features/insights/components/IntentDonut.tsx` | 영업 목적 분포 도넛 |
| | `src/features/insights/components/SalesFunnel.tsx` | 영업 퍼널 시각화 |
| | `src/features/insights/components/OrgIntentHeatmap.tsx` | 고객사 × 목적 히트맵 |
| | `src/features/insights/components/ProductTrend.tsx` | 상품별 스택 에어리어 |
| | `src/features/insights/components/RiskAlerts.tsx` | 리스크 신호 목록 |
| | `src/features/insights/components/SentimentGauge.tsx` | 감성 분포 도넛 |
| **API** | `src/app/api/activities/[id]/classify/route.ts` | PATCH 수동 분류 수정 |
| | `src/app/api/activities/reclassify/route.ts` | POST 배치 재분류 |
| | `src/app/api/intelligence/insights/route.ts` | GET 다차원 인사이트 집계 |

### 수정 파일 (4개)

| 파일 | 변경 내용 |
|------|----------|
| `src/lib/pipeline/classify.ts` | V2 프롬프트 (GPT-4o), 10종 intent + 7종 stage + products + sentiment + riskFlags + reasoning |
| `src/app/api/activities/route.ts` | GET 필터 확장 (intent, stage, product, search JSONB 쿼리) |
| `src/features/activities/components/ActivityForm.tsx` | V2 분류 결과 표시 (ClassificationBadges + reasoning) |
| `src/app/(dashboard)/activities/page.tsx` | 3단 필터 (수단/목적/단계) + 검색 + ActivityCard/Sheet 통합 |
| `src/app/(dashboard)/intelligence/page.tsx` | 6종 인사이트 차트 + 기간 선택 (30d/90d/6m/1y) |

---

## 3. Architecture Decisions

### 3.1 스키마 변경 없음
- `parsedContent` JSONB에 V2 필드 추가 — DB 마이그레이션 불필요
- V1/V2 데이터 자연 공존, `isV2Content()` 가드로 안전하게 접근

### 3.2 AI 모델 전략
- 신규 활동: **GPT-4o** (정확한 다차원 분류)
- 배치 재분류: **GPT-4o-mini** (비용 절감, 589건 대량 처리)
- 프롬프트에 코스콤 도메인 지식 + Few-shot 3건 포함

### 3.3 분류 체계
```
V1: type (수단 1차원) → call, email, visit, meeting, contract, billing, inspection, other
V2: + intent (목적) → 10종: 신규영업, 계약갱신, 크로스셀, 업셀, 이슈해결, 관계유지, ...
    + stage (단계) → 7종: 탐색 → 니즈파악 → 제안 → 협상 → 계약 → 납품 → 사후관리
    + products (상품) → 동적: 원장서비스, 투자정보계, 회선서비스, ...
    + sentiment (감성) → positive / neutral / negative
    + riskFlags (리스크) → 할인 요구, 경쟁사 언급, 내부규정 변경, ...
    + reasoning (근거) → AI 판단 이유 1-2문장
```

---

## 4. Gap Analysis Summary

| 차수 | Match Rate | Gap 건수 | 주요 Gap |
|------|-----------|---------|---------|
| 1차 | 78.6% | 6건 | ClassificationEditor, ReclassifyPanel, Stage 필터, 고객사 하이라이팅 |
| 2차 | **96.4%** | 1건 | avgAmount/avgDaysInStage 집계 필드 (Nice-to-have) |

---

## 5. 해결된 사용자 문제

### "원문을 볼 수 없다"
→ 활동 카드 클릭 → Sheet 패널에 원문 전체 표시, 금액(파란), 고객사(금색), 날짜(회색) 자동 하이라이팅

### "AI 분류가 맘에 안든다"
→ 수단(method) 분류에서 **영업 목적(intent) + 단계(stage) + 상품(product) + 감성(sentiment)** 4차원 분류로 확장
→ AI가 분류 이유(reasoning)도 함께 표시
→ 틀린 분류는 [수정] 버튼으로 수동 교정 가능

### "의미있는 인사이트가 필요하다"
→ 6종 전략적 시각화:
- 영업 목적 분포 도넛 — 신규 vs 유지 vs 이슈 비율
- 영업 퍼널 — 단계별 활동 수, 전환율
- 고객사 × 목적 히트맵 — 어디에 어떤 활동을 집중하는지
- 상품별 트렌드 — 상품 영업 모멘텀 변화
- 리스크 신호 — 할인 요구, 경쟁사 언급 등 자동 감지
- 감성 분석 — 영업 진행 분위기

---

## 6. Remaining Items

| 항목 | 우선순위 | 설명 |
|------|---------|------|
| avgAmount in intentDistribution | Low | 인사이트 API에 평균 금액 집계 추가 |
| avgDaysInStage in stageFunnel | Low | 단계별 평균 체류 일수 계산 |
| 배치 재분류 비동기화 | Medium | 현재 동기 처리 → 큐 기반 비동기로 전환 (대량 데이터 시) |
| 실제 589건 데이터 재분류 실행 | Medium | ReclassifyPanel에서 실행 필요 |

---

## 7. Build Status

```
pnpm build: ✅ 성공 (TypeScript 에러 없음)
신규 API 라우트: 3개 (classify, reclassify, insights)
신규 컴포넌트: 15개
빌드 시간: ~5초
```
