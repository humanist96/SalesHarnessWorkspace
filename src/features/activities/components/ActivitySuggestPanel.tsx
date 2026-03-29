'use client'

import { Command, CommandGroup, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { SuggestionCard } from './SuggestionCard'
import { INTENT_CONFIG, type SalesIntent } from '@/lib/pipeline/types'
import { Badge } from '@/components/ui/badge'
import { History, Sparkles } from 'lucide-react'

interface Suggestion {
  id: string
  raw_content: string
  type: string | null
  organization_id: string | null
  organization_name: string | null
  activity_date: string
  summary: string | null
  intent: string | null
  products: string[] | null
  text_score?: number
  total_score?: number
}

interface Template {
  organization_id: string
  intent: string
  products: string[] | null
  frequency: number
  example_content: string
}

interface ActivitySuggestPanelProps {
  suggestions: Suggestion[]
  templates: Template[]
  isLoading: boolean
  visible: boolean
  onSelectSuggestion: (rawContent: string, orgId?: string | null) => void
  onSelectTemplate: (content: string) => void
}

export function ActivitySuggestPanel({
  suggestions,
  templates,
  isLoading,
  visible,
  onSelectSuggestion,
  onSelectTemplate,
}: ActivitySuggestPanelProps) {
  if (!visible) return null

  const hasSuggestions = suggestions.length > 0
  const hasTemplates = templates.length > 0

  if (!hasSuggestions && !hasTemplates && !isLoading) return null

  return (
    <div className="absolute left-0 right-0 top-full z-50 mt-1">
      <Command className="rounded-xl border border-white/[0.08] bg-[#0d1526] shadow-xl shadow-black/30">
        <CommandList className="max-h-[280px]">
          {isLoading && (
            <div className="space-y-2 p-3">
              <div className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />
              <div className="h-12 animate-pulse rounded-lg bg-white/[0.04]" />
            </div>
          )}

          {hasSuggestions && (
            <CommandGroup heading={
              <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <History className="h-3 w-3" />
                유사한 활동 ({suggestions.length}건)
              </span>
            }>
              {suggestions.map((s) => (
                <CommandItem
                  key={s.id}
                  value={s.id}
                  onSelect={() => onSelectSuggestion(s.raw_content, s.organization_id)}
                  className="cursor-pointer rounded-lg px-3 py-2 aria-selected:bg-white/[0.06]"
                >
                  <SuggestionCard
                    rawContent={s.raw_content}
                    intent={s.intent}
                    products={s.products}
                    organizationName={s.organization_name}
                    activityDate={s.activity_date}
                    score={s.text_score}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {hasSuggestions && hasTemplates && <CommandSeparator />}

          {hasTemplates && (
            <CommandGroup heading={
              <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <Sparkles className="h-3 w-3" />
                자주 사용하는 패턴
              </span>
            }>
              {templates.map((t, i) => {
                const intentCfg = INTENT_CONFIG[t.intent as SalesIntent]
                const prods = Array.isArray(t.products) ? t.products : []
                return (
                  <CommandItem
                    key={`tpl-${i}`}
                    value={`template-${i}`}
                    onSelect={() => onSelectTemplate(t.example_content)}
                    className="cursor-pointer rounded-lg px-3 py-2 aria-selected:bg-white/[0.06]"
                  >
                    <div className="flex items-center gap-2">
                      {intentCfg && (
                        <Badge variant="outline" className={`text-[9px] ${intentCfg.color}`}>
                          {intentCfg.label}
                        </Badge>
                      )}
                      <span className="text-[11px] text-slate-300">
                        {prods.slice(0, 3).join(' + ') || t.intent}
                      </span>
                      <span className="ml-auto text-[10px] text-slate-600">
                        {t.frequency}회
                      </span>
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </div>
  )
}
