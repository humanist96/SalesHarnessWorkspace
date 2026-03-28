'use client'

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
} from 'lucide-react'

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

export default function DashboardPage() {
  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? '좋은 아침입니다' : hour < 18 ? '좋은 오후입니다' : '수고하셨습니다'

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
            {greeting},{' '}
            <span className="shimmer-text">김영업</span>님
          </h1>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-[13px] font-semibold text-amber-950 shadow-lg shadow-amber-500/20 transition-shadow duration-300 hover:shadow-amber-500/30"
        >
          <Sparkles className="h-4 w-4" />
          AI 제안서 생성
        </motion.button>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="진행중 딜"
          value="12"
          change="+3 이번 달"
          icon={Target}
          color="blue"
          delay={0}
        />
        <StatCard
          title="이번주 미팅"
          value="5"
          change="오늘 2건"
          icon={Calendar}
          color="emerald"
          delay={1}
        />
        <StatCard
          title="예상 매출"
          value="8.5억"
          change="+12% 전월 대비"
          icon={TrendingUp}
          color="amber"
          delay={2}
        />
        <StatCard
          title="후속조치"
          value="3"
          change="긴급 1건"
          icon={Clock}
          color="rose"
          delay={3}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Today's Actions — spans 2 cols */}
        <motion.div
          variants={item}
          className="glass-card col-span-2 rounded-2xl p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
              <Zap className="h-4 w-4 text-amber-400" strokeWidth={2} />
              오늘 할 일
            </h2>
            <button className="text-[12px] text-slate-500 transition-colors hover:text-amber-400">
              전체 보기
            </button>
          </div>

          <div className="space-y-2">
            <ActionItem
              title="A증권 제안서 발송"
              subtitle="PowerBase Pro 업그레이드 제안"
              tag="제안서"
              tagColor="blue"
              time="오늘 17:00 마감"
              urgent
            />
            <ActionItem
              title="B증권 미팅 준비"
              subtitle="차세대 시스템 관련 논의"
              tag="미팅"
              tagColor="emerald"
              time="14:00 방문"
            />
            <ActionItem
              title="C증권 후속 이메일"
              subtitle="지난주 미팅 후속 — 견적서 전달"
              tag="이메일"
              tagColor="violet"
              time="오전 중"
            />
            <ActionItem
              title="주간 영업 보고서 작성"
              subtitle="이번 주 활동 및 파이프라인 현황"
              tag="보고서"
              tagColor="amber"
              time="금요일"
            />
          </div>
        </motion.div>

        {/* Upcoming Meetings */}
        <motion.div
          variants={item}
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
              <Calendar className="h-4 w-4 text-emerald-400" strokeWidth={2} />
              다가오는 미팅
            </h2>
          </div>

          <div className="space-y-4">
            <MeetingCard
              time="14:00"
              company="B증권"
              topic="차세대 시스템 논의"
              attendees={['김과장', '이대리']}
              isToday
            />
            <MeetingCard
              time="10:30"
              company="D자산운용"
              topic="PowerBase Core 데모"
              attendees={['박팀장']}
            />
            <MeetingCard
              time="15:00"
              company="E증권"
              topic="IT 운영대행 제안"
              attendees={['최이사', '정과장']}
            />
          </div>

          <button className="mt-4 flex w-full items-center justify-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] py-2 text-[12px] text-slate-500 transition-all duration-300 hover:border-white/[0.1] hover:text-slate-300">
            전체 일정 보기
            <ArrowRight className="h-3 w-3" />
          </button>
        </motion.div>
      </div>

      {/* AI Insights + Pipeline */}
      <div className="grid grid-cols-3 gap-4">
        {/* AI Recommendations */}
        <motion.div
          variants={item}
          className="glass-card rounded-2xl p-6"
        >
          <div className="mb-5 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
              <Sparkles className="h-4 w-4 text-amber-400" strokeWidth={2} />
              AI 추천
            </h2>
          </div>

          <div className="space-y-3">
            <AICard
              text="B증권 미팅 브리핑을 준비할까요?"
              action="브리핑 생성"
              icon={FileText}
            />
            <AICard
              text="A증권 제안서 초안을 작성해 드릴까요?"
              action="제안서 생성"
              icon={Sparkles}
            />
            <AICard
              text="이번 주 시장 동향이 업데이트되었습니다"
              action="확인하기"
              icon={TrendingUp}
            />
          </div>
        </motion.div>

        {/* Pipeline Summary — spans 2 cols */}
        <motion.div
          variants={item}
          className="glass-card col-span-2 rounded-2xl p-6"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-[15px] font-semibold text-white">
              <Target className="h-4 w-4 text-blue-400" strokeWidth={2} />
              영업 파이프라인
            </h2>
            <div className="flex items-center gap-1 text-[12px] text-slate-500">
              총 예상 매출
              <span className="ml-1 font-semibold text-amber-400">₩8.5억</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PipelineStage label="발굴" count={5} value="2.1억" color="slate" width="18%" />
            <div className="text-slate-700">›</div>
            <PipelineStage label="접촉" count={3} value="1.8억" color="blue" width="15%" />
            <div className="text-slate-700">›</div>
            <PipelineStage label="제안" count={2} value="2.5억" color="violet" width="22%" />
            <div className="text-slate-700">›</div>
            <PipelineStage label="협상" count={1} value="1.2억" color="amber" width="12%" />
            <div className="text-slate-700">›</div>
            <PipelineStage label="계약" count={1} value="0.9억" color="emerald" width="10%" />
          </div>

          {/* Recent Deals */}
          <div className="mt-6 space-y-2">
            <DealRow
              company="A증권"
              deal="PowerBase Pro 업그레이드"
              stage="제안"
              value="3.2억"
              probability={65}
            />
            <DealRow
              company="B증권"
              deal="차세대 시스템 구축"
              stage="접촉"
              value="5.0억"
              probability={30}
            />
            <DealRow
              company="D자산운용"
              deal="PowerBase Core 도입"
              stage="발굴"
              value="1.5억"
              probability={20}
            />
          </div>
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
  delay,
}: {
  title: string
  value: string
  change: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  color: 'blue' | 'emerald' | 'amber' | 'rose'
  delay: number
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

function ActionItem({
  title,
  subtitle,
  tag,
  tagColor,
  time,
  urgent,
}: {
  title: string
  subtitle: string
  tag: string
  tagColor: string
  time: string
  urgent?: boolean
}) {
  const tagColors: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    violet: 'bg-violet-500/10 text-violet-400',
    amber: 'bg-amber-500/10 text-amber-400',
  }

  return (
    <div className="group flex items-center gap-4 rounded-xl border border-white/[0.03] bg-white/[0.02] px-4 py-3 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.04]">
      <div className={`h-2 w-2 rounded-full ${urgent ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-slate-600'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-200">{title}</p>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">{subtitle}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tagColors[tagColor]}`}>
        {tag}
      </span>
      <span className="shrink-0 text-[11px] text-slate-600">{time}</span>
    </div>
  )
}

