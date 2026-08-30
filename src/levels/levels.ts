import type { LevelDefinition, TileKind } from '../types'
import { pickNumeric } from './valueBinding'

// Small ASCII helper: # = wall, . = empty, D = door (opens once its level's
// doorCondition holds), G = goal, S = start (rendered as empty).
function parseGrid(rows: string[]): TileKind[][] {
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
    objective: 'Väck roboten genom att ge den ett namn och hälsa på den.',
    intro: [
      'Du har hittat en avstängd robot i en övergiven anläggning. Innan resan börjar behöver den ett namn.',
      'En variabel är ett namn som pekar på ett värde. print() skriver ut det i terminalen.'
    ],
    ...NO_GRID,
    availableCommands: ['variabel = "text" (str)', 'print()'],
    starterCode: '# Ge roboten ett namn och hälsa på den.\n',
    hints: [
      'Skapa en variabel, till exempel name = "NOVA".',
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
    type: 'robot',
    title: 'Rum 1 — Energilåset',
    concept: 'addition (+)',
    objective: 'Räkna ut energin och ta dig igenom den låsta dörren.',
    intro: [
      'Det första rummet blockeras av en energidörr. Den kräver exakt 50 energienheter för att låsa upp.',
      'Två celler i väggen visar 20 och 30. Dörren reagerar direkt när din uträkning stämmer — innan roboten ens rört sig.'
    ],
    width: 8,
    height: 3,
    tileGrid: parseGrid(['########', '#S..D.G#', '########']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['+', 'move()'],
    starterCode:
      'cell_a = 20\ncell_b = 30\n\n# Räkna ut hur mycket energi de två cellerna ger tillsammans.\n\nmove()\nmove()\nmove()\nmove()\nmove()\n',
    hints: [
      'Roboten går redan rätt väg — dörren släpper bara igenom om energy stämmer.',
      '+ adderar cell_a och cell_b.',
      'Prova:\nenergy = cell_a + cell_b'
    ],
    successTip: 'Dörren lyssnar på variabeln energy hela tiden den körs — du ser den öppnas i samma ögonblick värdet blir rätt.',
    showConsole: true,
    showVariables: true,
    doorCondition: { variable: 'energy', op: '==', value: 50 },
    successCheck: (ctx) => pickNumeric(ctx.variables, ctx.consoleLines, ['energy']) === 50
  },
  {
    id: 3,
    world: 'kontrollcentralen',
    type: 'robot',
    title: 'Rum 2 — Säkerhetsdörren',
    concept: 'subtraktion (-)',
    objective: 'Räkna ut hur mycket energi som blir kvar, och lås upp dörren.',
    intro: [
      'Nästa dörr kräver exakt 65 energienheter kvar. Systemet har 100, och dörren kostar 35 att öppna.',
      '- drar bort ett värde från ett annat, precis som i matematiken.'
    ],
    width: 8,
    height: 3,
    tileGrid: parseGrid(['########', '#S..D.G#', '########']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['-', 'move()'],
    starterCode:
      'total_energy = 100\ndoor_cost = 35\n\n# Räkna ut hur mycket energi som är kvar.\n\nmove()\nmove()\nmove()\nmove()\nmove()\n',
    hints: [
      'total_energy är vad systemet har, door_cost är vad dörren kostar.',
      '- drar bort ett värde från ett annat: total_energy - door_cost.',
      'Prova:\nremaining_energy = total_energy - door_cost'
    ],
    successTip: 'Samma variabler kan kombineras med olika räknesätt beroende på vad de betyder i sammanhanget.',
    showConsole: true,
    showVariables: true,
    doorCondition: { variable: 'remaining_energy', op: '==', value: 65 },
    successCheck: (ctx) => pickNumeric(ctx.variables, ctx.consoleLines, ['remaining_energy']) === 65
  },
  {
    id: 4,
    world: 'kontrollcentralen',
    type: 'robot',
    title: 'Rum 3 — Bron',
    concept: 'multiplikation (*)',
    objective: 'Räkna ut hur lång bron blir så att byggsystemet kan lägga ut den.',
    intro: [
      'Golvet framför dig saknas — en klyfta delar rummet i två. Byggsystemet lägger ut brodelar automatiskt så fort det vet totallängden.',
      'Varje del är 2 meter, och du behöver 4 delar. * multiplicerar två tal.'
    ],
    width: 8,
    height: 3,
    tileGrid: parseGrid(['########', '#S.DD.G#', '########']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['*', 'move()'],
    starterCode:
      'part_length = 2\nparts_needed = 4\n\n# Räkna ut hur lång bron blir totalt.\n\nmove()\nmove()\nmove()\nmove()\nmove()\n',
    hints: [
      'part_length är längden på en del, parts_needed är hur många som behövs.',
      '* multiplicerar: part_length * parts_needed.',
      'Prova:\nbridge_length = part_length * parts_needed'
    ],
    successTip: 'Multiplikation är ett snabbt sätt att räkna ihop flera lika stora mängder, till exempel brodelar.',
    showConsole: true,
    showVariables: true,
    doorCondition: { variable: 'bridge_length', op: '==', value: 8 },
    successCheck: (ctx) => pickNumeric(ctx.variables, ctx.consoleLines, ['bridge_length']) === 8
  },
  {
    id: 5,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'backpack',
    title: 'Packa ryggsäcken',
    concept: 'variabler',
    objective: 'Packa ryggsäcken med 3 äpplen och 2 vattenflaskor.',
    intro: [
      'Innan roboten går vidare in i anläggningen behöver den packas.',
      'En variabel är ett namn som pekar på ett värde — namnet kan vara vad du vill, och värdet representerar något i spelvärlden.'
    ],
    ...NO_GRID,
    availableCommands: ['variabel = tal (int)'],
    starterCode: '# Skapa två variabler: apples och water.\n',
    hints: [
      'En variabel skapas genom att skriva ett namn, ett likhetstecken, och ett värde: namn = värde.',
      'Skapa apples med värdet 3, och water med värdet 2.',
      'Prova:\napples = 3\nwater = 2'
    ],
    successTip: 'En variabel är som en namngiven låda: apples pekar på talet 3, water pekar på talet 2.',
    showVariables: true,
    successCheck: (ctx) => ctx.variables.apples === 3 && ctx.variables.water === 2
  },
  {
    id: 6,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'rocket',
    title: 'Bygg raketen',
    concept: 'variabler + operatorer',
    objective: 'Räkna ut den totala mängden bränsle i raketens tre tankar.',
    intro: [
      'Raketen har tre bränsletankar. Varje tank rymmer 20 enheter bränsle.',
      'Nu kombinerar du det du lärt dig: variabler och räkneoperatorer i samma program.'
    ],
    ...NO_GRID,
    availableCommands: ['variabler', '*', 'print()'],
    starterCode: 'fuel = 20\nfuel_tanks = 3\n\n# Räkna ut den totala mängden bränsle.\n',
    hints: [
      'fuel är bränsle per tank, fuel_tanks är antalet tankar.',
      'Multiplicera de två variablerna för att få totalen.',
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
    objective: 'Räkna ut hur mycket energi som är kvar, lås upp dörren och ta dig till utgången.',
    intro: [
      'Dags för det första riktiga uppdraget. Roboten börjar med 100 energienheter.',
      'På vägen ut väntar en låst dörr, och sedan en kort sväng till utgången.'
    ],
    width: 6,
    height: 5,
    tileGrid: parseGrid(['######', '#S.D##', '###.##', '###G##', '######']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['variabler', '+', '-', '*', 'move()', 'turn_right()'],
    starterCode:
      'start_energy = 100\n\n# Dörren kostar 20 energi.\n# Roboten gör två rörelser på 15 energi var.\n# Räkna ut hur mycket energi som är kvar.\n\nmove()\nmove()\nturn_right()\nmove()\nmove()\n',
    hints: [
      'Dörren kräver att remaining_energy stämmer exakt, annars förblir den låst.',
      'Dörren kostar 20 energi. De två rörelserna kostar 15 energi var, alltså 15 * 2 totalt.',
      'Dra bort båda kostnaderna från start_energy.',
      'Prova:\nremaining_energy = start_energy - 20 - 15 * 2'
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
