# Plan: 영업활동 인사이트 v2

> 영업활동 원문 조회 + 의미 기반 AI 재분류 + 전략적 인사이트 시각화

## 1. Problem Statement (현재 문제)

### 1.1 원문(rawContent) 접근 불가
- 활동 목록에서 AI 요약(summary)만 표시, **원문 텍스트를 볼 수 없음**
- 실제 데이터는 매우 풍부함 (계약 상세, 금액 breakdown, 배경 설명 포함)
- 예: 중국은행 재계약 건은 원장서비스/투자정보계/백업서비스별 금액까지 포함된 상세 내용이지만, AI 요약으로 압축되면서 핵심 디테일 손실

### 1.2 분류 체계가 피상적 ("수단" vs "목적")
현재 8개 카테고리는 **커뮤니케이션 수단**을 분류할 뿐:
```
call(전화) | email(이메일) | visit(방문) | meeting(미팅)
contract(계약) | billing(빌링) | inspection(검수) | other(기타)
```

실제 영업 활동의 **비즈니스 의미**를 담지 못함:
- "IBK 강용원 이사 통화 → 부산은행 채권매도대행 회선비용 0.06억/년, 차주 계약 진행"
  - 현재: `call` (전화) ← **방법**만 분류
  - 필요: `계약추진` + `크로스셀` + `회선서비스` ← **영업 목적, 전략, 상품**을 분류

### 1.3 인사이트 부재
- 인텔리전스 페이지: 단순 건수 집계(유형별, 월별, 고객사별)만 제공
- **영업 전략적 질문에 답하지 못함:**
  - "이번 달 신규 수주 vs 기존 유지 활동 비율은?"
  - "계약 갱신 시즌인 고객사가 어디인가?"
  - "크로스셀 기회가 가장 높은 고객은?"
  - "활동 대비 계약 전환율이 높은 영업 패턴은?"

## 2. Solution Overview

### 2.1 다차원 의미 분류 체계 (Semantic Classification)

현재 단일 `type` 필드를 **4개 차원의 의미 분류**로 확장:

| 차원 | 설명 | 예시 값 |
|------|------|---------|
| **method** (수단) | 기존 type과 동일, 커뮤니케이션 방법 | call, email, visit, meeting |
| **intent** (영업 목적) | 이 활동의 비즈니스 목적 | 신규영업, 계약갱신, 관계유지, 이슈해결, 크로스셀, 업셀, 정보수집 |
| **stage** (영업 단계) | 세일즈 퍼널 상 위치 | 탐색, 니즈파악, 제안, 협상, 계약, 납품, 사후관리 |
| **product** (관련 상품) | PowerBase 상품/서비스 카테고리 | 원장서비스, 투자정보계, 전송서비스, 백업서비스, 시세정보, 회선 |

**분류 예시:**
```
원문: "중국은행 재계약 — 원장서비스 1.85억, 투자정보계 0.36억..."
→ method: meeting
→ intent: 계약갱신
→ stage: 협상
→ products: [원장서비스, 투자정보계, 백업서비스, 전송서비스]

원문: "IBK 부산은행 채권매도대행 회선비용 0.06억/년, 차주 계약 진행"
→ method: call
→ intent: 크로스셀
→ stage: 계약
→ products: [회선서비스]
```

### 2.2 원문 조회 + 상세 뷰

- 활동 카드 클릭 → 슬라이드오버(Sheet) 패널로 **원문 전체** 표시
- 원문 + AI 분석 결과를 나란히 보여줌
- AI 분류 결과 수동 수정 기능 (드롭다운으로 intent/stage 변경)

### 2.3 전략적 인사이트 대시보드

단순 건수 집계 → **의사결정 지원 시각화**로 전환:

| 시각화 | 인사이트 질문 | 차트 유형 |
|--------|-------------|----------|
| **영업 목적 분포** | 신규 vs 유지 vs 이슈 비율 | 도넛 차트 |
| **영업 퍼널 흐름** | 각 단계별 활동 수, 병목 지점 | 퍼널/산키 다이어그램 |
| **고객사 × 목적 히트맵** | 어떤 고객에 어떤 활동을 집중하는가 | 히트맵 |
| **상품별 활동 트렌드** | 상품별 영업 모멘텀 변화 | 스택 에어리어 차트 |
| **계약 갱신 캘린더** | 곧 만료되는 계약의 갱신 활동 현황 | 타임라인 |
| **활동→계약 전환 분석** | 영업 패턴별 성공률 | 퍼널 + 전환율 |

## 3. Scope Definition

### 3.1 In Scope (이번 PDCA 범위)

#### Phase A: 원문 조회 + 상세 뷰
- [ ] 활동 목록 카드에 원문 미리보기 토글 추가
- [ ] 활동 상세 Sheet 컴포넌트 (원문 + AI 분석 결과 병렬 표시)
- [ ] 원문 텍스트 하이라이팅 (금액, 고객사명, 날짜 자동 감지)

#### Phase B: 의미 분류 체계 개선
- [ ] DB 스키마 확장: `parsedContent` 내 intent, stage, products 필드 추가
- [ ] AI 분류 프롬프트 재설계 (4차원 분류)
- [ ] 기존 589건 데이터 재분류 마이그레이션 (배치 처리)
- [ ] 분류 결과 수동 수정 API + UI

