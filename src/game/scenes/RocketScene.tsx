import type { SnapshotValue } from '../../types'
import { pickNumeric } from '../../levels/valueBinding'
import { Gauge, SceneShell } from './shared'

interface RocketSceneProps {
  variables: Record<string, SnapshotValue> | null
  consoleLines: string[]
}

export function RocketScene({ variables, consoleLines }: RocketSceneProps) {
  const fuelPerTank = typeof variables?.fuel === 'number' ? variables.fuel : 0
  const tankCount = typeof variables?.fuel_tanks === 'number' ? Math.max(0, Math.min(6, variables.fuel_tanks)) : 0
  const total = pickNumeric(variables, consoleLines, ['total_fuel'])

  return (
    <SceneShell label="Raketen">
      <div className="rocket-tanks">
        {Array.from({ length: tankCount }).map((_, i) => (
          <div className="rocket-tank" key={i}>
            <div className="rocket-tank__fill" style={{ height: `${Math.min(100, fuelPerTank)}%` }} />
          </div>
        ))}
      </div>
      <Gauge value={total} max={100} unit=" bränsle" tone="amber" />
    </SceneShell>
  )
}
