import { SYSTEM_PROMPT, PROPOSAL_PROMPT, EMAIL_PROMPT } from './prompts/system'
import type { Product, Organization } from '@/lib/db/schema'

export function buildProposalMessages(
  organization: Organization,
  products: Product[],
  proposalType: string,
  context?: string,
) {
  const productList = products
    .map((p) => `- ${p.name}: ${p.description || ''}`)
    .join('\n')

  const userPrompt = `다음 정보를 기반으로 제안서를 작성해주세요.

고객사: ${organization.name}
업종: ${organization.industry || '미지정'}
규모: ${organization.size || '미지정'}
제안 유형: ${proposalType}

제안 상품:
${productList}

${context ? `추가 맥락:\n${context}` : ''}

위 정보를 바탕으로 구조화된 제안서를 작성해주세요.`

  return [
    { role: 'system' as const, content: `${SYSTEM_PROMPT}\n\n${PROPOSAL_PROMPT}` },
    { role: 'user' as const, content: userPrompt },
  ]
}

export function buildEmailMessages(
  organization: Organization,
  recipientName: string,
  recipientTitle: string | undefined,
  purpose: string,
  context?: string,
) {
  const purposeLabels: Record<string, string> = {
    introduction: '첫 인사/소개',
    followup: '미팅 후속조치',
    thankyou: '감사 인사',
    'meeting-request': '미팅 요청',
  }

  const userPrompt = `다음 정보를 기반으로 이메일을 작성해주세요.

수신자: ${recipientName}${recipientTitle ? ` (${recipientTitle})` : ''}
고객사: ${organization.name}
이메일 목적: ${purposeLabels[purpose] || purpose}

${context ? `추가 맥락:\n${context}` : ''}

위 정보를 바탕으로 비즈니스 이메일을 작성해주세요. 제목과 본문을 모두 포함해주세요.`

  return [
    { role: 'system' as const, content: `${SYSTEM_PROMPT}\n\n${EMAIL_PROMPT}` },
    { role: 'user' as const, content: userPrompt },
  ]
}

export function buildReportMessages(
  reportType: string,
  startDate: string,
  endDate: string,
) {
  const userPrompt = `다음 기간의 ${reportType === 'weekly' ? '주간' : '월간'} 영업 활동 보고서를 작성해주세요.

기간: ${startDate} ~ ${endDate}

참고: 현재 실제 활동 데이터가 없으므로, 보고서 양식과 구조를 포함한 템플릿을 생성해주세요.
각 섹션에 [데이터 입력 필요]로 표시해주세요.`

  return [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: userPrompt },
  ]
}
