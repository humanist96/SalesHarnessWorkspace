'use client'

import { motion } from 'motion/react'
import { List, Calendar, Columns3 } from 'lucide-react'

export type ViewMode = 'list' | 'calendar' | 'kanban'

const VIEWS: { value: ViewMode; label: string; icon: typeof List }[] = [
  { value: 'list', label: '리스트', icon: List },
  { value: 'calendar', label: '캘린더', icon: Calendar },
  { value: 'kanban', label: '칸반보드', icon: Columns3 },
]

interface ActivityViewTabsProps {
  value: ViewMode
  onChange: (view: ViewMode) => void
}

export function ActivityViewTabs({ value, onChange }: ActivityViewTabsProps) {
  return (
    <div className="inline-flex rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
      {VIEWS.map((view) => {
        const Icon = view.icon
        const isActive = value === view.value
        return (
          <button
            key={view.value}
            onClick={() => onChange(view.value)}
            className="relative rounded-lg px-4 py-2 text-[12px] font-medium transition-colors"
          >
            {isActive && (
              <motion.div
                layoutId="activeViewTab"
                className="absolute inset-0 rounded-lg bg-amber-500/10 border border-amber-500/20"
                transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
              />
            )}
            <span className={`relative z-10 inline-flex items-center gap-1.5 ${
              isActive ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'
            }`}>
              <Icon className="h-3.5 w-3.5" />
              {view.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