#### Phase C: 인사이트 시각화
- [ ] 영업 목적 분포 도넛 차트
- [ ] 영업 퍼널 흐름 시각화
- [ ] 고객사 × 영업목적 히트맵
- [ ] 상품별 활동 트렌드 차트
- [ ] AI 기반 주간 영업 패턴 요약 (GPT-4o)

### 3.2 Out of Scope
- 음성 입력 (voice source)
- 실시간 알림/푸시
- 모바일 UI 최적화
- 외부 CRM 연동

## 4. Technical Approach

### 4.1 스키마 변경
`parsedContent` JSONB 필드의 구조 확장 (기존 호환 유지):
```typescript
interface ParsedContentV2 {
  // 기존 필드 유지
  type: string
  summary: string
  keywords: string[]
  amounts: Amount[]
  followUps: FollowUp[]
  organizationMention: string | null
  contactMention: string | null
  confidence: number

  // V2 신규 필드
  intent: Intent           // 영업 목적
  stage: SalesStage        // 영업 단계
  products: string[]       // 관련 상품 목록
  sentiment: 'positive' | 'neutral' | 'negative'  // 영업 진행 감성
  riskFlags: string[]      // 리스크 신호 ("할인 요구", "경쟁사 언급", "결정 지연")
}
```

### 4.2 AI 분류 프롬프트 재설계
- GPT-4o-mini → **GPT-4o** 로 업그레이드 (복잡한 의미 분류에 더 높은 정확도 필요)
- 코스콤 PowerBase 도메인 지식을 프롬프트에 포함
- Few-shot 예제: 실제 데이터 5~10건을 골든 셋으로 포함
- 분류 결과에 `reasoning` 필드 추가 (AI가 왜 그렇게 분류했는지 설명)

### 4.3 기존 데이터 마이그레이션
- `/api/activities/reclassify` 배치 API 생성
- 기존 589건을 새 프롬프트로 재분류
- rate limiting 적용 (분당 20건)
- 진행률 표시 UI

### 4.4 인사이트 API 설계
```
GET /api/intelligence/insights
  ?period=30d|90d|6m|1y
  &dimension=intent|stage|product
  &groupBy=organization|month|week
```

### 4.5 시각화 컴포넌트
- Recharts 기반 (이미 프로젝트에 포함)
- 반응형 대시보드 그리드
- 드릴다운: 차트 영역 클릭 → 해당 활동 목록으로 필터링

## 5. User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-01 | 영업직원으로서, 활동 원문을 클릭해서 전체 내용을 볼 수 있다 | **Must** |
| US-02 | 영업직원으로서, AI가 활동의 영업 목적(intent)을 자동 분류해준다 | **Must** |
| US-03 | 영업직원으로서, AI 분류가 틀렸을 때 수동으로 수정할 수 있다 | **Must** |
| US-04 | 영업관리자로서, 팀의 신규영업 vs 유지 활동 비율을 한눈에 본다 | **Must** |
| US-05 | 영업직원으로서, 영업 퍼널별 활동 분포를 시각적으로 확인한다 | **Should** |
| US-06 | 영업관리자로서, 고객사별 어떤 종류의 영업을 하는지 히트맵으로 본다 | **Should** |
| US-07 | 영업직원으로서, 상품별 영업 트렌드를 시계열로 본다 | **Should** |
| US-08 | 영업직원으로서, AI가 리스크 신호(할인 요구, 결정 지연 등)를 감지해준다 | **Nice** |
| US-09 | 영업관리자로서, AI가 주간 영업 패턴 요약을 자동 생성해준다 | **Nice** |

## 6. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| GPT-4o 비용 증가 (분류 모델 업그레이드) | 중 | 신규 활동만 GPT-4o, 배치 재분류는 야간 실행 |
| 589건 재분류 시 API rate limit | 중 | 배치 처리 + 분당 20건 제한 + 진행률 표시 |
| intent/stage 분류 정확도 | 고 | Few-shot 골든셋 + 사용자 수정 피드백 루프 |
| 기존 parsedContent 호환성 | 저 | V2 필드를 optional로 추가, 기존 코드 영향 없음 |

## 7. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| 원문 접근성 | 불가 | 1클릭으로 전문 조회 |
| 분류 차원 | 1개 (method) | 4개 (method + intent + stage + product) |
| AI 분류 만족도 | 낮음 (단순 수단 분류) | 의미 있는 비즈니스 분류 |
| 인사이트 차트 수 | 3개 (건수 집계) | 6개+ (전략적 시각화) |
| 영업 전략 질문 답변 가능 여부 | 불가 | 가능 (신규 vs 유지, 퍼널 병목, 상품 트렌드) |

## 8. Implementation Order

```
Phase A (1차) ─ 원문 조회
  ├── ActivityDetailSheet 컴포넌트
  ├── 활동 목록에 클릭 이벤트 연결
  └── 원문 텍스트 하이라이팅

Phase B (2차) ─ 의미 분류
  ├── ParsedContentV2 타입 정의
  ├── classify.ts 프롬프트 재설계
  ├── 분류 결과 수정 API
  ├── 기존 데이터 재분류 배치
  └── 활동 목록/상세에 새 분류 태그 표시

Phase C (3차) ─ 인사이트 시각화
  ├── /api/intelligence/insights 엔드포인트
  ├── IntentDistribution 도넛 차트
  ├── SalesFunnel 퍼널 시각화
  ├── OrgIntentHeatmap 히트맵
  ├── ProductTrend 스택 차트
  └── AI 주간 패턴 요약
```
