import { useCallback, useEffect, useRef, useState } from 'react'
import type { FriendlyError, LevelDefinition, SimWorldState, SnapshotValue, TraceStep } from '../types'
import { createInitialState, checkWin } from '../engine/simulate'
import { usePyodideRunner } from './usePyodideRunner'

export type RunPhase = 'idle' | 'running' | 'awaiting_input' | 'success' | 'failed' | 'error'

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
  const [consoleLines, setConsoleLines] = useState<string[]>([])
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null)
  const [finalVariables, setFinalVariables] = useState<Record<string, SnapshotValue> | null>(null)
  const [lastCall, setLastCall] = useState<TraceStep['callInfo'] | null>(null)
  const [lastReturn, setLastReturn] = useState<TraceStep['returnInfo'] | null>(null)
  const [currentVariables, setCurrentVariables] = useState<Record<string, SnapshotValue> | null>(null)

  const runToken = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputsRef = useRef<string[]>([])
  const consoleRef = useRef<string[]>([])

  // Reset all per-level state whenever the active level changes.
  useEffect(() => {
    runToken.current += 1
    if (timerRef.current) clearTimeout(timerRef.current)
    inputsRef.current = []
    consoleRef.current = []
    setCode(level.starterCode)
    setWorldState(createInitialState(level.tileGrid, level.playerStart))
    setPhase('idle')
    setHighlightedLine(null)
    setError(null)
    setRunCount(0)
    setHintIndex(0)
    setLastActionNote(null)
    setLastStep(null)
    setConsoleLines([])
    setPendingPrompt(null)
    setFinalVariables(null)
    setLastCall(null)
    setLastReturn(null)
    setCurrentVariables(null)
  }, [level])

  const stop = useCallback(() => {
    runToken.current += 1
    if (timerRef.current) clearTimeout(timerRef.current)
    setPhase('idle')
    setHighlightedLine(null)
    setPendingPrompt(null)
  }, [])

  const reset = useCallback(() => {
    stop()
    inputsRef.current = []
    consoleRef.current = []
    setCode(level.starterCode)
    setWorldState(createInitialState(level.tileGrid, level.playerStart))
    setError(null)
    setLastActionNote(null)
    setLastStep(null)
    setConsoleLines([])
    setFinalVariables(null)
    setLastCall(null)
    setLastReturn(null)
    setCurrentVariables(null)
  }, [level, stop])

  const finishRun = useCallback(
    (steps: TraceStep[], finalVars: Record<string, SnapshotValue> | undefined) => {
      const finalState = steps.length ? steps[steps.length - 1].state : createInitialState(level.tileGrid, level.playerStart)
      const variables = finalVars ?? {}
      let won: boolean
      if (level.type === 'robot') {
        won = checkWin(finalState, level.tileGrid, level.requireAllResources)
      } else if (level.successCheck) {
        won = level.successCheck({
          variables,
          consoleLines: consoleRef.current,
          ranWithoutError: true,
          usedInput: inputsRef.current.length > 0
        })
      } else {
        won = true
      }
      setFinalVariables(finalVars ?? null)
      // The last line-level 'state' snapshot never captures the very last
      // statement's own effect (the trace event fires before a line runs),
      // so settle on the guaranteed-complete end-of-run snapshot here.
      if (finalVars) setCurrentVariables(finalVars)
      setPhase(won ? 'success' : 'failed')
      setHighlightedLine(null)
    },
    [level]
  )

  const playTrace = useCallback(
    (steps: TraceStep[], token: number, onDone: () => void) => {
      const delay = BASE_STEP_DELAY_MS / speed
      let i = 0

      const step = () => {
        if (runToken.current !== token) return
        if (i >= steps.length) {
          onDone()
          return
        }
        const s = steps[i]
        setWorldState(s.state)
        setHighlightedLine(s.line)
        setLastActionNote(s.note ?? null)
        setLastStep(s)
        if (s.type === 'print' && s.output !== undefined) {
          const text = s.output
          consoleRef.current = [...consoleRef.current, text]
          setConsoleLines(consoleRef.current)
        }
        if (s.type === 'input' && s.output !== undefined) {
          const text = s.output
          consoleRef.current = [...consoleRef.current, text]
          setConsoleLines(consoleRef.current)
        }
        if (s.type === 'call' && s.callInfo) {
          setLastCall(s.callInfo)
          setLastReturn(null)
        }
        if (s.type === 'return' && s.returnInfo) {
          setLastReturn(s.returnInfo)
        }
        if (s.type === 'state' && s.variables) {
          setCurrentVariables(s.variables)
        }
        i += 1
        timerRef.current = setTimeout(step, delay)
      }

      step()
    },
    [speed]
  )

  const execute = useCallback(
    async (inputs: string[], token: number) => {
      const result = await run({
        code,
        tileGrid: level.tileGrid,
        playerStart: level.playerStart,
        inputs
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

      if (result.awaitingInput) {
        const prompt = result.awaitingInput.prompt
        playTrace(result.steps, token, () => {
          if (runToken.current !== token) return
          setPendingPrompt(prompt)
          setPhase('awaiting_input')
        })
        return
      }

      playTrace(result.steps, token, () => finishRun(result.steps, result.finalVariables))
    },
    [code, level, run, playTrace, finishRun]
  )

  const runCode = useCallback(() => {
    if (phase === 'running' || phase === 'awaiting_input') return
    runToken.current += 1
    const token = runToken.current
    inputsRef.current = []
    consoleRef.current = []
    setPhase('running')
    setError(null)
    setPendingPrompt(null)
    setFinalVariables(null)
    setLastCall(null)
    setLastReturn(null)
    setCurrentVariables(null)
    setWorldState(createInitialState(level.tileGrid, level.playerStart))
    setRunCount((c) => c + 1)
    setConsoleLines([])
    void execute([], token)
  }, [phase, level, execute])

  const submitInput = useCallback(
    (value: string) => {
      if (phase !== 'awaiting_input') return
      runToken.current += 1
      const token = runToken.current
      inputsRef.current = [...inputsRef.current, value]
      consoleRef.current = []
      setPendingPrompt(null)
      setPhase('running')
      setLastCall(null)
      setLastReturn(null)
      setCurrentVariables(null)
      setWorldState(createInitialState(level.tileGrid, level.playerStart))
      setConsoleLines([])
      void execute(inputsRef.current, token)
    },
    [phase, level, execute]
  )

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
    consoleLines,
    pendingPrompt,
    submitInput,
    finalVariables,
    lastCall,
    lastReturn,
    currentVariables,
    runCode,
    stop,
    reset
  }
}
