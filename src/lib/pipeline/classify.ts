import { openai, AI_MODELS } from '@/lib/openai/client'
import type { ClassificationResultV2 } from './types'

// V1 호환 타입 (기존 코드에서 import하는 곳 대응)
export type ClassificationResult = ClassificationResultV2

const CLASSIFY_PROMPT_V2 = `당신은 코스콤 금융영업 활동을 다차원으로 분석하는 AI입니다.
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
   prospecting | needs_analysis | proposal | negotiation | contracting | implementation | post_care

4. products (관련 PowerBase 상품/서비스 — 텍스트에서 언급된 것만):
   원장서비스, 투자정보계, 백업서비스, 전송서비스, 시세정보, 회선서비스,
   채권매도대행, 장비유지보수, 시장조성, 파생상품, 외국환, FEP 등

5. sentiment (영업 진행 감성):
   - positive: 긍정적 (계약 체결, 승인, 금액 증가, 추가 발주)
   - neutral: 일상적 (정보 교환, 일정 조율, 확인)
   - negative: 부정적 (해지 검토, 할인 압박, 경쟁사 전환, 적자)

6. riskFlags (리스크 신호 — 해당 시만):
   할인 요구, 경쟁사 언급, 결정 지연, 담당자 변경, 예산 축소,
   해지 검토, 내부규정 변경, 적자 발생, 시스템 장애

=== JSON 형식 ===
{
  "type": "...",
  "intent": "...",
  "stage": "...",
  "products": ["상품1"],
  "sentiment": "positive|neutral|negative",
  "riskFlags": ["리스크1"],
  "summary": "1-2문장 요약",
  "keywords": ["핵심 키워드 3-5개"],
  "amounts": [{"value": 숫자(억 단위), "unit": "억/만/원", "description": "금액 설명"}],
  "followUps": [{"action": "후속조치", "dueDescription": "차주/월말/즉시", "priority": "critical|high|medium|low"}],
  "organizationMention": "고객사명 또는 null",
  "contactMention": "담당자명 또는 null",
  "confidence": 0-100,
  "reasoning": "이렇게 분류한 이유 1-2문장"
}

=== 분류 예시 ===

입력: "중국은행 재계약 (허지은) - 내부규정(6년이상 동일계약 유지 불가)에 따른 재계약 추진. 원장서비스 1.85억, 투자정보계 0.36억"
→ intent: "contract_renewal", stage: "negotiation", products: ["원장서비스", "투자정보계"], sentiment: "neutral", riskFlags: ["내부규정 변경"]

입력: "IBK 강용원 이사 통화, 부산은행 채권매도대행 회선비용 0.06억/년, 차주 계약 진행 예정"
→ intent: "cross_sell", stage: "contracting", products: ["채권매도대행", "회선서비스"], sentiment: "positive", riskFlags: []

입력: "지점 회선증속 논의, 현재 512K → 1024K 업그레이드 검토"
→ intent: "upsell", stage: "needs_analysis", products: ["회선서비스"], sentiment: "positive", riskFlags: []

후속조치 추출: "예정", "진행", "필요", "확인", "요청" 등이 포함된 문장에서 추출.
"차주" → high, "즉시" → critical, "월말까지" → medium

금액 추출: "0.06억/년", "2.45억", "25,806,000원" 등 감지. 억 단위로 통일.

반드시 유효한 JSON만 반환하세요. 다른 텍스트 없이.`

export async function classifyActivity(rawContent: string): Promise<ClassificationResultV2> {
  try {
    const response = await openai.chat.completions.create({
      model: AI_MODELS.quality,
      messages: [
        { role: 'system', content: CLASSIFY_PROMPT_V2 },
        { role: 'user', content: rawContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1500,
    })

    const text = response.choices[0]?.message?.content
    if (!text) throw new Error('Empty response')

    return JSON.parse(text) as ClassificationResultV2
  } catch {
    return {
      type: 'other',
      summary: rawContent.slice(0, 100),
      keywords: [],
      amounts: [],
      followUps: [],
      organizationMention: null,
      contactMention: null,
      confidence: 0,
      intent: 'relationship',
      stage: 'post_care',
      products: [],
      sentiment: 'neutral',
      riskFlags: [],
      reasoning: '분류 실패 — 수동 확인이 필요합니다.',
    }
  }
}

/** 배치 재분류용 (비용 절감) */
export async function classifyActivityBatch(rawContent: string): Promise<ClassificationResultV2> {
  try {
    const response = await openai.chat.completions.create({
      model: AI_MODELS.fast,
      messages: [
        { role: 'system', content: CLASSIFY_PROMPT_V2 },
        { role: 'user', content: rawContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1500,
    })

    const text = response.choices[0]?.message?.content
    if (!text) throw new Error('Empty response')

    return JSON.parse(text) as ClassificationResultV2
  } catch {
    return {
      type: 'other',
      summary: rawContent.slice(0, 100),
      keywords: [],
      amounts: [],
      followUps: [],
      organizationMention: null,
      contactMention: null,
      confidence: 0,
      intent: 'relationship',
      stage: 'post_care',
      products: [],
      sentiment: 'neutral',
      riskFlags: [],
      reasoning: '배치 분류 실패',
    }
  }
}
