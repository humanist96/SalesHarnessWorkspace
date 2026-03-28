# Design: 영업활동 인사이트 v2

> Plan 문서: [activity-insights-v2.plan.md](../../01-plan/features/activity-insights-v2.plan.md)

## 1. 데이터 모델 설계

### 1.1 ParsedContentV2 타입 (JSONB 확장)

`parsedContent` JSONB 필드의 V2 구조. 기존 V1 필드 유지 + 신규 필드 추가:

```typescript
// src/lib/pipeline/types.ts (신규 파일)

// === 영업 목적 (Intent) ===
export type SalesIntent =
  | 'new_business'      // 신규영업: 미거래 고객 개척, 첫 접촉
  | 'contract_renewal'  // 계약갱신: 기존 계약 연장/재계약
  | 'cross_sell'        // 크로스셀: 기존 고객에 추가 상품 판매
  | 'upsell'            // 업셀: 기존 상품 업그레이드/증설
  | 'issue_resolution'  // 이슈해결: 장애, 불만, 문의 대응
  | 'relationship'      // 관계유지: 정기 방문, 안부, 정보 제공
  | 'info_gathering'    // 정보수집: 시장조사, 경쟁사 동향 파악
  | 'negotiation'       // 협상: 가격, 조건, 할인 협의
  | 'delivery'          // 납품/구축: 서비스 설치, 세팅, 이관
  | 'billing_payment'   // 빌링/정산: 비용 청구, 수금, 정산

// === 영업 단계 (Stage) ===
export type SalesStage =
  | 'prospecting'       // 탐색: 잠재 고객 발굴
  | 'needs_analysis'    // 니즈파악: 고객 요구사항 확인
  | 'proposal'          // 제안: 솔루션/견적 제안
  | 'negotiation'       // 협상: 가격/조건 조율
  | 'contracting'       // 계약: 계약서 작성/날인
  | 'implementation'    // 납품: 서비스 구축/이관
  | 'post_care'         // 사후관리: 유지보수, 만족도 확인

// === 감성 (Sentiment) ===
export type ActivitySentiment = 'positive' | 'neutral' | 'negative'

// === V2 분류 결과 ===
export interface ClassificationResultV2 {
  // V1 호환 필드 (기존 유지)
  type: 'call' | 'email' | 'visit' | 'meeting' | 'contract' | 'billing' | 'inspection' | 'other'
  summary: string
  keywords: string[]
  amounts: { value: number; unit: string; description: string }[]
  followUps: { action: string; dueDescription: string; priority: 'critical' | 'high' | 'medium' | 'low' }[]
  organizationMention: string | null
  contactMention: string | null
  confidence: number

  // V2 신규 필드
  intent: SalesIntent
  stage: SalesStage
  products: string[]        // 관련 PowerBase 상품/서비스명
  sentiment: ActivitySentiment
  riskFlags: string[]       // ["할인 요구", "경쟁사 언급", "결정 지연", "담당자 변경"]
  reasoning: string         // AI가 이렇게 분류한 이유 (1-2문장)
}
```

### 1.2 DB 스키마 변경

**변경 없음** — `parsedContent`는 이미 JSONB 필드이므로 V2 필드를 추가해도 스키마 마이그레이션 불필요.
기존 V1 데이터와 V2 데이터가 동일 필드에 공존 가능 (V2 필드는 optional로 접근).

### 1.3 V1/V2 호환 유틸

```typescript
// src/lib/pipeline/parse-content.ts (신규 파일)

export function isV2Content(parsed: unknown): parsed is ClassificationResultV2 {
  return parsed !== null
    && typeof parsed === 'object'
    && 'intent' in (parsed as Record<string, unknown>)
}

export function getIntent(parsed: unknown): SalesIntent | null {
  if (isV2Content(parsed)) return parsed.intent
  return null
}

export function getStage(parsed: unknown): SalesStage | null {
  if (isV2Content(parsed)) return parsed.stage
  return null
}
```

---

## 2. AI 분류 프롬프트 설계

### 2.1 V2 분류 프롬프트

