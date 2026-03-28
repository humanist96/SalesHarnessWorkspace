// === 영업 목적 (Intent) ===
export type SalesIntent =
  | 'new_business'      // 신규영업
  | 'contract_renewal'  // 계약갱신
  | 'cross_sell'        // 크로스셀
  | 'upsell'            // 업셀
  | 'issue_resolution'  // 이슈해결
  | 'relationship'      // 관계유지
  | 'info_gathering'    // 정보수집
  | 'negotiation'       // 협상
  | 'delivery'          // 납품/구축
  | 'billing_payment'   // 빌링/정산

// === 영업 단계 (Stage) ===
export type SalesStage =
  | 'prospecting'       // 탐색
  | 'needs_analysis'    // 니즈파악
  | 'proposal'          // 제안
  | 'negotiation'       // 협상
  | 'contracting'       // 계약
  | 'implementation'    // 납품
  | 'post_care'         // 사후관리

// === 감성 ===
export type ActivitySentiment = 'positive' | 'neutral' | 'negative'

// === V2 분류 결과 ===
export interface ClassificationResultV2 {
  // V1 호환
  type: 'call' | 'email' | 'visit' | 'meeting' | 'contract' | 'billing' | 'inspection' | 'other'
  summary: string
  keywords: string[]
  amounts: { value: number; unit: string; description: string }[]
  followUps: { action: string; dueDescription: string; priority: 'critical' | 'high' | 'medium' | 'low' }[]
  organizationMention: string | null
  contactMention: string | null
  confidence: number

  // V2 신규
  intent: SalesIntent
  stage: SalesStage
  products: string[]
  sentiment: ActivitySentiment
  riskFlags: string[]
  reasoning: string
}

// === UI 설정 ===
export const INTENT_CONFIG: Record<SalesIntent, { label: string; color: string }> = {
  new_business:     { label: '신규영업',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  contract_renewal: { label: '계약갱신',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  cross_sell:       { label: '크로스셀',  color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  upsell:           { label: '업셀',     color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  issue_resolution: { label: '이슈해결',  color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  relationship:     { label: '관계유지',  color: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  info_gathering:   { label: '정보수집',  color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
  negotiation:      { label: '협상',     color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  delivery:         { label: '납품/구축', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
  billing_payment:  { label: '빌링/정산', color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
}

export const STAGE_CONFIG: Record<SalesStage, { label: string; step: number }> = {
  prospecting:    { label: '탐색',   step: 1 },
  needs_analysis: { label: '니즈파악', step: 2 },
  proposal:       { label: '제안',   step: 3 },
  negotiation:    { label: '협상',   step: 4 },
  contracting:    { label: '계약',   step: 5 },
  implementation: { label: '납품',   step: 6 },
  post_care:      { label: '사후관리', step: 7 },
}

export const SENTIMENT_CONFIG: Record<ActivitySentiment, { label: string; color: string }> = {
  positive: { label: '긍정', color: 'text-emerald-400' },
  neutral:  { label: '중립', color: 'text-slate-400' },
  negative: { label: '부정', color: 'text-rose-400' },
}

export const ALL_INTENTS: SalesIntent[] = [
  'new_business', 'contract_renewal', 'cross_sell', 'upsell',
  'issue_resolution', 'relationship', 'info_gathering', 'negotiation',
  'delivery', 'billing_payment',
]

export const ALL_STAGES: SalesStage[] = [
  'prospecting', 'needs_analysis', 'proposal', 'negotiation',
  'contracting', 'implementation', 'post_care',
]
