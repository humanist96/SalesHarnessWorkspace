'use client'

import { AlertTriangle } from 'lucide-react'

interface RiskAlertsProps {
  data: { flag: string; count: number; recentOrgs: string[] }[]
}

export function RiskAlerts({ data }: RiskAlertsProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center gap-2 py-4 text-[13px] text-slate-500">
        <span className="text-emerald-400">No risks detected</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {data.map((risk) => (
        <div
          key={risk.flag}
          className="rounded-lg border border-rose-500/10 bg-rose-500/[0.03] p-3"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-[12px] font-medium text-rose-300">{risk.flag}</span>
            <span className="ml-auto rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-400">
              {risk.count}건
            </span>
          </div>
          {risk.recentOrgs.length > 0 && (
            <p className="mt-1 text-[11px] text-slate-500">
              {risk.recentOrgs.join(', ')}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
