import { z } from 'zod'

export const createOrganizationSchema = z.object({
  name: z.string().min(1, '회사명을 입력해주세요').max(100),
  industry: z.string().optional(),
  size: z.enum(['large', 'medium', 'small']).optional(),
  website: z.string().url('올바른 URL을 입력해주세요').optional().or(z.literal('')),
  notes: z.string().max(5000).optional(),
})

export const updateOrganizationSchema = createOrganizationSchema.partial()

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>
