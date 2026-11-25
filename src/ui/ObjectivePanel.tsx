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
      {level.instructions && <ol className="objective-panel__steps" aria-label="Så gör du">
        {level.instructions.map(step => <li key={step}>{step}</li>)}
      </ol>}
      {level.commandHelp && <div className="objective-panel__help" aria-label="Kommandon i uppgiften">
        {level.commandHelp.map(command => <div key={command.code}>
          <code>{command.code}</code>
          <span>{command.description}</span>
        </div>)}
      </div>}
      {['produktionshallen', 'datacentret'].includes(level.world) && (
        <div className="objective-panel__commands" aria-label="Tillgängliga kommandon">
          <span>Tillgängligt:</span>
          {level.availableCommands.map(command => <code key={command}>{command}</code>)}
        </div>
      )}
    </div>
  )
}
