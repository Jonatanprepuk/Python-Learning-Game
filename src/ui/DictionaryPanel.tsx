import type { SnapshotValue } from '../types'
import { pyRepr } from './pyValue'

interface DictionaryPanelProps {
  variables: Record<string, SnapshotValue> | null
  dictName: string
}

export function DictionaryPanel({ variables, dictName }: DictionaryPanelProps) {
  const value = variables?.[dictName]
  const entries = value && typeof value === 'object' && !Array.isArray(value) ? Object.entries(value) : null

  return (
    <div className="dictionary-panel">
      <div className="dictionary-panel__title">Register: {dictName}</div>
      {!entries ? (
        <p className="dictionary-panel__empty">Kör koden för att se innehållet i {dictName}.</p>
      ) : (
        <div className="dictionary-card">
          {entries.map(([key, v]) => (
            <div className="dictionary-card__row" key={key}>
              <span className="dictionary-card__key">{key}</span>
              <span className="dictionary-card__value">{pyRepr(v as SnapshotValue)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
