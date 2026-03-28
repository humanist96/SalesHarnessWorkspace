'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navigation = [
  { name: '홈', href: '/', icon: '🏠' },
  { name: '고객사', href: '/organizations', icon: '🏢' },
  { name: '문서', href: '/documents', icon: '📄' },
  { name: '미팅', href: '/meetings', icon: '📅' },
  { name: '영업 현황', href: '/pipeline', icon: '📊' },
  { name: '인텔리전스', href: '/intelligence', icon: '💡' },
]

const bottomNavigation = [
  { name: '설정', href: '/settings', icon: '⚙️' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-60 flex-col bg-gray-900 text-gray-300">
      <div className="flex h-14 items-center px-4">
        <span className="text-lg font-bold text-white">SalesHarness</span>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-800 px-2 py-4">
        {bottomNavigation.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-gray-800 hover:text-white"
          >
            <span>{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </div>
    </aside>
  )
}
