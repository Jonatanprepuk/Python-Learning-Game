import { SceneShell } from './shared'

interface ScreenSceneProps {
  consoleLines: string[]
}

export function ScreenScene({ consoleLines }: ScreenSceneProps) {
  const lastLine = consoleLines.length > 0 ? consoleLines[consoleLines.length - 1].trim() : null
  const online = lastLine === 'SYSTEM ONLINE'

  return (
    <SceneShell label="Kontrollrum — huvudskärm">
      <div className={`control-screen${online ? ' control-screen--online' : ''}`}>
        <div className="control-screen__glass">
          <span className="control-screen__text">{lastLine ?? 'SYSTEM OFFLINE'}</span>
        </div>
        <div className="control-screen__lights">
          <span className={`panel-led${online ? ' panel-led--on' : ''}`} />
          <span className={`panel-led${online ? ' panel-led--on' : ''}`} />
          <span className={`panel-led${online ? ' panel-led--on' : ''}`} />
        </div>
      </div>
    </SceneShell>
  )
}