**파일**: `src/lib/pipeline/classify.ts` (기존 파일 수정)

```
모델: GPT-4o (AI_MODELS.quality)
Temperature: 0.1
Max tokens: 1500
Response format: json_object
```

**System Prompt (V2)**:

```
당신은 코스콤 금융영업 활동을 다차원으로 분석하는 AI입니다.
코스콤은 PowerBase(증권사/은행용 금융IT 시스템)를 판매하는 금융IT 기업입니다.

영업직원이 입력한 자유형식 텍스트를 분석하여 JSON으로 반환하세요.

=== 분류 차원 ===

1. type (커뮤니케이션 수단):
   call | email | visit | meeting | contract | billing | inspection | other

2. intent (영업 목적 — 이 활동의 비즈니스 의도):
   - new_business: 미거래 고객 첫 접촉, 신규 영업
   - contract_renewal: 기존 계약 만료 대비 재계약/연장
   - cross_sell: 기존 고객에게 추가 상품/서비스 판매
   - upsell: 기존 이용 상품의 업그레이드/증설/회선 증속
   - issue_resolution: 장애, 불만, 시스템 문제 대응
   - relationship: 정기 방문, 안부, 정보 공유 (직접적 매출 목적 없음)
   - info_gathering: 시장/경쟁사/고객 내부 정보 수집
   - negotiation: 가격/할인율/조건 협의
   - delivery: 서비스 납품/구축/설치/이관
   - billing_payment: 빌링 비용 청구/정산/수금

3. stage (세일즈 퍼널 상 위치):
   prospecting → needs_analysis → proposal → negotiation → contracting → implementation → post_care

4. products (관련 PowerBase 상품/서비스):
   원장서비스, 투자정보계, 백업서비스, 전송서비스, 시세정보, 회선서비스,
   채권매도대행, 장비유지보수, 시장조성, 파생상품, 외국환, FEP,
   기타 (텍스트에서 추출)

5. sentiment (영업 진행 감성):
   - positive: 긍정적 진행 (계약 체결, 승인, 금액 증가, 추가 발주)
   - neutral: 일상적 진행 (정보 교환, 일정 조율, 확인)
   - negative: 부정적 신호 (해지 검토, 할인 압박, 경쟁사 전환 언급, 적자)

6. riskFlags (리스크 신호 — 해당 시만 추출):
   할인 요구, 경쟁사 언급, 결정 지연, 담당자 변경, 예산 축소,
   해지 검토, 내부규정 변경, 적자 발생, 시스템 장애

=== JSON 형식 ===
{
  "type": "...",
  "intent": "...",
  "stage": "...",
  "products": ["상품1", "상품2"],
  "sentiment": "positive|neutral|negative",
  "riskFlags": ["리스크1"],
  "summary": "1-2문장 요약",
  "keywords": ["핵심 키워드 3-5개"],
  "amounts": [{"value": 숫자(억 단위), "unit": "억/만/원", "description": "금액 설명"}],
  "followUps": [{"action": "후속조치", "dueDescription": "차주/월말/즉시", "priority": "critical|high|medium|low"}],
  "organizationMention": "고객사명 또는 null",
  "contactMention": "담당자명 또는 null",
  "confidence": 0-100,
  "reasoning": "이렇게 분류한 이유 (1-2문장)"
}

=== 분류 예시 ===

입력: "중국은행 재계약 (허지은, 399-6680) - 내부규정(6년이상 동일계약 유지 불가)에 따른 재계약 추진. 현재 할인율 40%(3억 Cap). 원장서비스 1.85억, 투자정보계 0.36억, 백업서비스 0.44억, 전송서비스 0.34억: 총 3.06억"
→ type: "meeting", intent: "contract_renewal", stage: "negotiation",
  products: ["원장서비스", "투자정보계", "백업서비스", "전송서비스"],
  sentiment: "neutral", riskFlags: ["내부규정 변경"],
  reasoning: "6년 규정에 의한 의무적 재계약으로, 기존 할인율 유지 협상 중"

입력: "IBK 강용원 이사 통화, 부산은행 채권매도대행 회선비용 0.06억/년, 차주 계약 진행 예정"
→ type: "call", intent: "cross_sell", stage: "contracting",
  products: ["채권매도대행", "회선서비스"],
  sentiment: "positive", riskFlags: [],
  reasoning: "기존 IBK 고객에 부산은행향 채권매도대행 추가 서비스 계약 진행"

입력: "지점 회선증속 논의, 현재 512K → 1024K 업그레이드 검토"
→ type: "call", intent: "upsell", stage: "needs_analysis",
  products: ["회선서비스"],
  sentiment: "positive", riskFlags: [],
  reasoning: "기존 회선 속도 업그레이드 검토로 업셀 기회"

반드시 유효한 JSON만 반환하세요. 다른 텍스트 없이.
```

