import { useEffect, useMemo, useState } from 'react'
import type { LevelDefinition, TileKind } from '../types'
import { parseGrid } from '../levels/levels'
import { useLevelSession } from '../hooks/useLevelSession'
import { GameWorld } from '../game/GameWorld'
import { CodeEditor } from '../editor/CodeEditor'
import { ConsolePanel } from './ConsolePanel'
import { VariableInspector } from './VariableInspector'
import { Controls } from './Controls'
import { ErrorPanel } from './ErrorPanel'

const BASE_GRID = parseGrid([
  '##########',
  '#S.......#',
  '#..R..R..#',
  '#........#',
  '#..R..R..#',
  '#.......G#',
  '##########'
])

const PLAYER_START = { x: 1, y: 1, direction: 'right' as const }

const BASE_LEVEL: Omit<LevelDefinition, 'tileGrid'> = {
  id: -1,
  world: 'lekplats',
  type: 'robot',
  title: 'Lekplatsen',
  concept: 'Fri kodning',
  objective: 'Skriv och testa vilken Python-kod du vill.',
  width: 10,
  height: 7,
  playerStart: PLAYER_START,
  availableCommands: [],
  starterCode:
    '# Lekplatsen — inget att klara, bara testa.\n# Testa robot-kommandon eller vanlig Python.\n\nmove()\nmove()\nturn_right()\nmove()\ncollect()\n',
  hints: [],
  showConsole: true,
  showVariables: true,
  successCheck: () => true
}

type Tool = 'wall' | 'coin' | 'erase'

const TOOL_TILE: Record<Tool, TileKind> = {
  wall: 'wall',
  coin: 'resource',
  erase: 'empty'
}

const TOOL_LABEL: Record<Tool, string> = {
  wall: 'Vägg',
  coin: 'Mynt',
  erase: 'Radera'
}

interface PlaygroundProps {
  onBack: () => void
}

export function Playground({ onBack }: PlaygroundProps) {
  const [grid, setGrid] = useState<TileKind[][]>(BASE_GRID)
  const [tool, setTool] = useState<Tool>('wall')
  const [showWorld, setShowWorld] = useState(true)

  // level.id stays -1 across edits, so useLevelSession never wipes the
  // player's code/console just because the room layout changed.
  const level = useMemo<LevelDefinition>(() => ({ ...BASE_LEVEL, tileGrid: grid }), [grid])

  const session = useLevelSession(level)

  // Sync worldState from the new grid whenever it's edited, so a
  // freshly-placed coin doesn't render as already collected (worldState.
  // resources would otherwise still reflect the previous grid).
  useEffect(() => {
    session.refreshWorld()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid])

  const handleTileClick = (x: number, y: number) => {
    if (session.phase === 'running' || session.phase === 'awaiting_input') return
    const onBorder = x === 0 || y === 0 || x === level.width - 1 || y === level.height - 1
    const onStart = x === PLAYER_START.x && y === PLAYER_START.y
    if (onBorder || onStart) return

    setGrid((prev) => {
      const next = prev.map((row) => [...row])
      next[y][x] = TOOL_TILE[tool]
      return next
    })
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand">
          <img src={`${import.meta.env.BASE_URL}logo.webp`} alt="CSA" className="app-header__logo" />
        </div>
        <button className="btn btn--ghost btn--small app-header__home" onClick={onBack}>
          ← Hem
        </button>
        <button className="btn btn--ghost btn--small" onClick={() => setShowWorld((v) => !v)}>
          {showWorld ? 'Dölj roboten' : 'Visa roboten'}
        </button>
      </header>

      <div className="objective-panel">
        <p className="objective-panel__objective">
          Ingen uppgift att lösa här. Skriv vilken Python-kod du vill — flytta roboten med move(),
          turn_left(), turn_right() och collect(), eller testa vanliga variabler, loopar och villkor.
          Bygg om rummet med verktygen nedan, eller klicka en bricka igen för att se resultatet live.
        </p>
      </div>

      {showWorld && (
        <div className="playground-toolbar">
          <span className="playground-toolbar__label">Bygg rummet:</span>
          {(Object.keys(TOOL_LABEL) as Tool[]).map((t) => (
            <button
              key={t}
              className={`btn btn--small${tool === t ? ' btn--primary' : ' btn--ghost'}`}
              onClick={() => setTool(t)}
            >
              {TOOL_LABEL[t]}
            </button>
          ))}
          <span className="playground-toolbar__hint">Klicka i rummet för att måla ut {TOOL_LABEL[tool].toLowerCase()}</span>
        </div>
      )}

      <main className={`main-split${showWorld ? '' : ' main-split--single'}`}>
        {showWorld && (
          <section className="panel panel--world">
            <GameWorld
              level={level}
              worldState={session.worldState}
              lastStep={session.lastStep}
              editable
              onTileClick={handleTileClick}
            />
            {session.lastActionNote && session.phase === 'running' && (
              <div className="world-note">{session.lastActionNote}</div>
            )}
          </section>
        )}

        <section className="panel panel--editor">
          <CodeEditor
            value={session.code}
            onChange={session.setCode}
            highlightedLine={session.highlightedLine}
            readOnly={session.phase === 'running' || session.phase === 'awaiting_input'}
          />
          <VariableInspector variables={session.currentVariables} compact />
          <ConsolePanel
            lines={session.consoleLines}
            pendingPrompt={session.pendingPrompt}
            onSubmit={session.submitInput}
          />
        </section>
      </main>

      {session.phase === 'error' && session.error && <ErrorPanel error={session.error} />}

      <footer className="app-footer">
        <div className="hint-panel">
          <div className="hint-panel__header">
            <span className="hint-panel__title">Testa gärna</span>
          </div>
          <ul className="hint-panel__list">
            <li className="hint-panel__item">
              <pre className="hint-panel__text">
                move(), turn_left(), turn_right(), collect(), can_move(), resource_ahead(), at_goal() —
                och all vanlig Python: variabler, if/elif/else, for, while, listor, dict, def, class.
              </pre>
            </li>
          </ul>
        </div>
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
    </div>
  )
}
