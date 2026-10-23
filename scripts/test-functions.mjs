import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve('vite/package.json'))('esbuild')
const bundle = await build({
  stdin: {
    contents:
      'export { LEVELS, WORLDS } from "./src/levels/levels"; export { FUNCTION_LEVELS } from "./src/levels/functionLevels"; export { buildSource, buildCodeAnalysis, buildTestSource } from "./src/engine/pyBootstrap"; export * from "./src/engine/simulate"; export { snapshotEqual } from "./src/engine/snapshotEqual";',
    resolveDir: process.cwd()
  },
  bundle: true, write: false, platform: 'node', format: 'esm'
})
const api = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const { LEVELS, WORLDS, FUNCTION_LEVELS, buildSource, buildCodeAnalysis, buildTestSource, snapshotEqual } = api

const PYTHON = process.env.FUNCTION_TEST_PYTHON ?? 'python3'
const byId = Object.fromEntries(FUNCTION_LEVELS.map(l => [l.id, l]))

assert.equal(FUNCTION_LEVELS.length, 18)
assert.deepEqual(FUNCTION_LEVELS.map(l => l.id), Array.from({ length: 18 }, (_, i) => i + 63))
assert.equal(new Set(LEVELS.map(l => l.id)).size, LEVELS.length, 'no duplicate ids across the whole curriculum')
assert.equal(WORLDS.find(w => w.id === 'robotlabbet').status, 'available')
console.log('PASS: FUNCTION_LEVELS wiring (18 levels, ids 63-80, no collisions, world available)')

// ---------- Harness 1: non-robot, print()-based levels ('function' type) ----------
// Mirrors the real analysis pipeline (buildCodeAnalysis) and captures printed
// output plus, optionally, one final global variable (for successCheck
// assertions that read ctx.variables).
const PRINT_HARNESS = `import json, sys

def run_one(source, analysis_source, extract):
    printed = []
    scope = {
        '__step_print': lambda line, text: printed.append(text),
        '__step_input': lambda line, prompt: (_ for _ in ()).throw(RuntimeError('no input expected')),
        '__step_call': lambda *a: None, '__step_return': lambda *a: None, '__step_state': lambda *a: None,
    }
    split = analysis_source.index('__json.dumps({')
    exec(analysis_source[:split], scope)
    analysis = json.loads(eval(analysis_source[split:], scope))
    exec(source, scope)
    value = scope.get(extract) if extract else None
    return {'printed': printed, 'analysis': analysis, 'value': value}

items = json.load(sys.stdin)
json.dump([run_one(i['source'], i['analysis'], i.get('extract')) for i in items], sys.stdout)
`

function runPrint(code, extract) {
  const payload = [{ source: buildSource(code), analysis: buildCodeAnalysis(code), extract }]
  const result = spawnSync(PYTHON, ['-X', 'utf8', '-c', PRINT_HARNESS], {
    input: JSON.stringify(payload), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024
  })
  assert.equal(result.status, 0, result.stderr || result.error?.message)
  return JSON.parse(result.stdout)[0]
}

