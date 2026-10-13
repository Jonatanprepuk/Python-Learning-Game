import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve('vite/package.json'))('esbuild')
const bundle = await build({
  stdin: {
    contents: 'export { LEVELS, WORLDS } from "./src/levels/levels"; export { DATA_LEVELS, DATA_EXERCISES } from "./src/levels/dataLevels"; export { buildSource } from "./src/engine/pyBootstrap"; export { snapshotEqual } from "./src/engine/snapshotEqual"; export * from "./src/engine/simulate";',
    resolveDir: process.cwd()
  },
  bundle: true, write: false, platform: 'node', format: 'esm'
})
const { LEVELS, WORLDS, DATA_LEVELS: levels, DATA_EXERCISES: exercises, buildSource, snapshotEqual,
  createInitialState, applyMove, applyTurnLeft, applyTurnRight, applyActivate, checkWin } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
)
assert.equal(levels.length, 20)
assert.equal(new Set(LEVELS.map(level => level.id)).size, LEVELS.length)
assert.deepEqual(levels.map(level => level.id), Array.from({ length: 20 }, (_, i) => i + 43))
assert.equal(new Set(levels.map(level => JSON.stringify(level.tileGrid))).size, 20)
assert.equal(WORLDS.find(world => world.id === 'datacentret').status, 'available')
assert.equal(snapshotEqual({ a: 1, b: [2, { c: true }] }, { b: [2, { c: true }], a: 1 }), true)
for (const [actual, expected] of [[true, 1], ['1', 1], [[1, 2], [2, 1]], [{ a: 1, b: 2 }, { a: 1 }], [{ a: [1, 3] }, { a: [1, 2] }], [undefined, null], [{}, { a: null }]]) {
  assert.equal(snapshotEqual(actual, expected), false)
}

