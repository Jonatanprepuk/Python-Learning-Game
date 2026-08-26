import type { LevelDefinition, TileKind } from '../types'

// Small ASCII helper so grids stay readable:
// # = wall, . = empty, R = resource, G = goal, S = start (rendered as empty)
function parseGrid(rows: string[]): TileKind[][] {
  const map: Record<string, TileKind> = {
    '#': 'wall',
    '.': 'empty',
    R: 'resource',
    G: 'goal',
    S: 'empty'
  }
  return rows.map((row) => row.split('').map((ch) => map[ch] ?? 'empty'))
}

export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    title: 'Första steget',
    concept: 'move()',
    objective: 'Få roboten att nå den gröna rutan.',
    intro: [
      'Välkommen till forskningsstationen! Din robot väntar på instruktioner.',
      'Kommandot move() flyttar roboten ett steg framåt i den riktning den tittar.'
    ],
    width: 6,
    height: 3,
    tileGrid: parseGrid(['######', '#S..G#', '######']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['move()'],
    starterCode: 'move()',
    hints: [
      'Roboten behöver flytta sig tre steg för att nå målet.',
      'Du kan skriva move() flera gånger, en gång per rad.',
      'Prova:\nmove()\nmove()\nmove()'
    ],
    successTip: 'Bra jobbat! move() flyttar roboten ett steg framåt varje gång den anropas.'
  },
  {
    id: 2,
    title: 'Runt hörnet',
    concept: 'sekvenser + turn_right()',
    objective: 'Ta dig runt hörnet och nå den gröna rutan.',
    intro: [
      'Den här gången ligger målet runt ett hörn.',
      'Använd turn_right() för att vrida roboten 90 grader åt höger.'
    ],
    width: 6,
    height: 5,
    tileGrid: parseGrid(['######', '#S..##', '###.##', '###G##', '######']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['move()', 'turn_left()', 'turn_right()'],
    starterCode: 'move()\nmove()\n',
    hints: [
      'Roboten kan inte gå rakt fram hela vägen – det finns en vägg.',
      'När roboten inte kan gå längre fram kan du vrida den med turn_right().',
      'Prova:\nmove()\nmove()\nturn_right()\nmove()\nmove()'
    ],
    successTip: 'turn_right() och turn_left() vrider roboten utan att flytta den.'
  },
  {
    id: 3,
    title: 'Upprepning',
    concept: 'for-loopar',
    objective: 'Ta roboten hela vägen till den gröna rutan.',
    intro: [
      'Den här korridoren är lång. Det går att skriva move() många gånger, men det finns ett smidigare sätt.'
    ],
    width: 11,
    height: 3,
    tileGrid: parseGrid(['###########', '#S.......G#', '###########']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['move()', 'for i in range(n):'],
    starterCode: '# Hur långt är det till målet?\nmove()\n',
    hints: [
      'Det är åtta steg till målet – du kan skriva move() åtta gånger om du vill.',
      'Bra! Men kan du göra samma sak med färre rader kod?',
      'En for-loop upprepar kod åt dig: for i in range(8): move()',
      'Prova:\nfor i in range(8):\n    move()'
    ],
    successTip: 'for i in range(8): move() upprepar move() åtta gånger – samma resultat, mycket kortare kod.'
  },
  {
    id: 4,
    title: 'Samla energi',
    concept: 'loopar + collect()',
    objective: 'Samla alla energiceller och ta dig till målet.',
    intro: [
      'Stationen behöver energi. Kör över energicellerna och samla in dem med collect().',
      'collect() plockar upp det som ligger på rutan roboten står på.'
    ],
    width: 10,
    height: 3,
    tileGrid: parseGrid(['##########', '#SRRRRRRG#', '##########']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['move()', 'collect()', 'for i in range(n):'],
    starterCode: 'for i in range(6):\n    move()\n    collect()\n',
    hints: [
      'Varje energicell ligger på en egen ruta – flytta dit och använd collect().',
      'En loop kan innehålla flera rader kod, till exempel både move() och collect().',
      'Efter att du samlat alla celler behöver roboten flytta ett steg till för att nå målet.'
    ],
    successTip: 'En for-loop kan upprepa flera kommandon i taget, inte bara ett.',
    requireAllResources: true
  },
  {
    id: 5,
    title: 'Villkor',
    concept: 'if-satser',
    objective: 'Samla energicellerna som finns på vägen till målet.',
    intro: [
      'Den här korridoren har energiceller utspridda lite då och då.',
      'Med resource_ahead() kan roboten känna av om det finns något på rutan framför den innan den går dit.'
    ],
    width: 10,
    height: 3,
    tileGrid: parseGrid(['##########', '#SR.RR.RG#', '##########']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['move()', 'collect()', 'resource_ahead()', 'if:'],
    starterCode: 'for i in range(7):\n    if resource_ahead():\n        move()\n        collect()\n    else:\n        move()\n',
    hints: [
      'Alla rutor har inte en energicell på sig – ibland är det bara tomt.',
      'resource_ahead() svarar True eller False beroende på om det finns något på rutan framför roboten.',
      'Använd if resource_ahead(): innan du väljer att samla in, annars bara flytta vidare.'
    ],
    successTip: 'if-satser låter koden fatta beslut baserat på vad som händer i spelvärlden.',
    requireAllResources: true
  },
  {
    id: 6,
    title: 'Okänd sträcka',
    concept: 'while-loopar',
    objective: 'Ta roboten till slutet av korridoren.',
    intro: [
      'Den här korridoren är lång, och den här gången struntar vi i att räkna rutorna i förväg.',
      'can_move() svarar True om roboten kan gå ett steg framåt, annars False.'
    ],
    width: 11,
    height: 3,
    tileGrid: parseGrid(['###########', '#S.......G#', '###########']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['move()', 'can_move()', 'while:'],
    starterCode: 'while can_move():\n    move()\n',
    hints: [
      'Du skulle kunna räkna rutorna själv, men det finns ett smidigare sätt.',
      'while can_move(): upprepar kod ända tills roboten inte kan gå längre fram.',
      'Prova:\nwhile can_move():\n    move()'
    ],
    successTip: 'while-loopar upprepar kod så länge ett villkor är sant – perfekt när du inte vet hur många gånger i förväg.'
  },
  {
    id: 7,
    title: 'Funktioner',
    concept: 'def – egna funktioner',
    objective: 'Skörda alla tre rader med energiceller och nå målet.',
    intro: [
      'Stationens sista uppdrag har tre identiska rader med energiceller.',
      'Med def kan du bygga ett eget kommando som du sedan kan använda flera gånger.'
    ],
    width: 6,
    height: 9,
    tileGrid: parseGrid([
      '######',
      '#SRRR#',
      '#....#',
      '#RRR.#',
      '#....#',
      '#.RRR#',
      '#....#',
      '#...G#',
      '######'
    ]),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['move()', 'collect()', 'turn_left()', 'turn_right()', 'def name():'],
    starterCode:
      'def harvest_line():\n    for i in range(3):\n        move()\n        collect()\n\nharvest_line()\n',
    hints: [
      'harvest_line() finns redan definierad åt dig – den skördar tre rutor framåt.',
      'Efter varje rad behöver roboten vända sig och flytta ner till nästa rad innan den skördar igen.',
      'Du kan anropa harvest_line() flera gånger – den fungerar oavsett vilket håll roboten tittar åt.',
      'Fullständig lösning:\nharvest_line()\nturn_right()\nmove()\nmove()\nturn_right()\nharvest_line()\nturn_left()\nmove()\nmove()\nturn_left()\nharvest_line()\nturn_right()\nmove()\nmove()'
    ],
    successTip: 'Funktioner låter dig paketera flera kommandon under ett eget namn och återanvända dem.',
    requireAllResources: true
  }
]

export function getLevel(id: number): LevelDefinition | undefined {
  return LEVELS.find((l) => l.id === id)
}
