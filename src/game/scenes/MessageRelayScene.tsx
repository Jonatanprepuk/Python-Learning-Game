import type { SnapshotValue } from '../../types'
import { SceneShell } from './shared'

interface MessageRelaySceneProps {
  variables: Record<string, SnapshotValue> | null
}

export function MessageRelayScene({ variables }: MessageRelaySceneProps) {
  const message = typeof variables?.message === 'string' ? variables.message : null

  return (
    <SceneShell label="Kommunikationspanel">
      <div className="relay">
        <div className="relay__robot" />
        <div className={`relay__beam${message ? ' relay__beam--active' : ''}`} />
        <div className={`relay__receiver${message ? ' relay__receiver--lit' : ''}`}>
          {message ? <span className="relay__message">{message}</span> : <span className="relay__idle">Väntar på meddelande…</span>}
        </div>
      </div>
    </SceneShell>
  )
}
