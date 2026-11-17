import { freshInvestigation, SOURCES } from './case'
import type { ForensicsEvent, InvestigationState } from './case'

export const STORAGE_KEY = 'csa:forensik:nordverk:v2'
export function restoreInvestigation(raw: string | null): InvestigationState {
  const fresh = freshInvestigation()
  try {
    const value = JSON.parse(raw ?? 'null')
    if (value?.version !== 2) return fresh
    const known = new Set(SOURCES.map(source => source.id))
    const ids = (values: unknown) => Array.isArray(values) ? [...new Set(values.filter((id): id is string => typeof id === 'string' && known.has(id)))] : []
    const preserved = ids(value.preserved)
    const collected = ids(value.collected).filter(id => preserved.includes(id))
    const strings = <T extends object>(defaults: T, supplied: Record<string, unknown> | undefined): T => Object.fromEntries(Object.keys(defaults).map(key => [key, typeof supplied?.[key] === 'string' ? supplied[key] : ''])) as T
    return {
      ...fresh, stage: Number.isInteger(value.stage) && value.stage >= 1 && value.stage <= 7 ? value.stage : 1,
      mode: value.mode === 'independent' ? 'independent' : 'guided',
      codes: value.codes && typeof value.codes === 'object' ? Object.fromEntries(Object.entries(value.codes).filter(([, code]) => typeof code === 'string')) as Record<string, string> : {},
      scope: { networks: Array.isArray(value.scope?.networks) ? value.scope.networks.filter((network: unknown) => typeof network === 'string') : [], question: typeof value.scope?.question === 'string' ? value.scope.question : '' },
      preserved, collected,
      custody: Array.isArray(value.custody) ? value.custody.filter((entry: any) => known.has(entry?.source_id) && ['preserved', 'collected'].includes(entry.action) && typeof entry.time === 'string' && typeof entry.sha256 === 'string' && typeof entry.method === 'string') : [],
      observations: Array.isArray(value.observations) ? value.observations.filter((note: any) => typeof note?.id === 'string' && typeof note.claim === 'string' && Array.isArray(note.evidence) && note.evidence.every((id: unknown) => typeof id === 'string') && typeof note.alternative === 'string') : [],
      report: strings(fresh.report, value.report), response: strings(fresh.response, value.response),
      history: Array.isArray(value.history) ? value.history.filter((item: any) => typeof item?.time === 'string' && typeof item.description === 'string' && typeof item.count === 'number').slice(-40) : [],
      reviewed: value.reviewed?.items?.every?.((item: any) => typeof item.label === 'string' && typeof item.passed === 'boolean' && typeof item.feedback === 'string') ? value.reviewed : undefined
    }
  } catch { return fresh }
}

/** Facts about operations, not correctness of the learner's hypothesis. */
export function applyEvents(state: InvestigationState, events: ForensicsEvent[]): InvestigationState {
  let next = { ...state }
  for (const event of events) {
    if (event.kind === 'scope' && event.scope) next = { ...next, scope: event.scope }
    if (event.kind === 'preserved' && event.verified && event.source_id && event.sha256 === SOURCES.find(source => source.id === event.source_id)?.sha256 && event.entry) {
      next = { ...next, preserved: [...new Set([...next.preserved, event.source_id])], custody: [...next.custody, event.entry].slice(-150) }
    }
    if (event.kind === 'collected' && event.source_id && next.preserved.includes(event.source_id) && event.entry) {
      next = { ...next, collected: [...new Set([...next.collected, event.source_id])], custody: [...next.custody, event.entry].slice(-150) }
    }
    if (event.kind === 'report_draft' && event.report) next = { ...next, report: { ...next.report, ...event.report } }
    if (['packets', 'timeline', 'conversations', 'logs'].includes(event.kind)) {
      next = { ...next, history: [...next.history, { time: new Date().toISOString(), description: event.message, count: event.packets?.length ?? event.records?.length ?? event.conversations?.length ?? 0 }].slice(-40) }
    }
  }
  return { ...next, reviewed: undefined }
}
