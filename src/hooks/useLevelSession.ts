import { useCallback, useEffect, useRef, useState } from 'react'
import type { FriendlyError, LevelDefinition, SimWorldState, TraceStep } from '../types'
import { createInitialState, checkWin } from '../engine/simulate'
import { usePyodideRunner } from './usePyodideRunner'

export type RunPhase = 'idle' | 'running' | 'success' | 'failed' | 'error'

const BASE_STEP_DELAY_MS = 420

export function useLevelSession(level: LevelDefinition) {
  const { status: engineStatus, run } = usePyodideRunner()

  const [code, setCode] = useState(level.starterCode)
  const [worldState, setWorldState] = useState<SimWorldState>(() =>
    createInitialState(level.tileGrid, level.playerStart)
  )
  const [phase, setPhase] = useState<RunPhase>('idle')
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null)
  const [error, setError] = useState<FriendlyError | null>(null)
  const [runCount, setRunCount] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [hintIndex, setHintIndex] = useState(0)
  const [lastActionNote, setLastActionNote] = useState<string | null>(null)
  const [lastStep, setLastStep] = useState<TraceStep | null>(null)

  const runToken = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Reset all per-level state whenever the active level changes.
  useEffect(() => {
    runToken.current += 1
    if (timerRef.current) clearTimeout(timerRef.current)
    setCode(level.starterCode)
    setWorldState(createInitialState(level.tileGrid, level.playerStart))
    setPhase('idle')
    setHighlightedLine(null)
    setError(null)
    setRunCount(0)
    setHintIndex(0)
    setLastActionNote(null)
    setLastStep(null)
  }, [level])

  const stop = useCallback(() => {
    runToken.current += 1
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase('idle')
    setHighlightedLine(null)
  }, [])

  const reset = useCallback(() => {
    stop()
    setCode(level.starterCode)
    setWorldState(createInitialState(level.tileGrid, level.playerStart))
    setError(null)
    setLastActionNote(null)
    setLastStep(null)
  }, [level, stop])

  const playTrace = useCallback(
    (steps: TraceStep[], token: number) => {
      const delay = BASE_STEP_DELAY_MS / speed
      let i = 0

      const step = () => {
        if (runToken.current !== token) return
        if (i >= steps.length) {
          const finalState = steps.length
            ? steps[steps.length - 1].state
            : createInitialState(level.tileGrid, level.playerStart)
          const won = checkWin(finalState, level.tileGrid, level.requireAllResources)
          setPhase(won ? 'success' : 'failed')
          setHighlightedLine(null)
          return
        }
        const s = steps[i]
        setWorldState(s.state)
        setHighlightedLine(s.line)
        setLastActionNote(s.note ?? null)
        setLastStep(s)
        i += 1
        timerRef.current = setTimeout(step, delay)
      }

      step()
    },
    [level, speed]
  )

  const runCode = useCallback(async () => {
    if (phase === 'running') return
    runToken.current += 1
    const token = runToken.current
    setPhase('running')
    setError(null)
    setWorldState(createInitialState(level.tileGrid, level.playerStart))
    setRunCount((c) => c + 1)

    const result = await run({
      code,
      tileGrid: level.tileGrid,
      playerStart: level.playerStart
    })

    if (runToken.current !== token) return

    if (!result.ok) {
      setPhase('error')
      setError(
        result.error ?? {
          title: 'Något blev fel',
          message: 'Koden kunde inte köras just nu. Försök igen.',
          technical: 'unknown'
        }
      )
      setHighlightedLine(result.error?.line ?? null)
      return
    }

    playTrace(result.steps, token)
  }, [code, level, phase, run, playTrace])

  const revealNextHint = useCallback(() => {
    setHintIndex((i) => Math.min(i + 1, level.hints.length))
  }, [level.hints.length])

  return {
    engineStatus,
    code,
    setCode,
    worldState,
    phase,
    highlightedLine,
    error,
    runCount,
    speed,
    setSpeed,
    hintIndex,
    revealNextHint,
    lastActionNote,
    lastStep,
    runCode,
    stop,
    reset
  }
}
