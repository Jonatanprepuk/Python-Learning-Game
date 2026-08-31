import type { LevelDefinition } from '../types'

interface ObjectivePanelProps {
  level: LevelDefinition
  levelIndex: number
  totalLevels: number
  worldTitle: string
}

export function ObjectivePanel({ level, levelIndex, totalLevels, worldTitle }: ObjectivePanelProps) {
  return (
    <div className="objective-panel">
      <div className="objective-panel__meta">
        <span className="objective-panel__world">{worldTitle}</span>
        <span className="objective-panel__badge">
          Uppdrag {levelIndex + 1} / {totalLevels}
        </span>
        <span className="objective-panel__concept">{level.concept}</span>
      </div>
      <h1 className="objective-panel__title">{level.title}</h1>
      <p className="objective-panel__objective">{level.objective}</p>
    </div>
  )
}
