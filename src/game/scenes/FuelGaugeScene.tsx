import type { SnapshotValue } from '../../types'
import { Gauge, SceneShell } from './shared'

interface FuelGaugeSceneProps {
  variables: Record<string, SnapshotValue> | null
}

export function FuelGaugeScene({ variables }: FuelGaugeSceneProps) {
  const before = typeof variables?.fuel_before === 'number' ? variables.fuel_before : null
  const left = typeof variables?.fuel_left === 'number' ? variables.fuel_left : before
  const used = typeof variables?.fuel_used === 'number' ? variables.fuel_used : null
  const impossible = left !== null && before !== null && (left > before || left < 0)

  return (
    <SceneShell label="Expeditionsfarkost — bränsle">
      <Gauge value={impossible ? before : left} min={0} max={Math.max(before ?? 90, 90)} unit=" L" tone={impossible ? 'rose' : 'teal'} />
      {impossible && <span className="scene-warning">⚠ Omöjligt värde</span>}
      {used !== null && <span className="scene-note">Förbrukat under resan: {used} L</span>}
    </SceneShell>
  )
}
