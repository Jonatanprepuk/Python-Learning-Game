import type { Direction, DoorCondition, GridPos, Mechanism, SimWorldState, SnapshotValue, TileKind } from '../types'

/** Doors can listen to sensor readings, status text, or several checks together. */
export function evaluateDoorCondition(condition: DoorCondition | undefined, variables: Record<string, SnapshotValue>): boolean {
  if (!condition) return false
  if ('all' in condition) return condition.all.length > 0 && condition.all.every(item => evaluateDoorCondition(item, variables))
  const value = variables[condition.variable]
  if (condition.op === '==') return value === condition.value
  if (typeof value !== 'number' || typeof condition.value !== 'number') return false
  switch (condition.op) {
    case '>=': return value >= condition.value
    case '<=': return value <= condition.value
    case '>': return value > condition.value
    case '<': return value < condition.value
  }
}

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
  start: { x: number; y: number; direction: Direction },
  mechanisms?: Mechanism[]
): SimWorldState {
  const resources: GridPos[] = []
  tileGrid.forEach((row, y) => {
    row.forEach((tile, x) => {
      if (tile === 'resource') resources.push({ x, y })
    })
  })
  return {
    mechanisms,
    activated: [],
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
    mechanisms: state.mechanisms,
    activated: [...(state.activated ?? [])],
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
  const obstacle = closedMechanism(state, target)
  if (obstacle) {
    next.bumped = true
    next.message = `${obstacle.label} blockerar vägen. Gå till panel ${obstacle.id} och använd activate() med rätt villkor.`
    return next
  }
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
  return !closedMechanism(state, aheadPosition(state)) && !isBlocked(grid, aheadPosition(state), doorsOpen)
}

export function queryResourceAhead(state: SimWorldState, grid: TileKind[][], doorsOpen: boolean): boolean {
  const target = aheadPosition(state)
  if (closedMechanism(state, target) || isBlocked(grid, target, doorsOpen)) return false
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
  if (state.mechanisms?.some(item => item.required !== false && !state.activated?.includes(item.id))) return false
  if (requireAllResources && state.collected < state.totalResources) return false
  return true
}

function closedMechanism(state: SimWorldState, pos: GridPos): Mechanism | undefined {
  return state.mechanisms?.find(item => !state.activated?.includes(item.id) && item.barriers.some(cell => cell.x === pos.x && cell.y === pos.y))
}

export function applyActivate(state: SimWorldState, variables: Record<string, SnapshotValue>): SimWorldState {
  const next = clone(state)
  const stations = state.mechanisms?.filter(item => item.station.x === state.robot.x && item.station.y === state.robot.y) ?? []
  const matching = stations.filter(item => evaluateDoorCondition(item.condition, variables))
  if (!stations.length) {
    next.message = 'Här finns ingen panel. Ställ roboten på en bokstavsruta innan activate().'
  } else if (!matching.length) {
    next.message = `Panel ${stations[0].id}: kontrollen stämmer inte än.`
  } else {
    next.activated = [...new Set([...(state.activated ?? []), ...matching.map(item => item.id)])]
    next.message = `${matching.map(item => item.label).join(', ')} är klar. Passagen är säker.`
  }
  return next
}
