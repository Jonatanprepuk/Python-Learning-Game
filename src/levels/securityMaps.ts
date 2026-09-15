import type { Direction, DoorCondition, GridPos, Mechanism, TileKind } from '../types'

interface Stage {
  approach: string
  travel: string
  label: string
  kind: Mechanism['kind']
  code?: string
  condition?: DoorCondition
  alternate?: { path: string; label: string; condition: DoorCondition }
}
interface Mission { story: string; stages: Stage[] }
const eq = (variable: string, value: string | number | boolean): DoorCondition => ({ variable, op: '==', value })

// Each mission has its own spatial route. Compass paths describe geometry only;
// the learner writes normal robot commands and conditional actions.
const missions: Mission[] = [
  { story: 'Gå till panel A i entréns sidoficka. Väck panelen, aktivera grinden och gå runt väggen till utgången.', stages: [
    { approach: 'RRU', travel: 'URRRDD', kind: 'door', label: 'Entrégrind' }] },
  { story: 'Kortläsaren sitter norr om start. Kontrollera kortet där och sväng in genom arkivets kortgrind.', stages: [
    { approach: 'UUUR', travel: 'RRDDDRR', kind: 'door', label: 'Kortgrind' }] },
  { story: 'Ett felaktigt kort har startat en intrångsövning. Gå till larmcentral A och aktivera larmet för att koppla bort laserfältet på evakueringsvägen.', stages: [
    { approach: 'RRRDD', travel: 'DLLLLUU', kind: 'laser', label: 'Evakueringslaser' }] },
  { story: 'Den heta scannergången går inte att beträda. Nå kylpanelen via den nedre gången och slå på fläkten innan du går genom värmezonen.', stages: [
    { approach: 'DDRRR', travel: 'UUURRU', kind: 'heat', label: 'Het scanner' }] },
  { story: 'Vid förgreningen visar batteriet 12. Välj laddvägen nedåt med din if-sats; vägen rakt fram kräver ett fulladdat batteri.', stages: [
    { approach: 'RR', travel: 'DDDRRRU', kind: 'charger', label: 'Laddväg', alternate: { path: 'RRRU', label: 'Patrullspärr', condition: eq('battery', 100) } }] },
  { story: 'Arkivet är byggt runt ett skyddat valv. Nå behörighetspanelen i väster, öppna valvgrinden och runda valvet till målet.', stages: [
    { approach: 'ULL', travel: 'UUURRRRDD', kind: 'door', label: 'Valvgrind' }] },
  { story: 'Hissens lastpanel finns längst ned i schaktet. Godkänn lasten där och kör upp genom hissplattformen till den övre korridoren.', stages: [
    { approach: 'RRRD', travel: 'RRUUUULL', kind: 'lift', label: 'Hissplattform' }] },
  { story: 'Temperaturen ligger precis på gränsen. Testa vid panel A utan att utlösa larmet. Markera checked, aktivera och följ den smala gångbron.', stages: [
    { approach: 'LUU', travel: 'LLUUURRR', kind: 'bridge', label: 'Tyst gångbro' }] },
  { story: 'Här delar sig korridoren. Servicekortet ska välja elif-grenen och servicevägen uppåt. Den raka huvudvägen kräver NOVA.', stages: [
    { approach: 'RRR', travel: 'UUULLL', kind: 'door', label: 'Serviceväg', alternate: { path: 'RRDD', label: 'Huvuddörr', condition: eq('status', 'ÖPPEN') } }] },
  { story: 'Välj patrullvägen uppåt vid panel A när batteriet räcker. Lägg både aktivering och patrullens rörelser i rätt gren.', stages: [
    { approach: 'RRRR', travel: 'UURRRDD', kind: 'door', label: 'Patrullväg', alternate: { path: 'DDLL', label: 'Laddgrind', condition: eq('patrol', 'LADDA') } }] },
  { story: 'En laser skär av kraftgången. Gå till reservpanelen, summera cellerna och aktivera skyddet innan roboten korsar laserfältet.', stages: [
    { approach: 'UUU', travel: 'RRRRDDLLD', kind: 'laser', label: 'Skyddat laserfält' }] },
  { story: 'Räkna på energin vid korsningen. Med 25 kvar ska elif-grenen ta roboten åt vänster till laddstationen. Vägen uppåt kräver minst 30.', stages: [
    { approach: 'UU', travel: 'LLLDDDDR', kind: 'charger', label: 'Reservladdning', alternate: { path: 'UURR', label: 'Uppdragsgrind', condition: eq('route', 'FORTSÄTT') } }] },
  { story: 'Lasrarna ligger i en sicksackgång. Beräkna total effekt vid panel A och välj KYL innan roboten går in i fältet.', stages: [
    { approach: 'LLD', travel: 'DDRRRDDRRU', kind: 'laser', label: 'Överbelastade lasrar' }] },
  { story: 'Reservkraften driver en utdragbar bro över ett schakt. Dela kraften vid brofästet och kör över först när varje sensor får tillräckligt.', stages: [
    { approach: 'DRRRR', travel: 'UUUUULL', kind: 'bridge', label: 'Sensorbro' }] },
  { story: 'Batterilagret har en lastplattform i en återvändsgränd. Vid panel A behöver du både ett öppet förråd och tillräckligt många hela batteripaket för att nå den bakre utgången.', stages: [
    { approach: 'ULLLL', travel: 'DDDDRRRRRU', kind: 'lift', label: 'Batteriplattform' }] },
  { story: 'En signalstyrd laser spärrar en smal passage. Kontrollera att signalen är påslagen och att det är rätt tick. Passera i den inre BLINK-grenen.', stages: [
    { approach: 'RRUU', travel: 'UULLLLDD', kind: 'laser', label: 'Signallaser' }] },
  { story: 'Riskpanelen har tre vägval. LARM går vänster, VARNING går upp och LUGNT går höger. Kontrollera först sensorn och välj sedan varningsvägen med ett nästlat elif.', stages: [
    { approach: 'UUU', travel: 'UUURRR', kind: 'door', label: 'Varningsväg', alternate: { path: 'RRRD', label: 'Normalväg', condition: eq('status', 'LUGNT') } }] },
  { story: 'Två olika hinder kräver två stopp och ström från huvudbrytaren. Vid A kyler du värmezonen. Kör sedan till B och pumpa bort vattnet innan du fortsätter till målet.', stages: [
    { approach: 'RR', travel: 'UURRR', kind: 'heat', label: 'Värmezon', code: 'if power == 1:\n    if temperature > 40:\n        fan_on = True', condition: eq('fan_on', true) },
    { approach: '', travel: 'DDDRRU', kind: 'water', label: 'Översvämmad gång', code: 'if power == 1:\n    if water_level >= 70:\n        pump_on = True', condition: eq('pump_on', true) }] },
  { story: 'Luftslussen har en kortkontroll vid A och en miljökontroll vid B. Öppna den yttre grinden med kortet och kontrollera sedan både tryck och syre innan du går vidare.', stages: [
    { approach: 'DD', travel: 'RRRR', kind: 'door', label: 'Yttre sluss', code: 'if access_code == "NOVA":\n    card_ok = True', condition: eq('card_ok', true) },
    { approach: '', travel: 'UULLU', kind: 'door', label: 'Tryckport', condition: eq('airlock_open', true) }] },
  { story: 'Sista banan går genom tre system. A kontrollerar kortet, B lägger ut energibron och C startar skyddet. Beräkna energin vid B och nå alla tre paneler innan utgången.', stages: [
    { approach: 'RR', travel: 'UUURR', kind: 'door', label: 'Identitetsgrind', code: 'if access_code == "NOVA":\n    card_ok = True', condition: eq('card_ok', true) },
    { approach: '', travel: 'DDDDRR', kind: 'bridge', label: 'Energibro', code: 'remaining = main_power + backup_power - sensors * sensor_cost\nif remaining >= 50:\n    bridge_ready = True', condition: eq('bridge_ready', true) },
    { approach: '', travel: 'UUUURR', kind: 'laser', label: 'Slutligt skydd', condition: eq('system_on', true) }] }
]

