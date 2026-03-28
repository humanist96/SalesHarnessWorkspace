'use client'

import { INTENT_CONFIG, ALL_INTENTS, type SalesIntent } from '@/lib/pipeline/types'

interface OrgIntentHeatmapProps {
  data: {
    organizationId: string
    organizationName: string
    intents: Record<string, number>
    total: number
  }[]
}

function getHeatColor(value: number, max: number): string {
  if (max === 0 || value === 0) return 'bg-white/[0.02]'
  const intensity = value / max
  if (intensity < 0.25) return 'bg-amber-500/10'
  if (intensity < 0.5) return 'bg-amber-500/20'
  if (intensity < 0.75) return 'bg-amber-500/40'
  return 'bg-amber-500/60'
}

export function OrgIntentHeatmap({ data }: OrgIntentHeatmapProps) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-[13px] text-slate-500">V2 분류 데이터 없음</p>
  }

  const maxVal = Math.max(...data.flatMap((d) => Object.values(d.intents)), 1)
  // 실제 데이터에 있는 intent만 표시
  const activeIntents = ALL_INTENTS.filter((intent) =>
    data.some((d) => (d.intents[intent] ?? 0) > 0),
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="pb-2 pr-3 text-left text-[10px] font-medium text-slate-500">고객사</th>
            {activeIntents.map((intent) => (
              <th key={intent} className="pb-2 px-1 text-center text-[9px] font-medium text-slate-500">
                {INTENT_CONFIG[intent].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((org) => (
            <tr key={org.organizationId}>
              <td className="py-1 pr-3 text-[11px] font-medium text-slate-300 truncate max-w-[120px]">
                {org.organizationName}
              </td>
              {activeIntents.map((intent) => {
                const val = org.intents[intent] ?? 0
                return (
                  <td key={intent} className="p-1">
                    <div
                      className={`h-7 w-full min-w-[32px] rounded ${getHeatColor(val, maxVal)} flex items-center justify-center`}
                      title={`${org.organizationName} - ${INTENT_CONFIG[intent].label}: ${val}건`}
                    >
                      {val > 0 && (
                        <span className="text-[10px] font-medium text-white/70">{val}</span>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
