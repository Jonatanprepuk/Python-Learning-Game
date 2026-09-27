import type { Direction, GridPos, LevelDefinition, TileKind } from '../types'
import { createPerfectMaze } from './loopMaze'

const WORLD = 'produktionshallen'
const MOVES = ['move()', 'turn_left()', 'turn_right()', 'can_move()', 'at_goal()']
const WALL_RULE = `while not at_goal():
    if can_move_left():
        turn_left()
        move()
    elif can_move():
        move()
    elif can_move_right():
        turn_right()
        move()
    else:
        turn_right()
        turn_right()`

interface MapSpec {
  tileGrid: TileKind[][]
  width: number
  height: number
  playerStart: { x: number; y: number; direction: Direction }
}

function pathMap(start: GridPos, path: string, branches: { from: GridPos; path: string }[] = [], resources: GridPos[] = []): MapSpec {
  const floors = new Set<string>()
  const key = (p: GridPos) => `${p.x},${p.y}`
  const walk = (origin: GridPos, route: string) => {
    let pos = { ...origin }
    floors.add(key(pos))
    for (const step of route) {
      if (step === 'R') pos.x++
      else if (step === 'L') pos.x--
      else if (step === 'U') pos.y--
      else if (step === 'D') pos.y++
      else throw new Error(`Unknown path step: ${step}`)
      floors.add(key(pos))
    }
    return pos
  }
  const goal = walk(start, path)
  branches.forEach(branch => walk(branch.from, branch.path))
  const positions = [...floors].map(item => item.split(',').map(Number))
  const width = Math.max(...positions.map(([x]) => x)) + 2
  const height = Math.max(...positions.map(([, y]) => y)) + 2
  const tileGrid = Array.from({ length: height }, () => Array<TileKind>(width).fill('wall'))
  positions.forEach(([x, y]) => { tileGrid[y][x] = 'empty' })
  resources.forEach(({ x, y }) => { tileGrid[y][x] = 'resource' })
  tileGrid[goal.y][goal.x] = 'goal'
  return { tileGrid, width, height, playerStart: { ...start, direction: 'right' } }
}

function fixedMaze(): MapSpec {
  let seed = 287
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  return {
    tileGrid: createPerfectMaze(random), width: 9, height: 9,
    playerStart: { x: 1, y: 1, direction: 'right' }
  }
}

interface LoopExercise {
  id: number
  title: string
  concept: string
  objective: string
  map: MapSpec
  requiredLoop: 'for' | 'while'
  requireIfStatement?: boolean
  commands: string[]
  starterCode: string
  hints: string[]
  solution: string
  requireAllResources?: boolean
  randomMaze?: boolean
  unscaffolded?: boolean
}

const straight = pathMap({ x: 1, y: 1 }, 'RRRR')
const mazePractice = fixedMaze()
const mazePreview = { tileGrid: createPerfectMaze(() => 0.37), width: 9, height: 9,
  playerStart: { x: 1, y: 1, direction: 'right' as Direction } }

