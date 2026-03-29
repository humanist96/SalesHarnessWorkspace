# Plan: 영업활동 스마트 작성 (Smart Activity Compose)

## Context

영업직원이 활동을 기록할 때 매번 처음부터 작성해야 하는 비효율이 있다.
동일 고객사(IBK 137건, 다올 107건 등)에 대해 유사한 패턴의 활동이 반복됨에도
기존 기록을 참고하거나 재활용할 수 없다.

**목표**: 입력 중 유사 기록을 실시간 검색하여 자동완성/템플릿 선택/편집 기능 제공

---

## 기술 접근: pg_trgm (트라이그램) + JSONB 복합 매칭

**왜 임베딩(pgvector)이 아닌 pg_trgm인가:**
- 589건 데이터에서 유사성은 주로 **고객사명 + 상품명 + 금액 패턴**의 어휘적 반복 (IBK, 원장서비스, 0.06억)
- pg_trgm은 외부 API 호출 없이 **<15ms** 응답 → 타이핑 중 즉각 반응
- OpenAI 의존 없음 → 비용 0, 장애 무관
- 추후 데이터 5,000건 이상 시 pgvector 레이어 추가 가능 (확장 경로 확보)

---

## 구현 계획

### Phase 1: DB 인덱스 (pg_trgm 활성화)

**파일**: `scripts/enable-trgm.ts` (신규)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_activities_raw_trgm ON activities USING gin (raw_content gin_trgm_ops);
CREATE INDEX idx_activities_org_date ON activities (organization_id, activity_date DESC);
```

Neon에서 pg_trgm 확장을 활성화하고 GIN 인덱스를 생성하는 일회성 마이그레이션 스크립트.

---

### Phase 2: 유사 활동 검색 API

**파일**: `src/app/api/activities/suggest/route.ts` (신규)

```
GET /api/activities/suggest?q=IBK+원장&organizationId=xxx&limit=5
```

**검색 로직 (3단계 가중 스코어링)**:
```
Score = 0.5 × similarity(raw_content, query)      -- 텍스트 유사도
      + 0.3 × (org_match ? 1 : 0)                 -- 같은 고객사 보너스
      + 0.2 × recency(activity_date)               -- 최신일수록 높음
```

**동작 분기**:
- `q` 길이 ≥ 5자: 트라이그램 유사도 검색 (threshold > 0.08)
- `q` 길이 < 5자 + `organizationId` 있음: 해당 고객사 최근 활동 5건 반환
- `q` 없음 + `organizationId` 있음: 고객사별 자주 사용 패턴(템플릿) 반환

**템플릿 쿼리** (같은 엔드포인트, `mode=templates` 파라미터):
```sql
SELECT organization_id, parsed_content->>'intent' as intent,
       parsed_content->'products' as products, COUNT(*) as freq,
       (array_agg(raw_content ORDER BY activity_date DESC))[1] as example
