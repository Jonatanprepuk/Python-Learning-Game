import type { LevelDefinition } from '../types'

interface CompletionModalProps {
  level: LevelDefinition
  linesOfCode: number
  runCount: number
  isLastLevel: boolean
  onNext: () => void
  onDismiss: () => void
  onBackToWorlds: () => void
}

export function CompletionModal({
  level,
  linesOfCode,
  runCount,
  isLastLevel,
  onNext,
  onDismiss,
  onBackToWorlds
}: CompletionModalProps) {
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal__badge">Uppdrag slutfört!</div>
        <h2 className="modal__title">{level.title}</h2>
        {level.successTip && <p className="modal__tip">{level.successTip}</p>}

        <div className="modal__stats">
          <div className="modal__stat">
            <span className="modal__stat-value">{linesOfCode}</span>
            <span className="modal__stat-label">Kodrader</span>
          </div>
          <div className="modal__stat">
            <span className="modal__stat-value">{runCount}</span>
            <span className="modal__stat-label">Körningar</span>
          </div>
          <div className="modal__stat modal__stat--wide">
            <span className="modal__stat-value">{level.concept}</span>
            <span className="modal__stat-label">Nytt koncept</span>
          </div>
        </div>

        <div className="modal__actions">
          <button className="btn btn--ghost" onClick={onDismiss}>
            Stanna kvar
          </button>
          {isLastLevel ? (
            <button className="btn btn--primary" onClick={onBackToWorlds}>
              Världen klar — till kartan
            </button>
          ) : (
            <button className="btn btn--primary" onClick={onNext}>
              Nästa uppdrag
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
