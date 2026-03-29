'use client'

import { motion } from 'motion/react'
import { isV2Content } from '@/lib/pipeline/parse-content'
import type { Activity } from '@/lib/db/schema'

const INTENT_DOT_COLORS: Record<string, string> = {
  new_business: 'bg-emerald-400',
  contract_renewal: 'bg-amber-400',
  cross_sell: 'bg-violet-400',
  upsell: 'bg-blue-400',
  issue_resolution: 'bg-rose-400',
  relationship: 'bg-slate-400',
  info_gathering: 'bg-cyan-400',
  negotiation: 'bg-orange-400',
  delivery: 'bg-teal-400',
  billing_payment: 'bg-pink-400',
}

interface CalendarDayCellProps {
  day: number | null
  activities: Activity[]
  isToday: boolean
  isSelected: boolean
  isWeekend: boolean
  onClick: () => void
  index: number
}

export function CalendarDayCell({
  day,
  activities,
  isToday,
  isSelected,
  isWeekend,
  onClick,
  index,
}: CalendarDayCellProps) {
  if (day === null) {
    return <div className="h-20 rounded-lg" />
  }

  const dots = activities.slice(0, 3).map((a) => {
    const intent = isV2Content(a.parsedContent) ? a.parsedContent.intent : null
    return intent ? INTENT_DOT_COLORS[intent] ?? 'bg-slate-500' : 'bg-slate-500'
  })

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.01, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.97 }}
      className={`relative flex h-20 flex-col items-start rounded-lg border p-2 transition-colors ${
        isSelected
          ? 'border-amber-500/30 bg-amber-500/[0.06]'
          : isToday
          ? 'border-amber-500/20 bg-amber-500/[0.03]'
          : isWeekend
          ? 'border-white/[0.03] bg-white/[0.01]'
          : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.04]'
      }`}
    >
      {/* 날짜 번호 */}
      <span className={`text-[12px] font-medium ${
        isToday ? 'text-amber-400' : isWeekend ? 'text-slate-600' : 'text-slate-300'
      }`}>
        {day}
      </span>

      {/* 오늘 표시 glow */}
      {isToday && (
        <motion.div
          className="absolute -top-px -right-px h-2 w-2 rounded-full bg-amber-400"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        />
      )}

      {/* 활동 도트 */}
      {dots.length > 0 && (
        <div className="mt-auto flex items-center gap-1">
          {dots.map((color, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.01 + i * 0.03, type: 'spring', bounce: 0.5 }}
              className={`h-1.5 w-1.5 rounded-full ${color}`}
            />
          ))}
          {activities.length > 3 && (
            <span className="text-[8px] text-slate-600">+{activities.length - 3}</span>
          )}
        </div>
      )}
    </motion.button>
  )
}
