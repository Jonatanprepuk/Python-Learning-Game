import type { TileKind } from '../types'

const CELLS = 4
const SIZE = CELLS * 2 + 1
const DIRECTIONS = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 }
]

/** Randomized depth-first spanning tree: every open tile is connected, and
 * the corridor graph has no cycles. A wall follower can therefore reach G. */
export function createPerfectMaze(random: () => number = Math.random): TileKind[][] {
  const grid = Array.from({ length: SIZE }, () => Array<TileKind>(SIZE).fill('wall'))
  const visited = new Set(['0,0'])
  const stack = [{ x: 0, y: 0 }]
  grid[1][1] = 'empty'

  while (stack.length) {
    const cell = stack[stack.length - 1]
    const choices = DIRECTIONS
      .map(delta => ({ x: cell.x + delta.x, y: cell.y + delta.y }))
      .filter(next => next.x >= 0 && next.y >= 0 && next.x < CELLS && next.y < CELLS && !visited.has(`${next.x},${next.y}`))
    if (!choices.length) {
      stack.pop()
      continue
    }
    const next = choices[Math.floor(random() * choices.length)]
    grid[cell.y + next.y + 1][cell.x + next.x + 1] = 'empty'
    grid[next.y * 2 + 1][next.x * 2 + 1] = 'empty'
    visited.add(`${next.x},${next.y}`)
    stack.push(next)
  }

  grid[SIZE - 2][SIZE - 2] = 'goal'
  return grid
}

export function mazeKey(grid: TileKind[][]): string {
  return grid.map(row => row.map(tile => tile === 'wall' ? '#' : '.').join('')).join('\n')
}

export function nextUniqueMaze(seen: Set<string>, random: () => number = Math.random): TileKind[][] {
  for (let attempt = 0; attempt < 10000; attempt++) {
    const grid = createPerfectMaze(random)
    const key = mazeKey(grid)
    if (seen.has(key)) continue
    seen.add(key)
    return grid
  }
  throw new Error('Kunde inte skapa en ny labyrint. Ladda om sidan och försök igen.')
}
