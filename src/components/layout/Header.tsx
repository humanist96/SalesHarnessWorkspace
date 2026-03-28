'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react'
import Link from 'next/link'
import { logout } from '@/lib/auth/actions'

export function Header() {
  const router = useRouter()
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/organizations?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-white/[0.04] bg-[#0a0e1a]/60 px-6 backdrop-blur-xl">
      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" strokeWidth={1.8} />
        <input
          type="text"
          placeholder="고객사, 문서 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-72 rounded-lg border border-white/[0.06] bg-white/[0.03] pl-10 pr-4 text-[13px] text-slate-300 placeholder-slate-600 outline-none transition-all duration-300 focus:border-amber-500/30 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(245,158,11,0.05)]"
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-slate-600">
          ⌘K
        </kbd>
      </form>

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

        {/* Notifications — links to meetings */}
        <Link
          href="/meetings"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-slate-400 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.05] hover:text-slate-200"
        >
          <Bell className="h-4 w-4" strokeWidth={1.8} />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-amber-950 shadow-sm shadow-amber-500/30">
            3
          </span>
        </Link>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] py-1.5 pl-1.5 pr-3 transition-all duration-300 hover:border-white/[0.1] hover:bg-white/[0.05]"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-amber-400 to-amber-600 text-[10px] font-bold text-amber-950">
              K
            </div>
            <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-white/[0.08] bg-[#1a2236] p-1 shadow-xl shadow-black/30">
              <Link
                href="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
              >
                <User className="h-4 w-4" strokeWidth={1.8} />
                프로필
              </Link>
              <Link
                href="/settings"
                onClick={() => setProfileOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
              >
                <Settings className="h-4 w-4" strokeWidth={1.8} />
                설정
              </Link>
              <div className="my-1 h-px bg-white/[0.06]" />
              <button
                onClick={() => { setProfileOpen(false); logout() }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-red-400 transition-colors hover:bg-red-500/10"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.8} />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
