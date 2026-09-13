import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { build } from 'esbuild'

const bundle = await build({
  stdin: {
    contents: 'export { LEVELS, WORLDS } from "./src/levels/levels"; export { buildSource, buildIfCheck } from "./src/engine/pyBootstrap";',
    resolveDir: process.cwd()
  },
  bundle: true, write: false, platform: 'node', format: 'esm'
})
const { LEVELS, WORLDS, buildSource, buildIfCheck } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
)
const levels = LEVELS.filter(level => level.world === 'sakerhetssystemet')
assert.equal(levels.length, 20)
assert.equal(new Set(LEVELS.map(level => level.id)).size, LEVELS.length)
assert.equal(WORLDS.find(world => world.id === 'sakerhetssystemet').status, 'available')

// Execute the same Python wrapper used by the worker, with inert UI callbacks.
const python = `import json, sys
results = []
for item in json.load(sys.stdin):
    scope = {name: (lambda *args: None) for name in ['__step_state', '__step_call', '__step_return', '__step_print']}
    check = item['check'].splitlines()
    exec('\\n'.join(check[:-1]), scope)
    has_if = eval(check[-1], scope)
    exec(item['source'], scope)
    results.append({'variables': scope['__snapshot_globals'](scope), 'hasIfStatement': has_if})
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
levels.forEach((level, index) => {
  const correct = context(outcomes[index])
  assert.equal(level.successCheck(correct), true, `${level.title}: solution`)
  assert.equal(level.successCheck(context(outcomes[index + 20])), false, `${level.title}: starter`)
  assert.equal(level.successCheck({ ...correct, hasIfStatement: false }), false, `${level.title}: missing if`)
  assert.equal(level.successCheck({ ...correct, ranWithoutError: false }), false)
  for (const name of level.watchVariables) {
    assert.equal(level.successCheck({ ...correct, variables: { ...correct.variables, [name]: null } }), false,
      `${level.title}: incorrect ${name}`)
  }
})
assert.equal(outcomes[40].hasIfStatement, false, 'Comment/string must not count as if')
assert.equal(outcomes[41].hasIfStatement, false, 'Multiline string must not count as if')
console.log('PASS: 20 Python solutions, 20 starters rejected, incorrect values rejected, actual if syntax required.')