### 2.2 모델 변경 전략

| 항목 | V1 (현재) | V2 (변경) | 이유 |
|------|----------|----------|------|
| 신규 활동 분류 | gpt-4o-mini | **gpt-4o** | 다차원 분류 정확도 필요 |
| 배치 재분류 | — | gpt-4o-mini | 비용 절감 (589건 대량 처리) |
| 추천/인사이트 | gpt-4o-mini | gpt-4o-mini (유지) | 기존 동작 유지 |

---

## 3. API 설계

### 3.1 기존 API 수정

#### `GET /api/activities` — 필터 확장

```typescript
// 추가 query params:
?intent=contract_renewal,cross_sell    // V2 intent 필터 (쉼표 구분)
&stage=negotiation,contracting         // V2 stage 필터
&product=원장서비스                      // 상품 필터
&search=중국은행                        // rawContent 텍스트 검색
```

**구현**: `parsedContent` JSONB 내 필드를 `sql` raw query로 필터링

```typescript
// intent 필터 예시
if (intent) {
  const intents = intent.split(',')
  filters.push(sql`${activities.parsedContent}->>'intent' = ANY(${intents})`)
}
```

#### `PATCH /api/activities/[id]/classify` — 수동 분류 수정 (신규)

```typescript
// Request body:
{
  intent?: SalesIntent,
  stage?: SalesStage,
  products?: string[],
  sentiment?: ActivitySentiment
}

// 동작:
// 1. parsedContent JSONB 내 해당 필드만 업데이트
// 2. aiClassified = false (수동 수정 표시)로 변경하지 않음 — 대신 manualOverride 플래그 추가
// 3. updatedAt 갱신
```

### 3.2 신규 API

#### `GET /api/intelligence/insights` — 다차원 인사이트 집계

```typescript
// Query params:
?period=30d|90d|6m|1y       // 기간 (기본: 30d)
&dimension=intent|stage|product  // 집계 차원

// Response:
interface InsightsResponse {
  // 영업 목적별 분포
  intentDistribution: {
    intent: SalesIntent
    count: number
    percentage: number
    avgAmount: number       // 평균 관련 금액
  }[]

  // 영업 단계별 분포
  stageFunnel: {
    stage: SalesStage
    count: number
    avgDaysInStage: number  // 평균 체류 일수
  }[]

  // 고객사 × 목적 히트맵 데이터
  orgIntentMatrix: {
    organizationId: string
    organizationName: string
    intents: Record<SalesIntent, number>
  }[]

  // 상품별 월간 트렌드
  productTrend: {
    month: string
    products: Record<string, number>
  }[]

  // 리스크 요약
  riskSummary: {
    flag: string
    count: number
    recentOrgs: string[]    // 최근 해당 리스크 언급 고객사
  }[]

  // 감성 분포
  sentimentDistribution: {
    sentiment: ActivitySentiment
    count: number
    percentage: number
  }[]
}
```

#### `POST /api/activities/reclassify` — 배치 재분류

