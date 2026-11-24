import { DEBUG_ASSIGNMENTS } from './expeditionDebug'
import type { LevelDefinition, TileKind } from '../types'

// Absolute directions make route data readable, but kor returns the robot's
// new heading: callers must carry that return value between route segments.
const driver = `# Läs hjälpfunktionerna innan du skriver din lösning.
# En rutt är en lista av [riktning, antal steg]. N/E/S/W är väderstreck.
def rikta(target, facing):
    right = {"N": "E", "E": "S", "S": "W", "W": "N"}
    while facing != target:
        turn_right()
        facing = right[facing]
    return facing

def fram(n):
    for i in range(n):
        data = scan()
        if data["blocked"]:
            use_tool(data["tool"], data["power"])
        move()
        if data["kind"] == "resource":
            collect()

def kor(route, facing):
    for leg in route:
        facing = rikta(leg[0], facing)
        fram(leg[1])
    return facing
`

export interface Assignment {
  title: string; concept: string; story: string; instructions: string[]
  // Internal tile coordinates, counting from zero.
  width: number; height: number; start: [number, number]; goal: [number, number]
  corridors: [number, number, string][]
  objects: [number, number, TileKind][]; energy: number
  data: string; starter: string; solution: string; hint: string
  check: NonNullable<LevelDefinition['successCheck']>
}
const assignments: Assignment[] = [
  {
    title: 'Laddleden eller genvägen', concept: 'läsa funktioner, beräkna kostnader och välja rutt',
    story: 'Huvudgången är kort men dyr. Den norra leden går via två laddceller. Läs vad kor() redan gör och välj en rutt som får roboten genom reläet till målet.',
    instructions: [
      'Implementera netto(route): summera steps och tools och dra av 5 per cell. Spara båda resultaten i costs, en dictionary med rutternas namn som nycklar.',
      'Välj den rutt vars nettokostnad ryms inom startenergin 10. Spara namnet i chosen och kör dess path. Skriv inte om hjälpfunktionerna. Förklara ditt val med print().',
      'Alla reläer krävs, men cellerna är valfria. Uppskattad nettokostnad räcker i denna bana; i senare uppdrag måste även energin under färden kontrolleras.'
    ],
    width: 11, height: 6, start: [1, 3], goal: [9, 3],
    corridors: [[1, 3, 'EEEEEEEE'], [3, 3, 'NNEEESS']],
    objects: [[3, 2, 'resource'], [6, 1, 'resource'], [5, 3, 'storm'], [7, 3, 'beacon'], [8, 3, 'rock']], energy: 10,
    data: `routes = {
    "genvagen": {"path": [["E", 8]], "steps": 8, "tools": 8, "cells": 0},
    "laddleden": {"path": [["E", 2], ["N", 2], ["E", 3], ["S", 2], ["E", 3]], "steps": 12, "tools": 4, "cells": 2}
}`,
    starter: `def netto(route):
    return 0  # TODO: beräkna från argumentets data.

costs = {}
chosen = ""
# TODO: jämför rutterna, välj namn och kör den valda rutten.
`,
    solution: `def netto(route):
    return route["steps"] + route["tools"] - 5 * route["cells"]

costs = {}
chosen = ""
for name in routes:
    costs[name] = netto(routes[name])
    if costs[name] <= 10:
        chosen = name
facing = kor(routes[chosen]["path"], "E")
print(chosen, costs[chosen])`,
    hint: 'kor() samlar redan cellerna. Jämför 8 + 8 med 12 + 4 − 10. Verktygen behövs även om rutten har få steg.',
    check: c => c.variables.chosen === 'laddleden' && (c.variables.costs as Record<string, unknown>)?.genvagen === 16 && (c.variables.costs as Record<string, unknown>)?.laddleden === 6
  },
  {
    title: 'Service med återresa', concept: 'parametrar, returvärden och nästlade uppdragsdata',
    story: 'Två reläer ligger i sidogångar. Cellerna där behövs för återresan och stenen vid utgången. En förbindelse söderut ser lockande ut, men dess storm kostar extra energi.',
    instructions: [
      'Börja med kor([["E", 2]], "E"). Då står du vid första korsningen. Läs jobs: out går till reläet, back går tillbaka och next leder till nästa korsning eller målet.',
      'Skriv service(job, facing) som kör out, back och next i den ordningen och returnerar slutriktningen. Uppdatera facing efter varje kor-anrop, även inne i funktionen.',
      'Loopa över jobs och använd returvärdet från service vid nästa anrop. Räkna slutförda servicebesök i done. Alla reläer krävs; planera både ditväg och hemväg.'
    ],
    width: 11, height: 8, start: [1, 4], goal: [9, 4],
    corridors: [[1, 4, 'EEEEEEEE'], [3, 4, 'NNN'], [3, 4, 'SSEEENN']],
    objects: [[3, 3, 'beacon'], [3, 2, 'resource'], [3, 1, 'resource'], [6, 5, 'resource'], [6, 6, 'beacon'], [4, 6, 'storm'], [8, 4, 'rock']], energy: 10,
    data: `jobs = [
    {"name": "norra", "out": [["N", 3]], "back": [["S", 3]], "next": [["E", 3]]},
    {"name": "sodra", "out": [["S", 2]], "back": [["N", 2]], "next": [["E", 3]]}
]`,
    starter: `def service(job, facing):
    # TODO: använd job och uppdatera riktningen genom hela besöket.
    return facing

done = 0
# TODO: gå till första korsningen och utför båda servicebesöken.
`,
    solution: `def service(job, facing):
    for part in ["out", "back", "next"]:
        facing = kor(job[part], facing)
    return facing

done = 0
facing = kor([["E", 2]], "E")
for job in jobs:
    facing = service(job, facing)
    done = done + 1
print("Servicebesok:", done)`,
    hint: 'En funktion ändrar inte anroparens facing automatiskt. Använd facing = kor(...) och facing = service(...). Den södra förbindelsen är en alternativ väg, inte en nödvändig del av jobs.',
    check: c => c.variables.done === 2
  },
  ...DEBUG_ASSIGNMENTS
]

