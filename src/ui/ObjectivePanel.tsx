import type { LevelDefinition } from '../types'

interface ObjectivePanelProps {
  level: LevelDefinition
  levelIndex: number
  totalLevels: number
}

export function ObjectivePanel({ level, levelIndex, totalLevels }: ObjectivePanelProps) {
  return (
    <div className="objective-panel">
      <div className="objective-panel__meta">
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
