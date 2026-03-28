export const DOCUMENT_TYPES = {
  proposal: '제안서',
  email: '이메일',
  report: '보고서',
  briefing: '브리핑',
} as const

export const PROPOSAL_TYPES = {
  new: '신규 제안',
  renewal: '갱신 제안',
  expansion: '확장 제안',
} as const

export const EMAIL_PURPOSES = {
  introduction: '소개',
  followup: '후속조치',
  thankyou: '감사',
  'meeting-request': '미팅 요청',
} as const

export const DEAL_STAGES = {
  discovery: '발굴',
  contact: '접촉',
  proposal: '제안',
  negotiation: '협상',
  closed_won: '계약 성사',
  closed_lost: '기회 소멸',
} as const

export const ORG_SIZES = {
  large: '대형',
  medium: '중형',
  small: '소형',
} as const

export const USER_ROLES = {
  admin: '관리자',
  manager: '팀장',
  sales: '영업직원',
} as const

export type DocumentType = keyof typeof DOCUMENT_TYPES
export type ProposalType = keyof typeof PROPOSAL_TYPES
export type EmailPurpose = keyof typeof EMAIL_PURPOSES
export type DealStage = keyof typeof DEAL_STAGES