function MeetingCard({
  time,
  company,
  topic,
  attendees,
  isToday,
}: {
  time: string
  company: string
  topic: string
  attendees: string[]
  isToday?: boolean
}) {
  return (
    <div className="group rounded-xl border border-white/[0.03] bg-white/[0.02] p-3.5 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.04]">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-white">{time}</span>
            {isToday && (
              <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
                오늘
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] font-medium text-slate-300">{company}</p>
          <p className="mt-0.5 text-[11px] text-slate-500">{topic}</p>
        </div>
        <button className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] opacity-0 transition-all duration-300 group-hover:opacity-100 hover:border-amber-500/30">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
        </button>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <Users className="h-3 w-3 text-slate-600" />
        <span className="text-[10px] text-slate-600">{attendees.join(', ')}</span>
      </div>
    </div>
  )
}

function AICard({
  text,
  action,
  icon: Icon,
}: {
  text: string
  action: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}) {
  return (
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
  )
}

function PipelineStage({
  label,
  count,
  value,
  color,
  width,
}: {
  label: string
  count: number
  value: string
  color: string
  width: string
}) {
  const colors: Record<string, string> = {
    slate: 'from-slate-500/20 to-slate-600/10 border-slate-500/20',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    violet: 'from-violet-500/20 to-violet-600/10 border-violet-500/20',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/20',
    emerald: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
  }

  return (
    <div className="flex-1">
      <div
        className={`rounded-lg border bg-gradient-to-b ${colors[color]} p-3 text-center transition-all duration-300 hover:scale-[1.02]`}
      >
        <p className="text-[18px] font-bold text-white">{count}</p>
        <p className="text-[10px] font-medium text-slate-400">{label}</p>
        <p className="mt-0.5 text-[10px] text-slate-500">{value}</p>
      </div>
    </div>
  )
}

function DealRow({
  company,
  deal,
  stage,
  value,
  probability,
}: {
  company: string
  deal: string
  stage: string
  value: string
  probability: number
}) {
  const stageColors: Record<string, string> = {
    '발굴': 'bg-slate-500/10 text-slate-400',
    '접촉': 'bg-blue-500/10 text-blue-400',
    '제안': 'bg-violet-500/10 text-violet-400',
    '협상': 'bg-amber-500/10 text-amber-400',
    '계약': 'bg-emerald-500/10 text-emerald-400',
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-white/[0.03] bg-white/[0.02] px-4 py-2.5 transition-all duration-300 hover:border-white/[0.08] hover:bg-white/[0.04]">
      <div className="w-20">
        <p className="text-[12px] font-semibold text-slate-200">{company}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-[12px] text-slate-400">{deal}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${stageColors[stage]}`}>
        {stage}
      </span>
      <div className="w-16 text-right">
        <p className="text-[12px] font-semibold text-white">{value}</p>
      </div>
      <div className="w-12">
        <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
            style={{ width: `${probability}%` }}
          />
        </div>
        <p className="mt-0.5 text-right text-[9px] text-slate-600">{probability}%</p>
      </div>
    </div>
  )
}
