import type { LevelDefinition } from '../types'
import type { WorldMeta } from '../levels/levels'

interface HomePageProps {
  worlds: WorldMeta[]
  levels: LevelDefinition[]
  completed: Set<number>
  onEnter: (worldId: string) => void
}

export function HomePage({ worlds, levels, completed, onEnter }: HomePageProps) {
  return (
    <div className="home">
      <div className="home__hero">
        <span className="home__eyebrow">Robotanläggning · Fjärrstyrd programmering</span>
        <h1 className="home__title">KODROBOT</h1>
        <p className="home__lede">
          En övergiven anläggning väntar på att startas upp igen, ett rum i taget. Varje värld är ett nytt
          system att få igång med Python. Välj en värld nedan för att börja.
        </p>
      </div>

      <div className="home__grid">
        {worlds.map((world) => {
          const worldLevels = levels.filter((l) => l.world === world.id)
          const doneCount = worldLevels.filter((l) => completed.has(l.id)).length
          const available = world.status === 'available'

          return (
            <button
              key={world.id}
              className={`world-card${available ? ' world-card--available' : ' world-card--locked'}`}
              onClick={() => available && onEnter(world.id)}
              disabled={!available}
            >
              <span className="world-card__light" />
              <span className="world-card__title">{world.title}</span>
              <span className="world-card__tagline">{world.tagline}</span>
              {available ? (
                <span className="world-card__meta">
                  {doneCount} / {worldLevels.length} uppdrag klara
                </span>
              ) : (
                <span className="world-card__meta world-card__meta--soon">Kommer senare</span>
              )}
              {!available && <span className="world-card__ribbon">Snart</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
