import type { SnapshotValue } from '../types'
import { RobotWakeScene } from './scenes/RobotWakeScene'
import { BackpackScene } from './scenes/BackpackScene'
import { RocketScene } from './scenes/RocketScene'

interface ControlCenterSceneProps {
  sceneId: string
  variables: Record<string, SnapshotValue> | null
  consoleLines: string[]
}

export function ControlCenterScene({ sceneId, variables, consoleLines }: ControlCenterSceneProps) {
  switch (sceneId) {
    case 'robot-wake':
      return <RobotWakeScene consoleLines={consoleLines} />
    case 'backpack':
      return <BackpackScene variables={variables} />
    case 'rocket':
      return <RocketScene variables={variables} consoleLines={consoleLines} />
    default:
      return null
  }
}
