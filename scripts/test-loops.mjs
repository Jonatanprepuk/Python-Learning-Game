import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve('vite/package.json'))('esbuild')
const bundle = await build({
  stdin: {
    contents: 'export { LEVELS, WORLDS } from "./src/levels/levels"; export { LOOP_LEVELS, LOOP_SOLUTIONS } from "./src/levels/loopLevels"; export { createPerfectMaze, mazeKey, nextUniqueMaze } from "./src/levels/loopMaze"; export { buildSource, buildCodeAnalysis } from "./src/engine/pyBootstrap"; export * from "./src/engine/simulate";',
    resolveDir: process.cwd()
  },
  bundle: true, write: false, platform: 'node', format: 'esm'
})
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const { LEVELS, WORLDS, LOOP_LEVELS, LOOP_SOLUTIONS, buildSource, buildCodeAnalysis, createInitialState, queryAtCorner,
  queryCanMoveLeft, queryCanMoveRight, queryStepsToGoal, mazeKey, nextUniqueMaze } = api

assert.equal(LOOP_LEVELS.length, 15)
assert.deepEqual(new Set(LOOP_LEVELS.map(level => level.id)), new Set(Array.from({ length: 15 }, (_, i) => i + 28)))
assert.deepEqual(LOOP_LEVELS.filter(level => level.hints.length === 0).map(level => level.id), [40, 41, 42])
assert.ok(LOOP_LEVELS.filter(level => [40, 41, 42].includes(level.id)).every(level => level.starterCode === ''))
assert.equal(LOOP_LEVELS.at(-1).id, 39, 'Existing final maze keeps its ID and remains last')
assert.equal(new Set(LEVELS.map(level => level.id)).size, LEVELS.length)
assert.equal(WORLDS.find(world => world.id === 'produktionshallen').status, 'available')
for (const [sensor, firstLevel] of [['at_corner()', 7], ['steps_to_goal()', 8], ['can_move_left()', 9], ['can_move_right()', 10]]) {
  assert.ok(LOOP_LEVELS[firstLevel].availableCommands.includes(sensor))
  assert.ok(LOOP_LEVELS.slice(0, firstLevel).every(level => !level.availableCommands.includes(sensor)))
}
const straight = LOOP_LEVELS[0]
assert.equal(queryStepsToGoal(createInitialState(straight.tileGrid, straight.playerStart), straight.tileGrid, false), 4)
assert.equal(queryCanMoveLeft(createInitialState(straight.tileGrid, straight.playerStart), straight.tileGrid, false), false)
assert.equal(queryCanMoveRight(createInitialState(straight.tileGrid, straight.playerStart), straight.tileGrid, false), false)
const cornerLevel = LOOP_LEVELS.find(level => level.id === 33)
assert.equal(queryAtCorner(createInitialState(cornerLevel.tileGrid, cornerLevel.playerStart), cornerLevel.tileGrid, false), false)
const cornerState = createInitialState(cornerLevel.tileGrid, cornerLevel.playerStart)
cornerState.robot.x = 5
cornerState.robot.y = 7
assert.equal(queryAtCorner(cornerState, cornerLevel.tileGrid, false), true)

let seed = 123456789
const random = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0
  return seed / 4294967296
}
const finalMaze = LOOP_LEVELS.at(-1)
const seen = new Set([mazeKey(finalMaze.tileGrid)])
const maps = Array.from({ length: 100 }, () => nextUniqueMaze(seen, random))
assert.equal(seen.size, 101)
for (const grid of maps) {
  assert.equal(grid.length, 9)
  assert.ok(grid.every(row => row.length === 9))
  assert.ok(grid[0].every(tile => tile === 'wall'))
  assert.equal(grid[7][7], 'goal')
  const state = createInitialState(grid, finalMaze.playerStart)
  assert.ok(queryStepsToGoal(state, grid, false) > 0)
  // In the open-tile graph, a perfect maze is connected and has V-1 edges.
  let vertices = 0
  let edges = 0
  grid.forEach((row, y) => row.forEach((tile, x) => {
    if (tile === 'wall') return
    vertices++
    if (grid[y]?.[x + 1] !== 'wall') edges++
    if (grid[y + 1]?.[x] !== 'wall') edges++
  }))
  assert.equal(edges, vertices - 1)
}

const wallRule = LOOP_SOLUTIONS[finalMaze.id]
const cases = [
  ...LOOP_LEVELS.map(level => ({ level, grid: level.tileGrid, code: LOOP_SOLUTIONS[level.id] })),
  ...maps.map(grid => ({ level: finalMaze, grid, code: wallRule })),
  { level: straight, grid: straight.tileGrid, code: 'for i in range(0):\n    move()\nmove()\nmove()\nmove()\nmove()' },
  { level: LOOP_LEVELS[1], grid: straight.tileGrid, code: 'while False:\n    move()\nmove()\nmove()\nmove()\nmove()' },
  { level: straight, grid: straight.tileGrid, code: 'for i in range(1):\n    def later():\n        move()\nlater()\nlater()\nlater()\nlater()' }
]