const exercises: LoopExercise[] = [
  {
    id: 28,
    title: 'Raka transportbandet', concept: 'for och range()',
    objective: 'Gå fyra steg rakt fram. Låt en for-loop köra move() en gång per steg.',
    map: straight, requiredLoop: 'for', commands: [...MOVES, 'for i in range(n):'],
    starterCode: '# Upprepa move() fyra gånger med for.\nfor steg in range(4):\n    # Skriv move() här\n',
    hints: ['range(4) ger fyra varv: 0, 1, 2 och 3.', 'Raden inne i loopen behöver fyra mellanslags indrag.'],
    solution: 'for steg in range(4):\n    move()'
  },
  {
    id: 29,
    title: 'Samma väg, nytt villkor', concept: 'while och at_goal()',
    objective: 'Gå samma fyra steg, men låt en while-loop fortsätta tills roboten står på målet.',
    map: straight, requiredLoop: 'while', commands: [...MOVES, 'while villkor:'],
    starterCode: '# Fortsätt så länge roboten inte står på målet.\nwhile not at_goal():\n    # Skriv move() här\n',
    hints: ['at_goal() blir True först på den gröna rutan.', 'not at_goal() betyder att målet ännu inte är nått.'],
    solution: 'while not at_goal():\n    move()'
  },
  {
    id: 30,
    title: 'Sicksackbandet', concept: 'for, jämna rader och if',
    objective: 'Gå fyra vågräta rader med fyra steg per rad. Mellan raderna går du två steg nedåt. Använd radnumret och % 2 för att välja sväng.',
    map: pathMap({ x: 1, y: 1 }, 'RRRRDDLLLLDDRRRRDDLLLL'),
    requiredLoop: 'for', requireIfStatement: true,
    commands: [...MOVES, 'for i in range(n):', 'if villkor:', '%'],
    starterCode: '# Fyra rader. Jämna radnummer går åt höger, udda åt vänster.\nfor rad in range(4):\n    for steg in range(4):\n        # Gå ett steg\n    if rad < 3:\n        # Byt rad: sväng, gå två steg ned och sväng igen\n',
    hints: ['Använd en inre for-loop för de fyra stegen i varje rad.', 'rad % 2 == 0 är sant på rad 0 och 2. Sväng höger efter dem, vänster efter rad 1.', 'Hoppa över radbytet efter den sista raden.'],
    solution: `for rad in range(4):
    for steg in range(4):
        move()
    if rad < 3:
        if rad % 2 == 0:
            turn_right()
            move()
            move()
            turn_right()
        else:
            turn_left()
            move()
            move()
            turn_left()`
  },
  {
    id: 40,
    title: 'Sicksack utan stöd', concept: 'självständig for-övning',
    objective: 'Gå tre vågräta rader med sex steg per rad. Mellan raderna går du två steg nedåt. Använd en for-loop och välj sväng med radnumret.',
    map: pathMap({ x: 1, y: 1 }, 'RRRRRRDDLLLLLLDDRRRRRR'),
    requiredLoop: 'for', requireIfStatement: true, unscaffolded: true,
    commands: [...MOVES, 'for i in range(n):', 'if villkor:', '%'],
    starterCode: '', hints: [],
    solution: `for rad in range(3):
    for steg in range(6):
        move()
    if rad < 2:
        if rad % 2 == 0:
            turn_right()
            move()
            move()
            turn_right()
        else:
            turn_left()
            move()
            move()
            turn_left()`
  },
  {
    id: 31,
    title: 'Plocka energiceller', concept: 'for och if i samma loop',
    objective: 'Gå sju steg. Samla cellerna efter steg 2, 4 och 6 med en if-sats inuti for-loopen.',
    map: pathMap({ x: 1, y: 1 }, 'RRRRRRR', [], [{ x: 3, y: 1 }, { x: 5, y: 1 }, { x: 7, y: 1 }]),
    requiredLoop: 'for', requireIfStatement: true, requireAllResources: true,
    commands: [...MOVES, 'collect()', 'for i in range(n):', 'if villkor:', '%'],
    starterCode: '# Numrera stegen från 1 till 7. Samla på jämna steg.\nfor steg in range(1, 8):\n    # Flytta och kontrollera om steget är jämnt\n',
    hints: ['range(1, 8) ger stegen 1 till 7.', 'Efter move(): om steg % 2 == 0, använd collect().'],
    solution: 'for steg in range(1, 8):\n    move()\n    if steg % 2 == 0:\n        collect()'
  },
  {
    id: 32,
    title: 'Till väggen och vidare', concept: 'while can_move()',
    objective: 'Följ den L-formade gången till väggen, sväng vänster och följ nästa gång till målet.',
    map: pathMap({ x: 1, y: 4 }, 'RRRRUUU'), requiredLoop: 'while',
    commands: [...MOVES, 'while villkor:'],
    starterCode: '# Gå så länge vägen framåt är fri. Sväng sedan vänster.\n',
    hints: ['while can_move(): fortsätter fram till väggen.', 'Efter svängen behöver du en ny while-loop.'],
    solution: 'while can_move():\n    move()\nturn_left()\nwhile can_move():\n    move()'
  },
  {
    id: 41,
    title: 'Tre transportgångar', concept: 'självständig while-övning',
    objective: 'Följ tre raka gångar till målet. Sväng vänster när du når slutet av en gång.',
    map: pathMap({ x: 1, y: 5 }, 'RRRRUUULL'),
    requiredLoop: 'while', unscaffolded: true,
    commands: [...MOVES, 'while villkor:'],
    starterCode: '', hints: [],
    solution: `while can_move():
    move()
turn_left()
while can_move():
    move()
turn_left()
while can_move():
    move()`
  },
  {
    id: 33,
    title: 'Tre vänsterhörn', concept: 'while, if och at_corner()',
    objective: 'Följ gången till målet. När roboten står i ett hörn ska den svänga vänster.',
    map: pathMap({ x: 1, y: 7 }, 'RRRRUUUULLLLDD'), requiredLoop: 'while', requireIfStatement: true,
    commands: [...MOVES, 'at_corner()', 'while villkor:', 'if villkor:'],
    starterCode: '# Fortsätt till målet. Kontrollera varje ruta innan du går vidare.\nwhile not at_goal():\n    # Om du står i ett hörn: sväng vänster\n    # Gå ett steg\n',
    hints: ['at_corner() ser en 90-graders sväng oavsett åt vilket håll roboten tittar.', 'Lägg turn_left() i en if-sats före move().'],
    solution: 'while not at_goal():\n    if at_corner():\n        turn_left()\n    move()'
  },
  {
    id: 34,
    title: 'Avståndsmätaren', concept: 'while med avstånd och hinder',
    objective: 'Fortsätt medan kortaste avståndet till målet är större än noll. Sväng vänster när vägen framåt tar slut.',
    map: pathMap({ x: 1, y: 5 }, 'RRRRUUUU'), requiredLoop: 'while', requireIfStatement: true,
    commands: [...MOVES, 'steps_to_goal()', 'while villkor:', 'if villkor:'],
    starterCode: '# steps_to_goal() visar hur många gångbara steg som återstår.\nwhile steps_to_goal() > 0:\n    # Sväng om det är stopp framför roboten\n    # Gå ett steg\n',
    hints: ['Avståndet blir 0 på målet.', 'if not can_move(): kan upptäcka när roboten behöver svänga.'],
    solution: 'while steps_to_goal() > 0:\n    if not can_move():\n        turn_left()\n    move()'
  },
  {
    id: 35,
    title: 'Vänster passage', concept: 'while och can_move_left()',
    objective: 'Vid förgreningen går vägen till målet åt vänster. Kontrollera vänster sida under varje varv.',
    map: pathMap({ x: 1, y: 5 }, 'RRRUUUU', [{ from: { x: 4, y: 5 }, path: 'RR' }]),
    requiredLoop: 'while', requireIfStatement: true,
    commands: [...MOVES, 'can_move_left()', 'while villkor:', 'if villkor:'],
    starterCode: '# Välj vänster när en öppning dyker upp.\nwhile not at_goal():\n    # Kontrollera vänster, sväng vid behov och gå vidare\n',
    hints: ['can_move_left() vrider inte roboten.', 'Efter en eventuell turn_left() går du ett steg.'],
    solution: 'while not at_goal():\n    if can_move_left():\n        turn_left()\n    move()'
  },
  {
    id: 36,
    title: 'Höger passage', concept: 'while, höger sensor och if',
    objective: 'Välj höger vid de två förgreningarna och fortsätt till målet.',
    map: pathMap({ x: 1, y: 1 }, 'RRRRDDDDLLLL', [
      { from: { x: 5, y: 1 }, path: 'R' },
      { from: { x: 5, y: 5 }, path: 'D' }
    ]), requiredLoop: 'while', requireIfStatement: true,
    commands: [...MOVES, 'can_move_right()', 'while villkor:', 'if villkor:', 'else:'],
    starterCode: '# Titta åt höger i varje varv. Annars fortsätter du framåt.\nwhile not at_goal():\n    # Välj riktning och flytta\n',
    hints: ['På båda förgreningarna finns en öppen ruta till höger.', 'Kontrollera med can_move_right(), sväng om det behövs och använd move().'],
    solution: 'while not at_goal():\n    if can_move_right():\n        turn_right()\n    else:\n        if not can_move():\n            turn_left()\n    move()'
  },
  {
    id: 42,
    title: 'Två vägval utan stöd', concept: 'självständig while-övning med if',
    objective: 'Välj vänster vid första förgreningen och höger vid den andra. Skriv en while-loop som kontrollerar båda sidorna.',
    map: pathMap({ x: 1, y: 5 }, 'RRRRUUUURRR', [{ from: { x: 5, y: 5 }, path: 'RR' }]),
    requiredLoop: 'while', requireIfStatement: true, unscaffolded: true,
    commands: [...MOVES, 'can_move_left()', 'can_move_right()', 'while villkor:', 'if/elif/else:'],
    starterCode: '', hints: [],
    solution: `while not at_goal():
    if can_move_left():
        turn_left()
    elif can_move_right():
        turn_right()
    move()`
  },
  {
    id: 37,
    title: 'Återvändsgränden', concept: 'while med if/elif/else',
    objective: 'Pröva vänster, framåt och höger i den ordningen. Vänd helt när alla tre håll är stängda.',
    map: pathMap({ x: 1, y: 1 }, 'RRRDDDDLLL', [{ from: { x: 4, y: 1 }, path: 'RR' }]),
    requiredLoop: 'while', requireIfStatement: true,
    commands: [...MOVES, 'can_move_left()', 'can_move_right()', 'while villkor:', 'if/elif/else:'],
    starterCode: '# En återvändsgränd kräver två högersvängar.\nwhile not at_goal():\n    # Pröva vänster, framåt, höger och sist helt om\n',
    hints: ['När vänster är fri: sväng vänster och gå. Annars prövar du framåt, sedan höger.', 'Om inga av de tre hållen är fria: sväng höger två gånger. Nästa varv kan roboten gå tillbaka.'],
    solution: WALL_RULE
  },
  {
    id: 38,
    title: 'Övningslabyrinten', concept: 'vänsterhandsregeln i fast labyrint',
    objective: 'Använd samma regel i en större, fast labyrint: vänster, framåt, höger eller vänd.',
    map: mazePractice, requiredLoop: 'while', requireIfStatement: true,
    commands: [...MOVES, 'can_move_left()', 'can_move_right()', 'while villkor:', 'if/elif/else:'],
    starterCode: '# Följ vänsterväggen tills roboten når målet.\nwhile not at_goal():\n    # Pröva vänster, framåt, höger och sist helt om\n',
    hints: ['Regeln är densamma som i återvändsgränden, men körs nu många gånger.', 'Vänd två gånger med turn_right() om det är stopp åt vänster, framåt och höger.'],
    solution: WALL_RULE
  },
  {
    id: 39,
    title: 'Den skiftande labyrinten', concept: 'while och generell problemlösning',
    objective: 'Labyrinten ändras vid varje körning. Skriv en while-loop som följer vänsterväggen till målet oavsett karta.',
    map: mazePreview, requiredLoop: 'while', requireIfStatement: true, randomMaze: true,
    commands: [...MOVES, 'can_move_left()', 'can_move_right()', 'while villkor:', 'if/elif/else:'],
    starterCode: '# En ny labyrint skapas när du trycker Kör kod.',
    hints: ['Lita på sensorerna i stället för att memorera vägen. Kartan blir ny nästa gång du kör.', 'Pröva vänster, framåt, höger och vänd helt om när inget av dem fungerar.'],
    solution: WALL_RULE
  }
]

export const LOOP_SOLUTIONS = Object.fromEntries(exercises.map(exercise => [exercise.id, exercise.solution])) as Record<number, string>

export const LOOP_LEVELS: LevelDefinition[] = exercises.map((exercise) => ({
  id: exercise.id,
  world: WORLD,
  type: 'robot',
  title: exercise.title,
  concept: exercise.concept,
  objective: exercise.objective,
  ...exercise.map,
  availableCommands: exercise.commands,
  starterCode: exercise.starterCode,
  hints: exercise.unscaffolded ? [] : [...exercise.hints, `Prova:\n${exercise.solution}`],
  successTip: 'Du använde en loop för att styra roboten till målet.',
  requiredLoop: exercise.requiredLoop,
  requireIfStatement: exercise.requireIfStatement,
  requireAllResources: exercise.requireAllResources,
  randomMaze: exercise.randomMaze
}))
