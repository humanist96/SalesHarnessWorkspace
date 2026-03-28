'use client'

import Link from 'next/link'
import { Building2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ORG_SIZES } from '@/lib/constants'
import { formatRelativeTime } from '@/lib/utils/format'
import type { Organization } from '@/lib/db/schema'

interface OrganizationListProps {
  organizations: Organization[]
}

export function OrganizationList({ organizations }: OrganizationListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {organizations.map((org) => (
        <Link
          key={org.id}
          href={`/organizations/${org.id}`}
          className="glass-card group rounded-2xl p-5 transition-all duration-300"
        >
          <div className="mb-3 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Building2 className="h-5 w-5 text-blue-400" strokeWidth={1.8} />
            </div>
            {org.size && (
              <Badge variant="outline" className="border-white/[0.08] bg-white/[0.03] text-[10px] text-slate-400">
                {ORG_SIZES[org.size as keyof typeof ORG_SIZES] || org.size}
              </Badge>
            )}
          </div>
          <h3 className="text-[14px] font-semibold text-white group-hover:text-amber-400 transition-colors">
            {org.name}
          </h3>
          {org.industry && (
            <p className="mt-0.5 text-[12px] text-slate-500">{org.industry}</p>
          )}
          <p className="mt-2 text-[11px] text-slate-600">
            {formatRelativeTime(org.createdAt)}
          </p>
        </Link>
      ))}
    </div>
  )
}
