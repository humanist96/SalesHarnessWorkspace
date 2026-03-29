'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { CalendarDayCell } from './CalendarDayCell'
import { ActivityCard } from './ActivityCard'
import type { Activity } from '@/lib/db/schema'

interface CalendarViewProps {
  activities: Activity[]
  onActivityClick: (activity: Activity) => void
}

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  // 월요일 시작 (0=월, 6=일)
  let startDayOfWeek = firstDay.getDay() - 1
  if (startDayOfWeek < 0) startDayOfWeek = 6

  const days: (number | null)[] = []
  for (let i = 0; i < startDayOfWeek; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  return days
}

export function CalendarView({ activities, onActivityClick }: CalendarViewProps) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [direction, setDirection] = useState(0)

  const days = useMemo(() => getMonthDays(year, month), [year, month])

  // 날짜별 활동 그룹핑
  const activityMap = useMemo(() => {
    const map = new Map<number, Activity[]>()
    for (const a of activities) {
      const d = new Date(a.activityDate)
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate()
        if (!map.has(day)) map.set(day, [])
        map.get(day)!.push(a)
      }
    }
    return map
  }, [activities, year, month])

  const selectedActivities = selectedDay ? activityMap.get(selectedDay) ?? [] : []

  function navigate(dir: number) {
    setDirection(dir)
    setSelectedDay(null)
    let newMonth = month + dir
    let newYear = year
    if (newMonth < 0) { newMonth = 11; newYear-- }
    if (newMonth > 11) { newMonth = 0; newYear++ }
    setMonth(newMonth)
    setYear(newYear)
  }

  const isToday = (day: number) =>
    year === today.getFullYear() && month === today.getMonth() && day === today.getDate()

  return (
    <div className="space-y-4">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-[18px] font-bold text-white">
          {year}년 {month + 1}월
        </h2>
        <button
          onClick={() => navigate(1)}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((wd, i) => (
          <div key={wd} className={`py-2 text-center text-[11px] font-medium ${
            i >= 5 ? 'text-slate-600' : 'text-slate-500'
          }`}>
            {wd}
          </div>
        ))}
      </div>

      {/* 캘린더 그리드 */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, x: direction * 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -40 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-7 gap-1"
        >
          {days.map((day, i) => (
            <CalendarDayCell
              key={i}
              day={day}
              activities={day ? activityMap.get(day) ?? [] : []}
              isToday={day ? isToday(day) : false}
              isSelected={day === selectedDay}
              isWeekend={i % 7 >= 5}
              onClick={() => { if (day) setSelectedDay(day === selectedDay ? null : day) }}
              index={i}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* 선택된 날 활동 목록 */}
      <AnimatePresence>
        {selectedDay && selectedActivities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-3 text-[13px] font-semibold text-white">
                {month + 1}월 {selectedDay}일 활동 ({selectedActivities.length}건)
              </h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {selectedActivities.map((a, idx) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <ActivityCard activity={a} onClick={() => onActivityClick(a)} />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
