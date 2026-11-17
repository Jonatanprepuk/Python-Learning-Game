import { caseData } from './case'
import type { InvestigationState } from './case'

export const FORENSICS_HELPERS = `import json as __json
import sys as __sys
import hashlib as __hashlib
import copy as __copy
import ipaddress as __ip
import datetime as __datetime

def __event(kind, message='', **payload):
    frame = __sys._getframe(1)
    while frame and frame.f_code.co_filename != '<utredning>':
        frame = frame.f_back
    __bridge(__json.dumps(dict(kind=kind, message=message, line=frame.f_lineno if frame else 1, **payload), allow_nan=False))

def print(*args, sep=' ', end='\\n'):
    __event('console', sep.join(str(a) for a in args) + end)

def source_manifest():
    return __copy.deepcopy(__data['sources'])

def all_sources():
    return [s['id'] for s in __data['sources']]

def __source(source_id):
    source = next((s for s in __data['sources'] if s['id'] == source_id), None)
    if source is None:
        raise ValueError('Okänt käll-ID: ' + str(source_id) + '. Läs Material för tillgängliga ID:n.')
    return source

def read_original(source_id):
    __source(source_id)
    return bytes.fromhex(__data['originals'][source_id])

def set_scope(networks, question):
    if not isinstance(networks, list) or not networks:
        raise ValueError('Välj minst ett nät i en lista, exempelvis ["10.20.10.0/24"].')
    known = {s['network'] for s in __data['sources'] if s['kind'] == 'capture'}
    if any(n not in known for n in networks):
        raise ValueError('Välj nät som finns i materialförteckningen.')
    if not isinstance(question, str) or not question.strip():
        raise ValueError('Skriv en fråga som du vill undersöka.')
    __event('scope', 'Avgränsning sparad. Du kan ändra den när ett nytt spår kräver det.', scope=dict(networks=list(dict.fromkeys(networks)), question=question))

def preserve_sources(source_ids):
    if not isinstance(source_ids, list) or not source_ids:
        raise ValueError('Ange en lista med käll-ID:n. all_sources() ger alla nio.')
    for source_id in dict.fromkeys(source_ids):
        source = __source(source_id)
        original = read_original(source_id)
        working_copy = bytes(bytearray(original))
        digest = __hashlib.sha256(working_copy).hexdigest()
        verified = digest == source['sha256']
        __event('preserved', source_id + (' · kontrollsumman stämmer.' if verified else ' · kontrollsumman avviker!'), source_id=source_id, sha256=digest, verified=verified, entry=dict(source_id=source_id, action='preserved', time=__now, sha256=digest, method='Bytekopia av original; SHA-256 jämförd med Miras överlämningsmanifest'))
        if not verified:
            raise ValueError('Kontrollsumman avviker för ' + source_id + '. Stoppa insamlingen och kontrollera överlämningen.')
        __preserved.add(source_id)

def collect_sources(source_ids):
    if not isinstance(source_ids, list) or not source_ids:
        raise ValueError('Välj minst en källa att samla in.')
    for source_id in dict.fromkeys(source_ids):
        source = __source(source_id)
        if source_id not in __preserved:
            raise ValueError('Säkra arbetskopian av ' + source_id + ' med preserve_sources först.')
        __collected.add(source_id)
        __event('collected', source_id + ' · arbetskopian är tillgänglig för undersökning.', source_id=source_id, entry=dict(source_id=source_id, action='collected', time=__now, sha256=source['sha256'], method='Lokal inläsning av verifierad arbetskopia; originalet orört'))

def load_packets(source_ids=None):
    ids = [s['id'] for s in __data['sources'] if s['kind'] == 'capture' and s['id'] in __collected] if source_ids is None else source_ids
    if not isinstance(ids, list) or not ids:
        raise ValueError('Samla först in minst en trafikfil i moment 3. Ange filernas käll-ID:n i en lista.')
    for source_id in ids:
        source = __source(source_id)
        if source_id not in __collected or source['kind'] != 'capture':
            raise ValueError(source_id + ' är inte en insamlad trafikfil.')
    return __copy.deepcopy([p for p in __data['packets'] if p['source_id'] in ids])

def __checked(rows):
    if not isinstance(rows, list):
        raise ValueError('Verktyget behöver en lista med paket från load_packets().')
    original = {p['id']: p for p in __data['packets'] if p['source_id'] in __collected}
    if any(not isinstance(p, dict) or original.get(p.get('id')) != p for p in rows):
        raise ValueError('Använd oförändrade paket från dina insamlade arbetskopior.')
    if len({p['id'] for p in rows}) != len(rows):
        raise ValueError('Samma paket får inte räknas två gånger.')
    return rows

def filter_packets(packets, network='', host='', peer='', protocol='', after='', before='', min_payload=0):
    __checked(packets)
    subnet = __ip.ip_network(network) if network else None
    for value in [host, peer]:
        if value: __ip.ip_address(value)
    def timestamp(value):
        if not value: return ''
        try:
            parsed = __datetime.datetime.fromisoformat(value.replace('Z', '+00:00'))
            if parsed.tzinfo: parsed = parsed.astimezone(__datetime.timezone.utc)
            return parsed.replace(tzinfo=None).isoformat(sep=' ')
        except ValueError: raise ValueError('Skriv tiden som YYYY-MM-DD HH:MM:SS.')
    after, before = timestamp(after), timestamp(before)
    if after and before and after > before:
        raise ValueError('Starttiden måste vara före sluttiden.')
    if protocol and protocol.upper() not in ['TCP', 'TLS', 'DNS', 'HTTP']:
        raise ValueError('Protokoll kan vara TCP, TLS, DNS eller HTTP. Tom text betyder alla.')
    def matches(p):
        endpoints = [p['src'], p['dst']]
        return (not subnet or any(__ip.ip_address(ip) in subnet for ip in endpoints)) and (not host or host in endpoints) and (not peer or peer in endpoints) and (not protocol or p['protocol'] == protocol.upper()) and (not after or p['time'] >= after) and (not before or p['time'] <= before) and p['payload_bytes'] >= min_payload
    return [p for p in packets if matches(p)]

def show_packets(packets):
    rows = sorted(__checked(packets), key=lambda p: (p['time'], p['source_id'], p['no']))
    __event('packets', str(len(rows)) + ' paket i urvalet. Ingen bedömning av hypotesen har gjorts.', packets=rows)

def show_conversations(packets):
    groups = {}
    for p in __checked(packets):
        if not p['src'].startswith('10.20.') or p['dst'].startswith('10.20.') or not p['payload_bytes']: continue
        key = (p['time'][:10], p['src'], p['dst'], p['dst_port'])
        if key not in groups:
            groups[key] = dict(src=p['src'], dst=p['dst'], port=p['dst_port'], day=p['time'][:10], network=p['network'], count=0, payload_bytes=0, first=p['time'], last=p['time'])
        row = groups[key]
        row['count'] += 1
        row['payload_bytes'] += p['payload_bytes']
        row['first'] = min(row['first'], p['time'])
        row['last'] = max(row['last'], p['time'])
    __event('conversations', 'Utgående kontakter summerade per dag och motpart.', conversations=sorted(groups.values(), key=lambda r: -r['payload_bytes']), packets=packets)
    return list(groups.values())

def show_timeline(packets, host='', peer=''):
    rows = filter_packets(packets, host=host, peer=peer)
    rows.sort(key=lambda p: (p['time'], p['source_id'], p['no']))
    __event('timeline', str(len(rows)) + ' paket i tidslinjen. Läs båda riktningarna och jämför dagarna.', packets=rows)
    return rows

def lookup(log_type, value=''):
    if log_type not in ['DHCP', 'DNS', 'Drift']:
        raise ValueError('Loggtyp ska vara DHCP, DNS eller Drift.')
    source_id = {'DHCP': 'LOG-DHCP', 'DNS': 'LOG-DNS', 'Drift': 'LOG-OPS'}[log_type]
    if source_id not in __collected:
        raise ValueError('Samla in ' + source_id + ' först.')
    rows = [r for r in __data['logs'] if r['type'] == log_type and (not value or value.lower() in __json.dumps(r, ensure_ascii=False).lower())]
    __event('logs', str(len(rows)) + ' loggträffar i ' + log_type + '.', records=rows)
    return __copy.deepcopy(rows)

def report_draft():
    return __copy.deepcopy(__draft)

def save_report(report):
    if not isinstance(report, dict): raise ValueError('Rapporten ska vara en dictionary.')
    result = {key: str(value) for key, value in report.items() if key in __draft}
    __event('report_draft', 'Rapportutkastet sparat. Bedömning sker först vid inlämning.', report=result)
`
let cachedData: string | undefined
export function buildForensicsSource(code: string, context: Partial<InvestigationState> = {}, now = new Date().toISOString()) {
  cachedData ??= JSON.stringify(caseData())
  return `__data = __json.loads(${JSON.stringify(cachedData)})\n__preserved = set(${JSON.stringify(context.preserved ?? [])})\n__collected = set(${JSON.stringify(context.collected ?? [])})\n__draft = __json.loads(${JSON.stringify(JSON.stringify(context.report ?? {}))})\n__now = ${JSON.stringify(now)}\nexec(compile(${JSON.stringify(code)}, '<utredning>', 'exec'), globals())`
}