// ---------- Harness 2: robot-grid levels ----------
const ROBOT_HARNESS = `import json, sys

def run_one(grid, start, source, analysis_source):
    x, y, direction = start['x'], start['y'], start['direction']
    dirs = ['up', 'right', 'down', 'left']
    delta = {'up': (0,-1), 'right': (1,0), 'down': (0,1), 'left': (-1,0)}
    count = 0
    def guard():
        nonlocal count
        count += 1
        if count > 2500: raise RuntimeError('INFINITE_LOOP')
    def open_at(xx, yy):
        return 0 <= yy < len(grid) and 0 <= xx < len(grid[yy]) and grid[yy][xx] != 'wall'
    def open_direction(d):
        dx,dy = delta[d]
        return open_at(x+dx,y+dy)
    def turn_left(line):
        nonlocal direction
        guard(); direction = dirs[(dirs.index(direction)-1)%4]
    def turn_right(line):
        nonlocal direction
        guard(); direction = dirs[(dirs.index(direction)+1)%4]
    def move(line):
        nonlocal x,y
        guard()
        if open_direction(direction):
            dx,dy = delta[direction]; x += dx; y += dy
    def at_goal(line):
        guard(); return grid[y][x] == 'goal'
    scope = {
        '__step_move': move, '__step_turn_left': turn_left, '__step_turn_right': turn_right,
        '__step_at_goal': at_goal, '__step_can_move': lambda line: guard() or open_direction(direction),
        '__step_can_move_left': lambda line: guard() or open_direction(dirs[(dirs.index(direction)-1)%4]),
        '__step_can_move_right': lambda line: guard() or open_direction(dirs[(dirs.index(direction)+1)%4]),
        '__step_resource_ahead': lambda line: False, '__step_collect': lambda line: None,
        '__step_steps_to_goal': lambda line: 0, '__step_at_corner': lambda line: False,
        '__step_state': lambda *a: None, '__step_call': lambda *a: None, '__step_return': lambda *a: None,
        '__step_print': lambda *a: None, '__step_input': lambda *a: None, '__step_activate': lambda *a: None
    }
    split = analysis_source.index('__json.dumps({')
    exec(analysis_source[:split], scope)
    analysis = json.loads(eval(analysis_source[split:], scope))
    exec(source, scope)
    return {'won': grid[y][x] == 'goal', 'calls': count, 'analysis': analysis}

items = json.load(sys.stdin)
json.dump([run_one(**item) for item in items], sys.stdout)
`

function runRobot(level, code) {
  const payload = [{ grid: level.tileGrid, start: level.playerStart, source: buildSource(code), analysis_source: buildCodeAnalysis(code) }]
  const result = spawnSync(PYTHON, ['-X', 'utf8', '-c', ROBOT_HARNESS], {
    input: JSON.stringify(payload), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024
  })
  assert.equal(result.status, 0, result.stderr || result.error?.message)
  return JSON.parse(result.stdout)[0]
}

// Same structural gate useLevelSession.finishRun applies, so a "logically
// correct but missing the taught construct" solution is caught the same way.
function requirementsSatisfied(level, analysis) {
  if (level.requireFunctionDef && !analysis.hasFunctionDef) return false
  if (level.requireIfStatement && !analysis.hasIfStatement) return false
  if (level.requireWhileLoop && !analysis.hasWhileLoop) return false
  if (level.requireForLoop && !analysis.hasForLoop) return false
  if (level.forbidLoops && (analysis.hasForLoop || analysis.hasWhileLoop)) return false
  return true
}

// ---------- Harness 3: 'tests' levels (buildTestSource) ----------
const TESTS_HARNESS = `import sys
src = sys.stdin.read()
marker = '\\n__TESTS__\\n'
idx = src.index(marker)
main_src, test_expr = src[:idx], src[idx + len(marker):]
scope = {
    '__step_print': lambda *a: None, '__step_input': lambda *a: None, '__step_state': lambda *a: None,
    '__step_call': lambda *a: None, '__step_return': lambda *a: None
}
exec(main_src, scope)
sys.stdout.write(eval(test_expr, scope))
`

function runTests(level, code) {
  const combined = buildSource(code) + '\n__TESTS__\n' + buildTestSource(level.testFunction, level.tests.map(t => t.args))
  const result = spawnSync(PYTHON, ['-X', 'utf8', '-c', TESTS_HARNESS], {
    input: combined, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024
  })
  assert.equal(result.status, 0, result.stderr || result.error?.message)
  return JSON.parse(result.stdout)
}

function assertTestsPass(level, code, label) {
  const results = runTests(level, code)
  level.tests.forEach((test, i) => {
    assert.equal(results[i].ok, true, `${label}: test ${i} (${test.description}) should run without error, got ${JSON.stringify(results[i])}`)
    assert.ok(snapshotEqual(results[i].value, test.expected), `${label}: test ${i} (${test.description}) expected ${JSON.stringify(test.expected)}, got ${JSON.stringify(results[i].value)}`)
  })
}

