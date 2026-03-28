'use client'

import { Search, Bell, ChevronDown } from 'lucide-react'

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between border-b border-white/[0.04] bg-[#0a0e1a]/60 px-6 backdrop-blur-xl">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" strokeWidth={1.8} />
        <input
          type="text"
          placeholder="고객사, 문서, 딜 검색..."
          className="h-9 w-72 rounded-lg border border-white/[0.06] bg-white/[0.03] pl-10 pr-4 text-[13px] text-slate-300 placeholder-slate-600 outline-none transition-all duration-300 focus:border-amber-500/30 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(245,158,11,0.05)]"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-600">
          ⌘K
        </kbd>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* Date badge */}
        <div className="mr-2 hidden items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-3 py-1 text-[11px] text-slate-500 lg:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
          {new Date().toLocaleDateString('ko-KR', {
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          })}
        </div>

        {/* Notifications */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-slate-400 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-slate-200">
          <Bell className="h-4 w-4" strokeWidth={1.8} />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-amber-950 shadow-sm shadow-amber-500/30">
            3
          </span>
        </button>

        {/* Profile */}
        <button className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] py-1.5 pl-1.5 pr-3 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.05]">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-amber-600 text-[10px] font-bold text-amber-950">
            K
          </div>
          <ChevronDown className="h-3 w-3 text-slate-500" />
        </button>
      </div>
    </header>
  )
}