```typescript
// Request body:
{
  scope: 'all' | 'v1_only'   // 전체 or V1 데이터만
  dryRun?: boolean            // true면 실제 업데이트 없이 미리보기만
  batchSize?: number          // 기본 20
}

// Response (streaming 또는 polling):
{
  totalCount: number
  processedCount: number
  status: 'running' | 'completed' | 'failed'
  sampleResults?: ClassificationResultV2[]  // dryRun 시
}

// 구현 방식:
// 1. v1_only: parsedContent에 'intent' 필드가 없는 레코드만 대상
// 2. rate limit: 분당 20건 (OpenAI TPM 고려)
// 3. 실패 건은 skip하고 계속 진행
// 4. 진행률은 importBatches 테이블 재활용 or 새 status 엔드포인트
```

---

## 4. UI 컴포넌트 설계

### 4.1 컴포넌트 트리

```
src/features/activities/
├── components/
│   ├── ActivityForm.tsx             # (기존 수정) V2 분류 결과 표시 확장
│   ├── ActivityList.tsx             # (신규) 목록 컴포넌트 분리
│   ├── ActivityCard.tsx             # (신규) 개별 활동 카드
│   ├── ActivityDetailSheet.tsx      # (신규) 원문 + AI 분석 상세 패널
│   ├── ClassificationBadges.tsx     # (신규) intent/stage/product 뱃지 모음
│   ├── ClassificationEditor.tsx     # (신규) 수동 분류 수정 드롭다운
│   └── ReclassifyPanel.tsx          # (신규) 배치 재분류 관리 UI
├── hooks/
│   └── useActivities.ts             # (신규) React Query 훅
└── types.ts                         # (신규) 프론트엔드 타입

src/features/insights/               # (신규 feature 모듈)
├── components/
│   ├── IntentDonut.tsx              # 영업 목적 분포 도넛
│   ├── SalesFunnel.tsx              # 영업 퍼널 시각화
│   ├── OrgIntentHeatmap.tsx         # 고객사 × 목적 히트맵
│   ├── ProductTrend.tsx             # 상품별 트렌드
│   ├── RiskAlerts.tsx               # 리스크 신호 요약
│   └── SentimentGauge.tsx           # 감성 분포
└── hooks/
    └── useInsights.ts               # 인사이트 데이터 훅
```

### 4.2 ActivityDetailSheet (핵심 신규 컴포넌트)

**동작**: 활동 카드 클릭 → 오른쪽에서 Sheet 슬라이드

```
┌──────────────────────────────────────────────┐
│ 활동 상세                              [닫기] │
├──────────────────────────────────────────────┤
│                                              │
│ 📅 2024.01.04  |  🏢 중국은행  |  👤 허지은   │
│                                              │
│ ┌─ 분류 태그 ──────────────────────────────┐ │
│ │ [계약갱신] [협상] [원장서비스] [투자정보계] │ │
│ │ [백업서비스] [전송서비스]                  │ │
│ │ 감성: 중립 ⚪  리스크: ⚠ 내부규정 변경     │ │
│ │                            [수정] 버튼    │ │
│ └───────────────────────────────────────────┘ │
│                                              │
│ ── AI 요약 ─────────────────────────────── │
│ 중국은행 내부규정에 따른 재계약 추진.         │
│ 기존 할인율 40% 유지하여 총 3.06억 규모      │
│ 재계약 협상 중.                              │
│                                              │
│ ── 원문 전체 ───────────────────────────── │
│ ┌────────────────────────────────────────┐  │
│ │ 중국은행 재계약  (허지은, 399-6680)      │  │
│ │    - 중국은행 내부규정(6년이상 동일계약   │  │
│ │      유지 불가)에 따른 재계약 추진        │  │
│ │    - 현재 적용받고 있는 할인율은 기 계약  │  │
│ │      의 5년차 이후 40% (3억 Cap조항)     │  │
│ │      적용중('16년 사장보고)              │  │
│ │    - 선물매매로 적자발생 중이나,          │  │
│ │      시장조성자로 PowerBase 시스템은      │  │
│ │      유지해야하는 상황                   │  │
│ │                                        │  │
│ │    [현재 이용료] '22.12~ '23.11         │  │
│ │       > 원장서비스 : **1.78억**          │  │
│ │       > 투자정보계 : **0.35억**          │  │
│ │       > 백업서비스 : **0.43억**          │  │
│ │       > 전송서비스 **0.34억** : 총 2.9억 │  │
│ │                                        │  │
│ │    [재계약]                             │  │
│ │       > 원장서비스 : **1.85억**          │  │
│ │       > 투자정보계 : **0.36억**          │  │
│ │       > 백업서비스 : **0.44억**          │  │
│ │       > 전송서비스 **0.34억**            │  │
│ │       > 장비유지보수 **0.1억** : 총3.06억│  │
│ └────────────────────────────────────────┘  │
│  금액: 볼드 파란색 | 고객사: 볼드 금색        │
│                                              │
│ ── AI 분류 이유 ─────────────────────────── │
│ "6년 규정에 의한 의무적 재계약으로, 기존      │
│  할인율 유지 협상 중. 적자 발생으로 리스크"   │
│                                              │
│ ── 금액 요약 ──────────────────────────── │
│ │ 현재: 2.9억/년  →  재계약: 3.06억/년      │
│ │ 차이: +0.16억 (+5.5%)                    │
│                                              │
│ ── 후속조치 ─────────────────────────────  │
│ ☑ 계약서 수정본 중국은행 확인 (진행중)        │
│ ☑ 품의문 수정 진행 (진행중)                   │
└──────────────────────────────────────────────┘
```

