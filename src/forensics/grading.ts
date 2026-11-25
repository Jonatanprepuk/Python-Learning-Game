import { LOGS, PACKETS, SOURCES } from './case'
import type { InvestigationState, Review, Packet } from './case'

// Only the final submission uses the solution. Exploration and chapter
// navigation never import or consult this rubric.
const incident = PACKETS.filter(row => row.source_id === 'CAP-S-04' && [row.src, row.dst].includes('10.20.20.23') && [row.src, row.dst].includes('203.0.113.77'))
export const SOLUTION = {
  network: '10.20.20.0/24', source_ip: '10.20.20.23', hostname: 'FORM-07', destination_ip: '203.0.113.77', domain: 'collab-sync.example',
  start: incident[0].time, end: incident[incident.length - 1].time,
  payload_bytes: incident.filter(row => row.src === '10.20.20.23').reduce((sum, row) => sum + row.payload_bytes, 0)
}
export function evidenceIds(text: string) { return [...new Set(text.split(/[\s,;]+/).map(id => id.trim()).filter(Boolean))] }
export function isAvailableEvidence(id: string, collected: string[]) {
  if (collected.includes(id)) return SOURCES.some(source => source.id === id)
  const source = PACKETS.find(row => row.id === id)?.source_id ?? LOGS.find(row => row.id === id)?.source_id
  return !!source && collected.includes(source)
}
function time(value: string) { return value.trim().replace('T', ' ').replace(/(?:\.000)?Z$/, '') }
export function reviewInvestigation(state: InvestigationState): Review {
  const report = state.report
  const refs = evidenceIds(report.evidence)
  const hasPacket = (condition: (packet: Packet) => boolean) => refs.some(id => { const row = PACKETS.find(packet => packet.id === id); return !!row && condition(row) })
  const material = ['CAP-S-03', 'CAP-S-04', 'LOG-DHCP', 'LOG-DNS', 'LOG-OPS'].every(id => state.collected.includes(id))
  const sourceChoice = report.network.trim() === SOLUTION.network && report.source_ip.trim() === SOLUTION.source_ip && report.hostname.trim().toUpperCase() === SOLUTION.hostname
  const destination = report.destination_ip.trim() === SOLUTION.destination_ip && report.domain.trim().toLowerCase() === SOLUTION.domain
  const timeline = time(report.start) === SOLUTION.start && time(report.end) === SOLUTION.end && Number(report.payload_bytes.replace(/[\s_]/g, '')) === SOLUTION.payload_bytes
  const references = refs.length > 0 && refs.every(id => isAvailableEvidence(id, state.collected)) &&
    ['DHCP-02', 'DNS-01', 'OPS-03', 'CAP-S-03'].every(id => refs.includes(id)) && refs.some(id => ['OPS-01', 'OPS-02'].includes(id)) &&
    hasPacket(row => row.src === SOLUTION.source_ip && row.dst === SOLUTION.destination_ip && row.flags === 'SYN') &&
    hasPacket(row => row.src === SOLUTION.source_ip && row.dst === SOLUTION.destination_ip && row.time === SOLUTION.end)
  const observations = state.observations.filter(note => note.claim.trim().length > 0 && note.alternative.trim().length > 0 && note.evidence.length > 0 && note.evidence.every(id => isAvailableEvidence(id, state.collected)))
  const preserved = material && state.collected.every(id => state.preserved.includes(id) && state.custody.some(entry => entry.source_id === id && entry.action === 'preserved' && entry.sha256 === SOURCES.find(source => source.id === id)?.sha256))
  const items = [
    { label: 'Avgränsning och jämförelsematerial', passed: material && state.scope.networks.length >= 2 && state.scope.question.trim().length > 0, feedback: 'Behåll både händelsedagen och en jämförelsedag. Formulera en utredningsfråga och pröva mer än ett nät. Adress-, namn- och driftloggar behövs för sammanhanget.' },
    { label: 'Bevarade original och spårbar insamling', passed: preserved, feedback: 'Varje insamlad källa ska ha en verifierad arbetskopia och en SHA-256-post i bevisjournalen. Hashen visar att kopian stämmer med överlämningen, inte att innehållet i sig är sant.' },
    { label: 'Dator och adress vid händelsen', passed: sourceChoice, feedback: 'Kontrollera nätet, källadressen och adresslånet på rätt dag. Samma IP-adress kan tillhöra olika datorer den 3 och 4 november.' },
    { label: 'Destination och observerat händelseförlopp', passed: destination && timeline, feedback: 'Kontrollera destinationens namn, första TCP-anslutningen och sista utgående datapaketet. Summera utgående TCP-nyttolast i hela konversationen, inte Ethernet-ramarnas längder eller enbart stora paket.' },
    { label: 'Bevis för och emot hypotesen', passed: references, feedback: 'Hänvisa till första och sista relevanta paketet, rätt DHCP-post, DNS-posten och driftens information om studion. Referera även till studions jämförelsefil och en driftanteckning som förklarar ett annat stort trafikflöde.' },
    { label: 'Resonemang att diskutera', passed: observations.length >= 2 && report.reasoning.trim().length > 0 && report.counterargument.trim().length > 0 && report.limitations.trim().length > 0 && report.conclusion === 'misstankt_datautflode', feedback: 'Dokumentera minst två prövade hypoteser med belägg och en alternativ förklaring. Rapporten behöver ett resonemang, ett motargument och vad du inte vet. Textens kvalitet diskuteras med handledaren. Metadata räcker till misstanke om datautflöde, inte till att fastställa en viss stulen fil eller person.' },
    { label: 'Proportionerlig åtgärd och fortsatt undersökning', passed: state.response.containment === 'host' && state.response.next_source === 'endpoint' && state.response.prevention === 'egress' && state.response.rationale.trim().length > 0, feedback: 'Begränsa den berörda datorn och bevara dess spår. Process- och filhändelser kan klargöra innehåll och orsak. En kontrollerad regel för externa tjänster är mer proportionerlig än att stoppa alla nät eller blockera all TLS.' }
  ]
  return { items, passed: items.every(item => item.passed), submitted_at: new Date().toISOString() }
}
