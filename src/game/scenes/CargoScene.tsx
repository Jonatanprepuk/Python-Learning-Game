import type { SnapshotValue } from '../../types'
import { SceneShell } from './shared'

interface CargoSceneProps {
  variables: Record<string, SnapshotValue> | null
}

function Cells({ count }: { count: number }) {
  return (
    <div className="cargo-cells">
      {Array.from({ length: Math.max(0, Math.min(20, count)) }).map((_, i) => (
        <span className="cargo-cell" key={i} />
      ))}
    </div>
  )
}

export function CargoScene({ variables }: CargoSceneProps) {
  const stored = typeof variables?.stored_cells === 'number' ? variables.stored_cells : 0
  const incoming = typeof variables?.new_cells === 'number' ? variables.new_cells : 0
  const total = typeof variables?.total_cells === 'number' ? variables.total_cells : null

  return (
    <SceneShell label="Energilager">
      <div className="cargo-row">
        <div className="cargo-group">
          <span className="cargo-group__label">Lager</span>
          <Cells count={stored} />
        </div>
        <span className="cargo-op">+</span>
        <div className="cargo-group">
          <span className="cargo-group__label">Leverans</span>
          <Cells count={incoming} />
        </div>
      </div>
      <div className="cargo-total">TOTALT: {total === null ? '—' : total}</div>
    </SceneShell>
  )
}
