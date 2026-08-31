import type { LevelDefinition } from '../types'
import type { WorldMeta } from '../levels/levels'

interface HomePageProps {
  worlds: WorldMeta[]
  levels: LevelDefinition[]
  completed: Set<number>
  onEnter: (worldId: string) => void
  onOpenPlayground: () => void
}

// One CSA-palettfärg per värld — en liten identitet innan innehållet finns,
// samma idé som märkesfärger i ett kurshäfte.
const WORLD_ACCENTS: Record<string, string> = {
  kontrollcentralen: '#67b9e8', // klarblå
  sakerhetssystemet: '#6cb532', // klargrön
  produktionshallen: '#f0be00', // gul
  datacentret: '#ea528e', // rosa
  robotlabbet: '#aec2d3', // ljusblå
  expeditionen: '#b0c198', // ljusgrön
  'autonoma-system': '#d4c394' // beige / ljusguld
}

export function HomePage({ worlds, levels, completed, onEnter, onOpenPlayground }: HomePageProps) {
  return (
    <div className="home">
      <div className="home__hero">
        <span className="home__eyebrow">CSA · Programmeringskurs i Python</span>
        <h1 className="home__title">CSA:S PROGRAMMERINGSKURS</h1>
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
          const accent = WORLD_ACCENTS[world.id]

          return (
            <button
              key={world.id}
              className={`world-card${available ? ' world-card--available' : ' world-card--locked'}`}
              style={accent ? { borderTopColor: accent } : undefined}
              onClick={() => available && onEnter(world.id)}
              disabled={!available}
            >
              <span className="world-card__light" style={available && accent ? { background: accent, boxShadow: `0 0 8px ${accent}` } : undefined} />
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

      <button className="home__playground-link" onClick={onOpenPlayground}>
        Vill du bara testa Python fritt? Öppna Lekplatsen →
      </button>
    </div>
  )
}
