import type { SnapshotValue } from '../../types'
import { SceneShell } from './shared'

interface NameTagSceneProps {
  variables: Record<string, SnapshotValue> | null
}

export function NameTagScene({ variables }: NameTagSceneProps) {
  const name = variables && typeof variables.robot_name === 'string' ? variables.robot_name : null
  const revealed = !!name && name.length > 0

  return (
    <SceneShell label="Robotdocka">
      <div className={`robot-portrait${revealed ? ' robot-portrait--awake' : ''}`}>
        <div className="robot-portrait__head">
          <span className="robot-portrait__eye" />
          <span className="robot-portrait__eye" />
        </div>
        <div className="robot-portrait__badge">{revealed ? name : '???'}</div>
      </div>
    </SceneShell>
  )
}
