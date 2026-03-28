export type { Organization, NewOrganization, Contact } from '@/lib/db/schema'

export interface OrganizationWithContacts {
  id: string
  name: string
  industry: string | null
  size: string | null
  website: string | null
  notes: string | null
  createdAt: Date
  contacts: { id: string; name: string; title: string | null; email: string | null }[]
}
