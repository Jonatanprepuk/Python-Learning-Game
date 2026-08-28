import type { SnapshotValue } from '../../types'
import { pyType } from '../../ui/pyValue'
import { Gauge, SceneShell } from './shared'

interface ChargingStationSceneProps {
  variables: Record<string, SnapshotValue> | null
}

export function ChargingStationScene({ variables }: ChargingStationSceneProps) {
  const energy = typeof variables?.energy === 'number' ? variables.energy : 35
  const newEnergy = typeof variables?.new_energy === 'number' ? variables.new_energy : null
  const charge = variables?.charge

  return (
    <SceneShell label="Laddstationen">
      <Gauge value={newEnergy ?? energy} max={100} unit="%" tone="teal" />
      {charge !== undefined && (
        <div className="charge-readout">
          <span>charge = {typeof charge === 'string' ? `"${charge}"` : String(charge)}</span>
          <span className="type-chip">{pyType(charge)}</span>
        </div>
      )}
    </SceneShell>
  )
}
