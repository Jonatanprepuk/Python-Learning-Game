import type { SnapshotValue } from '../../types'
import { SceneShell } from './shared'

interface AntennaSceneProps {
  variables: Record<string, SnapshotValue> | null
}

export function AntennaScene({ variables }: AntennaSceneProps) {
  const online = variables?.communication_online === true

  return (
    <SceneShell label="Kommunikationscentral">
      <div className={`antenna${online ? ' antenna--online' : ''}`}>
        <div className="antenna__mast" />
        <div className="antenna__dish" />
        {online && (
          <>
            <span className="antenna__pulse" />
            <span className="antenna__pulse antenna__pulse--delay" />
          </>
        )}
      </div>
      <span className={`status-light${online ? ' status-light--on' : ' status-light--off'}`}>
        {online ? 'ANSLUTEN' : 'FRÅNKOPPLAD'}
      </span>
    </SceneShell>
  )
}
