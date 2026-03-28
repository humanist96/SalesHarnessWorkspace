'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import {
  TrendingUp,
  Users,
  FileText,
  Calendar,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  Clock,
  Target,
  Zap,
  Phone,
  Mail,
  MapPin,
  Handshake,
  FileCheck,
  ClipboardList,
  AlertCircle,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils/format'
import type { Activity, Reminder } from '@/lib/db/schema'
import type { ApiResponse } from '@/types/api'

interface DashboardData {
  stats: {
    totalActivities: number
    weekActivities: number
    pendingReminders: number
    overdueReminders: number
  }
  recentActivities: Activity[]
  recentReminders: Reminder[]
  activityTypeCounts: { type: string | null; count: number }[]
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16, filter: 'blur(8px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
}

const TYPE_ICONS: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  visit: MapPin,
  meeting: Handshake,
  contract: FileCheck,
  billing: ClipboardList,
  other: ClipboardList,
}

const TYPE_LABELS: Record<string, string> = {
  call: '전화',
  email: '이메일',
  visit: '방문',
  meeting: '미팅',
  contract: '계약',
  billing: '빌링',
  other: '기타',
}

export default function DashboardPage() {
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? '좋은 아침입니다' : hour < 18 ? '좋은 오후입니다' : '수고하셨습니다'

  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard')
      const json: ApiResponse<DashboardData> = await res.json()
      return json.data!
    },
  })

  const stats = dashboard?.stats
  const totalReminders = (stats?.pendingReminders ?? 0) + (stats?.overdueReminders ?? 0)

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-12"
    >
      {/* Greeting */}
      <motion.div variants={item} className="flex items-end justify-between">
        <div>
          <p className="text-[13px] font-medium text-slate-500">
            {new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight text-white">
            {greeting}
          </h1>
        </div>
        <Link href="/documents/new">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-[13px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20 transition-shadow duration-300 hover:shadow-amber-500/30"
          >
            <Sparkles className="h-4 w-4" />
            AI 제안서 생성
          </motion.div>
        </Link>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="전체 활동"
          value={isLoading ? '-' : String(stats?.totalActivities ?? 0)}
          change={`이번 주 ${stats?.weekActivities ?? 0}건`}
          icon={Target}
          color="blue"
        />
        <StatCard
          title="이번주 활동"
          value={isLoading ? '-' : String(stats?.weekActivities ?? 0)}
          change={`전체 ${stats?.totalActivities ?? 0}건`}
          icon={Calendar}
          color="emerald"
        />
        <StatCard
          title="후속조치"
          value={isLoading ? '-' : String(totalReminders)}
          change={stats?.overdueReminders ? `지연 ${stats.overdueReminders}건` : '지연 없음'}
          icon={Clock}
          color={stats?.overdueReminders ? 'rose' : 'amber'}
        />
        <StatCard
          title="AI 분류율"
          value={isLoading ? '-' : `${stats?.totalActivities ? Math.round((dashboard?.activityTypeCounts?.reduce((s, c) => s + (c.type ? c.count : 0), 0) ?? 0) / stats.totalActivities * 100) : 0}%`}
          change="자동 분류 완료"
          icon={Sparkles}
          color="amber"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Pending Reminders — spans 2 cols */}
        <motion.div
          variants={item}
          className="glass-card col-span-2 rounded-2xl p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
              <Zap className="h-4 w-4 text-amber-400" strokeWidth={2} />
              후속조치 현황
              {totalReminders > 0 && (
                <span className="ml-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-semibold text-rose-400">
                  {totalReminders}건
                </span>
              )}
            </h2>
            <Link href="/activities" className="text-[12px] text-slate-500 transition-colors hover:text-amber-400">
              전체 보기
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
              ))}
            </div>
          ) : !dashboard?.recentReminders?.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Clock className="mb-2 h-8 w-8 text-slate-600" />
              <p className="text-[13px] text-slate-500">대기 중인 후속조치가 없습니다</p>
              <p className="mt-1 text-[11px] text-slate-600">활동을 기록하면 AI가 자동으로 후속조치를 추출합니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dashboard.recentReminders.map((reminder) => (
                <ReminderItem key={reminder.id} reminder={reminder} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Activity Type Breakdown */}
        <motion.div
          variants={item}
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
              <TrendingUp className="h-4 w-4 text-emerald-400" strokeWidth={2} />
              활동 유형별 현황
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-white/[0.04]" />
              ))}
            </div>
          ) : !dashboard?.activityTypeCounts?.length ? (
            <p className="py-8 text-center text-[13px] text-slate-500">활동 데이터 없음</p>
          ) : (
            <div className="space-y-3">
              {dashboard.activityTypeCounts
                .filter((c) => c.type)
                .sort((a, b) => b.count - a.count)
                .map((typeCount) => {
                  const total = dashboard.activityTypeCounts.reduce((s, c) => s + c.count, 0)
                  const pct = total > 0 ? Math.round((typeCount.count / total) * 100) : 0
                  return (
                    <div key={typeCount.type} className="flex items-center gap-3">
                      <span className="w-12 text-[11px] text-slate-400">
                        {TYPE_LABELS[typeCount.type!] ?? typeCount.type}
                      </span>
                      <div className="flex-1 h-2 rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-[11px] font-medium text-slate-300">
                        {typeCount.count}건
                      </span>
                    </div>
                  )
                })}
            </div>
          )}

          <Link href="/activities" className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 text-[12px] text-slate-500 transition-all duration-300 hover:border-white/[0.1] hover:text-slate-300">
            활동 기록하기
            <ArrowRight className="h-3 w-3" />
          </Link>
        </motion.div>
      </div>

      {/* Recent Activities + AI Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        {/* AI Quick Actions */}
        <motion.div
          variants={item}
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
              <Sparkles className="h-4 w-4 text-amber-400" strokeWidth={2} />
              AI 도구
            </h2>
          </div>

          <div className="space-y-3">
            <AICard
              text="AI 제안서를 생성해 드릴까요?"
              action="제안서 생성"
              icon={FileText}
              href="/documents/new"
            />
            <AICard
              text="CSV 영업 데이터를 임포트할까요?"
              action="데이터 임포트"
              icon={TrendingUp}
              href="/import"
            />
            <AICard
              text="영업 인텔리전스를 확인해보세요"
              action="확인하기"
              icon={Sparkles}
              href="/intelligence"
            />
          </div>
        </motion.div>

        {/* Recent Activities — spans 2 cols */}
        <motion.div
          variants={item}
          className="glass-card col-span-2 rounded-2xl p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
              <ClipboardList className="h-4 w-4 text-blue-400" strokeWidth={2} />
              최근 활동
            </h2>
            <Link href="/activities" className="text-[12px] text-slate-500 transition-colors hover:text-amber-400">
              전체 보기
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-white/[0.04]" />
              ))}
            </div>
          ) : !dashboard?.recentActivities?.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ClipboardList className="mb-2 h-8 w-8 text-slate-600" />
              <p className="text-[13px] text-slate-500">아직 활동 기록이 없습니다</p>
              <Link href="/activities" className="mt-2 text-[12px] text-amber-400 hover:text-amber-300">
                첫 활동 기록하기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {dashboard.recentActivities.map((activity) => {
                const TypeIcon = TYPE_ICONS[activity.type || 'other'] || ClipboardList
                const parsed = activity.parsedContent as Record<string, unknown> | null
                return (
                  <div key={activity.id} className="flex items-center gap-4 rounded-lg border border-white/[0.03] bg-white/[0.02] px-4 py-2.5 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.04]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
                      <TypeIcon className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-[13px] text-slate-300">
                        {(parsed?.summary as string) || activity.rawContent.slice(0, 80)}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium text-slate-400">
                      {TYPE_LABELS[activity.type || 'other'] ?? activity.type}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-600">
                      {formatRelativeTime(activity.activityDate)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

/* ===== Sub-components ===== */

function StatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
}: {
  title: string
  value: string
  change: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  color: 'blue' | 'emerald' | 'amber' | 'rose'
}) {
  const colors = {
    blue: { bg: 'from-blue-500/10 to-blue-600/5', text: 'text-blue-400', glow: 'shadow-blue-500/10' },
    emerald: { bg: 'from-emerald-500/10 to-emerald-600/5', text: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
    amber: { bg: 'from-amber-500/10 to-amber-600/5', text: 'text-amber-400', glow: 'shadow-amber-500/10' },
    rose: { bg: 'from-rose-500/10 to-rose-600/5', text: 'text-rose-400', glow: 'shadow-rose-500/10' },
  }
  const c = colors[color]

  return (
    <motion.div
      variants={item}
      whileHover={{ y: -3, transition: { duration: 0.3 } }}
      className="stat-card glass-card group rounded-2xl p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${c.bg} shadow-lg ${c.glow}`}>
          <Icon className={`h-[18px] w-[18px] ${c.text}`} strokeWidth={1.8} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-600 transition-all duration-300 group-hover:text-slate-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
      <p className="text-[12px] font-medium text-slate-500">{title}</p>
      <p className="mt-0.5 text-[26px] font-bold tracking-tight text-white">{value}</p>
      <p className={`mt-1 text-[11px] font-medium ${c.text}`}>{change}</p>
    </motion.div>
  )
}

function ReminderItem({ reminder }: { reminder: Reminder }) {
  const isOverdue = reminder.status === 'overdue' || new Date(reminder.dueDate) < new Date()
  const priorityColors: Record<string, string> = {
    critical: 'bg-rose-500/10 text-rose-400',
    high: 'bg-amber-500/10 text-amber-400',
    medium: 'bg-blue-500/10 text-blue-400',
    low: 'bg-slate-500/10 text-slate-400',
  }

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-white/[0.03] bg-white/[0.02] px-4 py-3 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.04]">
      <div className={`h-2 w-2 rounded-full ${isOverdue ? 'bg-rose-400 shadow-sm shadow-rose-400/50' : 'bg-amber-400 shadow-sm shadow-amber-400/50'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-200">{reminder.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">{reminder.description}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityColors[reminder.priority]}`}>
        {reminder.priority}
      </span>
      <span className={`shrink-0 text-[11px] ${isOverdue ? 'font-semibold text-rose-400' : 'text-slate-600'}`}>
        {isOverdue && <AlertCircle className="mr-1 inline h-3 w-3" />}
        {formatRelativeTime(reminder.dueDate)}
      </span>
    </div>
  )
}

function AICard({
  text,
  action,
  icon: Icon,
  href,
}: {
  text: string
  action: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  href: string
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="group cursor-pointer rounded-xl border border-amber-500/[0.08] bg-gradient-to-r from-amber-500/[0.04] to-transparent p-3.5 transition-all duration-300 hover:border-amber-500/20 hover:from-amber-500/[0.08]"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10">
            <Icon className="h-3.5 w-3.5 text-amber-400" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-[12px] leading-relaxed text-slate-300">{text}</p>
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-amber-400 transition-colors group-hover:text-amber-300">
              {action}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
