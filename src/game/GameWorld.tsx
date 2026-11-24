import { useEffect, useRef, useState } from 'react'
import type { LevelDefinition, SimWorldState, TraceStep } from '../types'
import { Robot } from './Robot'
import { EXPEDITION_TOOLS } from '../engine/simulate'

interface Effect {
  id: number
  kind: 'collect' | 'bump'
  x: number
  y: number
}

interface GameWorldProps {
  level: LevelDefinition
  worldState: SimWorldState
  lastStep: TraceStep | null
  /** Playground only: lets clicking a tile paint it with the active tool. */
  editable?: boolean
  onTileClick?: (x: number, y: number) => void
}

const MAX_CELL = 56
const MIN_CELL = 30

export function GameWorld({ level, worldState, lastStep, editable, onTileClick }: GameWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [cellSize, setCellSize] = useState(44)
  const [effects, setEffects] = useState<Effect[]>([])
  const effectId = useRef(0)
  const lastStepSeen = useRef<TraceStep | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const w = el.clientWidth - (level.expedition ? 40 : 0)
      const h = el.clientHeight - (level.expedition ? 150 : 0)
      const size = Math.floor(Math.min(w / level.width, h / level.height))
      setCellSize(Math.max(MIN_CELL, Math.min(MAX_CELL, size)))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [level.width, level.height, level.expedition])

  useEffect(() => {
    if (!lastStep || lastStep === lastStepSeen.current) return
    lastStepSeen.current = lastStep

    if (lastStep.type === 'collect' && !lastStep.note) {
      const id = effectId.current++
      setEffects((fx) => [...fx, { id, kind: 'collect', x: lastStep.state.robot.x, y: lastStep.state.robot.y }])
      setTimeout(() => setEffects((fx) => fx.filter((f) => f.id !== id)), 700)
    }
    if (lastStep.type === 'move' && lastStep.state.bumped) {
      const id = effectId.current++
      setEffects((fx) => [...fx, { id, kind: 'bump', x: lastStep.state.robot.x, y: lastStep.state.robot.y }])
      setTimeout(() => setEffects((fx) => fx.filter((f) => f.id !== id)), 400)
    }
  }, [lastStep])

  const collectedSet = new Set(worldState.resources.map((r) => `${r.x},${r.y}`))
  const bumping = effects.some((e) => e.kind === 'bump')

  return (
    <div className={`world-wrapper${level.expedition ? ' world-wrapper--expedition' : ''}`} ref={containerRef}>
      <div
        className="world-grid"
        style={{
          width: cellSize * level.width,
          height: cellSize * level.height,
          gridTemplateColumns: `repeat(${level.width}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${level.height}, ${cellSize}px)`
        }}
      >
        {level.tileGrid.map((row, y) =>
          row.map((kind, x) => {
            const isCollectedResource = kind === 'resource' && !collectedSet.has(`${x},${y}`)
            const displayKind = isCollectedResource ? 'empty' : kind
            const doorOpen = displayKind === 'door' && worldState.doorsOpen
            const obstacle = level.mechanisms?.find(m => m.barriers.some(p => p.x === x && p.y === y))
            const panel = level.mechanisms?.find(m => m.station.x === x && m.station.y === y)
            const cleared = obstacle && worldState.activated?.includes(obstacle.id)
            const terrain = EXPEDITION_TOOLS[kind as keyof typeof EXPEDITION_TOOLS]
            const restored = worldState.cleared?.includes(`${x},${y}`)
            return (
              <div
                key={`${x}-${y}`}
                title={terrain ? `${terrain.label}: ${terrain.tool}, effekt ${terrain.power}${restored ? ' — klart' : ''}` : panel ? `Panel ${panel.id}: ${panel.label} — activate()` : obstacle ? `${obstacle.label}${cleared ? ' — säker' : ' — blockerad'}` : undefined}
                className={`tile tile--${displayKind}${terrain ? ` terrain${restored ? ' terrain--restored' : ''}` : ''}${obstacle ? ` obstacle obstacle--${obstacle.kind}${cleared ? ' obstacle--clear' : ''}` : ''}${doorOpen ? ' tile--door-open' : ''}${
                  editable ? ' tile--editable' : ''
                }`}
                onClick={editable ? () => onTileClick?.(x, y) : undefined}
              >
                {terrain && <span className="terrain__icon">{restored ? '✓' : ({ rock: '◆', gap: '═', storm: 'ϟ', beacon: '⌁' })[kind as keyof typeof EXPEDITION_TOOLS]}</span>}
                {panel && <span className={`station${worldState.activated?.includes(panel.id) ? ' station--active' : ''}`}>{panel.id}</span>}
                {obstacle && <span className="obstacle__symbol">{cleared ? '✓' : ({ door: '▥', laser: '╳', heat: '≋', water: '≈', bridge: '═', lift: '↕', charger: 'ϟ' })[obstacle.kind]}</span>}
                {displayKind === 'resource' && <span className="tile__resource" />}
                {displayKind === 'goal' && <span className="tile__goal" />}
                {displayKind === 'wall' && <span className="tile__wall" />}
                {displayKind === 'door' && (
                  <>
                    <span className="tile__door tile__door--left" />
                    <span className="tile__door tile__door--right" />
                  </>
                )}
              </div>
            )
          })
        )}

        <Robot
          x={worldState.robot.x}
          y={worldState.robot.y}
          direction={worldState.robot.direction}
          cellSize={cellSize}
          bump={bumping}
        />

        {effects.map((fx) => (
          <div
            key={fx.id}
            className={`fx fx--${fx.kind}`}
            style={{
              transform: `translate(${fx.x * cellSize}px, ${fx.y * cellSize}px)`,
              width: cellSize,
              height: cellSize
            }}
          >
            {fx.kind === 'collect' && <span className="fx__label">{level.expedition ? '+5 energi' : '+1'}</span>}
          </div>
        ))}
      </div>

      <div className="world-hud">
        {level.expedition && <div className="expedition-hud">
          <strong className={(worldState.energy ?? 0) < 5 ? 'energy-low' : ''}>⚡ {worldState.energy ?? level.expedition.energy} energi</strong>
          <span>Rörelse −1 · Cell +5 · Verktyg −effekt</span>
          {level.tileGrid.flat().includes('beacon') && <span>Reläer {level.tileGrid.flatMap((row, y) => row.map((t, x) => t === 'beacon' && worldState.cleared?.includes(`${x},${y}`))).filter(Boolean).length} / {level.tileGrid.flat().filter(t => t === 'beacon').length}</span>}
          <details><summary>Robotens förmågor och karttecken</summary>
            <p>Stå direkt framför hindret och vänd roboten mot det. use_tool(namn, effekt) använder ett verktyg utan att flytta roboten. Namnet skrivs inom citattecken, effekten som ett tal. Gå sedan fram med move().</p>
            <p>◆ Sten: <code>use_tool("drill", 3)</code> · ═ Schakt: <code>use_tool("bridge", 2)</code> · ϟ Storm: <code>use_tool("shield", 4)</code> · ⌁ Relä: <code>use_tool("repair", 1)</code></p>
            <p><code>data = scan()</code> läser rutan framför roboten. data["blocked"] anger om ett verktyg behövs, data["tool"] ger namnet och data["power"] ger effekten. kind är rutans typ och energy är robotens återstående energi.</p>
            <p>Gå till energicellen och använd collect(). {level.requireAllResources === false ? 'Cellerna är valfria laddstopp; alla reläer krävs.' : 'Alla celler och reläer krävs.'} Nå den gröna målrutan. Återställ om energin tar slut.</p>
          </details>
          {lastStep?.type === 'tool' && <span role="status">{lastStep.note}</span>}
        </div>}
        {level.mechanisms && <div className="mechanism-legend">
          <span>Panelruta → activate() · Grönt mål = utgång</span>
          {level.mechanisms.map(m => <span key={m.id} className={`mechanism-key mechanism-key--${m.kind}`}>
            {worldState.activated?.includes(m.id) ? '✓' : m.id} · {m.label}
          </span>)}
        </div>}
        {worldState.totalResources > 0 && (
          <div className="hud-chip">
            <span className="hud-chip__icon" />
            {worldState.collected} / {worldState.totalResources} energiceller
          </div>
        )}
      </div>
    </div>
  )
}
