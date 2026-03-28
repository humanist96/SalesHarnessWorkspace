'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar, Plus, MapPin, Users, Clock, X } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import type { Meeting } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'

export default function MeetingsPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

  const { data: meetingList, isLoading } = useQuery<Meeting[]>({
    queryKey: ['meetings'],
    queryFn: async () => {
      const res = await fetch('/api/meetings')
      const json: ApiResponse<Meeting[]> = await res.json()
      return json.data ?? []
    },
  })

  const completeMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch('/api/meetings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meetings'] }),
  })

  const scheduled = meetingList?.filter((m) => m.status === 'scheduled') ?? []
  const completed = meetingList?.filter((m) => m.status === 'completed') ?? []

  return (
    <div>
      <PageHeader
        title="미팅"
        description="고객사 미팅 일정과 브리핑을 관리합니다."
        action={
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-[13px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20"
          >
            <Plus className="h-4 w-4" />
            미팅 추가
          </button>
        }
      />

      {showForm && (
        <MeetingForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false)
            queryClient.invalidateQueries({ queryKey: ['meetings'] })
          }}
        />
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
          ))}
        </div>
      ) : !meetingList || meetingList.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="등록된 미팅이 없습니다"
          description="미팅을 추가하면 AI가 브리핑 자료를 자동으로 준비해 드립니다."
        />
      ) : (
        <div className="space-y-6">
          {scheduled.length > 0 && (
            <div>
              <h2 className="mb-3 text-[14px] font-semibold text-slate-300">
                예정된 미팅 ({scheduled.length})
              </h2>
              <div className="space-y-2">
                {scheduled.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onComplete={() => completeMutation.mutate({ id: meeting.id, status: 'completed' })}
                  />
                ))}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <h2 className="mb-3 text-[14px] font-semibold text-slate-500">
                완료된 미팅 ({completed.length})
              </h2>
              <div className="space-y-2">
                {completed.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MeetingCard({
  meeting,
  onComplete,
}: {
  meeting: Meeting
  onComplete?: () => void
}) {
  const date = new Date(meeting.scheduledAt)
  const isPast = date < new Date()
  const attendees = meeting.attendees as { name: string; role?: string }[] | null

  return (
    <div className="glass-card group rounded-xl p-4 transition-all duration-200 hover:border-white/[0.08]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-semibold text-white">{meeting.title}</h3>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              meeting.status === 'completed'
                ? 'bg-emerald-500/10 text-emerald-400'
                : isPast
                  ? 'bg-rose-500/10 text-rose-400'
                  : 'bg-blue-500/10 text-blue-400'
            }`}>
              {meeting.status === 'completed' ? '완료' : isPast ? '지남' : '예정'}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-4 text-[12px] text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}{' '}
              {date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {meeting.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {meeting.location}
              </span>
            )}
            {attendees && attendees.length > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {attendees.map((a) => a.name).join(', ')}
              </span>
            )}
          </div>

          {meeting.agenda && (
            <p className="mt-2 text-[12px] text-slate-500 line-clamp-1">{meeting.agenda}</p>
          )}
        </div>

        {meeting.status === 'scheduled' && onComplete && (
          <button
            onClick={onComplete}
            className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:border-emerald-500/30 hover:text-emerald-400"
          >
            완료 처리
          </button>
        )}
      </div>
    </div>
  )
}

function MeetingForm({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [location, setLocation] = useState('')
  const [agenda, setAgenda] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !scheduledAt) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, scheduledAt, location, agenda }),
      })
      if (res.ok) onSuccess()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="glass-card mb-6 rounded-2xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-white">새 미팅 추가</h2>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-[12px] font-medium text-slate-400">제목 *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="미팅 제목"
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-white placeholder:text-slate-600 focus:border-amber-500/30 focus:outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-400">일시 *</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-white focus:border-amber-500/30 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-[12px] font-medium text-slate-400">장소</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="미팅 장소"
              className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-white placeholder:text-slate-600 focus:border-amber-500/30 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-medium text-slate-400">안건</label>
          <textarea
            value={agenda}
            onChange={(e) => setAgenda(e.target.value)}
            placeholder="논의할 안건을 입력하세요"
            rows={3}
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-[13px] text-white placeholder:text-slate-600 focus:border-amber-500/30 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-[13px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20 disabled:opacity-50"
        >
          {isSubmitting ? '저장 중...' : '미팅 추가'}
        </button>
      </form>
    </div>
  )
}
