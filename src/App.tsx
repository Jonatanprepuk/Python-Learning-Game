import { useEffect, useMemo, useState } from 'react'
import { LEVELS, WORLDS } from './levels/levels'
import { useLevelSession } from './hooks/useLevelSession'
import { GameWorld } from './game/GameWorld'
import { ControlCenterScene } from './game/ControlCenterScene'
import { CodeEditor } from './editor/CodeEditor'
import { ObjectivePanel } from './ui/ObjectivePanel'
import { Controls } from './ui/Controls'
import { HintPanel } from './ui/HintPanel'
import { ErrorPanel } from './ui/ErrorPanel'
import { ConsolePanel } from './ui/ConsolePanel'
import { VariableInspector } from './ui/VariableInspector'
import { DashboardPanel } from './ui/DashboardPanel'
import { InventoryPanel } from './ui/InventoryPanel'
import { DictionaryPanel } from './ui/DictionaryPanel'
import { FunctionMachinePanel } from './ui/FunctionMachinePanel'
import { ObjectWorkshopPanel } from './ui/ObjectWorkshopPanel'
import { CompletionModal } from './ui/CompletionModal'

export default function App() {
  const [levelIndex, setLevelIndex] = useState(0)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [modalDismissed, setModalDismissed] = useState(false)

  const level = LEVELS[levelIndex]
  const session = useLevelSession(level)

  const navGroups = useMemo(() => {
    const groups: { world: string; title: string; items: { level: (typeof LEVELS)[number]; index: number }[] }[] = []
    LEVELS.forEach((l, i) => {
      const last = groups[groups.length - 1]
      if (last && last.world === l.world) {
        last.items.push({ level: l, index: i })
      } else {
        groups.push({
          world: l.world,
          title: WORLDS.find((w) => w.id === l.world)?.title ?? l.world,
          items: [{ level: l, index: i }]
        })
      }
    })
    return groups
  }, [])

  const worldTitle = WORLDS.find((w) => w.id === level.world)?.title ?? level.world

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

  const worldView = (() => {
    switch (level.type) {
      case 'robot':
        return <GameWorld level={level} worldState={session.worldState} lastStep={session.lastStep} />
      case 'dashboard':
        return <DashboardPanel variables={session.finalVariables} watch={level.watchVariables ?? []} />
      case 'inventory':
        return <InventoryPanel variables={session.finalVariables} listName={level.watchList ?? ''} />
      case 'dictionary':
        return <DictionaryPanel variables={session.finalVariables} dictName={level.watchDict ?? ''} />
      case 'function':
        return <FunctionMachinePanel lastCall={session.lastCall} lastReturn={session.lastReturn} />
      case 'class':
        return <ObjectWorkshopPanel variables={session.finalVariables} />
      case 'terminal':
        return level.showVariables ? <VariableInspector variables={session.finalVariables} /> : null
      case 'scene':
        return (
          <ControlCenterScene
            sceneId={level.visualScene ?? ''}
            variables={session.currentVariables}
            consoleLines={session.consoleLines}
          />
        )
      default:
        return null
    }
  })()

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__logo" />
          Kodrobot
        </div>
        <nav className="level-nav">
          {navGroups.map((group) => (
            <div className="level-nav__group" key={group.world}>
              <span className="level-nav__world">{group.title}</span>
              <div className="level-nav__row">
                {group.items.map(({ level: l, index: i }) => (
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
              </div>
            </div>
          ))}
        </nav>
      </header>

      <ObjectivePanel level={level} levelIndex={levelIndex} totalLevels={LEVELS.length} worldTitle={worldTitle} />

      {level.intro.length > 0 && (
        <div className="intro-banner">
          {level.intro.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      <main className="main-split">
        <section className="panel panel--world">
          {worldView}
          {level.type === 'robot' && session.lastActionNote && session.phase === 'running' && (
            <div className="world-note">{session.lastActionNote}</div>
          )}
        </section>

        <section className="panel panel--editor">
          <CodeEditor
            value={session.code}
            onChange={session.setCode}
            highlightedLine={session.highlightedLine}
            readOnly={session.phase === 'running' || session.phase === 'awaiting_input'}
          />
          {level.type === 'scene' && level.showVariables && (
            <VariableInspector variables={session.currentVariables} compact />
          )}
          {level.showConsole && (
            <ConsolePanel
              lines={session.consoleLines}
              pendingPrompt={session.pendingPrompt}
              onSubmit={session.submitInput}
            />
          )}
        </section>
      </main>

      {session.phase === 'error' && session.error && <ErrorPanel error={session.error} />}

      {session.phase === 'failed' && (
        <div className="not-there-yet">
          {level.type === 'robot'
            ? 'Koden kördes utan fel, men roboten nådde inte målet än. Titta på var den stannade och prova att ändra koden.'
            : 'Koden kördes utan fel, men resultatet stämmer inte riktigt än. Kolla igenom villkoren i din kod och kör igen.'}
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
