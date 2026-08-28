import type { SnapshotValue } from '../types'
import { pyRepr, pyType } from './pyValue'

interface VariableInspectorProps {
  variables: Record<string, SnapshotValue> | null
  /** Render as a compact strip (e.g. stacked below the code editor) instead of filling a whole panel. */
  compact?: boolean
}

export function VariableInspector({ variables, compact }: VariableInspectorProps) {
  const entries = variables ? Object.entries(variables) : []

  return (
    <div className={compact ? 'console-panel variable-inspector--compact' : 'variable-inspector'}>
      <div className="variable-inspector__title">Variabler</div>
      {entries.length === 0 ? (
        <p className="variable-inspector__empty">Kör koden för att se dina variabler här.</p>
      ) : (
        <table className="variable-inspector__table">
          <tbody>
            {entries.map(([name, value]) => (
              <tr key={name}>
                <td className="variable-inspector__name">{name}</td>
                <td className="variable-inspector__value">{pyRepr(value)}</td>
                <td>
                  <span className="type-chip">{pyType(value)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
