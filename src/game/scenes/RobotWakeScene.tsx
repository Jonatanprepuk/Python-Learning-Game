import { SceneShell } from './shared'

interface RobotWakeSceneProps {
  consoleLines: string[]
}

export function RobotWakeScene({ consoleLines }: RobotWakeSceneProps) {
  const lastMessage = consoleLines.length > 0 ? consoleLines[consoleLines.length - 1].trim() : null
  const awake = !!lastMessage

  return (
    <SceneShell label="Robotdocka">
      <div className={`robot-portrait${awake ? ' robot-portrait--awake' : ''}`}>
        <div className="robot-portrait__head">
          <span className="robot-portrait__eye" />
          <span className="robot-portrait__eye" />
        </div>
      </div>
      {lastMessage && <div className="speech-bubble">{lastMessage}</div>}
    </SceneShell>
  )
}
