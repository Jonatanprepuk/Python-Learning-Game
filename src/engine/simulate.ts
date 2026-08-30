import type { Direction, GridPos, SimWorldState, TileKind } from '../types'

const DELTAS: Record<Direction, GridPos> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
}

const LEFT_TURN: Record<Direction, Direction> = {
  up: 'left',
  left: 'down',
  down: 'right',
  right: 'up'
}

const RIGHT_TURN: Record<Direction, Direction> = {
  up: 'right',
  right: 'down',
  down: 'left',
  left: 'up'
}

export function tileAt(grid: TileKind[][], x: number, y: number): TileKind {
  if (y < 0 || y >= grid.length) return 'wall'
  const row = grid[y]
  if (x < 0 || x >= row.length) return 'wall'
  return row[x]
}

export function createInitialState(
  tileGrid: TileKind[][],
  start: { x: number; y: number; direction: Direction }
): SimWorldState {
  const resources: GridPos[] = []
  tileGrid.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile === 'resource') resources.push({ x, y })
    })
  })
  return {
    robot: { x: start.x, y: start.y, direction: start.direction },
    resources,
    collected: 0,
    totalResources: resources.length,
    bumped: false,
    message: null,
    doorsOpen: false
  }
}

function clone(state: SimWorldState): SimWorldState {
  return {
    robot: { ...state.robot },
    resources: state.resources.map((r) => ({ ...r })),
    collected: state.collected,
    totalResources: state.totalResources,
    bumped: false,
    message: null,
    doorsOpen: state.doorsOpen
  }
}

/**
 * Returns a new state with doorsOpen updated (or the same state if unchanged),
 * so the UI can visually flip a door open the instant a variable becomes
 * correct — not only the next time the robot tries to move through it.
 */
export function withDoorsOpen(state: SimWorldState, doorsOpen: boolean): SimWorldState {
  if (state.doorsOpen === doorsOpen) return state
  return { ...clone(state), doorsOpen }
}

export function aheadPosition(state: SimWorldState): GridPos {
  const d = DELTAS[state.robot.direction]
  return { x: state.robot.x + d.x, y: state.robot.y + d.y }
}

export function isBlocked(grid: TileKind[][], pos: GridPos, doorsOpen: boolean): boolean {
  const tile = tileAt(grid, pos.x, pos.y)
  if (tile === 'wall') return true
  if (tile === 'door') return !doorsOpen
  return false
}

export function applyMove(state: SimWorldState, grid: TileKind[][], doorsOpen: boolean): SimWorldState {
  const next = clone(state)
  const target = aheadPosition(state)
  if (isBlocked(grid, target, doorsOpen)) {
    next.bumped = true
    next.message =
      tileAt(grid, target.x, target.y) === 'door'
        ? 'Dörren är låst – något stämmer inte än.'
        : 'Roboten kan inte flytta dit – något är i vägen.'
    return next
  }
  next.robot.x = target.x
  next.robot.y = target.y
  return next
}

export function applyTurnLeft(state: SimWorldState): SimWorldState {
  const next = clone(state)
  next.robot.direction = LEFT_TURN[state.robot.direction]
  return next
}

export function applyTurnRight(state: SimWorldState): SimWorldState {
  const next = clone(state)
  next.robot.direction = RIGHT_TURN[state.robot.direction]
  return next
}

export function applyCollect(state: SimWorldState): SimWorldState {
  const next = clone(state)
  const idx = next.resources.findIndex((r) => r.x === state.robot.x && r.y === state.robot.y)
  if (idx === -1) {
    next.message = 'Det finns inget att samla här.'
    return next
  }
  next.resources.splice(idx, 1)
  next.collected = state.collected + 1
  return next
}

export function queryCanMove(state: SimWorldState, grid: TileKind[][], doorsOpen: boolean): boolean {
  return !isBlocked(grid, aheadPosition(state), doorsOpen)
}

export function queryResourceAhead(state: SimWorldState, grid: TileKind[][], doorsOpen: boolean): boolean {
  const target = aheadPosition(state)
  if (isBlocked(grid, target, doorsOpen)) return false
  return state.resources.some((r) => r.x === target.x && r.y === target.y)
}

export function queryAtGoal(state: SimWorldState, grid: TileKind[][]): boolean {
  return tileAt(grid, state.robot.x, state.robot.y) === 'goal'
}

export function checkWin(
  state: SimWorldState,
  grid: TileKind[][],
  requireAllResources?: boolean
): boolean {
  const onGoal = tileAt(grid, state.robot.x, state.robot.y) === 'goal'
  if (!onGoal) return false
  if (requireAllResources && state.collected < state.totalResources) return false
  return true
}
