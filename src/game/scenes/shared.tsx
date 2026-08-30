import type { ReactNode } from 'react'

interface SceneShellProps {
  label: string
  children: ReactNode
}

/** Consistent framing for every Kontrollcentralen scene: a small label + content area. */
export function SceneShell({ label, children }: SceneShellProps) {
  return (
    <div className="scene">
      <span className="scene__label">{label}</span>
      <div className="scene__content">{children}</div>
    </div>
  )
}

interface GaugeProps {
  value: number | null
  min?: number
  max: number
  unit?: string
  tone?: 'amber' | 'green' | 'red'
}

/** A horizontal fill gauge reused by scenes that show a live measurement. */
export function Gauge({ value, min = 0, max, unit = '', tone = 'amber' }: GaugeProps) {
  const shown = value ?? min
  const pct = Math.max(0, Math.min(100, ((shown - min) / (max - min)) * 100))
  return (
    <div className="gauge">
      <div className={`gauge__track gauge__track--${tone}`}>
        <div className="gauge__fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="gauge__value">{value === null ? '—' : `${shown}${unit}`}</span>
    </div>
  )
}
