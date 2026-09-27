import { useCallback, useEffect, useRef, useState } from 'react'
import type { FriendlyError, LevelDefinition, SimWorldState, SnapshotValue, TileKind, TraceStep } from '../types'
import { createInitialState, checkWin } from '../engine/simulate'
import { usePyodideRunner } from './usePyodideRunner'
import { mazeKey, nextUniqueMaze } from '../levels/loopMaze'

export type RunPhase = 'idle' | 'running' | 'paused' | 'awaiting_input' | 'success' | 'failed' | 'error'

interface TracePlayback {
  token: number
  paused: boolean
  advance: () => void
}

const BASE_STEP_DELAY_MS = 420

export function useLevelSession(level: LevelDefinition) {
  const { status: engineStatus, run } = usePyodideRunner()

  const [code, setCode] = useState(level.starterCode)
  const [completion, setCompletion] = useState<{ levelId: number; run: number } | null>(null)
  const [mazeGrid, setMazeGrid] = useState(level.tileGrid)
  const activeGrid = level.randomMaze ? mazeGrid : level.tileGrid
  const [worldState, setWorldState] = useState<SimWorldState>(() =>
    createInitialState(level.tileGrid, level.playerStart, level.mechanisms)
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
  const [failureReason, setFailureReason] = useState<string | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [debugProgress, setDebugProgress] = useState({ current: 0, total: 0 })

  const runToken = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputsRef = useRef<string[]>([])
  const consoleRef = useRef<string[]>([])
  const seenMazes = useRef(new Set<string>())
  const playbackRef = useRef<TracePlayback | null>(null)
  const debugModeRef = useRef(false)
  const speedRef = useRef(speed)
  speedRef.current = speed

  // Reset all per-level state whenever the active level changes. Keyed on
  // level.id (not the whole object) so that a level whose tileGrid mutates in
  // place while staying "the same level" — e.g. the Playground's editable
  // grid — doesn't wipe the player's code/console every time a tile changes.
  useEffect(() => {
    runToken.current += 1
    if (timerRef.current) clearTimeout(timerRef.current)
    playbackRef.current = null
    debugModeRef.current = false
    inputsRef.current = []
    consoleRef.current = []
    setCode(level.starterCode)
    setCompletion(null)
    setMazeGrid(level.tileGrid)
    seenMazes.current = level.randomMaze ? new Set([mazeKey(level.tileGrid)]) : new Set()
    setWorldState(createInitialState(level.tileGrid, level.playerStart, level.mechanisms))
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
    setFailureReason(null)
    setDebugMode(false)
    setDebugProgress({ current: 0, total: 0 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id])

  // Re-derive worldState from the current level.tileGrid without touching
  // code/console/phase — used after editing the Playground's grid so a
  // freshly-placed coin doesn't render as "already collected".
  const refreshWorld = useCallback(() => {
    setWorldState(createInitialState(level.tileGrid, level.playerStart, level.mechanisms))
  }, [level])

  const stop = useCallback(() => {
    runToken.current += 1
    if (timerRef.current) clearTimeout(timerRef.current)
    playbackRef.current = null
    debugModeRef.current = false
    setPhase('idle')
    setDebugMode(false)
    setHighlightedLine(null)
    setPendingPrompt(null)
  }, [])

  const reset = useCallback(() => {
    stop()
    inputsRef.current = []
    consoleRef.current = []
    setCode(level.starterCode)
    setWorldState(createInitialState(activeGrid, level.playerStart, level.mechanisms))
    setError(null)
    setLastActionNote(null)
    setLastStep(null)
    setConsoleLines([])
    setFinalVariables(null)
    setLastCall(null)
    setLastReturn(null)
    setCurrentVariables(null)
    setFailureReason(null)
    setCompletion(null)
    setDebugProgress({ current: 0, total: 0 })
  }, [level, activeGrid, stop])

  const finishRun = useCallback(
    (steps: TraceStep[], finalVars: Record<string, SnapshotValue> | undefined, grid: TileKind[][], hasIfStatement?: boolean, movedInFor?: boolean, movedInWhile?: boolean) => {
      const finalState = steps.length ? steps[steps.length - 1].state : createInitialState(grid, level.playerStart, level.mechanisms)
      const variables = finalVars ?? {}
      let won: boolean
      const loopSatisfied = !level.requiredLoop || (level.requiredLoop === 'for' ? movedInFor : movedInWhile)
      const ifSatisfied = !level.requireIfStatement || hasIfStatement
      if (level.successCheck) {
        // Robot levels with a successCheck validate BOTH the code's result and
        // that the robot actually reached the goal (e.g. a door-unlock room).
        won =
          level.successCheck({
            hasIfStatement,
            variables,
            consoleLines: consoleRef.current,
            ranWithoutError: true,
            usedInput: inputsRef.current.length > 0
          }) && (level.type !== 'robot' || checkWin(finalState, grid, level.requireAllResources))
      } else if (level.type === 'robot') {
        won = checkWin(finalState, grid, level.requireAllResources)
      } else {
        won = true
      }
      won = won && Boolean(loopSatisfied) && Boolean(ifSatisfied)
      setFailureReason(!loopSatisfied ? `Använd ${level.requiredLoop}-loopen för att faktiskt flytta roboten.` : !ifSatisfied ? 'Använd en if-sats för att välja vad roboten ska göra.' : null)
      setFinalVariables(finalVars ?? null)
      // The last line-level 'state' snapshot never captures the very last
      // statement's own effect (the trace event fires before a line runs),
      // so settle on the guaranteed-complete end-of-run snapshot here.
      if (finalVars) setCurrentVariables(finalVars)
      setPhase(won ? 'success' : 'failed')
      setCompletion(won ? { levelId: level.id, run: runToken.current } : null)
      setHighlightedLine(null)
    },
    [level]
  )

  const playTrace = useCallback(
    (steps: TraceStep[], token: number, onDone: () => void, debug: boolean) => {
      let index = 0
      let visibleIndex = 0
      const total = steps.filter(step => step.type !== 'state').length
      const playback: TracePlayback = { token, paused: debug, advance: () => {} }
      playbackRef.current = playback
      setDebugProgress({ current: 0, total })
      if (debug) {
        setHighlightedLine(steps.find(step => step.type !== 'state')?.line ?? null)
        setPhase('paused')
      }

      const advance = () => {
        if (runToken.current !== token || playbackRef.current !== playback) return
        timerRef.current = null
        // During debugging, one click advances to the next action or sensor.
        // Snapshots in between still update variables, but do not consume a step.
        if (playback.paused || level.world === 'produktionshallen') {
          while (index < steps.length && steps[index].type === 'state') {
            const variables = steps[index].variables
            if (variables) setCurrentVariables(variables)
            index += 1
          }
        }
        if (index >= steps.length) {
          playbackRef.current = null
          onDone()
          return
        }

        const s = steps[index]
        setWorldState(s.state)
        setHighlightedLine(s.line)
        setLastActionNote(s.note ?? null)
        setLastStep(s)
        if ((s.type === 'print' || s.type === 'input') && s.output !== undefined) {
          consoleRef.current = [...consoleRef.current, s.output]
          setConsoleLines(consoleRef.current)
        }
        if (s.type === 'call' && s.callInfo) {
          setLastCall(s.callInfo)
          setLastReturn(null)
        }
        if (s.type === 'return' && s.returnInfo) setLastReturn(s.returnInfo)
        if (s.type === 'state' && s.variables) setCurrentVariables(s.variables)
        if (s.type !== 'state') {
          visibleIndex += 1
          setDebugProgress({ current: visibleIndex, total })
        }
        index += 1
        if (!playback.paused) {
          const delay = (level.world === 'produktionshallen' ? 90 : BASE_STEP_DELAY_MS) / speedRef.current
          timerRef.current = setTimeout(advance, delay)
        }
      }

      playback.advance = advance
      if (!debug) advance()
    },
    [level.world]
  )

  const execute = useCallback(
    async (inputs: string[], token: number, grid: TileKind[][], debug: boolean) => {
      const result = await run({
        code,
        tileGrid: grid,
        playerStart: level.playerStart,
        inputs,
        doorCondition: level.doorCondition, mechanisms: level.mechanisms
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
        }, debug)
        return
      }

      playTrace(result.steps, token, () => finishRun(result.steps, result.finalVariables, grid, result.hasIfStatement, result.movedInFor, result.movedInWhile), debug)
    },
    [code, level, run, playTrace, finishRun]
  )

  const startRun = useCallback((debug: boolean) => {
    if (phase === 'running' || phase === 'paused' || phase === 'awaiting_input') return
    runToken.current += 1
    const token = runToken.current
    debugModeRef.current = debug
    setDebugMode(debug)
    setDebugProgress({ current: 0, total: 0 })
    const grid = level.randomMaze ? nextUniqueMaze(seenMazes.current) : activeGrid
    if (level.randomMaze) setMazeGrid(grid)
    inputsRef.current = []
    consoleRef.current = []
    setPhase('running')
    setError(null)
    setPendingPrompt(null)
    setHighlightedLine(null)
    setLastStep(null)
    setLastActionNote(null)
    setFinalVariables(null)
    setLastCall(null)
    setLastReturn(null)
    setCurrentVariables(null)
    setFailureReason(null)
    setCompletion(null)
    setWorldState(createInitialState(grid, level.playerStart, level.mechanisms))
    setRunCount((c) => c + 1)
    setConsoleLines([])
    void execute([], token, grid, debug)
  }, [phase, level, activeGrid, execute])

  const runCode = useCallback(() => startRun(false), [startRun])
  const debugCode = useCallback(() => startRun(true), [startRun])

  const pause = useCallback(() => {
    const playback = playbackRef.current
    if (!playback || phase !== 'running') return
    playback.paused = true
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    debugModeRef.current = true
    setDebugMode(true)
    setPhase('paused')
  }, [phase])

  const resume = useCallback(() => {
    const playback = playbackRef.current
    if (!playback || phase !== 'paused') return
    playback.paused = false
    setPhase('running')
    playback.advance()
  }, [phase])

  const stepOnce = useCallback(() => {
    const playback = playbackRef.current
    if (!playback || phase !== 'paused') return
    playback.advance()
  }, [phase])

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
      setWorldState(createInitialState(activeGrid, level.playerStart, level.mechanisms))
      setConsoleLines([])
      void execute(inputsRef.current, token, activeGrid, debugModeRef.current)
    },
    [phase, level, activeGrid, execute]
  )

  const revealNextHint = useCallback(() => {
    setHintIndex((i) => Math.min(i + 1, level.hints.length))
  }, [level.hints.length])

  return {
    engineStatus,
    code,
    completion,
    setCode,
    worldState,
    activeGrid,
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
    failureReason,
    debugMode,
    debugProgress,
    canPause: phase === 'running' && playbackRef.current !== null,
    runCode,
    debugCode,
    pause,
    resume,
    stepOnce,
    stop,
    reset,
    refreshWorld
  }
}