**shadcn/ui Sheet 필요** — 현재 미설치. `npx shadcn@latest add sheet` 실행 필요.

**원문 하이라이팅 규칙**:
- 금액 패턴 (`/\d+\.?\d*억|[\d,]+원|[\d,]+만/g`) → `text-blue-400 font-semibold`
- 고객사명 (organizations 테이블 매칭) → `text-amber-400 font-semibold`
- 날짜 패턴 (`/'\d{2}\.\d{1,2}/g`, `YYYY.MM.DD`) → `text-slate-400`

### 4.3 ClassificationBadges 컴포넌트

```typescript
// Intent 뱃지 색상 맵
const INTENT_CONFIG: Record<SalesIntent, { label: string; color: string }> = {
  new_business:      { label: '신규영업',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  contract_renewal:  { label: '계약갱신',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  cross_sell:        { label: '크로스셀',  color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  upsell:            { label: '업셀',     color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  issue_resolution:  { label: '이슈해결',  color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  relationship:      { label: '관계유지',  color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  info_gathering:    { label: '정보수집',  color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  negotiation:       { label: '협상',     color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  delivery:          { label: '납품/구축', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  billing_payment:   { label: '빌링/정산', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
}

// Stage 뱃지 (퍼널 순서대로 점진적 진한 색)
const STAGE_CONFIG: Record<SalesStage, { label: string; step: number }> = {
  prospecting:    { label: '탐색',   step: 1 },
  needs_analysis: { label: '니즈파악', step: 2 },
  proposal:       { label: '제안',   step: 3 },
  negotiation:    { label: '협상',   step: 4 },
  contracting:    { label: '계약',   step: 5 },
  implementation: { label: '납품',   step: 6 },
  post_care:      { label: '사후관리', step: 7 },
}
```

### 4.4 ClassificationEditor 컴포넌트

활동 상세 Sheet 내에서 AI 분류를 수동 수정하는 인라인 에디터:

```
┌─ 분류 수정 모드 ─────────────────────────────────┐
│ 영업 목적: [▼ 계약갱신  ]  영업 단계: [▼ 협상    ] │
│ 감성:     [▼ 중립      ]                          │
│ 상품:     [원장서비스 ×] [투자정보계 ×] [+ 추가]   │
│                                                   │
│                         [취소]  [저장]             │
└───────────────────────────────────────────────────┘
```

- Select 드롭다운: shadcn/ui Select 재사용
- 상품 태그: 입력 + autocomplete (기존 products 테이블 참조)
- 저장 시 `PATCH /api/activities/[id]/classify` 호출

### 4.5 활동 목록 페이지 개선

**현재** `src/app/(dashboard)/activities/page.tsx` 변경사항:

