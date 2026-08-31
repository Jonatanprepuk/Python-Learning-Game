import type { LevelDefinition, TileKind } from '../types'
import { pickNumeric } from './valueBinding'

// Small ASCII helper: # = wall, . = empty, D = door (opens once its level's
// doorCondition holds), G = goal, S = start (rendered as empty).
export function parseGrid(rows: string[]): TileKind[][] {
  const map: Record<string, TileKind> = {
    '#': 'wall',
    '.': 'empty',
    D: 'door',
    G: 'goal',
    S: 'empty'
  }
  return rows.map((row) => row.split('').map((ch) => map[ch] ?? 'empty'))
}

// Scene-type levels don't need a grid, but LevelDefinition keeps
// tileGrid/playerStart required so the shared session/world-state plumbing
// doesn't need to branch on level type.
const NO_GRID: Pick<LevelDefinition, 'width' | 'height' | 'tileGrid' | 'playerStart'> = {
  width: 1,
  height: 1,
  tileGrid: [['empty'] as TileKind[]],
  playerStart: { x: 0, y: 0, direction: 'right' }
}

export interface WorldMeta {
  id: string
  title: string
  tagline: string
  status: 'available' | 'soon'
}

export const WORLDS: WorldMeta[] = [
  {
    id: 'kontrollcentralen',
    title: 'Kontrollcentralen',
    tagline: 'Variabler, tal och de fyra räknesätten.',
    status: 'available'
  },
  {
    id: 'sakerhetssystemet',
    title: 'Säkerhetssystemet',
    tagline: 'Logik och villkor.',
    status: 'soon'
  },
  {
    id: 'produktionshallen',
    title: 'Produktionshallen',
    tagline: 'Loopar.',
    status: 'soon'
  },
  {
    id: 'datacentret',
    title: 'Datacentret',
    tagline: 'Listor och dictionaries.',
    status: 'soon'
  },
  {
    id: 'robotlabbet',
    title: 'Robotlabbet',
    tagline: 'Funktioner.',
    status: 'soon'
  },
  {
    id: 'expeditionen',
    title: 'Expeditionen',
    tagline: 'Kombinerade uppdrag.',
    status: 'soon'
  },
  {
    id: 'autonoma-system',
    title: 'Autonoma system',
    tagline: 'Klasser.',
    status: 'soon'
  }
]

