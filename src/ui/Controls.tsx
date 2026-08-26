import type { RunPhase } from '../hooks/useLevelSession'

interface ControlsProps {
  phase: RunPhase
  speed: number
  onSpeedChange: (s: number) => void
  onRun: () => void
  onStop: () => void
  onReset: () => void
  engineReady: boolean
}

const SPEEDS = [0.5, 1, 2, 4]

export function Controls({ phase, speed, onSpeedChange, onRun, onStop, onReset, engineReady }: ControlsProps) {
  const running = phase === 'running'
  return (
    <div className="controls">
      <button
        className="btn btn--primary"
        onClick={onRun}
        disabled={running || !engineReady}
        title={!engineReady ? 'Python-motorn laddas...' : undefined}
      >
        {engineReady ? 'Kör kod' : 'Laddar Python…'}
      </button>
      <button className="btn btn--ghost" onClick={onStop} disabled={!running}>
        Stoppa
      </button>
      <button className="btn btn--ghost" onClick={onReset}>
        Återställ
      </button>

      <div className="speed-control">
        <span className="speed-control__label">Hastighet</span>
        <div className="speed-control__options">
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={`speed-pill${speed === s ? ' speed-pill--active' : ''}`}
              onClick={() => onSpeedChange(s)}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
