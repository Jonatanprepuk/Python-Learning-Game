import type { Packet } from './case'

type Predicate = (packet: Packet) => boolean
function inNetwork(address: string, value: string) {
  const [base, bits = '32'] = value.split('/')
  const parts = base.split('.').map(Number)
  const prefix = Number(bits)
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255) || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new Error('Ange en IPv4-adress eller ett nät med /prefix.')
  const number = (ip: string) => ip.split('.').reduce((sum, part) => (sum * 256 + Number(part)) >>> 0, 0)
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  return ((number(address) & mask) >>> 0) === ((number(base) & mask) >>> 0)
}

/** A deliberately bounded display-filter grammar, never eval/Python. */
export function compileDisplayFilter(input: string): Predicate {
  if (!input.trim()) return () => true
  const tokens: string[] = []
  const lexer = /\s*(\&\&|\|\||==|!=|>=|<=|[()<>]|"[^"\n]*"|'[^'\n]*'|[A-Za-z0-9_./:\-]+)/y
  let offset = 0
  while (offset < input.trimEnd().length) {
    lexer.lastIndex = offset
    const match = lexer.exec(input)
    if (!match) throw new Error(`Kan inte läsa filtret nära ”${input.slice(offset, offset + 16)}”.`)
    tokens.push(match[1]); offset = lexer.lastIndex
  }
  let cursor = 0
  const take = () => tokens[cursor++]
  const values = (packet: Packet, field: string): (string | number)[] => {
    switch (field) {
      case 'ip.addr': return [packet.src, packet.dst]
      case 'ip.src': return [packet.src]
      case 'ip.dst': return [packet.dst]
      case 'tcp.port': return packet.protocol === 'DNS' ? [] : [packet.src_port, packet.dst_port]
      case 'tcp.stream': return packet.protocol === 'DNS' ? [] : [packet.stream]
      case 'tcp.len': return packet.protocol === 'DNS' ? [] : [packet.payload_bytes]
      case 'frame.len': return [packet.length]
      case 'frame.time': return [packet.time]
      default: throw new Error('Fält stöds inte. Prova ip.addr, ip.src, ip.dst, tcp.port, tcp.stream, tcp.len, frame.len eller frame.time.')
    }
  }
  const atom = (): Predicate => {
    if (tokens[cursor] === '(') {
      take(); const test = or()
      if (take() !== ')') throw new Error('En avslutande parentes saknas.')
      return test
    }
    const field = take()
    if (!field) throw new Error('Ett villkor saknas efter operatorn.')
    const protocol = field.toLowerCase()
    if (['tcp', 'tls', 'dns', 'http', 'ip'].includes(protocol)) {
      return packet => protocol === 'ip' || (protocol === 'tcp' ? packet.protocol !== 'DNS' : packet.protocol.toLowerCase() === protocol)
    }
    // Validate fields even when the capture is empty.
    values({ src: '', dst: '', protocol: 'TCP' } as Packet, field)
    const op = take()
    if (!['==', '!=', '>', '>=', '<', '<='].includes(op)) throw new Error('Använd en jämförelse, exempelvis ip.addr == 10.20.10.22.')
    const raw = take()
    if (raw === undefined || ['&&', '||', ')'].includes(raw)) throw new Error('Jämförelsen saknar ett värde.')
    const value = raw.replace(/^['"]|['"]$/g, '').replace('T', ' ').replace(/Z$/, '')
    const addressField = field.startsWith('ip.')
    if (addressField) { inNetwork('0.0.0.0', value); if (!['==', '!='].includes(op)) throw new Error('IP-adresser jämförs med == eller !=.') }
    const numeric = !addressField && field !== 'frame.time'
    if (numeric && !/^\d+$/.test(value)) throw new Error('Detta fält behöver ett heltal.')
    const matches = (item: string | number) => {
      const right = numeric ? Number(value) : value
      if (op === '==' || op === '!=') return addressField ? inNetwork(String(item), value) : item === right
      if (op === '>') return item > right
      if (op === '>=') return item >= right
      if (op === '<') return item < right
      return item <= right
    }
    return packet => op === '!=' ? values(packet, field).length > 0 && !values(packet, field).some(matches) : values(packet, field).some(matches)
  }
  const and = (): Predicate => {
    let left = atom()
    while (['&&', 'and'].includes(tokens[cursor])) { take(); const right = atom(); const previous = left; left = packet => previous(packet) && right(packet) }
    return left
  }
  const or = (): Predicate => {
    let left = and()
    while (['||', 'or'].includes(tokens[cursor])) { take(); const right = and(); const previous = left; left = packet => previous(packet) || right(packet) }
    return left
  }
  const predicate = or()
  if (cursor !== tokens.length) throw new Error('Koppla ihop villkor med && eller || och kontrollera parenteserna.')
  return predicate
}
