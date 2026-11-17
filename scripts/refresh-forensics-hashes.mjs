// Run after intentionally changing the synthetic evidence fixture. The test
// suite independently verifies these handover hashes against the actual bytes.
import { createHash } from 'node:crypto'
import { writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve('vite/package.json'))('esbuild')
const bundle = await build({ stdin: { contents: 'export { SOURCES, sourceBytes } from "./src/forensics/case"', resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'esm' })
const { SOURCES, sourceBytes } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const hashes = Object.fromEntries(SOURCES.map(source => [source.id, createHash('sha256').update(sourceBytes(source.id)).digest('hex')]))
await writeFile('src/forensics/hashes.json', JSON.stringify(hashes, null, 2) + '\n')
console.log(`Updated handover manifest for ${SOURCES.length} sources.`)
