import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { build } from 'esbuild'

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
const result = spawnSync(process.env.SECURITY_TEST_PYTHON ?? 'python', ['-X', 'utf8', '-c', python], {
  input: JSON.stringify(snippets.map(code => ({ source: buildSource(code), check: buildIfCheck(code) }))),
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
// Preserve the numeric locks from chapter one, including strict numeric comparisons.
assert.equal(evaluateDoorCondition({ variable: 'energy', op: '==', value: 50 }, { energy: 50 }), true)
assert.equal(evaluateDoorCondition({ variable: 'energy', op: '>=', value: 50 }, { energy: true }), false)
assert.equal(evaluateDoorCondition({ variable: 'energy', op: '==', value: 50 }, { energy: '50' }), false)
assert.equal(evaluateDoorCondition({ all: [] }, {}), false)
console.log('PASS: all 20 robot routes reach the goal without collisions; incomplete controls stay locked; Python solutions and if checks pass.')
