import type { SnapshotValue } from '../../types'
import { SceneShell } from './shared'

interface BackpackSceneProps {
  variables: Record<string, SnapshotValue> | null
}

function ItemRow({ label, count, icon }: { label: string; count: number; icon: string }) {
  return (
    <div className="backpack-row">
      <span className="backpack-row__label">{label}</span>
      <div className="backpack-row__items">
        {Array.from({ length: Math.max(0, Math.min(12, count)) }).map((_, i) => (
          <span className={`backpack-item backpack-item--${icon}`} key={i} />
        ))}
      </div>
    </div>
  )
}

export function BackpackScene({ variables }: BackpackSceneProps) {
  const apples = typeof variables?.apples === 'number' ? variables.apples : 0
  const water = typeof variables?.water === 'number' ? variables.water : 0

  return (
    <SceneShell label="Robotens ryggsäck">
      <div className="backpack">
        <ItemRow label="apples" count={apples} icon="apple" />
        <ItemRow label="water" count={water} icon="water" />
      </div>
    </SceneShell>
  )
}
