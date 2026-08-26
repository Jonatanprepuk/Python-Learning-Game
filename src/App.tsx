import { useEffect, useMemo, useState } from 'react'
import { LEVELS } from './levels/levels'
import { useLevelSession } from './hooks/useLevelSession'
import { GameWorld } from './game/GameWorld'
import { CodeEditor } from './editor/CodeEditor'
import { ObjectivePanel } from './ui/ObjectivePanel'
import { Controls } from './ui/Controls'
import { HintPanel } from './ui/HintPanel'
import { ErrorPanel } from './ui/ErrorPanel'
import { CompletionModal } from './ui/CompletionModal'

export default function App() {
  const [levelIndex, setLevelIndex] = useState(0)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [modalDismissed, setModalDismissed] = useState(false)

  const level = LEVELS[levelIndex]
  const session = useLevelSession(level)

  useEffect(() => {
    setModalDismissed(false)
  }, [levelIndex])

  useEffect(() => {
    if (session.phase === 'success') {
      setCompleted((prev) => {
        if (prev.has(level.id)) return prev
        const next = new Set(prev)
        next.add(level.id)
        return next
      })
    }
  }, [session.phase, level.id])

  const linesOfCode = useMemo(
    () => session.code.split('\n').filter((l) => l.trim().length > 0).length,
    [session.code]
  )

  const isLastLevel = levelIndex === LEVELS.length - 1
  const showModal = session.phase === 'success' && !modalDismissed

  const goToNext = () => {
    if (!isLastLevel) setLevelIndex((i) => i + 1)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo" />
          Kodrobot
        </div>
        <nav className="level-nav">
          {LEVELS.map((l, i) => (
            <button
              key={l.id}
              className={`level-nav__item${i === levelIndex ? ' level-nav__item--active' : ''}${
                completed.has(l.id) ? ' level-nav__item--done' : ''
              }`}
              onClick={() => setLevelIndex(i)}
              title={l.title}
            >
              {completed.has(l.id) ? '✓' : l.id}
            </button>
          ))}
        </nav>
      </header>

      <ObjectivePanel level={level} levelIndex={levelIndex} totalLevels={LEVELS.length} />

      {level.intro.length > 0 && (
        <div className="intro-banner">
          {level.intro.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      <main className="main-split">
        <section className="panel panel--world">
          <GameWorld level={level} worldState={session.worldState} lastStep={session.lastStep} />
          {session.lastActionNote && session.phase === 'running' && (
            <div className="world-note">{session.lastActionNote}</div>
          )}
        </section>

        <section className="panel panel--editor">
          <CodeEditor
            value={session.code}
            onChange={session.setCode}
            highlightedLine={session.highlightedLine}
            readOnly={session.phase === 'running'}
          />
        </section>
      </main>

      {session.phase === 'error' && session.error && <ErrorPanel error={session.error} />}

      {session.phase === 'failed' && (
        <div className="not-there-yet">
          Koden kördes utan fel, men roboten nådde inte målet än. Titta på var den stannade och prova att ändra koden.
        </div>
      )}

      <footer className="app-footer">
        <HintPanel
          hints={level.hints}
          revealedCount={session.hintIndex}
          onReveal={session.revealNextHint}
        />
        <Controls
          phase={session.phase}
          speed={session.speed}
          onSpeedChange={session.setSpeed}
          onRun={session.runCode}
          onStop={session.stop}
          onReset={session.reset}
          engineReady={session.engineStatus === 'ready'}
        />
      </footer>

      {showModal && (
        <CompletionModal
          level={level}
          linesOfCode={linesOfCode}
          runCount={session.runCount}
          isLastLevel={isLastLevel}
          onNext={goToNext}
          onDismiss={() => setModalDismissed(true)}
        />
      )}
    </div>
  )
}