FROM activities
WHERE organization_id = $orgId AND pipeline_status = 'completed'
GROUP BY 1, 2, 3 ORDER BY freq DESC LIMIT 5
```

---

### Phase 3: UI 컴포넌트

#### 3-1. shadcn/ui Command 설치
```bash
npx shadcn@latest add command
```

#### 3-2. useActivitySuggestions 훅 (신규)

**파일**: `src/features/activities/hooks/useActivitySuggestions.ts`

- 입력값 300ms 디바운스 (한글 IME composition 대응 포함)
- `compositionend` 이벤트 후에만 검색 트리거 (IME 조합 중 미발동)
- TanStack React Query: `staleTime: 30s`, `enabled: query.length >= 5 || !!orgId`

#### 3-3. SuggestionCard 컴포넌트 (신규)

**파일**: `src/features/activities/components/SuggestionCard.tsx`

```
┌──────────────────────────────────────────────┐
│ [계약갱신] [원장서비스] [투자정보계]    2일 전  │
│ 중국은행 재계약 — 원장서비스 1.85억,          │
│ 투자정보계 0.36억, 총 3.06억...              │
│                              ████░░ 유사도 72%│
└──────────────────────────────────────────────┘
```

- intent 뱃지 + product 태그 (기존 ClassificationBadges 재사용)
- rawContent 2줄 미리보기 (`line-clamp-2`)
- 유사도 바 (green >30%, amber >15%, slate 나머지)
- 상대 시간 표시

#### 3-4. ActivitySuggestPanel 컴포넌트 (신규)

**파일**: `src/features/activities/components/ActivitySuggestPanel.tsx`

cmdk(Command) 기반 팝오버 패널:
```
┌─────────────────────────────────────────┐
│ 유사한 활동 (3건)                        │
│ ┌─ SuggestionCard ────────────────────┐ │
│ │ [계약갱신] 중국은행 재계약 — ...     │ │
│ └─────────────────────────────────────┘ │
│ ┌─ SuggestionCard ────────────────────┐ │
│ │ [크로스셀] IBK 채권매도대행 — ...    │ │
│ └─────────────────────────────────────┘ │
│─────────────────────────────────────────│
│ 자주 사용하는 패턴                       │
│  [계약갱신] 원장+투자정보 (23회)         │
│  [신규영업] 회선서비스 (12회)            │
└─────────────────────────────────────────┘
```

**키보드 네비게이션**: ↑↓ 이동, Enter 선택, Esc 닫기 (cmdk 내장)
**위치**: Textarea 바로 아래, absolute 포지셔닝, max-h-[280px] 스크롤
**표시 조건**: `rawContent.length >= 5` 이고 결과가 있을 때
**숨기기**: Esc, blur(200ms 딜레이), 입력 삭제

#### 3-5. ActivityForm.tsx 수정

**파일**: `src/features/activities/components/ActivityForm.tsx` (수정)

변경사항:
- Textarea를 `relative` 컨테이너로 감싸기
- `useActivitySuggestions(rawContent, organizationId)` 훅 연결
- `<ActivitySuggestPanel>` 렌더링
- 선택 시 `setRawContent(selected.rawContent)` + 필요시 `setOrganizationId`
- IME composition 상태 추적 (`isComposing` ref)

```
┌─ ActivityForm ───────────────────────┐
│ 고객사: [▼ IBK투자증권           ]   │
│                                      │
│ 활동 내용:                           │
│ ┌──────────────────────────────────┐ │
│ │ IBK 원장서비스 재계약...         │ │ ← Textarea
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ ▸ 유사한 활동 (3건)             │ │ ← SuggestPanel
│ │   중국은행 재계약 — 원장...      │ │    (appears on typing)
│ │   IBK 원장서비스 갱신...         │ │
│ │ ────────────────────────────     │ │
│ │ ▸ 자주 사용하는 패턴            │ │
│ │   [계약갱신] 원장+투자정보       │ │
│ └──────────────────────────────────┘ │
│                                      │
│ [        활동 기록 + AI 분류        ] │
└──────────────────────────────────────┘
```

---

## 신규/수정 파일 요약

| 파일 | 유형 | 설명 |
|------|------|------|
| `scripts/enable-trgm.ts` | 신규 | pg_trgm 확장 + 인덱스 마이그레이션 |
| `src/app/api/activities/suggest/route.ts` | 신규 | 유사 활동 검색 + 템플릿 API |
| `src/components/ui/command.tsx` | 신규 | shadcn Command (설치) |
| `src/features/activities/hooks/useActivitySuggestions.ts` | 신규 | 디바운스 검색 훅 (IME 대응) |
| `src/features/activities/components/SuggestionCard.tsx` | 신규 | 유사 활동 카드 |
| `src/features/activities/components/ActivitySuggestPanel.tsx` | 신규 | 제안 패널 (cmdk 기반) |
| `src/features/activities/components/ActivityForm.tsx` | 수정 | 패널 통합 |

---

## 한글 IME 처리 (핵심)

한글 입력 시 자음/모음 조합 중에 검색이 발동하면 "ㅇ", "이" 같은 미완성 글자로 검색되어 무의미한 결과가 나옴.

**해결**: `compositionstart`/`compositionend` 이벤트 감지
```typescript
const isComposing = useRef(false)
// Textarea에 onCompositionStart/End 연결
// 디바운스 타이머는 compositionend 후에만 시작
```

---

## 검증 방법

1. **pg_trgm 마이그레이션**: `scripts/enable-trgm.ts` 실행 후 DB에서 `SELECT similarity('IBK 원장서비스', raw_content) FROM activities LIMIT 5` 확인
2. **API 테스트**: `curl localhost:3000/api/activities/suggest?q=IBK+원장` → 유사도 순으로 정렬된 결과 확인
3. **UI 테스트**: 활동 폼에서 "IBK" 입력 → 패널에 IBK 관련 활동 표시, 클릭 시 Textarea에 내용 채워짐
4. **IME 테스트**: 한글 "중국은행" 입력 중 "중"까지 입력할 때 패널이 나타나지 않고, "중국" 완성 후 나타나는지 확인
5. **빌드**: `pnpm build` 성공 확인
