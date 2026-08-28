import { useCallback, useEffect, useRef, useState } from 'react'
import type { Direction, RunResult, TileKind, WorkerRequest, WorkerResponse } from '../types'

const RUN_TIMEOUT_MS = 10000

export type RunnerStatus = 'loading' | 'ready' | 'error'

interface RunArgs {
  code: string
  tileGrid: TileKind[][]
  playerStart: { x: number; y: number; direction: Direction }
  inputs?: string[]
}

export function usePyodideRunner() {
  const [status, setStatus] = useState<RunnerStatus>('loading')
  const workerRef = useRef<Worker | null>(null)
  const nextId = useRef(1)
  const pending = useRef<Map<number, (r: RunResult) => void>>(new Map())

  const spawnWorker = useCallback(() => {
    const worker = new Worker(new URL('../engine/pyodideWorker.ts', import.meta.url), {
      type: 'module'
    })
    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data
      if (msg.type === 'ready') {
        setStatus('ready')
      } else if (msg.type === 'fatal') {
        setStatus('error')
      } else if (msg.type === 'result' && msg.result) {
        const resolve = pending.current.get(msg.id)
        if (resolve) {
          pending.current.delete(msg.id)
          resolve(msg.result)
        }
      }
    }
    worker.onerror = () => {
      setStatus('error')
    }
    workerRef.current = worker
    setStatus('loading')
    const req: WorkerRequest = { id: 0, type: 'init' }
    worker.postMessage(req)
    return worker
  }, [])

  useEffect(() => {
    const worker = spawnWorker()
    return () => {
      worker.terminate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const run = useCallback(
    (args: RunArgs): Promise<RunResult> => {
      return new Promise((resolve) => {
        const worker = workerRef.current
        if (!worker) {
          resolve({ ok: false, steps: [], error: undefined, timedOut: false })
          return
        }
        const id = nextId.current++
        let settled = false

        const finish = (result: RunResult) => {
          if (settled) return
          settled = true
          pending.current.delete(id)
          resolve(result)
        }

        const timer = setTimeout(() => {
          if (settled) return
          // Runaway script that never calls back into our JS bridge
          // (e.g. `while True: pass`). Kill the worker and start fresh.
          worker.terminate()
          finish({
            ok: false,
            steps: [],
            timedOut: true,
            error: {
              title: 'Programmet körde för länge',
              message:
                'Koden tog för lång tid att köra, troligen en oändlig loop utan robot-kommandon. Kontrollera dina villkor i while-loopen.',
              technical: 'timeout'
            }
          })
          spawnWorker()
        }, RUN_TIMEOUT_MS)

        pending.current.set(id, (result) => {
          clearTimeout(timer)
          finish(result)
        })

        const req: WorkerRequest = {
          id,
          type: 'run',
          code: args.code,
          inputs: args.inputs,
          level: { tileGrid: args.tileGrid, playerStart: args.playerStart }
        }
        worker.postMessage(req)
      })
    },
    [spawnWorker]
  )

  return { status, run }
}
