export type Direction = 'up' | 'down' | 'left' | 'right'

export type TileKind = 'empty' | 'wall' | 'resource' | 'goal'

export interface GridPos {
  x: number
  y: number
}

export interface LevelDefinition {
  id: number
  title: string
  concept: string
  objective: string
  intro: string[]
  width: number
  height: number
  /** Row-major grid of tile kinds, tileGrid[y][x] */
  tileGrid: TileKind[][]
  playerStart: { x: number; y: number; direction: Direction }
  availableCommands: string[]
  starterCode: string
  hints: string[]
  successTip?: string
  requireAllResources?: boolean
}

export interface SimWorldState {
  robot: { x: number; y: number; direction: Direction }
  resources: GridPos[]
  collected: number
  totalResources: number
  bumped: boolean
  message: string | null
}

export type StepType =
  | 'move'
  | 'turn_left'
  | 'turn_right'
  | 'collect'
  | 'can_move'
  | 'resource_ahead'
  | 'at_goal'

export interface TraceStep {
  line: number
  type: StepType
  state: SimWorldState
  result?: boolean
  note?: string | null
}

export interface FriendlyError {
  title: string
  message: string
  code?: string
  line?: number
  technical: string
}

export interface RunResult {
  ok: boolean
  steps: TraceStep[]
  error?: FriendlyError
  timedOut?: boolean
}

export interface WorkerRequest {
  id: number
  type: 'init' | 'run'
  code?: string
  level?: {
    tileGrid: TileKind[][]
    playerStart: LevelDefinition['playerStart']
  }
}

export interface WorkerResponse {
  id: number
  type: 'ready' | 'result' | 'progress' | 'fatal'
  result?: RunResult
  message?: string
}