1. **필터 바 확장**: method 필터 + intent 필터 + stage 필터 추가
2. **ActivityCard 분리**: 카드 내에 intent/stage 뱃지 표시, 클릭 시 Sheet 오픈
3. **검색 추가**: rawContent 텍스트 검색 입력

```
┌──────────────────────────────────────────────────────┐
│ 영업 활동                                            │
│ 활동을 기록하면 AI가 자동으로 분류하고 인사이트를 도출합니다 │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 수단: [전체] [전화] [이메일] [방문] [미팅] [계약] ...  │
│ 목적: [전체] [신규영업] [계약갱신] [크로스셀] [업셀] ...│
│ 🔍 검색: [____________________]                      │
│                                                      │
│ ┌─ 폼 (col-2) ─┐  ┌─ 목록 (col-3) ──────────────┐  │
│ │               │  │                              │  │
│ │  ActivityForm │  │ [계약갱신][협상] 중국은행 재.. │  │
│ │  (기존 유지)  │  │ [크로스셀][계약] IBK 부산은.. │  │
│ │               │  │ [업셀][니즈파악] IBK 회선증.. │  │
│ │               │  │                              │  │
│ └───────────────┘  └──────────────────────────────┘  │
│                                                      │
│                    ← 카드 클릭 시 Sheet 오픈 →       │
└──────────────────────────────────────────────────────┘
```

---

## 5. 인사이트 시각화 설계

### 5.1 인텔리전스 페이지 개편

**파일**: `src/app/(dashboard)/intelligence/page.tsx`

기존 3개 차트(유형별 현황, 월별 추이, 고객사별 빈도)에 V2 인사이트 추가:

```
┌──────────────────────────────────────────────────────┐
│ 인텔리전스                                           │
│ AI 기반 영업 인사이트와 전략적 분석                      │
├──────────────────────────────────────────────────────┤
│                                                      │
│ 기간: [30일 ▼]    [새로고침]                          │
│                                                      │
│ ── AI 추천 고객 (기존 유지) ──────────────────────── │
│ │ 1. IBK투자증권 │ 2. 중국은행   │ 3. IPS외국환 │     │
│                                                      │
│ ── 영업 목적 분포 ──────── ── 감성 분포 ────────── │
│ │     [도넛 차트]       │  │  [도넛 차트]        │   │
│ │  신규 25%  갱신 35%   │  │  긍정 40%          │   │
│ │  크로스셀 20% 기타20% │  │  중립 45%  부정15%  │   │
│ └───────────────────────┘  └─────────────────────┘   │
│                                                      │
│ ── 영업 퍼널 ────────────────────────────────────── │
│ │  탐색(42) → 니즈(38) → 제안(25) → 협상(18) →     │
│ │  계약(12) → 납품(8) → 사후(15)                    │
│ │  [수평 퍼널 바 차트 — 단계별 활동 수]               │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ── 고객사 × 영업목적 히트맵 ─────────────────────── │
│ │         신규 갱신 크로스 업셀 이슈 관계            │
│ │ IBK      ■    □    ■     ■    □    □             │
│ │ 중국은행  □    ■    □     □    □    ■             │
│ │ IPS      ■    ■    □     □    ■    □             │
│ │ (색상 진하기 = 활동 빈도)                         │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ ── 상품별 트렌드 (6개월) ─ ── 리스크 신호 ────────  │
│ │ [스택 에어리어 차트]   │  │ ⚠ 할인 요구 (3건)  │  │
│ │ 원장 ██████████████   │  │   IBK, 중국은행     │  │
│ │ 회선 ████████         │  │ ⚠ 경쟁사 언급 (1건) │  │
│ │ 투자 █████            │  │   IPS외국환         │  │
│ └───────────────────────┘  └─────────────────────┘   │
│                                                      │
│ ── 매출 예측 (기존 유지) ────────────────────────── │
└──────────────────────────────────────────────────────┘
```

### 5.2 차트 구현 스펙

