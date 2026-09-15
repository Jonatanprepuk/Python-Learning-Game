import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

// Use Vite's compiler with both npm's flat and pnpm's isolated dependencies.
const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve('vite/package.json'))('esbuild')

const bundle = await build({
  stdin: {
    contents: 'export { LEVELS, WORLDS } from "./src/levels/levels"; export { buildSource, buildIfCheck } from "./src/engine/pyBootstrap"; export * from "./src/engine/simulate";',
    resolveDir: process.cwd()
  },
  bundle: true, write: false, platform: 'node', format: 'esm'
})
const { LEVELS, WORLDS, buildSource, buildIfCheck, createInitialState, evaluateDoorCondition, applyMove, applyTurnLeft, applyTurnRight, applyActivate, checkWin } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
)
const levels = LEVELS.filter(level => level.world === 'sakerhetssystemet')
assert.equal(levels.length, 20)
assert.equal(new Set(levels.map(level => JSON.stringify(level.tileGrid))).size, 20, 'Each map must be distinct')
assert.equal(new Set(LEVELS.map(level => level.id)).size, LEVELS.length)
assert.equal(WORLDS.find(world => world.id === 'sakerhetssystemet').status, 'available')

// Execute the worker's Python wrapper and replay its events through the real simulator.
const python = `import json, sys
results = []
for item in json.load(sys.stdin):
    events = []
    scope = {name: (lambda *args: None) for name in ['__step_state', '__step_call', '__step_return', '__step_print']}
    scope['__step_state'] = lambda line, snapshot: events.append({'type': 'state', 'variables': json.loads(snapshot)})
    for action in ['move', 'turn_left', 'turn_right', 'activate']:
        scope['__step_' + action] = lambda line, action=action: events.append({'type': action})
    check = item['check'].splitlines()
    exec('\\n'.join(check[:-1]), scope)
    has_if = eval(check[-1], scope)
    exec(item['source'], scope)
    results.append({'variables': scope['__snapshot_globals'](scope), 'hasIfStatement': has_if, 'events': events})
json.dump(results, sys.stdout)
`
const solutions = levels.map(level => level.hints.at(-1).replace(/^Prova:\n/, ''))
const snippets = [...solutions, ...levels.map(level => level.starterCode),
  '# if power == 1:\ntext = "if power == 1:"',
  'text = """\nif power == 1:\n    pass\n"""']
