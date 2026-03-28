export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">안녕하세요 👋</h1>
      <p className="text-gray-500">SalesHarness에 오신 것을 환영합니다.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="진행중 딜" value="—" />
        <StatCard title="이번주 미팅" value="—" />
        <StatCard title="예상 매출" value="—" />
        <StatCard title="후속조치 필요" value="—" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-medium">시작하기</h2>
        <p className="mt-2 text-sm text-gray-500">
          첫 번째 고객사를 등록하고, AI로 제안서를 만들어보세요.
        </p>
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  )
}