// 'tests' levels don't run through either robot/print harness, but
// requireIfStatement/requireForLoop are still checked structurally against
// the exact same buildCodeAnalysis the real engine uses.
const ANALYSIS_HARNESS = `import sys
src = sys.stdin.read()
split = src.index('__json.dumps({')
scope = {}
exec(src[:split], scope)
sys.stdout.write(eval(src[split:], scope))
`

function getAnalysis(code) {
  const result = spawnSync(PYTHON, ['-X', 'utf8', '-c', ANALYSIS_HARNESS], {
    input: buildCodeAnalysis(code), encoding: 'utf8', maxBuffer: 10 * 1024 * 1024
  })
  assert.equal(result.status, 0, result.stderr || result.error?.message)
  return JSON.parse(result.stdout)
}

// ================= Level 63: Starta robotlabbet =================
{
  const level = byId[63]
  const solution = 'def starta_labbet():\n    print("Robotlabbet online. Alla system redo.")\n\nstarta_labbet()\n'
  const { printed, analysis } = runPrint(solution, null)
  assert.ok(printed.some(line => line.trim().length > 0))
  assert.ok(requirementsSatisfied(level, analysis))
  const noFn = runPrint('print("Robotlabbet online.")\n', null)
  assert.ok(!requirementsSatisfied(level, noFn.analysis), 'a bare print with no def must fail requireFunctionDef')
  console.log('PASS: 63 Starta robotlabbet')
}

// ================= Level 64: Trappmönstret =================
{
  const level = byId[64]
  const solution = 'def steg():\n    move()\n    turn_right()\n    move()\n    turn_left()\n\nwhile not at_goal():\n    steg()\n'
  const inlined = 'move()\nturn_right()\nmove()\nturn_left()\nmove()\nturn_right()\nmove()\nturn_left()\nmove()\nturn_right()\nmove()\nturn_left()\nmove()\nturn_right()\nmove()\nturn_left()\n'
  const outcome = runRobot(level, solution)
  assert.equal(outcome.won, true)
  assert.ok(requirementsSatisfied(level, outcome.analysis))
  const inlinedOutcome = runRobot(level, inlined)
  assert.equal(inlinedOutcome.won, true, 'grid sanity check: same destination reachable by brute force')
  assert.ok(!requirementsSatisfied(level, inlinedOutcome.analysis), 'inlined moves must fail requireFunctionDef/requireWhileLoop')
  console.log('PASS: 64 Trappmönstret')
}

// ================= Level 65: Sensorkontrollen =================
{
  const level = byId[65]
  assertTestsPass(level, 'def has_error(readings):\n    return -1 in readings\n', '65 correct')
  const buggy = runTests(level, 'def has_error(readings):\n    return False\n')
  assert.ok(level.tests.some((t, i) => !(buggy[i].ok && snapshotEqual(buggy[i].value, t.expected))), '65: always-False must fail at least one case')
  console.log('PASS: 65 Sensorkontrollen')
}

// ================= Level 66: Hälsa flera robotar =================
{
  const level = byId[66]
  const solution = 'def halsa(namn):\n    print("Hej, " + namn + "!")\n\nhalsa("ATLAS")\nhalsa("NOVA")\n'
  const { printed, analysis } = runPrint(solution, null)
  assert.equal(printed.length, 2)
  assert.notEqual(printed[0].trim(), printed[1].trim())
  assert.ok(requirementsSatisfied(level, analysis))
  const hardcoded = runPrint('def halsa(namn):\n    print("Hej, ATLAS!")\n\nhalsa("ATLAS")\nhalsa("NOVA")\n', null)
  assert.equal(hardcoded.printed[0].trim(), hardcoded.printed[1].trim(), 'sanity: a hardcoded body produces identical lines, which successCheck must reject')
  console.log('PASS: 66 Hälsa flera robotar')
}

