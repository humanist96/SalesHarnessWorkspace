import type { DocumentType } from '@/lib/constants'

export interface ProposalFormData {
  organizationId: string
  productIds: string[]
  proposalType: 'new' | 'renewal' | 'expansion'
  context?: string
}

export interface EmailFormData {
  organizationId: string
  recipientName: string
  recipientTitle?: string
  purpose: 'introduction' | 'followup' | 'thankyou' | 'meeting-request'
  context?: string
}

export interface ReportFormData {
  reportType: 'weekly' | 'monthly'
  startDate: string
  endDate: string
}

export interface DocumentItem {
  id: string
  type: DocumentType
  title: string
  organizationName?: string
  ai_generated: boolean
  user_feedback: 'approved' | 'edited' | 'rejected' | null
  created_at: string
}

export interface GenerateRequest {
  type: DocumentType
  data: ProposalFormData | EmailFormData | ReportFormData
}
