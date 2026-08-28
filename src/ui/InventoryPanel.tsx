import type { SnapshotValue } from '../types'
import { pyRepr } from './pyValue'

interface InventoryPanelProps {
  variables: Record<string, SnapshotValue> | null
  listName: string
}

export function InventoryPanel({ variables, listName }: InventoryPanelProps) {
  const list = variables?.[listName]
  const items = Array.isArray(list) ? list : null

  return (
    <div className="inventory-panel">
      <div className="inventory-panel__title">Ryggsäck: {listName}</div>
      {!items ? (
        <p className="inventory-panel__empty">Kör koden för att se innehållet i {listName}.</p>
      ) : items.length === 0 ? (
        <p className="inventory-panel__empty">Listan är tom.</p>
      ) : (
        <div className="inventory-panel__grid">
          {items.map((item, i) => (
            <div className="inventory-card" key={`${i}-${pyRepr(item)}`}>
              {pyRepr(item)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