// Exercise the other decisions too: the map uses one fixed scenario, but the
// suggested Python must teach correct boundaries and nested fallback branches.
const branchCases = []
const cases = (room, entries) => entries.forEach(([inputs, expected]) => branchCases.push({ room, inputs, expected }))
cases(5, [[{ battery: 19 }, { charge_needed: true }], [{ battery: 20 }, { charge_needed: false }]])
cases(6, [[{ clearance: 2 }, { archive_open: false }], [{ clearance: 4 }, { archive_open: true }]])
cases(7, [[{ cargo_weight: 36 }, { load: 101, lift_ready: false }], [{ cargo_weight: 34 }, { load: 99, lift_ready: true }]])
cases(8, [[{ temperature: 41 }, { alarm_on: true, checked: true }], [{ temperature: 39 }, { alarm_on: false, checked: true }]])
cases(9, [[{ access_code: 'NOVA' }, { status: 'ÖPPEN' }], [{ access_code: 'OKÄND' }, { status: 'LÅST' }]])
cases(10, [[{ battery: 49 }, { patrol: 'LADDA' }], [{ battery: 79 }, { patrol: 'STARTA' }], [{ battery: 80 }, { patrol: 'LÅNG' }]])
cases(11, [[{ cell_a: 24 }, { energy: 59, mode: 'AV', shield_on: false }], [{ cell_a: 64 }, { energy: 99, mode: 'EKO', shield_on: true }], [{ cell_a: 65 }, { energy: 100, mode: 'FULLT', shield_on: true }]])
cases(12, [[{ energy: 54 }, { remaining: 9, route: 'NÖDSTOPP' }], [{ energy: 55 }, { remaining: 10, route: 'LADDA' }], [{ energy: 74 }, { remaining: 29, route: 'LADDA' }], [{ energy: 75 }, { remaining: 30, route: 'FORTSÄTT' }]])
cases(13, [[{ lasers: 0 }, { laser_mode: 'AV' }], [{ lasers: 1, power_each: 1 }, { laser_mode: 'AKTIV' }], [{ lasers: 5, power_each: 20 }, { laser_mode: 'AKTIV' }], [{ lasers: 5, power_each: 30 }, { laser_mode: 'KYL' }], [{ lasers: 1, power_each: 151 }, { laser_mode: 'NÖDSTOPP' }]])
cases(14, [[{ reserve: 87 }, { per_sensor: 14.5, sensor_status: 'SPARA' }], [{ reserve: 117 }, { per_sensor: 19.5, sensor_status: 'REDO' }], [{ reserve: 120 }, { per_sensor: 20, sensor_status: 'TURBO' }]])
cases(15, [[{ storage_open: false }, { patrol_ready: false }], [{ batteries: 15 }, { ready_guards: 3, patrol_ready: false }], [{ batteries: 16 }, { ready_guards: 4, patrol_ready: true }]])
cases(16, [[{ tick: 15 }, { remainder: 1, signal: 'VÄNTA' }], [{ signal_enabled: false }, { signal: 'AV' }], [{ signal_enabled: false, tick: 15 }, { signal: 'AV' }]])
cases(17, [[{ risk: 39 }, { status: 'LUGNT' }], [{ risk: 40 }, { status: 'VARNING' }], [{ risk: 79 }, { status: 'VARNING' }], [{ risk: 80 }, { status: 'LARM' }], [{ sensor_ok: false, risk: 100 }, { status: 'SENSORFEL' }]])
cases(18, [[{ power: 0 }, { fan_on: false, pump_on: false }], [{ temperature: 40 }, { fan_on: false, pump_on: true }], [{ water_level: 69 }, { fan_on: true, pump_on: false }], [{ temperature: 40, water_level: 69 }, { fan_on: false, pump_on: false }]])
cases(19, [[{ access_code: 'FEL' }, { card_ok: false, status: 'NEKAD', airlock_open: false }], [{ pressure: 6, oxygen: 18 }, { status: 'SÄNK TRYCKET', airlock_open: false }], [{ oxygen: 18 }, { status: 'FYLL SYRE', airlock_open: false }], [{ oxygen: 19 }, { status: 'ÖPPEN', airlock_open: true }]])
cases(20, [[{ access_code: 'FEL' }, { status: 'NEKAD', system_on: false }], [{ main_power: 79, risk: 80 }, { remaining: 49, status: 'LÅG ENERGI', system_on: false }], [{ risk: 80, coolant: 29 }, { status: 'LARM', system_on: false }], [{ coolant: 29 }, { status: 'BEHÖVER KYLNING', system_on: false }], [{ risk: 79, coolant: 30 }, { status: 'ONLINE', system_on: true }]])
const pythonValue = value => typeof value === 'boolean' ? value ? 'True' : 'False' : JSON.stringify(value)
const branchSnippets = branchCases.map(({ room, inputs }) => {
  let code = solutions[room - 1]
  for (const [name, value] of Object.entries(inputs)) {
    const assignment = new RegExp(`^${name} = .+$`, 'm')
    assert.match(code, assignment, `Room ${room}: input ${name} exists`)
    code = code.replace(assignment, `${name} = ${pythonValue(value)}`)
  }
  return code
})
const result = spawnSync(process.env.SECURITY_TEST_PYTHON ?? 'python', ['-X', 'utf8', '-c', python], {
  input: JSON.stringify([...snippets, ...branchSnippets].map(code => ({ source: buildSource(code), check: buildIfCheck(code) }))),
  encoding: 'utf8'
})
assert.equal(result.status, 0, result.stderr || result.error?.message)
const outcomes = JSON.parse(result.stdout)
const context = outcome => ({ ...outcome, consoleLines: [], ranWithoutError: true, usedInput: false })
function replay(level, events) {
  let state = createInitialState(level.tileGrid, level.playerStart, level.mechanisms)
  let variables = {}
  let bumps = 0
  for (const event of events) {
    if (event.type === 'state') variables = event.variables
    if (event.type === 'move') {
      state = applyMove(state, level.tileGrid, evaluateDoorCondition(level.doorCondition, variables))
      if (state.bumped) bumps++
    }
    if (event.type === 'activate') state = applyActivate(state, variables)
    if (event.type === 'turn_left') state = applyTurnLeft(state)
    if (event.type === 'turn_right') state = applyTurnRight(state)
  }
  return { won: checkWin(state, level.tileGrid), bumps }
}
levels.forEach((level, index) => {
  assert.equal(level.type, 'robot')
  assert.equal(level.tileGrid.length, level.height)
  assert.ok(level.tileGrid.every(row => row.length === level.width))
  const correct = context(outcomes[index])
  const initial = createInitialState(level.tileGrid, level.playerStart, level.mechanisms)
  assert.deepEqual(applyActivate(initial, correct.variables).activated, [], `${level.title}: remote activation forbidden`)
  for (const mechanism of level.mechanisms.filter(item => item.required !== false)) {
    const atPanel = { ...initial, robot: { ...initial.robot, ...mechanism.station } }
    assert.equal(applyActivate(atPanel, {}).activated.includes(mechanism.id), false, `${level.title}: wrong panel values`)
    assert.equal(applyActivate(atPanel, correct.variables).activated.includes(mechanism.id), true, `${level.title}: local activation`)
  }
  assert.equal(level.successCheck(correct), true, `${level.title}: solution`)
  assert.equal(level.successCheck(context(outcomes[index + 20])), false, `${level.title}: starter`)
  assert.equal(level.successCheck({ ...correct, hasIfStatement: false }), false, `${level.title}: missing if`)
  assert.equal(level.successCheck({ ...correct, ranWithoutError: false }), false)
  assert.equal(evaluateDoorCondition(level.doorCondition, {}), false)
  assert.equal(replay(level, outcomes[index].events.filter(event => event.type !== 'activate')).won, false, `${level.title}: activation required`)
  assert.deepEqual(replay(level, outcomes[index].events), { won: true, bumps: 0 }, `${level.title}: reach goal`)
  assert.equal(replay(level, outcomes[index + 20].events).won, false, `${level.title}: locked door`)
  assert.equal(replay(level, []).won, false, `${level.title}: code alone is not enough`)
  for (const name of level.watchVariables) {
    assert.equal(level.successCheck({ ...correct, variables: { ...correct.variables, [name]: null } }), false,
      `${level.title}: incorrect ${name}`)

  }
})
assert.equal(outcomes[40].hasIfStatement, false, 'Comment/string must not count as if')
assert.equal(outcomes[41].hasIfStatement, false, 'Multiline string must not count as if')
branchCases.forEach(({ room, inputs, expected }, index) => {
  for (const [name, value] of Object.entries(expected)) {
    assert.equal(outcomes[snippets.length + index].variables[name], value,
      `Room ${room}, ${JSON.stringify(inputs)}: ${name}`)
  }
})
// Preserve the numeric locks from chapter one, including strict numeric comparisons.
assert.equal(evaluateDoorCondition({ variable: 'energy', op: '==', value: 50 }, { energy: 50 }), true)
assert.equal(evaluateDoorCondition({ variable: 'energy', op: '>=', value: 50 }, { energy: true }), false)
assert.equal(evaluateDoorCondition({ variable: 'energy', op: '==', value: 50 }, { energy: '50' }), false)
assert.equal(evaluateDoorCondition({ all: [] }, {}), false)
console.log(`PASS: all 20 robot routes reach the goal without collisions; incomplete controls stay locked; Python solutions, if checks and ${branchCases.length} alternative/boundary scenarios pass.`)
