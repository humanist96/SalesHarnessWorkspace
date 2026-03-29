'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { isV2Content, getSummary } from '@/lib/pipeline/parse-content'
import { INTENT_CONFIG, type SalesIntent } from '@/lib/pipeline/types'
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

const INTENT_TEXT_COLORS: Record<string, string> = {
  new_business: 'text-emerald-400/70',
  contract_renewal: 'text-amber-400/70',
  cross_sell: 'text-violet-400/70',
  upsell: 'text-blue-400/70',
  issue_resolution: 'text-rose-400/70',
  relationship: 'text-slate-400/70',
  info_gathering: 'text-cyan-400/70',
  negotiation: 'text-orange-400/70',
  delivery: 'text-teal-400/70',
  billing_payment: 'text-pink-400/70',
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

/**
 * 캘린더 미니 라벨 기준 (우선순위):
 * 1순위: 고객사 축약명 (IBK투자증권→IBK, 중국은행→중국은행)
 * 2순위: intent 한글 라벨 (계약갱신, 신규영업 등)
 * 3순위: 상품명 첫 번째 (원장서비스, 회선 등)
 * 4순위: rawContent 첫 8자 (fallback)
 *
 * 표시 형식: "[고객사] intent" (최대 12자)
 */
function getMiniLabel(activity: Activity): { label: string; color: string; dotColor: string } {
  const parsed = activity.parsedContent
  const v2 = isV2Content(parsed)

  if (!v2) {
    return {
      label: activity.rawContent.slice(0, 10),
      color: 'text-slate-500',
      dotColor: 'bg-slate-500',
    }
  }

  const intent = parsed.intent
  const intentCfg = INTENT_CONFIG[intent as SalesIntent]
  const intentLabel = intentCfg?.label ?? ''
  const org = parsed.organizationMention ?? ''
  const products = parsed.products ?? []

  // 고객사 축약: "투자증권", "증권", "금융투자" 등 접미사 제거
  const shortOrg = org
    .replace(/투자증권|종합금융|금융투자|투자|증권|캐피탈/g, '')
    .trim()

  // 라벨 조합
  let label = ''
  if (shortOrg) {
    label = shortOrg
    if (intentLabel) label += ` ${intentLabel}`
  } else if (intentLabel && products.length > 0) {
    label = `${products[0]} ${intentLabel}`
  } else if (intentLabel) {
    label = intentLabel
  } else {
    label = activity.rawContent.slice(0, 10)
  }

  return {
    label: label.slice(0, 14),
    color: intent ? INTENT_TEXT_COLORS[intent] ?? 'text-slate-500' : 'text-slate-500',
    dotColor: intent ? INTENT_DOT_COLORS[intent] ?? 'bg-slate-500' : 'bg-slate-500',
  }
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
  const [hovered, setHovered] = useState(false)

  if (day === null) {
    return <div className="min-h-24 rounded-lg" />
  }

  const items = activities.slice(0, 2).map(getMiniLabel)
  const extraCount = activities.length - 2

  return (
    <motion.button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.008, duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.97 }}
      className={`relative flex min-h-24 flex-col rounded-lg border p-1.5 text-left transition-all duration-200 ${
        isSelected
          ? 'border-amber-500/30 bg-amber-500/[0.06] shadow-[0_0_12px_rgba(245,158,11,0.1)]'
          : isToday
          ? 'border-amber-500/20 bg-amber-500/[0.03]'
          : isWeekend
          ? 'border-white/[0.03] bg-white/[0.01]'
          : 'border-white/[0.04] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.04]'
      }`}
    >
      {/* 날짜 번호 */}
      <div className="flex items-center justify-between">
        <span className={`text-[11px] font-semibold ${
          isToday ? 'text-amber-400' : isWeekend ? 'text-slate-600' : 'text-slate-300'
        }`}>
          {day}
        </span>
        {isToday && (
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-amber-400"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
      </div>

      {/* 미니 활동 목록 */}
      <div className="mt-1 flex-1 space-y-0.5 overflow-hidden">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-1 truncate">
            <span className={`h-1 w-1 shrink-0 rounded-full ${item.dotColor}`} />
            <span className={`truncate text-[8px] font-medium ${item.color}`}>
              {item.label}
            </span>
          </div>
        ))}
        {extraCount > 0 && (
          <span className="text-[8px] text-slate-600 pl-2">+{extraCount}</span>
        )}
      </div>

      {/* 호버 툴팁 말풍선 */}
      <AnimatePresence>
        {hovered && activities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-1/2 bottom-full z-50 mb-2 w-56 -translate-x-1/2"
          >
            <div className="rounded-xl border border-white/[0.1] bg-[#131b2e]/95 p-3 shadow-xl shadow-black/40 backdrop-blur-xl">
              {/* 화살표 */}
              <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 h-3 w-3 rotate-45 border-b border-r border-white/[0.1] bg-[#131b2e]/95" />

              <p className="mb-2 text-[10px] font-semibold text-slate-300">
                {day}일 활동 ({activities.length}건)
              </p>
              <div className="space-y-1.5">
                {activities.slice(0, 5).map((a, i) => {
                  const parsed = a.parsedContent
                  const v2 = isV2Content(parsed)
                  const intent = v2 ? parsed.intent : null
                  const intentLabel = intent ? INTENT_CONFIG[intent as SalesIntent]?.label : null
                  const org = v2 ? parsed.organizationMention : null
                  const summary = getSummary(parsed) || a.rawContent.slice(0, 40)

                  return (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                        intent ? INTENT_DOT_COLORS[intent] ?? 'bg-slate-500' : 'bg-slate-500'
                      }`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          {org && <span className="text-[9px] font-semibold text-amber-400/80">{org}</span>}
                          {intentLabel && <span className="text-[8px] text-slate-500">{intentLabel}</span>}
                        </div>
                        <p className="text-[9px] text-slate-400 line-clamp-1">{summary}</p>
                      </div>
                    </div>
                  )
                })}
                {activities.length > 5 && (
                  <p className="text-[8px] text-slate-600">... 외 {activities.length - 5}건</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  )
}
