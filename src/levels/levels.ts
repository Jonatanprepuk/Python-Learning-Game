import type { LevelDefinition, SnapshotValue, TileKind } from '../types'

// Non-"robot" levels don't need a grid, but LevelDefinition keeps
// tileGrid/playerStart required so the shared session/world-state plumbing
// doesn't need to branch on level type.
const NO_GRID: Pick<LevelDefinition, 'width' | 'height' | 'tileGrid' | 'playerStart'> = {
  width: 1,
  height: 1,
  tileGrid: [['empty'] as TileKind[]],
  playerStart: { x: 0, y: 0, direction: 'right' }
}

function asNumber(v: SnapshotValue | undefined): number | null {
  return typeof v === 'number' ? v : null
}

export const WORLDS: { id: string; title: string }[] = [{ id: 'kontrollcentralen', title: 'Kontrollcentralen' }]

export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'screen',
    title: 'Starta kontrollcentralen',
    concept: 'print() och strängar',
    objective: 'Få den stora skärmen att visa SYSTEM ONLINE.',
    intro: [
      'Du har kommit fram till en övergiven teknisk anläggning. Kontrollrummet är mörkt och tyst.',
      'Den stora skärmen väntar på sitt startmeddelande.'
    ],
    ...NO_GRID,
    availableCommands: ['print()', '"text" (str)'],
    starterCode: 'print("SYSTEM OFFLINE")\n',
    hints: [
      'Texten som ska visas står mellan citattecken: " ".',
      'Ändra texten SYSTEM OFFLINE till SYSTEM ONLINE.',
      'Prova:\nprint("SYSTEM ONLINE")'
    ],
    successTip: 'print() skriver ut exakt den text du ger den, tecken för tecken.',
    showConsole: true,
    successCheck: (ctx) => ctx.consoleLines.some((line) => line.trim() === 'SYSTEM ONLINE')
  },
  {
    id: 2,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'nametag',
    title: 'Ge roboten ett namn',
    concept: 'variabler och str',
    objective: 'Registrera robotens anropsnamn som NOVA.',
    intro: [
      'I ett hörn av kontrollrummet vaknar en robot i sin laddstation. Namnskylten på bröstet är tom: ???',
      'En variabel är ett namn som pekar på ett värde – just nu pekar robot_name på fel text.'
    ],
    ...NO_GRID,
    availableCommands: ['variabel = "text" (str)', 'print()'],
    starterCode: 'robot_name = "Okänd"\nprint(robot_name)\n',
    hints: [
      'robot_name är en variabel av typen str (text) – den innehåller just nu fel namn.',
      'Ändra värdet mellan citattecknen till NOVA.',
      'Prova:\nrobot_name = "NOVA"\nprint(robot_name)'
    ],
    successTip: 'En variabel är som en namngiven låda: robot_name pekar på texten "NOVA".',
    showConsole: true,
    showVariables: true,
    successCheck: (ctx) => ctx.variables.robot_name === 'NOVA'
  },
  {
    id: 3,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'battery',
    title: 'Ladda batteriet',
    concept: 'int och numeriska variabler',
    objective: 'Ladda NOVA till 75 energienheter.',
    intro: [
      'NOVA står kvar i laddstationen. En stor batterimätare visar bara 20%.',
      'Uppdraget kräver minst 75 energienheter innan roboten får lämna stationen.'
    ],
    ...NO_GRID,
    availableCommands: ['variabel = tal (int)', 'print()'],
    starterCode: 'energy = 20\nprint(energy)\n',
    hints: [
      'energy är en variabel av typen int (heltal) – just nu har den fel värde.',
      'Ändra 20 till 75.',
      'Prova:\nenergy = 75\nprint(energy)'
    ],
    successTip: 'int är Pythons typ för heltal. Du kan ändra en variabels värde bara genom att tilldela den ett nytt.',
    showConsole: true,
    showVariables: true,
    successCheck: (ctx) => ctx.variables.energy === 75
  },
  {
    id: 4,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'speed-gauge',
    title: 'Kalibrera hastigheten',
    concept: 'float och decimaltal',
    objective: 'Kalibrera NOVA:s motorer till hastigheten 2.5.',
    intro: [
      'NOVA rullas ut på en testbana. En holografisk hastighetsmätare visar motorernas kalibrering.',
      'Testprotokollet kräver exakt 2.5 meter per sekund.'
    ],
    ...NO_GRID,
    availableCommands: ['variabel = tal (float)', 'print()'],
    starterCode: 'speed = 1\nprint(speed)\n',
    hints: [
      'speed behöver bli ett decimaltal, inte ett heltal.',
      'Decimaltal i Python skrivs med punkt, till exempel 2.5.',
      'Prova:\nspeed = 2.5\nprint(speed)'
    ],
    successTip: 'När ett tal innehåller decimaler används typen float, till exempel 2.5 eller 3.14.',
    showConsole: true,
    showVariables: true,
    successCheck: (ctx) => ctx.variables.speed === 2.5
  },
  {
    id: 5,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'antenna',
    title: 'Aktivera kommunikationssystemet',
    concept: 'bool – True och False',
    objective: 'Slå på satellitlänken.',
    intro: [
      'En kommunikationspanel visar SATELLITLÄNK: FRÅNKOPPLAD. Antennen ligger nedfälld.',
      'bool har bara två värden: True och False.'
    ],
    ...NO_GRID,
    availableCommands: ['variabel = True/False (bool)', 'print()'],
    starterCode: 'communication_online = False\nprint(communication_online)\n',
    hints: [
      'communication_online är en bool – ett sanningsvärde som bara kan vara True eller False.',
      'Just nu är länken avstängd (False). Slå på den istället.',
      'Prova:\ncommunication_online = True\nprint(communication_online)'
    ],
    successTip: 'bool representerar bara två tillstånd: True (på) och False (av).',
    showConsole: true,
    showVariables: true,
    successCheck: (ctx) => ctx.variables.communication_online === true
  },
  {
    id: 6,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'cargo',
    title: 'Fyll energilagret',
    concept: 'variabler + addition',
    objective: 'Registrera leveransen korrekt: 4 befintliga celler och 3 nya.',
    intro: [
      'Energilagret innehåller 4 energiceller. En transportdrönare levererar 3 till.',
      'Koden registrerar just nu fel antal nya celler – lagersystemet räknar fel.'
    ],
    ...NO_GRID,
    availableCommands: ['variabler', '+'],
    starterCode: 'stored_cells = 4\nnew_cells = 2\n\ntotal_cells = stored_cells + new_cells\n\nprint(total_cells)\n',
    hints: [
      'Leveransen innehöll 3 nya celler, inte 2 – new_cells har fel värde.',
      'stored_cells ska vara oförändrad (4); det är bara new_cells som behöver rättas.',
      'Prova:\nstored_cells = 4\nnew_cells = 3\n\ntotal_cells = stored_cells + new_cells\n\nprint(total_cells)'
    ],
    successTip: 'Du kan lagra resultatet av en uträkning i en ny variabel: total_cells = stored_cells + new_cells.',
    showConsole: true,
    showVariables: true,
    successCheck: (ctx) => ctx.variables.stored_cells === 4 && ctx.variables.new_cells === 3 && ctx.variables.total_cells === 7
  },
  {
    id: 7,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'fuel-gauge',
    title: 'Beräkna bränslet efter resan',
    concept: 'subtraktion',
    objective: 'Räkna ut hur mycket bränsle som är kvar efter resan.',
    intro: [
      'En expeditionsfarkost återvänder. Den hade 90 liter bränsle och förbrukade 30 liter under resan.',
      'Beräkningen i kontrollsystemet ger ett omöjligt resultat – något är fel i logiken, inte i syntaxen.'
    ],
    ...NO_GRID,
    availableCommands: ['variabler', '-'],
    starterCode: 'fuel_before = 90\nfuel_used = 30\n\nfuel_left = fuel_before + fuel_used\n\nprint(fuel_left)\n',
    hints: [
      'Kör koden. Bränslemätaren skulle behöva visa mer bränsle än farkosten någonsin hade – det är fel.',
      'Förbrukat bränsle ska dras bort, inte läggas till.',
      'Prova:\nfuel_left = fuel_before - fuel_used'
    ],
    successTip: 'Samma variabler kan kombineras med olika räknesätt beroende på vad de faktiskt betyder – här behövdes - istället för +.',
    showConsole: true,
    showVariables: true,
    successCheck: (ctx) => ctx.variables.fuel_left === 60
  },
  {
    id: 8,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'message-relay',
    title: 'Bygg robotens statusmeddelande',
    concept: 'str(), text + tal',
    objective: 'Skicka ett statusmeddelande utan att kraschen upprepas.',
    intro: [
      'NOVA:s kommunikationspanel ska skicka en statusrapport till kontrollcentralen.',
      'Systemet kraschar just nu när det försöker kombinera text och ett tal direkt.'
    ],
    ...NO_GRID,
    availableCommands: ['str()', '+'],
    starterCode: 'robot_name = "NOVA"\nenergy = 75\n\nmessage = robot_name + " har " + energy + "% energi"\n\nprint(message)\n',
    hints: [
      'Kör koden och läs felmeddelandet noga – vilka två typer krockar?',
      'energy är ett tal (int), inte text (str). Python kan inte klistra ihop text och tal med +.',
      'Gör om talet till text med str(energy) innan du kombinerar det med resten av meddelandet.',
      'Prova:\nmessage = robot_name + " har " + str(energy) + "% energi"'
    ],
    successTip: 'str() gör om nästan vilket värde som helst till text, så att det går att kombinera med + och andra strängar.',
    showConsole: true,
    showVariables: true,
    successCheck: (ctx) => ctx.variables.message === 'NOVA har 75% energi'
  },
  {
    id: 9,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'operator-card',
    title: 'Registrera operatören',
    concept: 'input()',
    objective: 'Fråga operatören vad hen heter istället för att gissa.',
    intro: [
      'Kontrollcentralen kräver nu att en mänsklig operatör loggar in. Skärmen visar: OPERATÖR SAKNAS.',
      'input() låter programmet fråga spelaren om något, och vänta på ett svar.'
    ],
    ...NO_GRID,
    availableCommands: ['input()', 'variabler', 'print()'],
    starterCode: 'name = "Okänd"\n\nprint("Välkommen " + name)\n',
    hints: [
      'Systemet ska inte ha ett förbestämt namn – be istället operatören skriva in det.',
      'input("Vad heter du? ") pausar programmet, visar frågan, och returnerar det operatören skriver.',
      'Prova:\nname = input("Vad heter du? ")\n\nprint("Välkommen " + name)'
    ],
    successTip: 'input() pausar programmet och väntar på ett svar från spelaren – svaret kommer alltid som en str.',
    showConsole: true,
    showVariables: true,
    successCheck: (ctx) => ctx.usedInput && typeof ctx.variables.name === 'string' && ctx.variables.name.trim().length > 0
  },
  {
    id: 10,
    world: 'kontrollcentralen',
    type: 'scene',
    visualScene: 'charging-station',
    title: 'Laddstationen',
    concept: 'input() + typkonvertering + addition',
    objective: 'Reparera laddstationen så att den kan beräkna NOVA:s nya energinivå.',
    intro: [
      'NOVA står vid en laddstation med 35% energi kvar. Stationen frågar hur mycket som ska laddas.',
      'Det här uppdraget kräver allt du lärt dig hittills i Kontrollcentralen.'
    ],
    ...NO_GRID,
    availableCommands: ['input()', 'int()', '+'],
    starterCode:
      'energy = 35\n\ncharge = input("Hur mycket energi vill du ladda? ")\n\nnew_energy = energy + charge\n\nprint("Ny energinivå:", new_energy)\n',
    hints: [
      'Kom ihåg att input() alltid ger dig text, oavsett vad operatören skriver.',
      'Du behöver ett tal för att kunna addera det till energy.',
      'Funktionen int() kan göra om till exempel "25" till talet 25.',
      'Prova:\nenergy = 35\ncharge = int(input("Hur mycket energi vill du ladda? "))\nnew_energy = energy + charge\nprint("Ny energinivå:", new_energy)'
    ],
    successTip: 'Genom att kombinera input(), int() och vanlig addition kan du bygga ett litet program som faktiskt reagerar på vad operatören skriver.',
    showConsole: true,
    showVariables: true,
    successCheck: (ctx) => {
      if (!ctx.usedInput) return false
      const energy = asNumber(ctx.variables.energy)
      const newEnergy = asNumber(ctx.variables.new_energy)
      const charge = ctx.variables.charge
      if (energy === null || newEnergy === null) return false
      const chargeAsInt = parseInt(String(charge ?? ''), 10)
      if (Number.isNaN(chargeAsInt)) return false
      return newEnergy === energy + chargeAsInt
    }
  }
]

export function getLevel(id: number): LevelDefinition | undefined {
  return LEVELS.find((l) => l.id === id)
}
