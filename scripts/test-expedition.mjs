import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve('vite/package.json'))('esbuild')
const bundle = await build({ stdin: { contents: 'export { LEVELS } from "./src/levels/levels"; export * from "./src/engine/simulate"; export { buildSource } from "./src/engine/pyBootstrap";', resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'esm' })
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const levels = api.LEVELS.filter(l => l.world === 'expeditionen')
assert.equal(levels.length, 16)
assert.equal(new Set(api.LEVELS.map(l => l.id)).size, api.LEVELS.length)
assert.equal(new Set(levels.map(l => JSON.stringify(l.tileGrid))).size, 16)
const harness = `import sys, json
payload = json.loads(sys.stdin.readline())
def bridge(name, args):
    sys.stdout.write(json.dumps({'call': name, 'args': args}) + '\\n')
    sys.stdout.flush()
    return json.loads(sys.stdin.readline())
scope = {}
for name in ['move', 'turn_left', 'turn_right', 'collect', 'scan', 'tool', 'can_move', 'can_move_left', 'can_move_right', 'at_goal', 'resource_ahead', 'input', 'print']:
    scope['__step_' + name] = lambda line, *args, name=name: bridge(name, args)
for name in ['state', 'call', 'return']:
    scope['__step_' + name] = lambda *args: None
exec(payload['source'], scope)
sys.stdout.write(json.dumps({'done': True, 'variables': scope['__snapshot_globals'](scope)}) + '\\n')
`
async function run(level, source) {
  let state = api.createInitialState(level.tileGrid, level.playerStart, undefined, level.expedition)
  let bumps = 0, actions = 0, usedInput = false
  const consoleLines = []
  const child = spawn(process.env.EXPEDITION_TEST_PYTHON ?? 'python', ['-X', 'utf8', '-u', '-c', harness], { stdio: ['pipe', 'pipe', 'pipe'] })
  let error = '', done
  child.stderr.on('data', data => { error += data })
  const timeout = setTimeout(() => child.kill(), 15000)
  const finished = new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(error || `Python exit ${code}`)))
  })
  child.stdin.write(JSON.stringify({ source: api.buildSource(source) }) + '\n')
  for await (const line of createInterface({ input: child.stdout })) {
    const event = JSON.parse(line)
    if (event.done) { done = event; continue }
    if (++actions > 2000) { child.kill(); throw new Error(`${level.title}: infinite loop`) }
    let result = null
    switch (event.call) {
      case 'move': state = api.applyMove(state, level.tileGrid, false); if (state.bumped) bumps++; break
      case 'turn_left': state = api.applyTurnLeft(state); break
      case 'turn_right': state = api.applyTurnRight(state); break
      case 'collect': state = api.applyCollect(state); break
      case 'scan': result = JSON.stringify(api.scanAhead(state, level.tileGrid)); break
      case 'tool': state = api.applyTool(state, level.tileGrid, ...event.args); break
      case 'can_move': result = api.queryCanMove(state, level.tileGrid, false); break
      case 'can_move_left': result = api.queryCanMoveLeft(state, level.tileGrid, false); break
      case 'can_move_right': result = api.queryCanMoveRight(state, level.tileGrid, false); break
      case 'at_goal': result = api.queryAtGoal(state, level.tileGrid); break
      case 'resource_ahead': result = api.queryResourceAhead(state, level.tileGrid, false); break
      case 'input': usedInput = true; result = 'NOVA'; break
      case 'print': consoleLines.push(event.args[0]); break
      default: throw new Error(event.call)
    }
    child.stdin.write(JSON.stringify(result) + '\n')
  }
  await finished
  clearTimeout(timeout)
  return { state, bumps, context: { variables: done.variables, consoleLines, usedInput, ranWithoutError: true } }
}
for (const level of levels) {
  const source = level.hints.at(-1).replace(/^Prova:\n/, '')
  const outcome = await run(level, source)
  assert.equal(outcome.bumps, 0, `${level.title}: collisions`)
  assert.equal(api.checkWin(outcome.state, level.tileGrid, level.requireAllResources), true, `${level.title}: goal/resources/relays`)
  assert.ok(level.successCheck(outcome.context), `${level.title}: objective`)
  assert.ok(outcome.state.energy >= 0)
  if (level.id >= 94) {
    // Charging must matter physically, not just be an arbitrary win condition.
    if (level.tileGrid.some(row => row.includes('resource'))) {
      const emptyCells = { ...level, tileGrid: level.tileGrid.map(row => row.map(t => t === 'resource' ? 'empty' : t)) }
      const uncharged = await run(emptyCells, source)
      assert.equal(api.checkWin(uncharged.state, emptyCells.tileGrid, false), false, `${level.title}: charging must be necessary`)
    }
    assert.equal(api.checkWin({ ...outcome.state, cleared: [] }, level.tileGrid, false), false, `${level.title}: relays must be repaired`)
    // Each new map must have junctions, not merely a winding corridor.
    let junctions = 0
    level.tileGrid.forEach((row, y) => row.forEach((t, x) => {
      if (t !== 'wall' && [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([nx,ny]) => level.tileGrid[ny]?.[nx] && level.tileGrid[ny][nx] !== 'wall').length >= 3) junctions++
    }))
    assert.ok(junctions >= 2, `${level.title}: branching paths`)
  }
  const starter = await run(level, level.starterCode)
  assert.equal(api.checkWin(starter.state, level.tileGrid, level.requireAllResources), false)
  if (level.id === 98 || level.id === 99) {
    assert.notDeepEqual([starter.state.robot.x, starter.state.robot.y], [level.playerStart.x, level.playerStart.y], 'Debug starter must actually move')
    if (level.id === 98) {
      assert.equal(starter.state.energy, 0, 'Energy starter must run out of energy')
      assert.equal(api.queryAtGoal(starter.state, level.tileGrid), false)
    } else {
      assert.equal(starter.bumps, 0)
      assert.equal(api.queryAtGoal(starter.state, level.tileGrid), true)
      assert.equal(starter.state.energy, 6, 'Relay starter must have energy left after charging')
      const repaired = level.tileGrid.flatMap((row,y) => row.map((tile,x) => tile === 'beacon' && starter.state.cleared.includes(`${x},${y}`))).filter(Boolean).length
      assert.equal(repaired, 2, 'Exactly one of three relays must be forgotten')
    }
    assert.ok(outcome.state.collected >= 5, 'Solution must include multiple charging stops')
    // Independently combine both first-area choices with both second-area choices.
    const firstRoutes = level.id === 98
      ? [[['N',3],['E',4],['S',3]], [['S',3],['E',4],['N',3]]]
      : [[['N',3],['E',4],['S',3]], [['S',3],['E',4],['N',3],['N',3],['W',2],['E',2],['S',3]]]
    const secondRoutes = level.id === 98
      ? [[['N',2],['E',4],['S',2]], [['S',3],['E',4],['N',3]]]
      : [[['N',2],['E',3],['S',2]], [['S',2],['E',3],['N',2]]]
    for (const first of firstRoutes) for (const second of secondRoutes) {
      const route = [['E',2], ...first, ['E',2], ...second, ['E',level.id === 98 ? 4 : 3]]
      const alternate = await run(level, level.starterCode.replace(/^route = .*$/m, `route = ${JSON.stringify(route)}`))
      assert.equal(alternate.bumps, 0, `${level.title}: route ${JSON.stringify(route)}`)
      assert.equal(api.checkWin(alternate.state, level.tileGrid, false), true, 'Alternative route must win')
      assert.ok(level.successCheck(alternate.context))
      // Individually verify that each relay is mandatory, even at the goal.
      level.tileGrid.forEach((row,y) => row.forEach((tile,x) => {
        if (tile === 'beacon') assert.equal(api.checkWin({ ...alternate.state, cleared: alternate.state.cleared.filter(p => p !== `${x},${y}`) }, level.tileGrid, false), false)
      }))
    }
  }
  console.log(`PASS ${level.id}: ${level.title} (${outcome.state.energy} energy left)`)
}
// The first mission must be solvable by the single edit its instructions request.
const firstMission = levels[0]
const guidedStart = await run(firstMission, firstMission.starterCode.replace('power = 0', 'power = cell_a + cell_b'))
assert.equal(guidedStart.bumps, 0)
assert.equal(api.checkWin(guidedStart.state, firstMission.tileGrid, true), true)
console.log('PASS: first mission completed by following the starter instruction')
// Engine boundary cases: incorrect tool, bool/negative/NaN power, exhaustion,
// recharge cannot be farmed, and relays cannot be skipped by reaching the goal.
const grid = [['empty', 'rock', 'resource', 'beacon', 'goal']]
let state = api.createInitialState(grid, { x: 0, y: 0, direction: 'right' }, undefined, { energy: 10 })
for (const power of [-3, true, NaN, 2]) assert.equal(api.applyTool(state, grid, 'drill', power).cleared.length, 0)
assert.equal(api.applyTool(state, grid, 'bridge', 3).cleared.length, 0)
assert.equal(api.applyMove(state, grid, false).robot.x, 0)
state = api.applyTool(state, grid, 'drill', 3)
assert.equal(state.energy, 7)
state = api.applyMove(state, grid, false)
state = api.applyMove(state, grid, false)
state = api.applyCollect(state)
assert.equal(api.applyCollect(state).energy, state.energy)
assert.equal(api.applyMove({ ...state, energy: 0 }, [['empty','empty','empty','empty']], false).robot.x, 2)
assert.equal(api.checkWin({ ...state, robot: { ...state.robot, x: 4 } }, grid), false)
console.log('PASS: all expedition solutions, starters and tool boundary checks')
