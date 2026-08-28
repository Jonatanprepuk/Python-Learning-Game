/// <reference lib="webworker" />
import { SNAPSHOT_SOURCE, buildSource } from './pyBootstrap'
import { translateError } from './errors'
import {
  applyCollect,
  applyMove,
  applyTurnLeft,
  applyTurnRight,
  createInitialState,
  queryAtGoal,
  queryCanMove,
  queryResourceAhead
} from './simulate'
import type { SimWorldState, SnapshotValue, StepType, TileKind, TraceStep, WorkerRequest, WorkerResponse } from '../types'

const ctx = self as unknown as DedicatedWorkerGlobalScope

const PYODIDE_VERSION = 'v0.26.4'
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`

const MAX_STEPS = 400
const INPUT_NEEDED_PREFIX = '__INPUT_NEEDED__:'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pyodide: any = null

function post(msg: WorkerResponse) {
  ctx.postMessage(msg)
}

async function init() {
  try {
    // @vite-ignore -- intentionally loaded from CDN at runtime, not bundled
    const mod = await import(/* @vite-ignore */ `${INDEX_URL}pyodide.mjs`)
    pyodide = await mod.loadPyodide({ indexURL: INDEX_URL })
    post({ id: 0, type: 'ready' })
  } catch (err) {
    post({ id: 0, type: 'fatal', message: String(err) })
  }
}

interface RunOutcome {
  steps: TraceStep[]
  finalVariables?: Record<string, SnapshotValue>
  awaitingInput?: { prompt: string }
}

function runUserCode(
  code: string,
  grid: TileKind[][],
  playerStart: { x: number; y: number; direction: import('../types').Direction },
  inputs: string[]
): RunOutcome {
  let state: SimWorldState = createInitialState(grid, playerStart)
  const steps: TraceStep[] = []
  let stepCount = 0
  let inputIndex = 0

  function guard() {
    stepCount += 1
    if (stepCount > MAX_STEPS) {
      throw new Error('INFINITE_LOOP: too many robot actions, likely an infinite loop')
    }
  }

  function pushStep(
    type: StepType,
    rawLine: number,
    result?: boolean,
    output?: string,
    callInfo?: TraceStep['callInfo'],
    returnInfo?: TraceStep['returnInfo'],
    variables?: TraceStep['variables']
  ) {
    // The player's code runs as its own compiled unit (see buildSource), so
    // _getframe(1).f_lineno is already the player's own 1-indexed line number.
    const line = Math.max(1, rawLine)
    steps.push({
      line,
      type,
      state,
      result,
      note: state.message,
      output,
      callInfo,
      returnInfo,
      variables
    })
  }

  // Run each execution in its own fresh globals namespace so variables never
  // leak between runs or between levels (the worker/pyodide instance is reused).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const globals: any = pyodide.toPy({})

  try {
    globals.set('__step_move', (rawLine: number) => {
      guard()
      state = applyMove(state, grid)
      pushStep('move', rawLine)
    })
    globals.set('__step_turn_left', (rawLine: number) => {
      guard()
      state = applyTurnLeft(state)
      pushStep('turn_left', rawLine)
    })
    globals.set('__step_turn_right', (rawLine: number) => {
      guard()
      state = applyTurnRight(state)
      pushStep('turn_right', rawLine)
    })
    globals.set('__step_collect', (rawLine: number) => {
      guard()
      state = applyCollect(state)
      pushStep('collect', rawLine)
    })
    globals.set('__step_can_move', (rawLine: number) => {
      guard()
      const result = queryCanMove(state, grid)
      pushStep('can_move', rawLine, result)
      return result
    })
    globals.set('__step_resource_ahead', (rawLine: number) => {
      guard()
      const result = queryResourceAhead(state, grid)
      pushStep('resource_ahead', rawLine, result)
      return result
    })
    globals.set('__step_at_goal', (rawLine: number) => {
      guard()
      const result = queryAtGoal(state, grid)
      pushStep('at_goal', rawLine, result)
      return result
    })
    globals.set('__step_print', (rawLine: number, text: string) => {
      guard()
      pushStep('print', rawLine, undefined, text)
    })
    // input() can't truly block here (no SharedArrayBuffer/COOP-COEP setup), so
    // the UI re-runs the whole script from scratch each time with one more
    // answer appended to `inputs`; once the queue runs out we raise a sentinel
    // that the caller turns into an "awaiting input" pause instead of an error.
    globals.set('__step_input', (rawLine: number, prompt: string) => {
      guard()
      if (inputIndex < inputs.length) {
        const answer = inputs[inputIndex]
        inputIndex += 1
        pushStep('input', rawLine, undefined, `${prompt}${answer}\n`)
        return answer
      }
      throw new Error(INPUT_NEEDED_PREFIX + prompt)
    })
    globals.set('__step_call', (rawLine: number, name: string, argsJson: string) => {
      guard()
      pushStep('call', rawLine, undefined, undefined, { name, args: JSON.parse(argsJson) })
    })
    globals.set('__step_return', (rawLine: number, name: string, valueJson: string) => {
      guard()
      pushStep('return', rawLine, undefined, undefined, undefined, { name, value: JSON.parse(valueJson) })
    })
    globals.set('__step_state', (rawLine: number, variablesJson: string) => {
      guard()
      pushStep('state', rawLine, undefined, undefined, undefined, undefined, JSON.parse(variablesJson))
    })

    const source = buildSource(code)
    try {
      pyodide.runPython(source, { globals })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      const idx = message.indexOf(INPUT_NEEDED_PREFIX)
      if (idx !== -1) {
        const prompt = message.slice(idx + INPUT_NEEDED_PREFIX.length).split('\n')[0]
        return { steps, awaitingInput: { prompt } }
      }
      throw err
    }

    const snapshotJson = pyodide.runPython(SNAPSHOT_SOURCE, { globals })
    const finalVariables = JSON.parse(snapshotJson) as Record<string, SnapshotValue>
    return { steps, finalVariables }
  } finally {
    globals.destroy()
  }
}

async function handleRun(req: WorkerRequest) {
  if (!pyodide || !req.level || req.code === undefined) {
    post({ id: req.id, type: 'result', result: { ok: false, steps: [] } })
    return
  }
  try {
    const { steps, finalVariables, awaitingInput } = runUserCode(
      req.code,
      req.level.tileGrid,
      req.level.playerStart,
      req.inputs ?? []
    )
    post({ id: req.id, type: 'result', result: { ok: true, steps, finalVariables, awaitingInput } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const friendly = translateError(message)
    post({
      id: req.id,
      type: 'result',
      result: { ok: false, steps: [], error: friendly }
    })
  }
}

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const req = event.data
  if (req.type === 'init') {
    await init()
  } else if (req.type === 'run') {
    await handleRun(req)
  }
}
