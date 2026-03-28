'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import {
  Home,
  Building2,
  FileText,
  Calendar,
  BarChart3,
  Lightbulb,
  Settings,
  Sparkles,
  ContactRound,
  ClipboardList,
} from 'lucide-react'
import type { Reminder } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'

const navigation = [
  { name: '홈', href: '/', icon: Home, badgeKey: null },
  { name: '영업 활동', href: '/activities', icon: ClipboardList, badgeKey: 'activities' },
  { name: '고객사', href: '/organizations', icon: Building2, badgeKey: null },
  { name: '담당자 찾기', href: '/contacts', icon: ContactRound, badgeKey: null },
  { name: '문서', href: '/documents', icon: FileText, badgeKey: null },
  { name: '미팅', href: '/meetings', icon: Calendar, badgeKey: null },
  { name: '영업 현황', href: '/pipeline', icon: BarChart3, badgeKey: null },
  { name: '인텔리전스', href: '/intelligence', icon: Lightbulb, badgeKey: null },
]

export function Sidebar() {
  const pathname = usePathname()

  const { data: pendingReminders } = useQuery<Reminder[]>({
    queryKey: ['reminders', 'sidebar'],
    queryFn: async () => {
      const res = await fetch('/api/reminders')
      const json: ApiResponse<Reminder[]> = await res.json()
      return json.data ?? []
    },
    refetchInterval: 60_000,
  })

  const reminderCount = pendingReminders?.length ?? 0
  const overdueCount = pendingReminders?.filter((r) => r.status === 'overdue' || new Date(r.dueDate) < new Date()).length ?? 0

  return (
    <aside className="sidebar-gradient flex w-[260px] flex-col border-r border-white/[0.04]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20">
          <Sparkles className="h-5 w-5 text-amber-950" />
        </div>
        <div>
          <span className="text-[15px] font-bold tracking-tight text-white">
            SalesHarness
          </span>
          <span className="ml-1.5 inline-flex items-center rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-400">
            AI
          </span>
        </div>
      </div>

      {/* Separator */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-300 ${
                isActive
                  ? 'nav-item-active text-amber-200'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
              }`}
            >
              <Icon
                className={`h-[18px] w-[18px] transition-colors duration-300 ${
                  isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
                strokeWidth={1.8}
              />
              <span>{item.name}</span>

              {item.badgeKey === 'activities' && reminderCount > 0 && (
                <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                  overdueCount > 0
                    ? 'bg-rose-500/15 text-rose-400'
                    : 'bg-amber-500/15 text-amber-400'
                }`}>
                  {reminderCount}
                </span>
              )}

              {isActive && !item.badgeKey && (
                <div className="absolute right-3 h-1.5 w-1.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="p-3">
        {/* Quick action */}
        <Link href="/documents/new" className="mb-3 flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-amber-500/10 to-blue-500/10 px-3 py-2.5 text-[13px] font-medium text-amber-300 transition-all duration-300 hover:from-amber-500/15 hover:to-blue-500/15">
          <Sparkles className="h-4 w-4" strokeWidth={1.8} />
          <span>AI 제안서 만들기</span>
        </Link>

        {/* Settings */}
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium text-slate-500 transition-all duration-300 hover:bg-white/[0.04] hover:text-slate-300"
        >
          <Settings className="h-[18px] w-[18px]" strokeWidth={1.8} />
          <span>설정</span>
        </Link>

        {/* User */}
        <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-600 text-[11px] font-bold text-slate-200 ring-1 ring-white/10">
            K
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-[12px] font-medium text-slate-300">
              코스콤 영업팀
            </p>
            <p className="truncate text-[11px] text-slate-500">
              sales@koscom.co.kr
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