| 차트 | Recharts 컴포넌트 | 데이터 소스 |
|------|-------------------|------------|
| 영업 목적 분포 | `PieChart` + `Pie` + `Cell` | `intentDistribution` |
| 감성 분포 | `PieChart` (inner donut) | `sentimentDistribution` |
| 영업 퍼널 | `BarChart` (horizontal) | `stageFunnel` |
| 고객사×목적 히트맵 | Custom SVG (Recharts 미지원) | `orgIntentMatrix` |
| 상품별 트렌드 | `AreaChart` + `Area` (stacked) | `productTrend` |
| 리스크 신호 | Plain list (차트 아님) | `riskSummary` |

### 5.3 히트맵 커스텀 구현

Recharts에 히트맵이 없으므로 CSS Grid + 색상 계산으로 구현:

```typescript
// 색상 강도 계산
function getHeatColor(value: number, max: number): string {
  const intensity = max > 0 ? value / max : 0
  if (intensity === 0) return 'bg-white/[0.02]'
  if (intensity < 0.25) return 'bg-amber-500/10'
  if (intensity < 0.5) return 'bg-amber-500/20'
  if (intensity < 0.75) return 'bg-amber-500/40'
  return 'bg-amber-500/60'
}
```

---

## 6. 배치 재분류 설계

### 6.1 처리 흐름

```
사용자 → [재분류 시작] 버튼
  ↓
POST /api/activities/reclassify { scope: 'v1_only' }
  ↓
서버: V1 데이터 조회 (parsedContent에 intent 없는 건)
  ↓
for each batch (20건):
  - GPT-4o-mini로 V2 분류
  - parsedContent 업데이트
  - 1초 대기 (rate limit)
  ↓
완료 시 응답 반환
```

### 6.2 UI: 설정 페이지 내 재분류 패널

```
┌─ 데이터 재분류 ───────────────────────────────┐
│                                              │
│ V1 데이터 (의미 분류 미적용): 589건            │
│ V2 데이터 (의미 분류 완료):   0건              │
│                                              │
│ 예상 소요: ~30분 (GPT-4o-mini)               │
│ 예상 비용: ~$2.5                              │
│                                              │
│ [미리보기 (5건)]  [전체 재분류 시작]           │
│                                              │
│ ── 진행률 ────────────────────────           │
│ ████████░░░░░░░░░░░░░ 42% (248/589)         │
│ 성공: 245  |  실패: 3  |  남은시간: ~17분     │
└──────────────────────────────────────────────┘
```

---

## 7. 구현 순서 (Implementation Order)

### Phase A: 기반 + 원문 조회 (1차)

| # | 작업 | 파일 | 의존성 |
|---|------|------|--------|
| A-1 | V2 타입 정의 | `src/lib/pipeline/types.ts` (신규) | 없음 |
| A-2 | V1/V2 호환 유틸 | `src/lib/pipeline/parse-content.ts` (신규) | A-1 |
| A-3 | shadcn/ui Sheet 설치 | `src/components/ui/sheet.tsx` | 없음 |
| A-4 | ActivityDetailSheet | `src/features/activities/components/ActivityDetailSheet.tsx` (신규) | A-2, A-3 |
| A-5 | ActivityCard 분리 | `src/features/activities/components/ActivityCard.tsx` (신규) | A-4 |
| A-6 | 활동 목록 페이지 리팩터 | `src/app/(dashboard)/activities/page.tsx` (수정) | A-5 |

### Phase B: 의미 분류 (2차)

| # | 작업 | 파일 | 의존성 |
|---|------|------|--------|
| B-1 | V2 프롬프트 적용 | `src/lib/pipeline/classify.ts` (수정) | A-1 |
| B-2 | 수동 분류 수정 API | `src/app/api/activities/[id]/classify/route.ts` (신규) | A-1 |
| B-3 | ClassificationBadges | `src/features/activities/components/ClassificationBadges.tsx` (신규) | A-1 |
| B-4 | ClassificationEditor | `src/features/activities/components/ClassificationEditor.tsx` (신규) | B-2, B-3 |
| B-5 | ActivityForm V2 결과 표시 | `src/features/activities/components/ActivityForm.tsx` (수정) | B-3 |
| B-6 | ActivityDetailSheet에 에디터 통합 | A-4 수정 | B-4 |
| B-7 | GET /api/activities 필터 확장 | `src/app/api/activities/route.ts` (수정) | A-1 |
| B-8 | 활동 목록 필터 UI 확장 | A-6 수정 | B-7 |

