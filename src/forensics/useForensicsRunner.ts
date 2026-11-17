import { useCallback, useEffect, useRef, useState } from 'react'
import type { ForensicsEvent, InvestigationState } from './case'

type Phase = 'loading' | 'ready' | 'running' | 'error'
interface RunOutcome { events: ForensicsEvent[]; error?: string }

const delays: Record<string, number> = { preserved: 90, collected: 90 }

export function useForensicsRunner() {
  const [phase, setPhase] = useState<Phase>('loading')
  const [events, setEvents] = useState<ForensicsEvent[]>([])
  const [error, setError] = useState<string | null>(null)
  const [line, setLine] = useState<number | null>(null)
  const worker = useRef<Worker | null>(null)
  const generation = useRef(0)
  const nextRunId = useRef(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const resolveRun = useRef<((outcome: RunOutcome) => void) | null>(null)
  const currentEvents = useRef<ForensicsEvent[]>([])
  const tailDelay = useRef(0)
  const started = useRef(0)

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  const spawn = useCallback(() => {
    const active = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
    worker.current = active
    setPhase('loading')
    const generationAtSpawn = generation.current
    let bootTimer: ReturnType<typeof setTimeout>
    const fail = (message: string) => {
      if (worker.current !== active) return
      clearTimeout(bootTimer)
      clearTimers()
      setError(message)
      setLine(null)
      setPhase('error')
      resolveRun.current?.({ events: currentEvents.current, error: message })
      resolveRun.current = null
      active.terminate()
    }
    bootTimer = setTimeout(() => fail('Python tog för lång tid att laddas. Försök igen när anslutningen fungerar.'), 45000)
    active.onerror = () => fail('Python-motorn avbröts. Starta om motorn och försök igen.')
    active.onmessage = ({ data }) => {
      if (worker.current !== active || generationAtSpawn !== generation.current) return
      if (data.type === 'ready') { clearTimeout(bootTimer); setPhase('ready'); return }
      if (data.type === 'fatal') { fail(data.message); return }
      if (data.id !== nextRunId.current) return
      if (data.type === 'event') {
        const event: ForensicsEvent = data.event
        currentEvents.current.push(event)
        const delay = Math.max(0, tailDelay.current - (Date.now() - started.current))
        timers.current.push(setTimeout(() => { setEvents(previous => [...previous, event]); setLine(event.line) }, delay))
        tailDelay.current += delays[event.kind] ?? 240
      }
      if (data.type === 'done') {
        // Keep semantic events in order, including events emitted before a Python
        // exception. Completion is assessed only after playback has finished.
        const delay = Math.max(0, tailDelay.current - (Date.now() - started.current))
        const outcome = { events: [...currentEvents.current], error: data.error as string | undefined }
        timers.current.push(setTimeout(() => {
          clearTimeout(watchdog.current)
          setError(data.error ?? null)
          setLine(data.line ?? null)
          setPhase('ready')
          resolveRun.current?.(outcome)
          resolveRun.current = null
        }, delay))
      }
    }
    active.postMessage({ type: 'init' })
    return () => { clearTimeout(bootTimer); active.terminate() }
  }, [])
  const watchdog = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    const cleanup = spawn()
    return () => { cleanup(); worker.current?.terminate(); worker.current = null; clearTimers(); clearTimeout(watchdog.current); resolveRun.current?.({ events: [], error: 'Avbruten' }); resolveRun.current = null }
  }, [spawn])

  const restart = useCallback(() => {
    generation.current += 1
    clearTimers()
    clearTimeout(watchdog.current)
    worker.current?.terminate()
    resolveRun.current?.({ events: [], error: 'Körningen avbröts.' })
    resolveRun.current = null
    setError(null)
    setLine(null)
    setEvents([])
    spawn()
  }, [spawn])

  const run = useCallback((code: string, context: Partial<InvestigationState>) => {
    if (!worker.current || phase !== 'ready') return Promise.resolve({ events: [], error: 'Python är inte redo.' })
    clearTimers()
    setEvents([])
    setError(null)
    setLine(null)
    setPhase('running')
    currentEvents.current = []
    tailDelay.current = 0
    started.current = Date.now()
    const id = ++nextRunId.current
    return new Promise<RunOutcome>(resolve => {
      resolveRun.current = resolve
      watchdog.current = setTimeout(() => {
        clearTimers()
        worker.current?.terminate()
        setError('Koden körde för länge. Kontrollera att en loop kan avslutas och starta om motorn.')
        setLine(null)
        setPhase('error')
        resolveRun.current?.({ events: [], error: 'Körningen tog för lång tid.' })
        resolveRun.current = null
      }, 20000)
      worker.current!.postMessage({ type: 'run', id, code, context })
    })
  }, [phase])

  const clearView = () => {
    if (phase === 'running') return
    setEvents([])
    setLine(null)
    if (phase !== 'error') setError(null)
  }

  return { phase, events, error, line, run, restart, clearView }
}
