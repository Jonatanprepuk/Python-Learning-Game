import type { RunPhase } from '../hooks/useLevelSession'

interface ControlsProps {
  phase: RunPhase
  speed: number
  onSpeedChange: (s: number) => void
  onRun: () => void
  onDebug: () => void
  onPause: () => void
  onResume: () => void
  onStep: () => void
  onStop: () => void
  onReset: () => void
  engineReady: boolean
  canPause: boolean
  /** Only for 'tests' levels: runs the current code against the level's example cases and grades it. */
  onRunTests?: () => void
}

const SPEEDS = [0.5, 1, 2, 4]

export function Controls({ phase, speed, onSpeedChange, onRun, onDebug, onPause, onResume, onStep, onStop, onReset, engineReady, canPause, onRunTests }: ControlsProps) {
  const busy = phase === 'running' || phase === 'paused' || phase === 'awaiting_input'
  return (
    <div className="controls">
      <button
        className="btn btn--primary"
        onClick={onRun}
        disabled={busy || !engineReady}
        title={!engineReady ? 'Python-motorn laddas...' : onRunTests ? 'Kör din kod fritt, utan att kontrollera mot exemplen.' : undefined}
      >
        {engineReady ? 'Kör kod' : 'Laddar Python…'}
      </button>
      {onRunTests && (
        <button
          className="btn btn--accent"
          onClick={onRunTests}
          disabled={busy || !engineReady}
          title="Kör koden mot exemplen och kontrollera om den klarar dem."
        >
          Kör tester
        </button>
      )}
      <button className="btn btn--ghost" onClick={onDebug} disabled={busy || !engineReady}>
        Felsök
      </button>
      <button className="btn btn--ghost" onClick={onPause} disabled={!canPause}>Pausa</button>
      <button className="btn btn--ghost" onClick={onStep} disabled={phase !== 'paused'}>Nästa steg</button>
      <button className="btn btn--ghost" onClick={onResume} disabled={phase !== 'paused'}>Fortsätt</button>
      <button className="btn btn--ghost" onClick={onStop} disabled={!busy}>
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
