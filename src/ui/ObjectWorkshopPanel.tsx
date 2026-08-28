import type { SnapshotValue } from '../types'
import { classAttributes, className, pyRepr } from './pyValue'

interface ObjectWorkshopPanelProps {
  variables: Record<string, SnapshotValue> | null
}

export function ObjectWorkshopPanel({ variables }: ObjectWorkshopPanelProps) {
  const objects = variables
    ? Object.entries(variables).filter(([, value]) => className(value) !== null)
    : []

  return (
    <div className="object-workshop">
      <div className="object-workshop__title">Robotverkstaden</div>
      {objects.length === 0 ? (
        <p className="object-workshop__empty">Kör koden för att se dina objekt dyka upp här.</p>
      ) : (
        <div className="object-workshop__grid">
          {objects.map(([name, value]) => (
            <div className="object-card" key={name}>
              <div className="object-card__header">
                <span className="object-card__name">{name}</span>
                <span className="type-chip">{className(value)}</span>
              </div>
              {classAttributes(value).map(([attr, v]) => (
                <div className="object-card__row" key={attr}>
                  <span className="object-card__attr">{attr}</span>
                  <span className="object-card__value">{pyRepr(v)}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