// ================= Level 67: Beräkna energikostnad =================
{
  const level = byId[67]
  const solution = 'def energikostnad(steg, kostnad_per_steg):\n    return steg * kostnad_per_steg\n\ntotal = energikostnad(5, 3)\nprint(total)\n'
  const { value, analysis } = runPrint(solution, 'total')
  assert.equal(value, 15)
  assert.ok(requirementsSatisfied(level, analysis))
  console.log('PASS: 67 Beräkna energikostnad')
}

// ================= Level 68: Temperaturkontroll =================
{
  const level = byId[68]
  const solution = 'def is_safe(temperature):\n    if temperature <= 80:\n        return True\n    else:\n        return False\n'
  assertTestsPass(level, solution, '68 correct')
  assert.ok(requirementsSatisfied(level, getAnalysis(solution)))
  // A logically correct one-liner with no if/else must still fail the
  // level's requireIfStatement gate — this is the same structural check
  // finishRun applies, independent of whether the test cases pass.
  const noIfAnalysis = getAnalysis('def is_safe(temperature):\n    return temperature <= 80\n')
  assert.ok(!requirementsSatisfied(level, noIfAnalysis), '68: a no-if one-liner must fail requireIfStatement even though it is logically correct')
  console.log('PASS: 68 Temperaturkontroll')
}

// ================= Level 69: Klassificera lådan =================
{
  const level = byId[69]
  const solution = 'def classify(weight):\n    if weight < 5:\n        return "lätt"\n    elif weight <= 20:\n        return "medel"\n    else:\n        return "tung"\n'
  assertTestsPass(level, solution, '69 correct')
  assert.ok(requirementsSatisfied(level, getAnalysis(solution)))
  console.log('PASS: 69 Klassificera lådan')
}

// ================= Level 70: Räkna trasiga sensorer =================
{
  const level = byId[70]
  const solution = 'def count_errors(readings):\n    count = 0\n    for value in readings:\n        if value == -1:\n            count = count + 1\n    return count\n'
  assertTestsPass(level, solution, '70 correct')
  assert.ok(requirementsSatisfied(level, getAnalysis(solution)))
  const builtin = getAnalysis('def count_errors(readings):\n    return readings.count(-1)\n')
  assert.ok(!requirementsSatisfied(level, builtin), '70: a .count()-only solution must fail requireForLoop')
  console.log('PASS: 70 Räkna trasiga sensorer')
}

// ================= Level 71: Summera lasten =================
{
  const level = byId[71]
  const solution = 'def total_weight(items):\n    total = 0\n    for weight in items:\n        total = total + weight\n    return total\n'
  assertTestsPass(level, solution, '71 correct')
  assert.ok(requirementsSatisfied(level, getAnalysis(solution)))
  console.log('PASS: 71 Summera lasten')
}

// ================= Level 72: Hitta tyngsta lådan =================
{
  const level = byId[72]
  const solution = 'def heaviest(items):\n    largest = items[0]\n    for value in items:\n        if value > largest:\n            largest = value\n    return largest\n'
  assertTestsPass(level, solution, '72 correct')
  assert.ok(requirementsSatisfied(level, getAnalysis(solution)))
  const builtin = getAnalysis('def heaviest(items):\n    return max(items)\n')
  assert.ok(!requirementsSatisfied(level, builtin), '72: a max()-only solution must fail requireForLoop')
  console.log('PASS: 72 Hitta tyngsta lådan')
}

// ================= Level 73: Stega N steg =================
{
  const level = byId[73]
  const solution = 'def move_n(n):\n    for i in range(n):\n        move()\n\nmove_n(5)\n'
  const outcome = runRobot(level, solution)
  assert.equal(outcome.won, true)
  assert.ok(requirementsSatisfied(level, outcome.analysis))
  console.log('PASS: 73 Stega N steg')
}

