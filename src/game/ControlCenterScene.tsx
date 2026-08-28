import type { SnapshotValue } from '../types'
import { ScreenScene } from './scenes/ScreenScene'
import { NameTagScene } from './scenes/NameTagScene'
import { BatteryScene } from './scenes/BatteryScene'
import { SpeedGaugeScene } from './scenes/SpeedGaugeScene'
import { AntennaScene } from './scenes/AntennaScene'
import { CargoScene } from './scenes/CargoScene'
import { FuelGaugeScene } from './scenes/FuelGaugeScene'
import { MessageRelayScene } from './scenes/MessageRelayScene'
import { OperatorCardScene } from './scenes/OperatorCardScene'
import { ChargingStationScene } from './scenes/ChargingStationScene'

interface ControlCenterSceneProps {
  sceneId: string
  variables: Record<string, SnapshotValue> | null
  consoleLines: string[]
}

export function ControlCenterScene({ sceneId, variables, consoleLines }: ControlCenterSceneProps) {
  switch (sceneId) {
    case 'screen':
      return <ScreenScene consoleLines={consoleLines} />
    case 'nametag':
      return <NameTagScene variables={variables} />
    case 'battery':
      return <BatteryScene variables={variables} />
    case 'speed-gauge':
      return <SpeedGaugeScene variables={variables} />
    case 'antenna':
      return <AntennaScene variables={variables} />
    case 'cargo':
      return <CargoScene variables={variables} />
    case 'fuel-gauge':
      return <FuelGaugeScene variables={variables} />
    case 'message-relay':
      return <MessageRelayScene variables={variables} />
    case 'operator-card':
      return <OperatorCardScene variables={variables} />
    case 'charging-station':
      return <ChargingStationScene variables={variables} />
    default:
      return null
  }
}
