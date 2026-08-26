/// <reference lib="webworker" />
import { PREAMBLE_LINE_COUNT, buildSource } from './pyBootstrap'
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
import type { SimWorldState, StepType, TileKind, TraceStep, WorkerRequest, WorkerResponse } from '../types'

const ctx = self as unknown as DedicatedWorkerGlobalScope

const PYODIDE_VERSION = 'v0.26.4'
const INDEX_URL = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`

const MAX_STEPS = 400

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

function runUserCode(code: string, grid: TileKind[][], playerStart: { x: number; y: number; direction: import('../types').Direction }) {
  let state: SimWorldState = createInitialState(grid, playerStart)
  const steps: TraceStep[] = []
  let stepCount = 0

  function guard() {
    stepCount += 1
    if (stepCount > MAX_STEPS) {
      throw new Error('INFINITE_LOOP: too many robot actions, likely an infinite loop')
    }
  }

  function pushStep(type: StepType, rawLine: number, result?: boolean) {
    const line = Math.max(1, rawLine - PREAMBLE_LINE_COUNT)
    steps.push({
      line,
      type,
      state,
      result,
      note: state.message
    })
  }

  pyodide.globals.set('__step_move', (rawLine: number) => {
    guard()
    state = applyMove(state, grid)
    pushStep('move', rawLine)
  })
  pyodide.globals.set('__step_turn_left', (rawLine: number) => {
    guard()
    state = applyTurnLeft(state)
    pushStep('turn_left', rawLine)
  })
  pyodide.globals.set('__step_turn_right', (rawLine: number) => {
    guard()
    state = applyTurnRight(state)
    pushStep('turn_right', rawLine)
  })
  pyodide.globals.set('__step_collect', (rawLine: number) => {
    guard()
    state = applyCollect(state)
    pushStep('collect', rawLine)
  })
  pyodide.globals.set('__step_can_move', (rawLine: number) => {
    guard()
    const result = queryCanMove(state, grid)
    pushStep('can_move', rawLine, result)
    return result
  })
  pyodide.globals.set('__step_resource_ahead', (rawLine: number) => {
    guard()
    const result = queryResourceAhead(state, grid)
    pushStep('resource_ahead', rawLine, result)
    return result
  })
  pyodide.globals.set('__step_at_goal', (rawLine: number) => {
    guard()
    const result = queryAtGoal(state, grid)
    pushStep('at_goal', rawLine, result)
    return result
  })

  const source = buildSource(code)
  pyodide.runPython(source)

  return steps
}

async function handleRun(req: WorkerRequest) {
  if (!pyodide || !req.level || req.code === undefined) {
    post({ id: req.id, type: 'result', result: { ok: false, steps: [] } })
    return
  }
  try {
    const steps = runUserCode(req.code, req.level.tileGrid, req.level.playerStart)
    post({ id: req.id, type: 'result', result: { ok: true, steps } })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const friendly = translateError(message, PREAMBLE_LINE_COUNT)
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