// ================= Level 74: Mönster med parameter =================
{
  const level = byId[74]
  const solution = 'def trappa(steg):\n    for i in range(steg):\n        move()\n        turn_right()\n        move()\n        turn_left()\n\ntrappa(5)\n'
  const outcome = runRobot(level, solution)
  assert.equal(outcome.won, true)
  assert.ok(requirementsSatisfied(level, outcome.analysis))
  console.log('PASS: 74 Mönster med parameter')
}

// ================= Level 75: Patrullera =================
{
  const level = byId[75]
  const solution = 'def patrullera():\n    move()\n    return at_goal()\n\nwhile not patrullera():\n    pass\n'
  const outcome = runRobot(level, solution)
  assert.equal(outcome.won, true)
  assert.ok(requirementsSatisfied(level, outcome.analysis))
  console.log('PASS: 75 Patrullera')
}

// ================= Level 76: Starta och stoppa =================
{
  const level = byId[76]
  const solution = 'def starta_system():\n    print("System igång.")\n\ndef stoppa_system():\n    print("System avstängt.")\n\nstarta_system()\nstoppa_system()\n'
  const { printed, analysis } = runPrint(solution, null)
  assert.equal(printed.length, 2)
  assert.notEqual(printed[0].trim(), printed[1].trim())
  assert.ok(requirementsSatisfied(level, analysis))
  console.log('PASS: 76 Starta och stoppa')
}

// ================= Level 77: Hjälpfunktion =================
{
  const level = byId[77]
  assertTestsPass(level, 'def dubbel(x):\n    return x * 2\n\ndef total(a, b):\n    return dubbel(a) + dubbel(b)\n', '77 correct')
  console.log('PASS: 77 Hjälpfunktion')
}

// ================= Level 78: Skottår =================
{
  const level = byId[78]
  assertTestsPass(level, 'def is_leap_year(year):\n    return (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)\n', '78 correct')
  const buggy = runTests(level, 'def is_leap_year(year):\n    return year % 4 == 0\n')
  assert.ok(level.tests.some((t, i) => !(buggy[i].ok && snapshotEqual(buggy[i].value, t.expected))), '78: naive %4-only rule must be caught by the century edge cases (1900, 2000)')
  console.log('PASS: 78 Skottår')
}

// ================= Level 79: Robotlabbet online (capstone) =================
{
  const level = byId[79]
  const solution =
    'def rapportera_status():\n    print("Robotlabbet redo för uppdrag.")\n\ndef styr():\n    if can_move_left():\n        turn_left()\n    elif can_move():\n        pass\n    elif can_move_right():\n        turn_right()\n    else:\n        turn_right()\n        turn_right()\n    move()\n    return at_goal()\n\nrapportera_status()\nwhile not styr():\n    pass\n'
  const outcome = runRobot(level, solution)
  assert.equal(outcome.won, true, 'capstone left-hand-rule solution must reach the goal on the two-corner grid')
  assert.ok(requirementsSatisfied(level, outcome.analysis))
  console.log('PASS: 79 Robotlabbet online')
}

// ================= Level 80: Extrauppgift: Rekursion (optional bonus) =================
{
  const level = byId[80]
  const solution = 'def sum_recursive(items):\n    if len(items) == 0:\n        return 0\n    return items[0] + sum_recursive(items[1:])\n'
  assertTestsPass(level, solution, '80 correct')
  assert.ok(requirementsSatisfied(level, getAnalysis(solution)), '80: a real recursive solution must satisfy forbidLoops')
  const iterative = getAnalysis('def sum_recursive(items):\n    total = 0\n    for value in items:\n        total = total + value\n    return total\n')
  assert.ok(!requirementsSatisfied(level, iterative), '80: an iterative (for-loop) solution must fail forbidLoops, even if it passes the test cases')
  console.log('PASS: 80 Extrauppgift: Rekursion')
}

console.log('\nPASS: all 18 Robotlabbet levels (ids 63-80, including the optional recursion bonus) verified end to end.')
