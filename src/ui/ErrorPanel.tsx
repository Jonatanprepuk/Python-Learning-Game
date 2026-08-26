import { useState } from 'react'
import type { FriendlyError } from '../types'

interface ErrorPanelProps {
  error: FriendlyError
}

export function ErrorPanel({ error }: ErrorPanelProps) {
  const [showTechnical, setShowTechnical] = useState(false)
  return (
    <div className="error-panel">
      <div className="error-panel__title">
        <span className="error-panel__icon" />
        {error.title}
      </div>
      <p className="error-panel__message">
        {error.message}
        {error.line != null && <span className="error-panel__line"> (rad {error.line})</span>}
      </p>
      <button className="error-panel__toggle" onClick={() => setShowTechnical((v) => !v)}>
        {showTechnical ? 'Dölj teknisk information' : 'Visa teknisk information'}
      </button>
      {showTechnical && <pre className="error-panel__technical">{error.technical}</pre>}
    </div>
  )
}