### Phase C: 배치 재분류 + 인사이트 (3차)

| # | 작업 | 파일 | 의존성 |
|---|------|------|--------|
| C-1 | 배치 재분류 API | `src/app/api/activities/reclassify/route.ts` (신규) | B-1 |
| C-2 | ReclassifyPanel UI | `src/features/activities/components/ReclassifyPanel.tsx` (신규) | C-1 |
| C-3 | 인사이트 집계 API | `src/app/api/intelligence/insights/route.ts` (신규) | A-1 |
| C-4 | IntentDonut | `src/features/insights/components/IntentDonut.tsx` (신규) | C-3 |
| C-5 | SalesFunnel | `src/features/insights/components/SalesFunnel.tsx` (신규) | C-3 |
| C-6 | OrgIntentHeatmap | `src/features/insights/components/OrgIntentHeatmap.tsx` (신규) | C-3 |
| C-7 | ProductTrend | `src/features/insights/components/ProductTrend.tsx` (신규) | C-3 |
| C-8 | RiskAlerts | `src/features/insights/components/RiskAlerts.tsx` (신규) | C-3 |
| C-9 | SentimentGauge | `src/features/insights/components/SentimentGauge.tsx` (신규) | C-3 |
| C-10 | 인텔리전스 페이지 통합 | `src/app/(dashboard)/intelligence/page.tsx` (수정) | C-4~C-9 |

---

## 8. 신규/수정 파일 요약

### 신규 파일 (16개)

| 파일 | 목적 |
|------|------|
| `src/lib/pipeline/types.ts` | V2 타입 정의 |
| `src/lib/pipeline/parse-content.ts` | V1/V2 호환 유틸 |
| `src/components/ui/sheet.tsx` | shadcn/ui Sheet (설치) |
| `src/features/activities/components/ActivityDetailSheet.tsx` | 원문 상세 뷰 |
| `src/features/activities/components/ActivityCard.tsx` | 활동 카드 |
| `src/features/activities/components/ActivityList.tsx` | 목록 컴포넌트 |
| `src/features/activities/components/ClassificationBadges.tsx` | 분류 뱃지 |
| `src/features/activities/components/ClassificationEditor.tsx` | 수동 분류 수정 |
| `src/features/activities/components/ReclassifyPanel.tsx` | 배치 재분류 UI |
| `src/features/activities/hooks/useActivities.ts` | React Query 훅 |
| `src/app/api/activities/[id]/classify/route.ts` | 수동 분류 API |
| `src/app/api/activities/reclassify/route.ts` | 배치 재분류 API |
| `src/app/api/intelligence/insights/route.ts` | 인사이트 집계 API |
| `src/features/insights/components/IntentDonut.tsx` | 도넛 차트 |
| `src/features/insights/components/SalesFunnel.tsx` | 퍼널 차트 |
| `src/features/insights/components/OrgIntentHeatmap.tsx` | 히트맵 |
| `src/features/insights/components/ProductTrend.tsx` | 트렌드 차트 |
| `src/features/insights/components/RiskAlerts.tsx` | 리스크 알림 |
| `src/features/insights/components/SentimentGauge.tsx` | 감성 게이지 |
| `src/features/insights/hooks/useInsights.ts` | 인사이트 훅 |

### 수정 파일 (4개)

| 파일 | 변경 내용 |
|------|----------|
| `src/lib/pipeline/classify.ts` | V2 프롬프트 + GPT-4o 전환 |
| `src/app/api/activities/route.ts` | GET 필터 확장 (intent, stage, product, search) |
| `src/features/activities/components/ActivityForm.tsx` | V2 분류 결과 표시 |
| `src/app/(dashboard)/activities/page.tsx` | ActivityCard/Sheet 연동, 필터 확장 |
| `src/app/(dashboard)/intelligence/page.tsx` | V2 인사이트 차트 통합 |
