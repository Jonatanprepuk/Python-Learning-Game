import hashes from './hashes.json'

export interface Packet {
  id: string
  no: number
  source_id: string
  time: string
  network: string
  src: string
  dst: string
  src_port: number
  dst_port: number
  protocol: 'TCP' | 'TLS' | 'DNS' | 'HTTP'
  length: number
  payload_bytes: number
  stream: number
  flags: string
  info: string
  server_name?: string
}
export interface LogRecord { id: string; source_id: string; type: 'DHCP' | 'DNS' | 'Drift'; time: string; ip: string; name: string; detail: string }
export interface EvidenceSource {
  id: string; filename: string; kind: 'capture' | 'log'; network: string; label: string; day: string
  origin: string; captured_at: string; count: number; sha256: string
}
export interface CustodyEntry { source_id: string; action: 'preserved' | 'collected'; time: string; sha256: string; method: string }
export interface Observation { id: string; claim: string; evidence: string[]; alternative: string }
export interface ReportDraft {
  network: string; source_ip: string; hostname: string; destination_ip: string; domain: string
  start: string; end: string; payload_bytes: string; evidence: string; reasoning: string; counterargument: string; limitations: string; conclusion: string
}
export interface ResponseDraft { containment: string; next_source: string; prevention: string; rationale: string }
export interface InvestigationState {
  version: 2; stage: number; mode: 'guided' | 'independent'; codes: Record<string, string>
  scope: { networks: string[]; question: string }; preserved: string[]; collected: string[]
  custody: CustodyEntry[]; observations: Observation[]; report: ReportDraft; response: ResponseDraft
  history: { time: string; description: string; count: number }[]; reviewed?: Review
}
export interface Conversation { src: string; dst: string; port: number; day: string; network: string; count: number; payload_bytes: number; first: string; last: string }
export interface ForensicsEvent {
  kind: string; line: number; message: string; source_id?: string; sha256?: string; verified?: boolean
  entry?: CustodyEntry; packets?: Packet[]; records?: LogRecord[]; conversations?: Conversation[]
  scope?: InvestigationState['scope']; report?: Partial<ReportDraft>; observation?: Observation
}
export interface ReviewItem { label: string; passed: boolean; feedback: string }
export interface Review { items: ReviewItem[]; passed: boolean; submitted_at: string }
export const COMPANY = 'Nordverk Design'
export const NETWORKS = [
  { id: 'kontor', cidr: '10.20.10.0/24', label: 'Kontor', description: 'Administration, kundmöten och webbtjänster.' },
  { id: 'studio', cidr: '10.20.20.0/24', label: 'Studio', description: 'Formgivning, prototyper och projektleveranser.' },
  { id: 'drift', cidr: '10.20.30.0/24', label: 'Drift', description: 'Filservrar, driftjobb och säkerhetskopiering.' }
]
export const DAYS = ['2026-11-03', '2026-11-04']
const packets: Packet[] = []
const captures: Omit<EvidenceSource, 'sha256'>[] = []
let nextStream = 1
function addPacket(source: Omit<EvidenceSource, 'sha256'>, fields: Omit<Packet, 'id' | 'no' | 'source_id' | 'network' | 'length'>) {
  const no = packets.filter(packet => packet.source_id === source.id).length + 1
  const packet: Packet = { ...fields, id: `${source.id}:${String(no).padStart(4, '0')}`, no, source_id: source.id, network: source.network, length: 54 + fields.payload_bytes }
  if (fields.protocol === 'DNS') packet.length = 42 + dnsPayload(fields.server_name ?? '').length
  packets.push(packet)
}
function clock(day: string, seconds: number) { return `${day} ${new Date(seconds * 1000).toISOString().slice(11, 19)}` }
function session(source: Omit<EvidenceSource, 'sha256'>, host: string, peer: string, at: number, count: number, payload: number, duration: number, name: string, port = 443) {
  const stream = nextStream++
  const common = { src: host, dst: peer, src_port: 48000 + stream, dst_port: port, stream }
  addPacket(source, { ...common, time: clock(source.day, at), protocol: 'TCP', payload_bytes: 0, flags: 'SYN', info: `${common.src_port} → ${port} [SYN]` })
  addPacket(source, { ...common, src: peer, dst: host, src_port: port, dst_port: common.src_port, time: clock(source.day, at), protocol: 'TCP', payload_bytes: 0, flags: 'SYN, ACK', info: `${port} → ${common.src_port} [SYN, ACK]` })
  addPacket(source, { ...common, time: clock(source.day, at + 1), protocol: 'TLS', payload_bytes: 160, flags: 'PSH, ACK', info: `Client Hello · SNI: ${name}`, server_name: name })
  for (let i = 0; i < count; i++) {
    const time = clock(source.day, at + 2 + Math.floor(i * duration / Math.max(1, count - 1)))
    addPacket(source, { ...common, time, protocol: 'TLS', payload_bytes: payload, flags: 'PSH, ACK', info: `Application Data · ${payload} TCP-nyttolastbyte` })
    if (i % 8 === 7) addPacket(source, { ...common, src: peer, dst: host, src_port: port, dst_port: common.src_port, time, protocol: 'TCP', payload_bytes: 0, flags: 'ACK', info: `${port} → ${common.src_port} [ACK]` })
  }
}
for (const network of NETWORKS) {
  for (const day of DAYS) {
    const prefix = network.cidr.split('.').slice(0, 3).join('.')
    const source = {
      id: `CAP-${network.id[0].toUpperCase()}-${day.slice(-2)}`,
      filename: `${network.id}_${day}.pcap`, kind: 'capture' as const, network: network.cidr,
      label: network.label, day, origin: `Speglingsport för nätet ${network.label}`,
      captured_at: `${day} 00:00:00–23:59:59 UTC`, count: 0
    }
    for (let i = 0; i < 8; i++) {
      session(source, `${prefix}.${21 + i % 4}`, '198.51.100.10', (9 + i) * 3600 + 5 * 60, 3, 300 + i * 30, 12, 'portal.nordverk.example')
    }
    if (network.id === 'kontor') session(source, `${prefix}.22`, '198.51.100.60', 17 * 3600 + 50 * 60, 180, 1400, 1498, 'meet.partner.example')
    if (network.id === 'drift') session(source, `${prefix}.30`, '203.0.113.80', 18 * 3600 + 30 * 60, 360, 1400, 1798, 'vault-backup.example')
    if (network.id === 'studio') {
      session(source, `${prefix}.22`, '198.51.100.90', 10 * 3600 + 15 * 60, 36, 1100, 90, 'client-portal.example')
      if (day === '2026-11-04') {
        addPacket(source, { time: `${day} 18:41:58`, src: `${prefix}.23`, dst: '10.20.30.2', src_port: 53023, dst_port: 53, protocol: 'DNS', payload_bytes: 0, stream: 0, flags: '', info: 'Standard query A collab-sync.example', server_name: 'collab-sync.example' })
        session(source, `${prefix}.23`, '203.0.113.77', 18 * 3600 + 42 * 60 + 10, 96, 1350, 343, 'collab-sync.example', 8443)
      }
    }
    source.count = packets.filter(packet => packet.source_id === source.id).length
    captures.push(source)
  }
}
export const PACKETS = packets.sort((a, b) => a.time.localeCompare(b.time) || a.source_id.localeCompare(b.source_id) || a.no - b.no)
const packetNumbers: Record<string, number> = {}
for (const packet of PACKETS) {
  packet.no = packetNumbers[packet.source_id] = (packetNumbers[packet.source_id] ?? 0) + 1
  packet.id = `${packet.source_id}:${String(packet.no).padStart(4, '0')}`
}
export const LOGS: LogRecord[] = [
  { id: 'DHCP-01', source_id: 'LOG-DHCP', type: 'DHCP', time: '2026-11-03 07:00:00', ip: '10.20.20.23', name: 'FORM-02', detail: 'Adresslån 2026-11-03 07:00:00–23:59:59 UTC. Datorn hade adressen den första dagen.' },
  { id: 'DHCP-02', source_id: 'LOG-DHCP', type: 'DHCP', time: '2026-11-04 07:45:00', ip: '10.20.20.23', name: 'FORM-07', detail: 'Adresslån 2026-11-04 07:45:00–23:59:59 UTC. Inventarie: formgivningsstation i studion.' },
  { id: 'DHCP-03', source_id: 'LOG-DHCP', type: 'DHCP', time: '2026-11-03 00:00:00', ip: '10.20.30.30', name: 'FILES-01', detail: 'Fast adress under båda dagarna. Fil- och backupserver.' },
  { id: 'DHCP-04', source_id: 'LOG-DHCP', type: 'DHCP', time: '2026-11-03 00:00:00', ip: '10.20.10.22', name: 'MEETING-02', detail: 'Fast adress under båda dagarna. Mötesrumsdator på kontoret.' },
  { id: 'DHCP-05', source_id: 'LOG-DHCP', type: 'DHCP', time: '2026-11-03 00:00:00', ip: '10.20.20.22', name: 'FORM-04', detail: 'Fast adress under båda dagarna. Station för godkända kundleveranser.' },
  { id: 'DNS-01', source_id: 'LOG-DNS', type: 'DNS', time: '2026-11-04 18:41:58', ip: '203.0.113.77', name: 'collab-sync.example', detail: 'Klient 10.20.20.23 frågar efter A-post. Svar: 203.0.113.77, TTL 300 s.' },
  { id: 'DNS-02', source_id: 'LOG-DNS', type: 'DNS', time: '2026-11-03 18:29:58', ip: '203.0.113.80', name: 'vault-backup.example', detail: 'Klient 10.20.30.30. Samma uppslag upprepas 2026-11-04 18:29:58.' },
  { id: 'DNS-03', source_id: 'LOG-DNS', type: 'DNS', time: '2026-11-03 17:49:55', ip: '198.51.100.60', name: 'meet.partner.example', detail: 'Klient 10.20.10.22. Samma destination används av mötesrummet båda dagarna.' },
  { id: 'DNS-04', source_id: 'LOG-DNS', type: 'DNS', time: '2026-11-04 10:14:58', ip: '198.51.100.90', name: 'client-portal.example', detail: 'Klient 10.20.20.22. Kundleveransportalen används också föregående dag.' },
  { id: 'OPS-01', source_id: 'LOG-OPS', type: 'Drift', time: '2026-11-02 08:00:00', ip: '10.20.30.30', name: 'Backupfönster', detail: 'FILES-01 skickar backup till vault-backup.example, 203.0.113.80:443, varje dag 18:30–19:00 UTC. Godkänt jobb BAK-17.' },
  { id: 'OPS-02', source_id: 'LOG-OPS', type: 'Drift', time: '2026-11-02 08:00:00', ip: '10.20.10.22', name: 'Kundworkshop', detail: 'MEETING-02 deltar i en tvådagars workshop 3–4 november, 17:50–18:15 UTC, via meet.partner.example. Videodelning ger mycket utgående trafik.' },
  { id: 'OPS-03', source_id: 'LOG-OPS', type: 'Drift', time: '2026-11-02 08:00:00', ip: '10.20.20.0/24', name: 'Studions arbetssätt', detail: 'Studion arbetar normalt 08:00–17:00 UTC. Kundleveranser går via client-portal.example på port 443. collab-sync.example finns inte i listan över godkända lagringstjänster. Övertid förekommer och måste kontrolleras separat.' },
  { id: 'OPS-04', source_id: 'LOG-OPS', type: 'Drift', time: '2026-11-05 07:55:00', ip: '', name: 'Larmets begränsning', detail: 'Egresslarmet gäller ovanlig extern trafik kvällen 4 november. Larmet är aggregerat och anger ingen säker källdator. TLS-innehåll och processloggar ingår inte i överlämningen.' }
]
const logSources: Omit<EvidenceSource, 'sha256'>[] = [
  { id: 'LOG-DHCP', filename: 'adresslan_03-04.json', kind: 'log', network: 'Alla nät', label: 'Adresslån / DHCP', day: 'Båda dagarna', origin: 'DHCP-server, export av Mira', captured_at: '2026-11-05 07:50:00 UTC', count: LOGS.filter(row => row.type === 'DHCP').length },
  { id: 'LOG-DNS', filename: 'namnuppslag_03-04.json', kind: 'log', network: 'Alla nät', label: 'Namnuppslag / DNS', day: 'Båda dagarna', origin: 'Intern DNS-resolver, export av Mira', captured_at: '2026-11-05 07:52:00 UTC', count: LOGS.filter(row => row.type === 'DNS').length },
  { id: 'LOG-OPS', filename: 'driftanteckningar.json', kind: 'log', network: 'Alla nät', label: 'Drift och godkända tjänster', day: 'Båda dagarna', origin: 'Driftjournal, överlämnad av Mira', captured_at: '2026-11-05 07:55:00 UTC', count: LOGS.filter(row => row.type === 'Drift').length }
]
const manifestHashes: Record<string, string> = hashes
export const SOURCES: EvidenceSource[] = [...captures, ...logSources].map(source => ({ ...source, sha256: manifestHashes[source.id] ?? '' }))
function dnsPayload(name: string): number[] {
  const encoded = name.split('.').flatMap(label => [label.length, ...Array.from(label).map(char => char.charCodeAt(0))])
  return [0x12, 0x34, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, ...encoded, 0, 0, 1, 0, 1]
}
/** Synthetic frames: displayed bytes and hashed PCAP copies share this representation. */
export function packetBytes(packet: Packet): Uint8Array {
  const bytes = new Uint8Array(packet.length)
  bytes.set([2, 0, 0, 0, 0, 2, 2, 0, 0, 0, 0, 1, 8, 0])
  const view = new DataView(bytes.buffer)
  bytes[14] = 0x45; view.setUint16(16, packet.length - 14); view.setUint16(18, packet.no)
  bytes[22] = 64; bytes[23] = packet.protocol === 'DNS' ? 17 : 6
  bytes.set(packet.src.split('.').map(Number), 26); bytes.set(packet.dst.split('.').map(Number), 30)
  let checksum = 0
  for (let i = 14; i < 34; i += 2) checksum += view.getUint16(i)
  while (checksum >>> 16) checksum = (checksum & 65535) + (checksum >>> 16)
  view.setUint16(24, (~checksum) & 65535)
  view.setUint16(34, packet.src_port); view.setUint16(36, packet.dst_port)
  if (packet.protocol === 'DNS') {
    view.setUint16(38, packet.length - 34); bytes.set(dnsPayload(packet.server_name ?? ''), 42)
  } else {
    view.setUint32(38, packet.no * 1400); bytes[46] = 0x50
    bytes[47] = packet.flags.includes('SYN') ? packet.flags.includes('ACK') ? 0x12 : 2 : packet.payload_bytes ? 0x18 : 0x10
    view.setUint16(48, 65535)
    for (let i = 54; i < bytes.length; i++) bytes[i] = (packet.no * 37 + i * 19) % 256
    if (packet.payload_bytes >= 5) { bytes.set([0x17, 3, 3], 54); view.setUint16(57, packet.payload_bytes - 5) }
  }
  return bytes
}
export function sourceBytes(sourceId: string): Uint8Array {
  const source = SOURCES.find(item => item.id === sourceId)
  if (!source) throw new Error('Okänd källa')
  if (source.kind === 'log') return new TextEncoder().encode(JSON.stringify(LOGS.filter(row => row.source_id === sourceId)))
  const rows = PACKETS.filter(row => row.source_id === sourceId).sort((a, b) => a.no - b.no)
  const bytes = new Uint8Array(24 + rows.reduce((sum, row) => sum + 16 + row.length, 0))
  const view = new DataView(bytes.buffer)
  view.setUint32(0, 0xa1b2c3d4, true); view.setUint16(4, 2, true); view.setUint16(6, 4, true)
  view.setUint32(16, 65535, true); view.setUint32(20, 1, true)
  let offset = 24
  for (const packet of rows) {
    view.setUint32(offset, Date.parse(packet.time.replace(' ', 'T') + 'Z') / 1000, true)
    view.setUint32(offset + 8, packet.length, true); view.setUint32(offset + 12, packet.length, true)
    bytes.set(packetBytes(packet), offset + 16); offset += 16 + packet.length
  }
  return bytes
}
function hex(bytes: Uint8Array) { return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('') }
export function caseData() {
  return { sources: SOURCES, packets: PACKETS, logs: LOGS, originals: Object.fromEntries(SOURCES.map(source => [source.id, hex(sourceBytes(source.id))])) }
}
export function formatBytes(value: number) {
  return value >= 1000000 ? `${(value / 1000000).toLocaleString('sv-SE', { maximumFractionDigits: 2 })} MB` : `${(value / 1000).toLocaleString('sv-SE', { maximumFractionDigits: 2 })} kB`
}
export function summarize(rows: Packet[]): Conversation[] {
  const groups = new Map<string, Conversation>()
  for (const row of rows) {
    if (!row.src.startsWith('10.20.') || row.dst.startsWith('10.20.') || !row.payload_bytes) continue
    const key = `${row.time.slice(0, 10)}|${row.src}|${row.dst}|${row.dst_port}`
    const group = groups.get(key) ?? { src: row.src, dst: row.dst, port: row.dst_port, day: row.time.slice(0, 10), network: row.network, count: 0, payload_bytes: 0, first: row.time, last: row.time }
    group.count++; group.payload_bytes += row.payload_bytes
    if (row.time < group.first) group.first = row.time
    if (row.time > group.last) group.last = row.time
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => b.payload_bytes - a.payload_bytes)
}
export function freshInvestigation(): InvestigationState {
  return {
    version: 2, stage: 1, mode: 'guided', codes: {}, scope: { networks: [], question: '' },
    preserved: [], collected: [], custody: [], observations: [], history: [],
    report: { network: '', source_ip: '', hostname: '', destination_ip: '', domain: '', start: '', end: '', payload_bytes: '', evidence: '', reasoning: '', counterargument: '', limitations: '', conclusion: '' },
    response: { containment: '', next_source: '', prevention: '', rationale: '' }
  }
}
