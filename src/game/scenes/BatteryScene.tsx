import type { SnapshotValue } from '../../types'
import { Gauge, SceneShell } from './shared'

interface BatterySceneProps {
  variables: Record<string, SnapshotValue> | null
}

export function BatteryScene({ variables }: BatterySceneProps) {
  const energy = variables && typeof variables.energy === 'number' ? variables.energy : null

  return (
    <SceneShell label="Laddstation — energi">
      <Gauge value={energy} max={100} unit="%" tone={energy !== null && energy >= 75 ? 'teal' : 'amber'} />
    </SceneShell>
  )
}
