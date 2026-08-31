import { useState } from 'react'

interface ConsolePanelProps {
  lines: string[]
  pendingPrompt?: string | null
  onSubmit?: (value: string) => void
}

export function ConsolePanel({ lines, pendingPrompt, onSubmit }: ConsolePanelProps) {
  const [draft, setDraft] = useState('')

  const submit = () => {
    if (!onSubmit) return
    onSubmit(draft)
    setDraft('')
  }

  return (
    <div className="console-panel">
      <div className="console-panel__title">Konsol</div>
      {lines.length === 0 && pendingPrompt == null ? (
        <p className="console-panel__empty">Kör koden för att se vad print() skriver ut här.</p>
      ) : (
        <pre className="console-panel__body">{lines.join('')}</pre>
      )}
      {pendingPrompt != null && (
        <div className="console-panel__input-row">
          <span className="console-panel__prompt">{pendingPrompt}</span>
          <input
            className="console-panel__input"
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
          <button className="btn btn--small btn--primary" onClick={submit}>
            Skicka
          </button>
        </div>
      )}
    </div>
  )
}
