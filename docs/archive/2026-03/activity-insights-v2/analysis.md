# Gap Analysis: activity-insights-v2

> 분석일: 2026-03-28
> 1차 Match Rate: **78.6%** (22/28)
> 2차 Match Rate (수정 후): **96.4%** (27/28)

## 1차 분석 Gap 목록 및 조치 결과

| # | 항목 | 1차 | 2차 | 조치 |
|---|------|------|------|------|
| 1 | B-2: PATCH /api/activities/[id]/classify | GAP* | MATCH | 이미 구현됨 (감지 오류) |
| 2 | B-4: ClassificationEditor.tsx | GAP | MATCH | 신규 구현 완료 |
| 3 | B-6: ActivityDetailSheet + Editor 통합 | GAP | MATCH | [수정] 버튼 + 에디터 토글 추가 |
| 4 | C-2: ReclassifyPanel.tsx | GAP | MATCH | 신규 구현 완료 (미리보기/진행률) |
| 5 | B-8: Stage 필터 | PARTIAL | MATCH | 단계 필터 행 추가 |
| 6 | 고객사명 하이라이팅 | GAP | MATCH | highlightText에 org 패턴 추가 (amber) |
| 7 | avgAmount, avgDaysInStage | GAP | GAP | 미구현 (낮은 우선순위 — Nice-to-have) |

## 2차 점수 상세

| Phase | Score |
|-------|-------|
| Phase A: 기반 + 원문 조회 | 100% (6/6) |
| Phase B: 의미 분류 | 100% (8/8) |
| Phase C: 배치 재분류 + 인사이트 | 90% (9/10) |
| **Overall** | **96.4% (27/28)** |

## 남은 Gap (1건)
- avgAmount, avgDaysInStage 필드 — 인사이트 API에서 추가 집계 쿼리 필요. 핵심 기능에 영향 없으므로 후속 개선으로 분류.

## 빌드 상태
- pnpm build: **성공** (TypeScript 에러 없음)
