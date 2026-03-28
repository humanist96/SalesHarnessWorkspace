import Link from 'next/link'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <p className="text-[80px] font-bold text-white/10">404</p>
      <h1 className="mt-2 text-[20px] font-semibold text-white">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 text-[13px] text-slate-500">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/[0.06] px-5 py-2.5 text-[13px] font-medium text-slate-300 transition-colors hover:bg-white/[0.1]"
      >
        <Home className="h-4 w-4" />
        홈으로 돌아가기
      </Link>
    </div>
  )
}