export const ADVANCED_EXPEDITION_LEVELS: LevelDefinition[] = assignments.map((m, index) => {
  const grid = Array.from({length:m.height}, () => Array<TileKind>(m.width).fill('wall'))
  for (const [sx, sy, path] of m.corridors) {
    let x = sx, y = sy
    grid[y][x] = 'empty'
    for (const d of path) {
      x += d === 'E' ? 1 : d === 'W' ? -1 : 0
      y += d === 'S' ? 1 : d === 'N' ? -1 : 0
      grid[y][x] = 'empty'
    }
  }
  for (const [x,y,kind] of m.objects) grid[y][x] = kind
  grid[m.goal[1]][m.goal[0]] = 'goal'
  return {
    // New debugging assignments must not inherit completion of the replaced levels.
    id: index < 2 ? 94 + index : 96 + index, world:'expeditionen', type:'robot', title:m.title, concept:m.concept,
    objective:m.story, instructions:m.instructions,
    commandHelp:[{code:'kor(route, facing) → facing', description:'Kör en rutt, hanterar verktyg och samlar celler. Spara returvärdet inför nästa rutt. Celler är valfria i dessa fyra uppdrag; alla reläer krävs.'}],
    width:m.width, height:m.height, tileGrid:grid,
    playerStart:{x:m.start[0], y:m.start[1], direction:'right'}, expedition:{energy:m.energy},
    requireAllResources:false, requireFunctionDef:true, requireForLoop:true,
    starterCode:`# Expedition ${13+index}: ${m.title}\n${m.data}\n\n${driver}\n${m.starter}`,
    hints:[m.hint, 'Läs kor() och fram() rad för rad. Svängarna kostar ingen energi. Varje cell kan bara samlas en gång. Kontrollera alltid energin före nästa hinder.', `Prova:\n${m.data}\n${driver}\n${m.solution}`],
    availableCommands:['scan()', 'use_tool(name, power)', 'move()', 'turn_right()', 'collect()', 'at_goal()'],
    showVariables:true, showConsole:true,
    successTip:'Serviceuppdraget är klart! Du har kopplat ihop kodens data, robotens riktning och energin längs rutten.',
    successCheck:c => c.ranWithoutError && m.check(c)
  }
})
