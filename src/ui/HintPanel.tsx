interface HintPanelProps {
  hints: string[]
  revealedCount: number
  onReveal: () => void
}

export function HintPanel({ hints, revealedCount, onReveal }: HintPanelProps) {
  const hasMore = revealedCount < hints.length

  return (
    <div className="hint-panel">
      <div className="hint-panel__header">
        <span className="hint-panel__title">Ledtrådar</span>
        <button className="btn btn--small" onClick={onReveal} disabled={!hasMore}>
          {revealedCount === 0 ? 'Visa ledtråd' : hasMore ? 'Nästa ledtråd' : 'Inga fler ledtrådar'}
        </button>
      </div>
      {revealedCount > 0 && (
        <ol className="hint-panel__list">
          {hints.slice(0, revealedCount).map((hint, i) => (
            <li key={i} className="hint-panel__item">
              <span className="hint-panel__index">Ledtråd {i + 1}</span>
              <pre className="hint-panel__text">{hint}</pre>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
