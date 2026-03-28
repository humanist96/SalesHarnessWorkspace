import { openai, AI_MODELS } from '@/lib/openai/client'

export interface ClassificationResult {
  type: 'call' | 'email' | 'visit' | 'meeting' | 'contract' | 'billing' | 'inspection' | 'other'
  summary: string
  keywords: string[]
  amounts: { value: number; unit: string; description: string }[]
  followUps: { action: string; dueDescription: string; priority: 'critical' | 'high' | 'medium' | 'low' }[]
  organizationMention: string | null
  contactMention: string | null
  confidence: number
}

const CLASSIFY_PROMPT = `당신은 코스콤 금융영업 활동을 분류하고 구조화하는 AI입니다.

영업직원이 입력한 자유형식 텍스트를 분석하여 다음 JSON 형식으로 반환하세요:

{
  "type": "call|email|visit|meeting|contract|billing|inspection|other",
  "summary": "1-2문장 요약",
  "keywords": ["핵심 키워드 3-5개"],
  "amounts": [{"value": 숫자(억 단위), "unit": "억/만/원", "description": "금액 설명"}],
  "followUps": [{"action": "후속조치 내용", "dueDescription": "차주/월말/즉시 등", "priority": "critical|high|medium|low"}],
  "organizationMention": "언급된 고객사명 또는 null",
  "contactMention": "언급된 담당자명 또는 null",
  "confidence": 0-100
}

분류 기준:
- call: 전화 통화
- email: 이메일 송수신
- visit: 고객사 방문
- meeting: 미팅/회의
- contract: 계약 관련 (계약서, 날인, 체결 등)
- billing: 빌링/비용/회선비용
- inspection: 검수/테스트/UAT
- other: 기타

후속조치 추출 규칙:
- "예정", "진행", "필요", "확인", "요청" 등이 포함된 문장에서 추출
- "차주" -> high, "즉시" -> critical, "월말까지" -> medium
- 명확하지 않으면 추출하지 않음

금액 추출:
- "0.06억/년", "2.45억", "25,806,000원" 등 감지
- 억 단위로 통일하여 value에 기록

반드시 유효한 JSON만 반환하세요. 다른 텍스트 없이.`

export async function classifyActivity(rawContent: string): Promise<ClassificationResult> {
  try {
    const response = await openai.chat.completions.create({
      model: AI_MODELS.fast,
      messages: [
        { role: 'system', content: CLASSIFY_PROMPT },
        { role: 'user', content: rawContent },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1000,
    })

    const text = response.choices[0]?.message?.content
    if (!text) throw new Error('Empty response')

    return JSON.parse(text) as ClassificationResult
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
    }
  }
}
