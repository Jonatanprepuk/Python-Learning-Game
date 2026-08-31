import type { SnapshotValue } from '../types'
import { pyRepr } from './pyValue'

interface DashboardPanelProps {
  variables: Record<string, SnapshotValue> | null
  watch: string[]
}

function Meter({ name, value }: { name: string; value: SnapshotValue | undefined }) {
  if (typeof value === 'boolean') {
    return (
      <div className="dashboard-meter">
        <span className="dashboard-meter__label">{name}</span>
        <span className={`status-light${value ? ' status-light--on' : ' status-light--off'}`}>
          {value ? 'AKTIV' : 'AV'}
        </span>
      </div>
    )
  }
  if (typeof value === 'number') {
    const pct = Math.max(0, Math.min(100, value))
    return (
      <div className="dashboard-meter">
        <span className="dashboard-meter__label">
          {name} <strong>{value}</strong>
        </span>
        <div className="dashboard-meter__bar">
          <div className="dashboard-meter__bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>
    )
  }
  return (
    <div className="dashboard-meter">
      <span className="dashboard-meter__label">{name}</span>
      <span className="type-chip">{value === undefined ? '–' : pyRepr(value)}</span>
    </div>
  )
}

export function DashboardPanel({ variables, watch }: DashboardPanelProps) {
  return (
    <div className="dashboard-panel">
      <div className="dashboard-panel__title">Systemstatus</div>
      {!variables ? (
        <p className="dashboard-panel__empty">Kör koden för att se mätarna reagera.</p>
      ) : (
        <div className="dashboard-panel__grid">
          {watch.map((name) => (
            <Meter key={name} name={name} value={variables[name]} />
          ))}
        </div>
      )}
    </div>
  )
}
