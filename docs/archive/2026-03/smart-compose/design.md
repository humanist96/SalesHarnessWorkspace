# Design: 영업활동 스마트 작성 (Smart Compose)

> Plan: [smart-compose.plan.md](../../01-plan/features/smart-compose.plan.md)

## 신규/수정 파일

| 파일 | 유형 | 설명 |
|------|------|------|
| `scripts/enable-trgm.ts` | 신규 | pg_trgm 확장 + GIN/BTREE 인덱스 마이그레이션 |
| `src/app/api/activities/suggest/route.ts` | 신규 | 유사 검색 + 템플릿 API |
| `src/components/ui/command.tsx` | 신규 | shadcn Command (cmdk) 설치 |
| `src/features/activities/hooks/useActivitySuggestions.ts` | 신규 | 디바운스 검색 훅 (IME 대응) |
| `src/features/activities/components/SuggestionCard.tsx` | 신규 | 유사 활동 카드 |
| `src/features/activities/components/ActivitySuggestPanel.tsx` | 신규 | 제안 패널 (cmdk 기반) |
| `src/features/activities/components/ActivityForm.tsx` | 수정 | 패널 통합 + IME 처리 |

## API 설계

### GET /api/activities/suggest

**파라미터**: `q`, `organizationId`, `mode` (suggest|templates), `limit`

**스코어링**: `0.5 × similarity(raw_content, q) + 0.3 × org_match + 0.2 × recency`

**동작 분기**:
- q ≥ 5자: pg_trgm 유사도 검색 (threshold 0.08)
- q < 5자 + orgId: 해당 고객사 최근 활동
- mode=templates + orgId: intent+products 그룹핑 패턴

## UI 설계

ActivityForm의 Textarea 아래에 cmdk 기반 팝오버 패널:
- 유사한 활동 섹션 (SuggestionCard: intent 뱃지 + products + 유사도 바)
- 자주 사용하는 패턴 섹션 (intent + products + 빈도수)
- 키보드: ↑↓ Enter Esc
- 한글 IME: compositionstart/end 이벤트로 조합 중 미발동
