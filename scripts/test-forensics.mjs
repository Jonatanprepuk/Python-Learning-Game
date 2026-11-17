import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { build } = createRequire(require.resolve('vite/package.json'))('esbuild')
const bundle = await build({ stdin: { contents: 'export * from "./src/forensics/case"; export * from "./src/forensics/python"; export * from "./src/forensics/stages"; export * from "./src/forensics/grading"; export * from "./src/forensics/state"; export * from "./src/forensics/displayFilter";', resolveDir: process.cwd() }, bundle: true, write: false, platform: 'node', format: 'esm' })
const lib = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`)
const { SOURCES, PACKETS, LOGS, STAGES, SOLUTION, freshInvestigation, sourceBytes, packetBytes, summarize, caseData, FORENSICS_HELPERS, buildForensicsSource, applyEvents, restoreInvestigation, reviewInvestigation, compileDisplayFilter } = lib
const all = SOURCES.map(source => source.id)
const ready = { ...freshInvestigation(), preserved: all, collected: all }
assert.equal(SOURCES.length, 9)
assert.equal(SOURCES.filter(source => source.kind === 'capture').length, 6)
assert.ok(PACKETS.length > 1500)
assert.equal(new Set(PACKETS.map(packet => packet.id)).size, PACKETS.length)
for (const source of SOURCES) {
  const bytes = sourceBytes(source.id)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256, `Handover checksum ${source.id}`)
  if (source.kind !== 'capture') continue
  const data = new DataView(bytes.buffer)
  assert.equal(data.getUint32(0, true), 0xa1b2c3d4)
  let offset = 24, count = 0, lastTimestamp = 0
  while (offset < bytes.length) {
    const seconds = data.getUint32(offset, true), length = data.getUint32(offset + 8, true)
    assert.ok(seconds >= lastTimestamp, 'Packet timestamps are ordered')
    assert.equal(length, data.getUint32(offset + 12, true))
    assert.ok(length <= 1514, 'A packet is not a multi-megabyte flow')
    const row = PACKETS.find(packet => packet.source_id === source.id && packet.no === count + 1)
    assert.deepEqual(bytes.slice(offset + 16, offset + 16 + length), packetBytes(row), 'Inspected bytes match the preserved capture')
    lastTimestamp = seconds; count++; offset += 16 + length
  }
  assert.equal(offset, bytes.length)
  assert.equal(count, source.count)
}
const count = expression => PACKETS.filter(compileDisplayFilter(expression)).length
assert.equal(count(''), PACKETS.length)
assert.ok(count('tcp') > count('tls'))
assert.equal(count('dns'), 1)
assert.equal(count('tcp.stream == 0'), 0)
assert.equal(count('ip.addr == 10.20.20.0/24'), PACKETS.filter(packet => packet.network === '10.20.20.0/24').length)
assert.equal(count('ip.addr == 10.20.20.23 && ip.addr == 203.0.113.77'), 111)
assert.equal(count('tls && tcp.len > 1000'), PACKETS.filter(packet => packet.protocol === 'TLS' && packet.payload_bytes > 1000).length)
assert.equal(count('(dns || tcp.port == 8443) && ip.addr != 198.51.100.10'), 112)
assert.equal(count('frame.time >= "2026-11-04 18:00:00" && ip.src == 10.20.20.23'), 99)
for (const invalid of ['ip.addr = 10.20.20.23', 'ip.addr == 999.1.2.3', 'tls &&', '(tls', 'tcp.len == hello', 'unknown == 3', 'tls; alert(1)', 'ip.addr ==', 'tls dns']) assert.throws(() => compileDisplayFilter(invalid), invalid)
const conversations = summarize(PACKETS)
assert.ok(conversations[0].src.startsWith('10.20.30.'), 'Largest transfer is a legitimate alternative lead')
assert.equal(conversations.filter(row => row.dst === SOLUTION.destination_ip && row.day === '2026-11-03').length, 0)
assert.equal(SOLUTION.start, '2026-11-04 18:42:10')
assert.equal(SOLUTION.end, '2026-11-04 18:47:55')
assert.equal(SOLUTION.payload_bytes, 129760)

const scenarios = []
const add = (name, code, error = false, context = ready) => scenarios.push({ name, code, error, context })
for (const stage of STAGES) {
  add(`guided stage ${stage.id}`, stage.guided)
  add(`independent stage ${stage.id}`, stage.independent, [1, 3].includes(stage.id))
}
add('acquisition needs preservation', 'collect_sources(["CAP-K-03"])', true, freshInvestigation())
add('analysis needs acquisition', 'load_packets(["CAP-K-03"])', true, freshInvestigation())
add('log lookup needs acquisition', 'lookup("DNS")', true, freshInvestigation())
add('unknown file', 'preserve_sources(["FAKE"])', true)
add('hash mismatch halts preservation', '__data["originals"]["CAP-K-03"] += "00"\npreserve_sources(["CAP-K-03"])', true)
add('partial preservation remains available', 'preserve_sources(["CAP-K-03", "FAKE"])', true, freshInvestigation())
add('mutated packet rejected', 'rows = load_packets()\nrows[0]["payload_bytes"] = 999\nshow_packets(rows)', true)
add('duplicate packet rejected', 'p = load_packets()[0]\nshow_packets([p, p])', true)
add('empty result is neutral', 'show_packets(filter_packets(load_packets(), host="10.99.0.1"))')
add('legitimate hypothesis is not rejected', 'show_packets(filter_packets(load_packets(), host="10.20.30.30"))')
add('incident hypothesis is not confirmed', 'show_packets(filter_packets(load_packets(), host="10.20.20.23", peer="203.0.113.77"))')
add('manual and helper filters agree', 'rows = load_packets()\nfiltered = filter_packets(rows, host="10.20.20.23", peer="203.0.113.77", after="2026-11-04 00:00:00")\nmanual = [p for p in rows if "10.20.20.23" in [p["src"], p["dst"]] and "203.0.113.77" in [p["src"], p["dst"]] and p["time"] >= "2026-11-04 00:00:00"]\nassert filtered == manual\nshow_packets(manual)')
add('reversed interval', 'filter_packets(load_packets(), after="2026-11-04 19:00:00", before="2026-11-04 18:00:00")', true)
add('bad time', 'filter_packets(load_packets(), after="18:00")', true)
add('DNS reveals both evidence and time', 'lookup("DHCP", "10.20.20.23")\nlookup("DNS", "203.0.113.77")')
add('partial report update', 'report = report_draft()\nreport["payload_bytes"] = 123\nsave_report(report)')

const harness = `import json, sys, copy
request = json.load(sys.stdin)
outcomes = []
for item in request['scenarios']:
    events = []
    context = item['context']
    scope = {'__bridge': lambda raw: events.append(json.loads(raw)), '__data': copy.deepcopy(request['data']), '__preserved': set(context['preserved']), '__collected': set(context['collected']), '__draft': context['report'], '__now': '2026-11-05T09:00:00Z'}
    error = None
    try:
        exec(request['helpers'], scope)
        exec(compile(item['code'], '<utredning>', 'exec'), scope)
    except Exception as exc:
        error = str(exc)
    outcomes.append({'events': events, 'error': error})
