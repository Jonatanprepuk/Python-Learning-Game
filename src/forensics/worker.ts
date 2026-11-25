/// <reference lib="webworker" />
import { FORENSICS_HELPERS, buildForensicsSource } from './python'

const scope = self as unknown as DedicatedWorkerGlobalScope
const indexURL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/'
let python: any

async function init() {
  try {
    const module = await import(/* @vite-ignore */ `${indexURL}pyodide.mjs`)
    python = await module.loadPyodide({ indexURL })
    scope.postMessage({ type: 'ready' })
  } catch {
    scope.postMessage({ type: 'fatal', message: 'Python kunde inte laddas. Kontrollera anslutningen och försök igen.' })
  }
}

scope.onmessage = async (message: MessageEvent) => {
  const { type, id, code, context } = message.data
  if (type === 'init') { await init(); return }
  if (type !== 'run' || !python) return
  const globals = python.toPy({})
  let count = 0
  try {
    globals.set('__bridge', (json: string) => {
      if (++count > 250) throw new Error('För många händelser. Begränsa din loop.')
      scope.postMessage({ type: 'event', id, event: JSON.parse(json) })
    })
    python.runPython(FORENSICS_HELPERS, { globals })
    python.runPython(buildForensicsSource(code, context), { globals })
    scope.postMessage({ type: 'done', id })
  } catch (error) {
    const technical = String(error)
    const frames = [...technical.matchAll(/File "<utredning>", line (\d+)/g)]
    const line = frames.length ? Number(frames[frames.length - 1][1]) : null
    const description = technical.trim().split('\n').filter(Boolean).slice(-1)[0]
    scope.postMessage({ type: 'done', id, error: description, line })
  } finally {
    globals.destroy()
  }
}
