import type { Direction, DoorCondition, GridPos, Mechanism, TileKind } from '../types'

// Each pair is a route to a terminal, followed by the gated route to the exit.
const routes = [
  ['RRU', 'URRRDD'], ['UUUR', 'RRDDDRR'], ['RRRDD', 'DLLLLUU'],
  ['DDRRR', 'UUURRU'], ['RR', 'DDDRRRU'], ['ULL', 'UUURRRRDD'],
  ['RRRD', 'RRUUUULL'], ['LUU', 'LLUUURRR'], ['RRR', 'UUULLL'],
  ['RRRR', 'UURRRDD'], ['UUU', 'RRRRDDLLD'], ['UU', 'LLLDDDDR'],
  ['LLD', 'DDRRRDDRRU'], ['DRRRR', 'UUUUULL'], ['ULLLL', 'DDDDRRRRRU'],
  ['RRUU', 'UULLLLDD'], ['UUU', 'UUURRR'], ['RR', 'UURRRDDDRRU'],
  ['DD', 'RRRRUULLU'], ['RR', 'UUURRDDDDRRUUUURR']
] as const
const directions = ['R', 'D', 'L', 'U'] as const
const vectors: Record<string, GridPos> = { R: { x: 1, y: 0 }, D: { x: 0, y: 1 }, L: { x: -1, y: 0 }, U: { x: 0, y: -1 } }

export function buildDataMap(index: number, condition: DoorCondition) {
  let pos = { x: 0, y: 0 }
  let facing = 0
  const floor: GridPos[] = [{ ...pos }]
  const walk = (path: string) => {
    const commands: string[] = []
    for (const step of path) {
      const next = directions.indexOf(step as typeof directions[number])
      const turns = (next - facing + 4) % 4
      if (turns === 3) commands.push('turn_left()')
      else for (let i = 0; i < turns; i++) commands.push('turn_right()')
      commands.push('move()')
      facing = next
      pos = { x: pos.x + vectors[step].x, y: pos.y + vectors[step].y }
      floor.push({ ...pos })
    }
    return commands.join('\n')
  }
  const approach = walk(routes[index][0])
  const station = { ...pos }
  const barrierIndex = floor.length
  const travel = walk(routes[index][1])
  const minX = Math.min(...floor.map(p => p.x)) - 1
  const minY = Math.min(...floor.map(p => p.y)) - 1
  const width = Math.max(...floor.map(p => p.x)) - minX + 2
  const height = Math.max(...floor.map(p => p.y)) - minY + 2
  const shift = (p: GridPos) => ({ x: p.x - minX, y: p.y - minY })
  const tileGrid = Array.from({ length: height }, () => Array<TileKind>(width).fill('wall'))
  floor.forEach(p => { tileGrid[p.y - minY][p.x - minX] = 'empty' })
  tileGrid[pos.y - minY][pos.x - minX] = 'goal'
  const mechanisms: Mechanism[] = [{
    id: 'A', label: 'Datagrind', kind: 'door', station: shift(station),
    barriers: [shift(floor[barrierIndex])], condition
  }]
  return {
    width, height, tileGrid, mechanisms,
    playerStart: { ...shift({ x: 0, y: 0 }), direction: 'right' as Direction },
    approach, travel
  }
}
