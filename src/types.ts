export type Direction = 'up' | 'down' | 'left' | 'right'

export type TileKind = 'empty' | 'wall' | 'resource' | 'goal' | 'door'

export interface GridPos {
  x: number
  y: number
}

/** A door tile blocks movement like a wall until this comparison against a live variable is true. */
export interface DoorCondition {
  variable: string
  op: '==' | '>=' | '<=' | '>' | '<'
  value: number
}

/** Which visual "world view" a level uses alongside the shared editor/hints/controls. */
export type LevelType = 'robot' | 'terminal' | 'dashboard' | 'inventory' | 'dictionary' | 'function' | 'class' | 'scene'

/** A JSON-safe snapshot of a Python value, as produced by the worker's end-of-run inspector. */
export type SnapshotValue =
  | string
  | number
  | boolean
  | null
  | SnapshotValue[]
  | { __class__: string; [attr: string]: SnapshotValue | string }

export interface SuccessContext {
  variables: Record<string, SnapshotValue>
  consoleLines: string[]
  ranWithoutError: boolean
  /** True if input() was actually called (and answered) at least once during this run. */
  usedInput: boolean
}

export interface LevelDefinition {
  id: number
  world: string
  type: LevelType
  title: string
  concept: string
  objective: string
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
  /** Show the print()/input() console panel next to the editor. */
  showConsole?: boolean
  /** Show the generic variable inspector, fed by the end-of-run snapshot. */
  showVariables?: boolean
  /** Dashboard: which global variables to render as meters/status chips. */
  watchVariables?: string[]
  /** Inventory: name of the global list variable to visualize. */
  watchList?: string
  /** Dictionary: name of the global dict variable to visualize. */
  watchDict?: string
  /** Scene: which bespoke Kontrollcentralen visual to render (see ControlCenterScene). */
  visualScene?: string
  /** Robot: a door tile stays closed until this condition on a live variable holds. */
  doorCondition?: DoorCondition
  /**
   * Custom win condition for non-robot levels. Robot levels fall back to
   * checkWin(); other levels fall back to "ran without error" if omitted.
   */
  successCheck?: (ctx: SuccessContext) => boolean
}

export interface SimWorldState {
  robot: { x: number; y: number; direction: Direction }
  resources: GridPos[]
  collected: number
  totalResources: number
  bumped: boolean
  message: string | null
  /** Whether door tiles currently count as passable (evaluated live against the player's variables). */
  doorsOpen: boolean
}

export type StepType =
  | 'move'
  | 'turn_left'
  | 'turn_right'
  | 'collect'
  | 'can_move'
  | 'resource_ahead'
  | 'at_goal'
  | 'print'
  | 'input'
  | 'call'
  | 'return'
  | 'state'

export interface TraceStep {
  line: number
  type: StepType
  state: SimWorldState
  result?: boolean
  note?: string | null
  output?: string
  /** 'call' step: the function name and its argument snapshot. */
  callInfo?: { name: string; args: Record<string, SnapshotValue> }
  /** 'return' step: which function returned and its return value. */
  returnInfo?: { name: string; value: SnapshotValue }
  /** 'state' step: a live snapshot of the player's globals just before this line runs. */
  variables?: Record<string, SnapshotValue>
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
  /** Set when execution paused on an input() call with no answer queued yet. */
  awaitingInput?: { prompt: string }
  /** End-of-run snapshot of the user's global variables (only when ok and not awaiting input). */
  finalVariables?: Record<string, SnapshotValue>
}

export interface WorkerRequest {
  id: number
  type: 'init' | 'run'
  code?: string
  /** Answers already given to input() calls for this run, in call order. */
  inputs?: string[]
  level?: {
    tileGrid: TileKind[][]
    playerStart: LevelDefinition['playerStart']
    doorCondition?: DoorCondition
  }
}

export interface WorkerResponse {
  id: number
  type: 'ready' | 'result' | 'progress' | 'fatal'
  result?: RunResult
  message?: string
}
