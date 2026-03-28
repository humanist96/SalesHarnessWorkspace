'use client'

import { LogOut, User, Shield } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/auth/actions'

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="설정" />

      <div className="space-y-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-slate-400" strokeWidth={1.8} />
            <h2 className="text-[15px] font-semibold text-white">프로필</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.03] py-2">
              <span className="text-[13px] text-slate-500">이메일</span>
              <span className="text-[13px] text-slate-300">세션에서 확인</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/[0.03] py-2">
              <span className="text-[13px] text-slate-500">역할</span>
              <span className="text-[13px] text-slate-300">영업직원</span>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-5 w-5 text-slate-400" strokeWidth={1.8} />
            <h2 className="text-[15px] font-semibold text-white">보안</h2>
          </div>
          <p className="text-[13px] text-slate-500 mb-4">
            비밀번호 변경 등 보안 설정은 추후 지원 예정입니다.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <Button
            onClick={() => logout()}
            variant="outline"
            className="w-full border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </div>
    </div>
  )
}