export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'robot-wake',
    title: 'Ge roboten ett namn',
    concept: 'print() och strängar',
    objective: 'Skapa en variabel (till exempel name) med ett namn som text, och använd print() för att hälsa på roboten.',
    ...NO_GRID,
    availableCommands: ['variabel = "text" (str)', 'print()'],
    starterCode: 'name =  # skriv ett namn som text här\n\n# Använd print() för att hälsa på roboten.\n',
    hints: [
      'Fyll i ett namn som text efter likhetstecknet, till exempel "NOVA".',
      'Använd print() för att skriva ut hälsningen.',
      'Prova:\nname = "NOVA"\nprint(name)'
    ],
    successTip: 'En variabel är som en namngiven låda: name pekar nu på texten du valde.',
    showConsole: true,
    successCheck: (ctx) => ctx.consoleLines.some((line) => line.trim().length > 0)
  },
  {
    id: 2,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'backpack',
    title: 'Packa ryggsäcken',
    concept: 'variabler',
    objective: 'Skapa två variabler med exakt dessa namn: apples satt till 3, och water satt till 2.',
    ...NO_GRID,
    availableCommands: ['variabel = tal (int)'],
    starterCode: 'apples =  # hur många äpplen?\nwater =  # hur många vattenflaskor?\n',
    hints: [
      'Fyll i värdet efter likhetstecknet för varje variabel.',
      'apples ska bli 3, water ska bli 2.',
      'Prova:\napples = 3\nwater = 2'
    ],
    successTip: 'En variabel är som en namngiven låda: apples pekar på talet 3, water pekar på talet 2.',
    showVariables: true,
    successCheck: (ctx) => ctx.variables.apples === 3 && ctx.variables.water === 2
  },
  {
    id: 3,
    world: 'kontrollcentralen',
    type: 'robot',
    title: 'Rum 1 — Energilåset',
    concept: 'addition (+)',
    objective: 'Spara summan av cell_a och cell_b i en variabel som heter exakt energy — dörren läser av den och öppnas automatiskt.',
    width: 8,
    height: 3,
    tileGrid: parseGrid(['########', '#S..D.G#', '########']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['+', 'move()'],
    starterCode: 'cell_a = 20\ncell_b = 30\n\nenergy =  # hur mycket energi ger cellerna tillsammans?\n\nmove()\n',
    hints: [
      'Roboten kommer inte hela vägen fram än – räkna ut hur många steg det faktiskt är till dörren och sedan till målet.',
      '+ adderar två tal i Python: cell_a + cell_b.',
      'Fyll i uträkningen efter energy =.',
      'Prova:\nenergy = cell_a + cell_b\n\nmove()\nmove()\nmove()\nmove()\nmove()'
    ],
    successTip: 'Dörren lyssnar på variabeln energy hela tiden den körs — du ser den öppnas i samma ögonblick värdet blir rätt.',
    showConsole: true,
    showVariables: true,
    doorCondition: { variable: 'energy', op: '==', value: 50 },
    successCheck: (ctx) => pickNumeric(ctx.variables, ctx.consoleLines, ['energy']) === 50
  },
  {
    id: 4,
    world: 'kontrollcentralen',
    type: 'robot',
    title: 'Rum 2 — Säkerhetsdörren',
    concept: 'subtraktion (-)',
    objective: 'Spara resultatet i en variabel som heter exakt remaining_energy — dörren öppnas automatiskt när den stämmer.',
    width: 8,
    height: 3,
    tileGrid: parseGrid(['########', '#S..D.G#', '########']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['-', 'move()'],
    starterCode:
      'total_energy = 100\ndoor_cost = 35\n\nremaining_energy =  # hur mycket energi är kvar?\n\nmove()\nmove()',
    hints: [
      'Roboten kommer inte riktigt fram än – räkna ut hur många steg det faktiskt är till målet.',
      '- drar bort ett värde från ett annat: total_energy - door_cost.',
      'Fyll i uträkningen efter remaining_energy =.',
      'Prova:\nremaining_energy = total_energy - door_cost\n\nmove()\nmove()\nmove()\nmove()\nmove()'
    ],
    successTip: 'Samma variabler kan kombineras med olika räknesätt beroende på vad de betyder i sammanhanget.',
    showConsole: true,
    showVariables: true,
    doorCondition: { variable: 'remaining_energy', op: '==', value: 65 },
    successCheck: (ctx) => pickNumeric(ctx.variables, ctx.consoleLines, ['remaining_energy']) === 65
  },
  {
    id: 5,
    world: 'kontrollcentralen',
    type: 'robot',
    title: 'Rum 3 — Bron',
    concept: 'multiplikation (*)',
    objective: 'Spara resultatet i en variabel som heter exakt bridge_length — bron läggs ut automatiskt när den stämmer.',
    width: 8,
    height: 3,
    tileGrid: parseGrid(['########', '#S.DD.G#', '########']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['*', 'move()'],
    starterCode:
      'part_length = 2\nparts_needed = 4\n\nbridge_length =  # hur lång blir bron totalt?\n\nmove()',
    hints: [
      'Roboten kommer inte riktigt fram än – räkna ut hur många steg det faktiskt är till målet.',
      '* multiplicerar: part_length * parts_needed.',
      'Fyll i uträkningen efter bridge_length =.',
      'Prova:\nbridge_length = part_length * parts_needed\n\nmove()\nmove()\nmove()\nmove()\nmove()'
    ],
    successTip: 'Multiplikation är ett snabbt sätt att räkna ihop flera lika stora mängder, till exempel brodelar.',
    showConsole: true,
    showVariables: true,
    doorCondition: { variable: 'bridge_length', op: '==', value: 8 },
    successCheck: (ctx) => pickNumeric(ctx.variables, ctx.consoleLines, ['bridge_length']) === 8
  },
  {
    id: 6,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'rocket',
    title: 'Bygg raketen',
    concept: 'variabler + operatorer',
    objective: 'Spara resultatet i en variabel som heter exakt total_fuel.',
    ...NO_GRID,
    availableCommands: ['variabler', '*', 'print()'],
    starterCode: 'fuel = 20\nfuel_tanks = 3\n\n# Räkna ut den totala mängden bränsle.\n',
    hints: [
      'Multiplicera de två variablerna: fuel * fuel_tanks.',
      'Spara resultatet i en variabel som heter exakt total_fuel.',
      'Prova:\ntotal_fuel = fuel * fuel_tanks\nprint(total_fuel)'
    ],
    successTip: 'Variabler kan användas i beräkningar precis som vanliga tal, och resultatet kan sparas i en ny variabel.',
    showConsole: true,
    showVariables: true,
    successCheck: (ctx) => pickNumeric(ctx.variables, ctx.consoleLines, ['total_fuel']) === 60
  },
  {
    id: 7,
    world: 'kontrollcentralen',
    type: 'robot',
    title: 'Robotens första uppdrag',
    concept: 'print, +, -, * och variabler tillsammans',
    objective:
      'Spara resultatet i en variabel som heter exakt remaining_energy — dörren öppnas automatiskt, och sedan tar du dig till utgången.',
    width: 6,
    height: 5,
    tileGrid: parseGrid(['######', '#S.D##', '###.##', '###G##', '######']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['variabler', '+', '-', '*', 'move()', 'turn_right()'],
    starterCode:
      'start_energy = 100\n\n# Dörren kostar 20 energi.\n# Roboten gör två rörelser på 15 energi var.\n# Räkna ut hur mycket energi som är kvar.\n\nmove()\nmove()\nturn_right()\nmove()\n',
    hints: [
      'Dörren kostar 20 energi. De två rörelserna kostar 15 energi var, alltså 15 * 2 totalt.',
      'Dra bort båda kostnaderna från start_energy, och spara resultatet i en variabel som heter exakt remaining_energy.',
      'Roboten kommer inte riktigt fram till utgången än – den behöver ett steg till på slutet.',
      'Prova:\nremaining_energy = start_energy - 20 - 15 * 2\n\nmove()\nmove()\nturn_right()\nmove()\nmove()'
    ],
    successTip: 'Du kombinerade print, +/-/*, och variabler i samma program – det är precis så riktiga Python-program byggs.',
    showConsole: true,
    showVariables: true,
    doorCondition: { variable: 'remaining_energy', op: '==', value: 50 },
    successCheck: (ctx) => pickNumeric(ctx.variables, ctx.consoleLines, ['remaining_energy', 'energy_left']) === 50
  }
]

export function getLevel(id: number): LevelDefinition | undefined {
  return LEVELS.find((l) => l.id === id)
}