const solutions = levels.map(level => level.hints.at(-1).replace(/^Prova:\n/, ''))
const variants = []
const cases = (room, rows) => rows.forEach(([inputs, expected]) => variants.push({ room, inputs, expected }))
cases(2, [[{ servers: ['a', 'b', 'c'] }, { primary: 'a', backup: 'c' }]])
cases(4, [[{ jobs: [] }, { jobs: ['bilder', 'loggar'], count: 2 }]])
cases(5, [[{ jobs: ['scan'] }, { current: 'scan', jobs: ['rapport'], remaining: 1 }]])
cases(6, [[{ logs: ['a', 'b', 'c', 'd'] }, { logs: ['a', 'b', 'c', 'd'], recent: ['b', 'c', 'd'], archived: ['a', 'b'] }]])
cases(7, [[{ loads: [59, 59] }, { average: 59, status: 'NORMAL' }], [{ loads: [60] }, { average: 60, status: 'HÖG' }]])
cases(8, [[{ temperatures: [] }, { hot: [], hot_count: 0 }], [{ temperatures: [69, 70, 70, 71] }, { hot: [70, 70, 71], hot_count: 3 }]])
cases(10, [[{ server: { name: 'x', capacity: 80, used: 70 } }, { server: { name: 'x', capacity: 130, used: 70 }, free: 60 }]])
cases(12, [[{ config: {} }, { effective: { retries: 3, timeout: 30 } }], [{ config: { retries: 0, timeout: 0 } }, { effective: { retries: 0, timeout: 0 } }]])
cases(13, [[{ capacity: { a: 50, b: 49 } }, { total: 99, low: ['b'] }], [{ capacity: {} }, { total: 0, low: [] }]])
cases(14, [[{ events: [] }, { counts: {} }], [{ events: ['ny', 'ny', 'annan'] }, { counts: { ny: 2, annan: 1 } }]])
cases(16, [[{ servers: [] }, { ready: [] }], [{ servers: [{ name: 'a', online: true, load: 70 }, { name: 'b', online: true, load: 71 }, { name: 'c', online: false, load: 0 }] }, { ready: ['a'] }]])
cases(17, [[{ racks: [[], [70, 71]] }, { totals: [0, 141], hot_count: 1 }], [{ racks: [] }, { totals: [], hot_count: 0 }]])
cases(18, [[{ jobs: [] }, { grouped: {} }], [{ jobs: [{ server: 'x', task: 'a' }, { server: 'x', task: 'a' }] }, { grouped: { x: ['a', 'a'] } }]])
cases(19, [[{ config: { ports: [], mode: 'live' } }, { config: { ports: [], mode: 'live' }, trial: { ports: [8080], mode: 'test' } }]])
cases(20, [
  [{ jobs: [] }, { report: { deployed: [], waiting: [], skipped: [], totals: {}, remaining: 100 } }],
  [{ budget: 0 }, { deployed: [], waiting: ['backup', 'scan', 'analys', 'cache'], skipped: ['index'], remaining: 0, totals: {} }],
  [{ budget: 30 }, { deployed: ['backup'], remaining: 0, totals: { drift: 30 }, waiting: ['scan', 'analys', 'cache'] }],
  [{ jobs: [{ name: 'dyr', team: 'x', cost: 101, enabled: true }, { name: 'gratis', team: 'x', cost: 0, enabled: true }, { name: 'av', team: 'y', cost: 0, enabled: false }] }, { deployed: ['gratis'], waiting: ['dyr'], skipped: ['av'], totals: { x: 0 }, remaining: 100 }]
])
const pythonValue = value => {
  if (typeof value === 'boolean') return value ? 'True' : 'False'
  if (Array.isArray(value)) return `[${value.map(pythonValue).join(', ')}]`
  if (value && typeof value === 'object') return `{${Object.entries(value).map(([key, item]) => `${JSON.stringify(key)}: ${pythonValue(item)}`).join(', ')}}`
  return JSON.stringify(value)
}
const alternateSolutions = variants.map(({ room, inputs }) => {
  const exercise = exercises[room - 1]
  let setup = exercise.setup
  for (const [name, value] of Object.entries(inputs)) {
    const pattern = new RegExp(`^${name} = .+$`, 'm')
    assert.match(setup, pattern)
    setup = setup.replace(pattern, `${name} = ${pythonValue(value)}`)
  }
  return `${setup}\n${exercise.solution}`
})
const python = `import json, sys
results = []
for source in json.load(sys.stdin):
    events = []
    scope = {name: (lambda *args: None) for name in ['__step_call', '__step_return', '__step_print']}
    scope['__step_state'] = lambda line, snapshot: events.append({'type': 'state', 'variables': json.loads(snapshot)})
    for action in ['move', 'turn_left', 'turn_right', 'activate']:
        scope['__step_' + action] = lambda line, action=action: events.append({'type': action})
    exec(source, scope)
    results.append({'variables': scope['__snapshot_globals'](scope), 'events': events})
json.dump(results, sys.stdout)
`
const snippets = [...solutions, ...levels.map(level => level.starterCode), ...alternateSolutions]
const result = spawnSync(process.env.DATA_TEST_PYTHON ?? 'python', ['-X', 'utf8', '-c', python], {
  input: JSON.stringify(snippets.map(buildSource)), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024
})
assert.equal(result.status, 0, result.stderr || result.error?.message)
const outcomes = JSON.parse(result.stdout)
const context = variables => ({ variables, consoleLines: [], ranWithoutError: true, usedInput: false })
function replay(level, events) {
  let state = createInitialState(level.tileGrid, level.playerStart, level.mechanisms)
  let variables = {}
  let bumps = 0
  for (const event of events) {
    if (event.type === 'state') variables = event.variables
    if (event.type === 'move') {
      state = applyMove(state, level.tileGrid, false)
      if (state.bumped) bumps++
    }
    if (event.type === 'turn_left') state = applyTurnLeft(state)
    if (event.type === 'turn_right') state = applyTurnRight(state)
    if (event.type === 'activate') state = applyActivate(state, variables)
  }
  return { won: checkWin(state, level.tileGrid), bumps }
}
levels.forEach((level, index) => {
  const outcome = outcomes[index]
  assert.equal(level.successCheck(context(outcome.variables)), true, level.title)
  assert.equal(level.successCheck({ ...context(outcome.variables), ranWithoutError: false }), false)
  assert.equal(level.successCheck(context(outcomes[index + 20].variables)), false, `${level.title}: starter`)
  assert.deepEqual(replay(level, outcome.events), { won: true, bumps: 0 }, `${level.title}: route`)
  assert.equal(replay(level, outcome.events.filter(event => event.type !== 'activate')).won, false)
  const initial = createInitialState(level.tileGrid, level.playerStart, level.mechanisms)
  assert.deepEqual(applyActivate(initial, outcome.variables).activated, [], 'Cannot activate remotely')
  const atPanel = { ...initial, robot: { ...initial.robot, ...level.mechanisms[0].station } }
  assert.deepEqual(applyActivate(atPanel, outcome.variables).activated, ['A'])
  for (const [name, value] of Object.entries(exercises[index].expected)) {
    const wrong = Array.isArray(value) ? [...value, 'extra'] : value && typeof value === 'object' ? { ...value, extra: 1 } : null
    const variables = { ...outcome.variables, [name]: wrong }
    assert.equal(level.successCheck(context(variables)), false, `${level.title}: wrong ${name}`)
    assert.deepEqual(applyActivate(atPanel, variables).activated, [], `${level.title}: wrong data stays locked`)
    const missing = { ...outcome.variables }
    delete missing[name]
    assert.equal(level.successCheck(context(missing)), false, `${level.title}: missing ${name}`)
  }
})
variants.forEach(({ room, expected }, index) => {
  for (const [name, value] of Object.entries(expected)) {
    assert.deepEqual(outcomes[40 + index].variables[name], value, `Room ${room}, case ${index + 1}: ${name}`)
  }
})
console.log(`PASS: 20 data levels, 20 distinct routes, locked gates, deep comparisons and ${variants.length} alternative scenarios.`)