const vectors: Record<string, GridPos> = { R: { x: 1, y: 0 }, D: { x: 0, y: 1 }, L: { x: -1, y: 0 }, U: { x: 0, y: -1 } }
const directions = ['R', 'D', 'L', 'U']
export function buildSecurityMission(index: number, solution: string, expected: Record<string, number | string | boolean>) {
  const mission = missions[index]
  let pos = { x: 0, y: 0 }
  let facing = 'R'
  const floor: GridPos[] = [{ ...pos }]
  const mechanisms: Mechanism[] = []
  let program = ''
  const walk = (path: string) => {
    const lines: string[] = []
    for (const direction of path) {
      const rotation = (directions.indexOf(direction) - directions.indexOf(facing) + 4) % 4
      if (rotation === 3) lines.push('turn_left()')
      else for (let count = 0; count < rotation; count++) lines.push('turn_right()')
      lines.push('move()')
      facing = direction
      pos = { x: pos.x + vectors[direction].x, y: pos.y + vectors[direction].y }
      floor.push({ ...pos })
    }
    return lines.join('\n')
  }
  for (const [stageIndex, stage] of mission.stages.entries()) {
    const approach = walk(stage.approach)
    const station = { ...pos }
    const id = String.fromCharCode(65 + stageIndex)
    const routeStart = floor.length
    const travel = walk(stage.travel)
    const condition = stage.condition ?? { all: Object.entries(expected).map(([variable, value]) => eq(variable, value)) }
    mechanisms.push({ id, label: stage.label, kind: stage.kind, station, barriers: floor.slice(routeStart, routeStart + (stage.kind === 'laser' || stage.kind === 'water' || stage.kind === 'bridge' ? 2 : 1)), condition })
    const alternatives = stage.alternate ? [stage.alternate] : []
    if (index === 16) alternatives.push({ path: 'LLLD', label: 'Larmväg', condition: eq('status', 'LARM') })
    for (const [alternativeIndex, alternative] of alternatives.entries()) {
      let branch = { ...station }
      const cells: GridPos[] = []
      for (const direction of alternative.path) {
        branch = { x: branch.x + vectors[direction].x, y: branch.y + vectors[direction].y }
        cells.push({ ...branch }); floor.push({ ...branch })
      }
      mechanisms.push({ id: `${id}×${alternativeIndex + 1}`, label: alternative.label, kind: 'door', station, barriers: cells.slice(0, 1), condition: alternative.condition, required: false })
    }
    let code = stage.code ?? solution
    // Put activate and movement in the branch producing the expected result.
    const lines = code.split('\n')
    const match = lines.map((line, index) => ({ line, index })).reverse().find(({ line }) => {
      const assignment = line.trim().match(/^(\w+) = (.+)$/)
      if (!assignment) return false
      const target = stage.condition && 'variable' in stage.condition ? { [stage.condition.variable]: stage.condition.value } : expected
      return Object.entries(target).some(([name, value]) => assignment[1] === name && assignment[2] === (typeof value === 'boolean' ? value ? 'True' : 'False' : JSON.stringify(value)))
    })?.index ?? -1
    if (match < 0) throw new Error(`Missing conditional action in mission ${index + 1}`)
    const indent = lines[match].match(/^ */)![0]
    lines.splice(match + 1, 0, ...['activate()', ...travel.split('\n')].map(line => indent + line))
    code = lines.join('\n')
    program += `\n# Gå till panel ${id}: ${stage.label}.\n${approach}\n${code}\n`
  }
  const minX = Math.min(...floor.map(p => p.x)) - 1
  const minY = Math.min(...floor.map(p => p.y)) - 1
  const width = Math.max(...floor.map(p => p.x)) - minX + 2
  const height = Math.max(...floor.map(p => p.y)) - minY + 2
  const shift = (p: GridPos) => ({ x: p.x - minX, y: p.y - minY })
  const tileGrid: TileKind[][] = Array.from({ length: height }, () => Array<TileKind>(width).fill('wall'))
  floor.forEach(p => { tileGrid[p.y - minY][p.x - minX] = 'empty' })
  tileGrid[pos.y - minY][pos.x - minX] = 'goal'
  return {
    story: mission.story, program,
    width, height, tileGrid,
    playerStart: { ...shift({ x: 0, y: 0 }), direction: 'right' as Direction },
    mechanisms: mechanisms.map(m => ({ ...m, station: shift(m.station), barriers: m.barriers.map(shift) }))
  }
}
