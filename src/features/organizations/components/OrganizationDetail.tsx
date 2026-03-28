'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Building2, Users, FileText, StickyNote, Clock, Phone, Mail, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ORG_SIZES } from '@/lib/constants'
import { formatDate, formatRelativeTime } from '@/lib/utils/format'
import type { Organization, Contact, Activity } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'

interface OrganizationDetailProps {
  organization: Organization
  contacts: Contact[]
}

const tabs = [
  { key: 'overview', label: '개요', icon: Building2 },
  { key: 'timeline', label: '활동 타임라인', icon: Clock },
  { key: 'contacts', label: '담당자', icon: Users },
  { key: 'notes', label: '메모', icon: StickyNote },
] as const

const TYPE_ICONS: Record<string, typeof Phone> = {
  call: Phone, email: Mail, visit: MapPin, meeting: Users,
  contract: FileText, other: Clock,
}

export function OrganizationDetail({ organization, contacts }: OrganizationDetailProps) {
  const [activeTab, setActiveTab] = useState<string>('overview')

  const { data: timelineActivities = [] } = useQuery<Activity[]>({
    queryKey: ['activities', 'org', organization.id],
    queryFn: async () => {
      const res = await fetch(`/api/activities?organizationId=${organization.id}&limit=50`)
      const json: ApiResponse<Activity[]> = await res.json()
      return json.data ?? []
    },
    enabled: activeTab === 'timeline',
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
              <Building2 className="h-7 w-7 text-blue-400" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-white">{organization.name}</h1>
              <div className="mt-1 flex items-center gap-2">
                {organization.industry && <span className="text-[13px] text-slate-400">{organization.industry}</span>}
                {organization.size && (
                  <Badge variant="outline" className="border-white/[0.08] text-[10px] text-slate-500">
                    {ORG_SIZES[organization.size as keyof typeof ORG_SIZES]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/[0.04] bg-white/[0.02] p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all ${isActive ? 'bg-white/[0.06] text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}>
              <Icon className="h-4 w-4" strokeWidth={1.8} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="glass-card rounded-2xl p-6">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <InfoRow label="등록일" value={formatDate(organization.createdAt)} />
            {organization.website && <InfoRow label="웹사이트" value={organization.website} />}
            <InfoRow label="담당자 수" value={`${contacts.length}명`} />
          </div>
        )}
        {activeTab === 'contacts' && (
          <div className="space-y-2">
            {contacts.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-slate-500">등록된 담당자가 없습니다.</p>
            ) : (
              contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between rounded-xl border border-white/[0.03] bg-white/[0.02] px-4 py-3">
                  <div>
                    <p className="text-[13px] font-medium text-slate-200">{contact.name}</p>
                    {contact.title && <p className="text-[11px] text-slate-500">{contact.title}</p>}
                  </div>
                  <div className="text-right">
                    {contact.email && <p className="text-[11px] text-slate-500">{contact.email}</p>}
                    {contact.phone && <p className="text-[11px] text-slate-600">{contact.phone}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {activeTab === 'timeline' && (
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {timelineActivities.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-slate-500">이 고객사의 활동 기록이 없습니다.</p>
            ) : (
              timelineActivities.map((activity) => {
                const Icon = TYPE_ICONS[activity.type || 'other'] || Clock
                const parsed = activity.parsedContent as Record<string, unknown> | null
                return (
                  <div key={activity.id} className="flex gap-3 rounded-xl border border-white/[0.03] bg-white/[0.02] p-3">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                      <Icon className="h-3.5 w-3.5 text-slate-500" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] text-slate-500">{formatRelativeTime(activity.activityDate)}</span>
                        {activity.aiClassified && <span className="text-[9px] text-amber-500/50">AI</span>}
                      </div>
                      <p className="text-[12px] text-slate-300 line-clamp-3">
                        {(parsed?.summary as string) || activity.rawContent.slice(0, 200)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
        {activeTab === 'notes' && (
          <div className="whitespace-pre-wrap text-[13px] text-slate-300">
            {organization.notes || '메모가 없습니다.'}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-white/[0.03] py-2 last:border-0">
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="text-[13px] text-slate-200">{value}</span>
    </div>
  )
}
