import type { SnapshotValue } from '../../types'
import { SceneShell } from './shared'

interface OperatorCardSceneProps {
  variables: Record<string, SnapshotValue> | null
}

export function OperatorCardScene({ variables }: OperatorCardSceneProps) {
  const name = variables && typeof variables.name === 'string' ? variables.name : null
  const registered = !!name && name !== 'Okänd' && name.trim().length > 0

  return (
    <SceneShell label="Kontrollcentralen — åtkomst">
      <div className={`operator-card${registered ? ' operator-card--active' : ''}`}>
        <span className="operator-card__title">OPERATÖR</span>
        <span className="operator-card__name">{registered ? name!.toUpperCase() : 'SAKNAS'}</span>
        <span className={`status-light${registered ? ' status-light--on' : ' status-light--off'}`}>
          {registered ? 'BEHÖRIGHET: AKTIV' : 'BEHÖRIGHET: SAKNAS'}
        </span>
      </div>
    </SceneShell>
  )
}
