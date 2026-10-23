interface ConsoleStageProps {
  lines: string[]
}

// For levels that are really just "define a function, call it, print
// something" — showing the call/return machine is more confusing than
// helpful (a print-only function returns None, which reads as a bug), so
// these levels show the printed output itself, nicely, instead.
export function ConsoleStage({ lines }: ConsoleStageProps) {
  return (
    <div className="console-stage">
      <div className="console-stage__title">Utskrift</div>
      <div className="console-stage__screen">
        {lines.length === 0 ? (
          <p className="console-stage__empty">Kör koden för att se utskriften här.</p>
        ) : (
          lines.map((line, index) => (
            <div key={index} className="console-stage__line" style={{ animationDelay: `${index * 90}ms` }}>
              <span className="console-stage__prompt">&gt;</span>
              <span className="console-stage__text">{line.replace(/\n+$/, '')}</span>
            </div>
          ))
        )}
        <span className="console-stage__cursor" />
      </div>
    </div>
  )
}