const python = `import json, sys, collections
results = []
for item in json.load(sys.stdin):
    grid = item['grid']
    x, y, direction = item['start']['x'], item['start']['y'], item['start']['direction']
    dirs = ['up', 'right', 'down', 'left']
    delta = {'up': (0,-1), 'right': (1,0), 'down': (0,1), 'left': (-1,0)}
    resources = {(xx,yy) for yy,row in enumerate(grid) for xx,tile in enumerate(row) if tile == 'resource'}
    moves = []
    count = 0
    def guard():
        global count
        count += 1
        if count > 2500: raise RuntimeError('INFINITE_LOOP')
    def open_at(xx, yy):
        return 0 <= yy < len(grid) and 0 <= xx < len(grid[yy]) and grid[yy][xx] != 'wall'
    def open_direction(d):
        dx,dy = delta[d]
        return open_at(x+dx,y+dy)
    def turn_left(line):
        global direction
        guard(); direction = dirs[(dirs.index(direction)-1)%4]
    def turn_right(line):
        global direction
        guard(); direction = dirs[(dirs.index(direction)+1)%4]
    def move(line):
        global x,y
        guard()
        success = open_direction(direction)
        if success:
            dx,dy = delta[direction]; x += dx; y += dy
        moves.append([line, success])
    def collect(line):
        guard(); resources.discard((x,y))
    def can_move(line):
        guard(); return open_direction(direction)
    def can_move_left(line):
        guard(); return open_direction(dirs[(dirs.index(direction)-1)%4])
    def can_move_right(line):
        guard(); return open_direction(dirs[(dirs.index(direction)+1)%4])
    def at_goal(line):
        guard(); return grid[y][x] == 'goal'
    def at_corner(line):
        guard()
        opened = [d for d in dirs if open_direction(d)]
        return len(opened) == 2 and abs(dirs.index(opened[0])-dirs.index(opened[1])) in (1,3)
    def steps_to_goal(line):
        guard(); todo = collections.deque([(x,y,0)]); seen = {(x,y)}
        while todo:
            xx,yy,dist = todo.popleft()
            if grid[yy][xx] == 'goal': return dist
            for dx,dy in delta.values():
                nx,ny = xx+dx,yy+dy
                if (nx,ny) not in seen and open_at(nx,ny):
                    seen.add((nx,ny)); todo.append((nx,ny,dist+1))
        return -1
    def state(line, vars): guard()
    def noop(*args): guard()
    scope = {
        '__step_move': move, '__step_turn_left': turn_left, '__step_turn_right': turn_right,
        '__step_collect': collect, '__step_can_move': can_move,
        '__step_can_move_left': can_move_left, '__step_can_move_right': can_move_right,
        '__step_at_corner': at_corner, '__step_steps_to_goal': steps_to_goal,
        '__step_at_goal': at_goal, '__step_resource_ahead': lambda line: False,
        '__step_state': state, '__step_call': noop, '__step_return': noop,
        '__step_print': noop, '__step_input': noop, '__step_activate': noop
    }
    analysis_source = item['analysis']
    split = analysis_source.index('__json.dumps({')
    exec(analysis_source[:split], scope)
    analysis = json.loads(eval(analysis_source[split:], scope))
    exec(item['source'], scope)
    moved = {line for line,success in moves if success}
    results.append({
        'won': grid[y][x] == 'goal' and not resources,
        'bumps': sum(not success for _,success in moves),
        'calls': count,
        'hasIf': analysis['hasIfStatement'],
        'movedInFor': any(line in moved for line in analysis['forMoveLines']),
        'movedInWhile': any(line in moved for line in analysis['whileMoveLines'])
    })
json.dump(results, sys.stdout)
`
const inputs = cases.map(({ level, grid, code }) => ({
  grid, start: level.playerStart, source: buildSource(code), analysis: buildCodeAnalysis(code)
}))
const result = spawnSync(process.env.LOOP_TEST_PYTHON ?? 'python', ['-X', 'utf8', '-c', python], {
  input: JSON.stringify(inputs), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024
})
assert.equal(result.status, 0, result.stderr || result.error?.message)
const outcomes = JSON.parse(result.stdout)
outcomes.slice(0, -3).forEach((outcome, i) => {
  assert.equal(outcome.won, true, `Solution ${i + 1} must reach its goal`)
  assert.equal(outcome.bumps, 0, `Solution ${i + 1} must avoid walls`)
  assert.equal(outcome.hasIf, Boolean(cases[i].level.requireIfStatement), `Solution ${i + 1} if requirement`)
  assert.equal(outcome[cases[i].level.requiredLoop === 'for' ? 'movedInFor' : 'movedInWhile'], true, `Solution ${i + 1} moves inside its loop`)
})
for (const outcome of outcomes.slice(-3)) {
  assert.equal(outcome.won, true, 'Repeated moves reach the goal')
  assert.equal(outcome.movedInFor || outcome.movedInWhile, false, 'Unused loops do not satisfy the loop requirement')
}
console.log(`PASS: 15 loop levels and ${maps.length} distinct mazes solved, sensors and executed-loop checks verified.`)
