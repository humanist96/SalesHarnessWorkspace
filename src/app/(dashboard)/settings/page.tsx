import { PageHeader } from '@/components/shared/PageHeader'

export default function SettingsPage() {
  return (
    <div>
      <PageHeader title="설정" />
      <div className="glass-card rounded-2xl p-6">
        <h2 className="text-[15px] font-semibold text-white">프로필</h2>
        <p className="mt-2 text-[13px] text-slate-500">
          Supabase 인증 연동 후 프로필 정보를 관리할 수 있습니다.
        </p>
      </div>
    </div>
  )
}
