import type { TraceStep } from '../types'
import type { RunPhase } from '../hooks/useLevelSession'

const LABELS: Record<TraceStep['type'], string> = {
  activate: 'activate()', move: 'move()', turn_left: 'turn_left()', turn_right: 'turn_right()',
  collect: 'collect()', can_move: 'can_move()', can_move_left: 'can_move_left()',
  can_move_right: 'can_move_right()', at_corner: 'at_corner()', steps_to_goal: 'steps_to_goal()',
  resource_ahead: 'resource_ahead()', at_goal: 'at_goal()', print: 'print()', input: 'input()',
  call: 'funktionsanrop', return: 'retur', state: 'variabler'
}

interface DebugPanelProps {
  phase: RunPhase
  step: TraceStep | null
  progress: { current: number; total: number }
}

export function DebugPanel({ phase, step, progress }: DebugPanelProps) {
  return (
    <div className="debug-panel" role="status" aria-live="polite">
      <span className="debug-panel__title">Felsökning</span>
      <span className="debug-panel__progress">Steg {progress.current} / {progress.total}</span>
      <span className="debug-panel__detail">
        {step
          ? `Rad ${step.line}: ${LABELS[step.type]}${step.result !== undefined ? ` → ${String(step.result)}` : ''}`
          : phase === 'paused' ? 'Tryck Nästa steg för att börja.' : 'Koden förbereds.'}
      </span>
      {step && <span className="debug-panel__position">Robot: ({step.state.robot.x}, {step.state.robot.y}) · {step.state.robot.direction}</span>}
    </div>
  )
}
