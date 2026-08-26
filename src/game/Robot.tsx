import type { Direction } from '../types'

const ROTATION: Record<Direction, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: 270
}

interface RobotProps {
  x: number
  y: number
  direction: Direction
  cellSize: number
  bump: boolean
}

export function Robot({ x, y, direction, cellSize, bump }: RobotProps) {
  const translate = `translate(${x * cellSize}px, ${y * cellSize}px)`
  return (
    <div
      className="robot-slot"
      style={{
        width: cellSize,
        height: cellSize,
        transform: translate
      }}
    >
      <div className={`robot${bump ? ' robot--bump' : ''}`} style={{ transform: `rotate(${ROTATION[direction]}deg)` }}>
        <div className="robot__body">
          <span className="robot__eye" />
          <span className="robot__visor" />
        </div>
        <div className="robot__arrow" />
      </div>
    </div>
  )
}