# Exercise the real worker source wrapper too, including a fresh namespace.
events = []
scope = {'__bridge': lambda raw: events.append(json.loads(raw))}
exec(request['helpers'], scope)
exec(request['wrapped_source'], scope)
assert events[-1]['kind'] == 'packets'
assert len(events[-1]['packets']) == 111
json.dump(outcomes, sys.stdout)
`
const execution = spawnSync(process.env.FORENSICS_TEST_PYTHON ?? 'python', ['-X', 'utf8', '-c', harness], {
  input: JSON.stringify({ data: caseData(), helpers: FORENSICS_HELPERS, scenarios, wrapped_source: buildForensicsSource('show_packets(filter_packets(load_packets(), host="10.20.20.23", peer="203.0.113.77"))', ready) }),
  encoding: 'utf8', maxBuffer: 30 * 1024 * 1024, timeout: 45000
})
assert.equal(execution.status, 0, execution.stderr || execution.error?.message)
const outcomes = JSON.parse(execution.stdout)
scenarios.forEach((scenario, index) => {
  const outcome = outcomes[index]
  assert.equal(!!outcome.error, scenario.error, `${scenario.name}: ${outcome.error}`)
  for (const event of outcome.events) assert.ok(event.line >= 1 && event.line <= scenario.code.split('\n').length, `${scenario.name}: user source line`)
  const next = applyEvents(scenario.context, outcome.events)
  assert.equal(next.reviewed, undefined, 'Exploration never grades a hypothesis')
})
const partial = outcomes[scenarios.findIndex(scenario => scenario.name.startsWith('partial preservation'))]
assert.ok(applyEvents(freshInvestigation(), partial.events).preserved.includes('CAP-K-03'))
const badHash = outcomes[scenarios.findIndex(scenario => scenario.name.startsWith('hash mismatch'))]
assert.equal(applyEvents(freshInvestigation(), badHash.events).preserved.length, 0)
const preserveEvents = outcomes[scenarios.findIndex(scenario => scenario.name === 'guided stage 2')].events
const collectEvents = outcomes[scenarios.findIndex(scenario => scenario.name === 'guided stage 3')].events
let complete = applyEvents(applyEvents(freshInvestigation(), preserveEvents), collectEvents)
const firstPacket = PACKETS.find(packet => packet.src === SOLUTION.source_ip && packet.dst === SOLUTION.destination_ip && packet.flags === 'SYN')
const lastPacket = PACKETS.find(packet => packet.src === SOLUTION.source_ip && packet.dst === SOLUTION.destination_ip && packet.time === SOLUTION.end)
complete = {
  ...complete, scope: { networks: ['10.20.10.0/24', SOLUTION.network], question: 'Vilken trafik avviker från dagen före och vad kan förklara den?' },
  observations: [
    { id: 'N1', claim: 'Den stora backuptrafiken kan förklara kvällslarmet.', evidence: ['OPS-01'], alternative: 'Samma mönster syns dagen före och jobbet är planerat.' },
    { id: 'N2', claim: 'Studions nya kontakt behöver undersökas vidare.', evidence: ['DNS-01', 'DHCP-02'], alternative: 'Det kan också vara oregistrerad övertid med en ny tjänst.' }
  ],
  report: { ...freshInvestigation().report, ...SOLUTION, payload_bytes: String(SOLUTION.payload_bytes), evidence: ['CAP-S-03', 'DHCP-02', 'DNS-01', 'OPS-01', 'OPS-03', firstPacket.id, lastPacket.id].join(', '), reasoning: 'En ny extern kontakt från en studioarbetsstation uppträder efter ordinarie arbetstid och saknar motsvarighet dagen före.', counterargument: 'Backupflödet är större, men är planerat enligt driftjournalen och återkommer båda dagarna.', limitations: 'TLS-innehållet saknas. Vi kan inte avgöra vilken fil som skickats, vilket program som användes eller vem som satt vid datorn.', conclusion: 'misstankt_datautflode' },
  response: { containment: 'host', next_source: 'endpoint', prevention: 'egress', rationale: 'Begränsa den berörda datorn och säkra dess process- och filhändelser utan att störa övriga nät i onödan.' }
}
assert.ok(reviewInvestigation(complete).passed, JSON.stringify(reviewInvestigation(complete)))
for (const [field, value] of [['hostname', 'FORM-02'], ['source_ip', '10.20.30.30'], ['payload_bytes', '999'], ['conclusion', 'bevisad_filstold'], ['evidence', 'FAKE-ID'], ['limitations', '']]) {
  assert.equal(reviewInvestigation({ ...complete, report: { ...complete.report, [field]: value } }).passed, false, `Review catches ${field}`)
}
assert.equal(reviewInvestigation({ ...complete, custody: [] }).passed, false)
assert.equal(reviewInvestigation({ ...complete, response: { ...complete.response, containment: 'reimage' } }).passed, false)
assert.deepEqual(restoreInvestigation(JSON.stringify(complete)), complete)
assert.deepEqual(restoreInvestigation('{broken'), freshInvestigation())
assert.deepEqual(restoreInvestigation('{"version":1,"completed":[1,2,3]}'), freshInvestigation())
assert.deepEqual(restoreInvestigation('{"version":2,"preserved":[],"collected":["CAP-S-04","FAKE"]}').collected, [])
assert.equal(STAGES.length, 7)
assert.ok(STAGES.every(stage => !stage.guided.includes(SOLUTION.source_ip) && !stage.independent.includes(SOLUTION.source_ip)), 'No starter supplies the incident address')
console.log(`PASS: ${scenarios.length} real Python experiments, ${PACKETS.length} packets, 9 binary evidence hashes, PCAP frames, filters, delayed review and lab-state persistence.`)
