import { z } from 'zod'

export const createProposalSchema = z.object({
  organizationId: z.string().uuid('고객사를 선택해주세요'),
  productIds: z.array(z.string().uuid()).min(1, '상품을 하나 이상 선택해주세요'),
  proposalType: z.enum(['new', 'renewal', 'expansion']),
  context: z.string().max(2000, '2000자 이내로 입력해주세요').optional(),
})

export const createEmailSchema = z.object({
  organizationId: z.string().uuid('고객사를 선택해주세요'),
  recipientName: z.string().min(1, '수신자 이름을 입력해주세요'),
  recipientTitle: z.string().optional(),
  purpose: z.enum(['introduction', 'followup', 'thankyou', 'meeting-request']),
  context: z.string().max(2000).optional(),
})

export const createReportSchema = z.object({
  reportType: z.enum(['weekly', 'monthly']),
  startDate: z.string().min(1, '시작일을 선택해주세요'),
  endDate: z.string().min(1, '종료일을 선택해주세요'),
})

export type CreateProposalInput = z.infer<typeof createProposalSchema>
export type CreateEmailInput = z.infer<typeof createEmailSchema>
export type CreateReportInput = z.infer<typeof createReportSchema>
