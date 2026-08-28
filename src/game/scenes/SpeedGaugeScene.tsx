import type { SnapshotValue } from '../../types'
import { SceneShell } from './shared'

interface SpeedGaugeSceneProps {
  variables: Record<string, SnapshotValue> | null
}

export function SpeedGaugeScene({ variables }: SpeedGaugeSceneProps) {
  const speed = variables && typeof variables.speed === 'number' ? variables.speed : null
  const pct = Math.max(0, Math.min(100, ((speed ?? 0) / 4) * 100))

  return (
    <SceneShell label="Testbana — motorkalibrering">
      <div className="speed-track">
        <div className="speed-track__robot" style={{ left: `${pct}%` }} />
        <div className="speed-track__line" />
      </div>
      <span className="gauge__value">{speed === null ? '—' : `${speed} m/s`}</span>
    </SceneShell>
  )
}
