import type { LevelDefinition, SuccessContext, TestCase, TileKind } from '../types'
import { snapshotEqual } from '../engine/snapshotEqual'

const WORLD = 'robotlabbet'

// Same small ASCII helper as levels.ts (kept local, like the other level
// files, so this module has no import cycle back to levels.ts).
function parseGrid(rows: string[]): TileKind[][] {
  const map: Record<string, TileKind> = { '#': 'wall', '.': 'empty', G: 'goal', S: 'empty' }
  return rows.map((row) => row.split('').map((ch) => map[ch] ?? 'empty'))
}

const NO_GRID: Pick<LevelDefinition, 'width' | 'height' | 'tileGrid' | 'playerStart'> = {
  width: 1,
  height: 1,
  tileGrid: [['empty'] as TileKind[]],
  playerStart: { x: 0, y: 0, direction: 'right' }
}

// Shared by every 'tests' level: all cases must run without error and match
// their expected value (deep-compared, so list/dict returns work too).
function testsSuccessCheck(tests: TestCase[]) {
  return (ctx: SuccessContext) =>
    Boolean(ctx.testResults) &&
    ctx.testResults!.length === tests.length &&
    ctx.testResults!.every((result, index) => result.ok && snapshotEqual(result.value, tests[index].expected))
}

const SENSOR_TESTS: TestCase[] = [
  { description: 'Inga avvikelser: has_error([12, 8, 5])', args: [[12, 8, 5]], expected: false },
  { description: 'En trasig sensor mitt i listan: has_error([12, -1, 5])', args: [[12, -1, 5]], expected: true },
  { description: 'Trasig sensor sist: has_error([3, 4, -1])', args: [[3, 4, -1]], expected: true },
  { description: 'Tom lista utan avläsningar: has_error([])', args: [[]], expected: false },
  { description: 'Flera trasiga sensorer: has_error([-1, 2, -1])', args: [[-1, 2, -1]], expected: true }
]

const IS_SAFE_TESTS: TestCase[] = [
  { description: 'Normal drift: is_safe(45)', args: [45], expected: true },
  { description: 'Precis vid gränsen: is_safe(80)', args: [80], expected: true },
  { description: 'Överhettad: is_safe(95)', args: [95], expected: false },
  { description: 'Mycket kallt: is_safe(-10)', args: [-10], expected: true },
  { description: 'Precis över gränsen: is_safe(81)', args: [81], expected: false }
]

const CLASSIFY_TESTS: TestCase[] = [
  { description: 'Lätt låda: classify(2)', args: [2], expected: 'lätt' },
  { description: 'Medeltung låda: classify(10)', args: [10], expected: 'medel' },
  { description: 'Tung låda: classify(30)', args: [30], expected: 'tung' },
  { description: 'Gränsen nedåt: classify(5)', args: [5], expected: 'medel' },
  { description: 'Gränsen uppåt: classify(20)', args: [20], expected: 'medel' }
]

const LEAP_YEAR_TESTS: TestCase[] = [
  { description: 'Vanligt skottår: is_leap_year(2024)', args: [2024], expected: true },
  { description: 'Vanligt år: is_leap_year(2023)', args: [2023], expected: false },
  { description: 'Sekelår som INTE är skottår: is_leap_year(1900)', args: [1900], expected: false },
  { description: 'Sekelår som ÄR skottår: is_leap_year(2000)', args: [2000], expected: true },
  { description: 'Delbart med 4, men ett sekelår utan skottår: is_leap_year(1800)', args: [1800], expected: false }
]

const COUNT_ERRORS_TESTS: TestCase[] = [
  { description: 'Inga fel: count_errors([5, 8, 2])', args: [[5, 8, 2]], expected: 0 },
  { description: 'Ett fel: count_errors([5, -1, 2])', args: [[5, -1, 2]], expected: 1 },
  { description: 'Flera fel: count_errors([-1, -1, 4, -1])', args: [[-1, -1, 4, -1]], expected: 3 },
  { description: 'Tom lista: count_errors([])', args: [[]], expected: 0 }
]

const TOTAL_WEIGHT_TESTS: TestCase[] = [
  { description: 'Tre lådor: total_weight([2, 5, 3])', args: [[2, 5, 3]], expected: 10 },
  { description: 'En låda: total_weight([7])', args: [[7]], expected: 7 },
  { description: 'Tom lastbil: total_weight([])', args: [[]], expected: 0 },
  { description: 'Med en justering: total_weight([10, -2, 4])', args: [[10, -2, 4]], expected: 12 }
]

const HEAVIEST_TESTS: TestCase[] = [
  { description: 'Tre lådor: heaviest([4, 9, 2])', args: [[4, 9, 2]], expected: 9 },
  { description: 'Alla lika: heaviest([5, 5, 5])', args: [[5, 5, 5]], expected: 5 },
  { description: 'En låda: heaviest([12])', args: [[12]], expected: 12 },
  { description: 'Felvärden (mindre negativt vinner): heaviest([-3, -1, -7])', args: [[-3, -1, -7]], expected: -1 }
]

const TOTAL_TESTS: TestCase[] = [
  { description: 'total(1, 2)', args: [1, 2], expected: 6 },
  { description: 'total(0, 5)', args: [0, 5], expected: 10 },
  { description: 'total(3, 3)', args: [3, 3], expected: 12 },
  { description: 'total(-2, 4)', args: [-2, 4], expected: 4 }
]

const RECURSION_TESTS: TestCase[] = [
  { description: 'Tre lådor: sum_recursive([2, 5, 3])', args: [[2, 5, 3]], expected: 10 },
  { description: 'En låda: sum_recursive([7])', args: [[7]], expected: 7 },
  { description: 'Tom lastbil — basfallet: sum_recursive([])', args: [[]], expected: 0 },
  { description: 'Fler lådor: sum_recursive([1, 2, 3, 4, 5])', args: [[1, 2, 3, 4, 5]], expected: 15 },
  { description: 'Med en justering: sum_recursive([10, -3, 2])', args: [[10, -3, 2]], expected: 9 }
]

export const FUNCTION_LEVELS: LevelDefinition[] = [
  {
    id: 63,
    world: WORLD,
    type: 'terminal',
    title: 'Starta robotlabbet',
    concept: 'funktioner: def och anrop',
    objective:
      'Skapa en funktion som skriver ut ett startmeddelande för robotlabbet. Skriv meddelandet med print() inne i funktionen.',
    ...NO_GRID,
    availableCommands: ['def namn():', 'print()', 'namn()  (anrop)'],
    starterCode:
      '# Skapa en funktion som skriver ut ett startmeddelande för robotlabbet.\n# Skriv meddelandet inne i funktionen med print().\n\ndef starta_labbet():\n    # skriv ditt meddelande här\n\n\nstarta_labbet()  # anropet är redan klart\n',
    hints: [
      'En funktion definieras med def, ett namn och ett kolon. Raden under ska vara indragen.',
      'Skriv din hälsning med print("...") inne i funktionen.',
      'Anropet starta_labbet() längst ner körs varje gång du trycker Kör kod — testa att ändra meddelandet.',
      'Prova:\ndef starta_labbet():\n    print("Robotlabbet online. Alla system redo.")\n\nstarta_labbet()'
    ],
    successTip: 'Du skapade din första egna funktion! def skapar funktionen, och ett anrop med () kör den.',
    requireFunctionDef: true,
    successCheck: (ctx) => ctx.consoleLines.some((line) => line.trim().length > 0)
  },
  {
    id: 64,
    world: WORLD,
    type: 'robot',
    title: 'Trappmönstret',
    concept: 'funktioner tillsammans med while',
    objective:
      'Skapa en funktion steg() som utför mönstret: gå fram, sväng höger, gå fram, sväng vänster. Kör sedan steg() i en while-loop tills roboten når den gröna målrutan.',
    width: 7,
    height: 7,
    tileGrid: parseGrid(['#######', '#S.####', '##..###', '###..##', '####..#', '#####G#', '#######']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['def namn():', 'move()', 'turn_left()', 'turn_right()', 'at_goal()', 'while villkor:'],
    starterCode:
      '# Mönstret är: gå fram, sväng höger, gå fram, sväng vänster.\n# Skriv det inuti en egen funktion.\n\ndef steg():\n    # skriv mönstret här\n\n\n# Kör steg() upprepade gånger tills roboten når målet.\nwhile not at_goal():\n    # anropa steg() här\n',
    hints: [
      'Mönstret är fyra rader inne i steg(): move(), turn_right(), move(), turn_left().',
      'En funktion definieras med def steg(): och körs genom att skriva steg().',
      'Anropa steg() inne i while-loopen, en gång per varv.',
      'Prova:\ndef steg():\n    move()\n    turn_right()\n    move()\n    turn_left()\n\nwhile not at_goal():\n    steg()'
    ],
    successTip: 'En funktion låter dig ge ett helt mönster ett eget namn, och upprepa det med en loop.',
    requireFunctionDef: true,
    requireWhileLoop: true
  },
  {
    id: 65,
    world: WORLD,
    type: 'tests',
    title: 'Sensorkontrollen',
    concept: 'funktioner, listor och return',
    objective:
      'En trasig sensor rapporterar talet -1. Skriv en funktion has_error(readings) som returnerar True om -1 finns med i listan readings, annars False. Funktionen testas automatiskt mot exemplen till vänster.',
    ...NO_GRID,
    availableCommands: ['def namn(parameter):', 'return', 'in', 'listor'],
    starterCode:
      '# En trasig sensor rapporterar -1. Skriv en funktion has_error(readings)\n# som returnerar True om -1 finns med i listan readings, annars False.\n\ndef has_error(readings):\n    # skriv din kod här\n',
    hints: [
      'En funktion kan skicka tillbaka ett värde med return.',
      'Operatorn in kontrollerar om ett värde finns i en lista: -1 in readings.',
      'Ett uttryck som -1 in readings är redan sant eller falskt — det kan returneras direkt.',
      'Prova:\ndef has_error(readings):\n    return -1 in readings'
    ],
    successTip: 'En funktion kan returnera resultatet av en jämförelse direkt — inget if krävs.',
    showConsole: true,
    testFunction: 'has_error',
    tests: SENSOR_TESTS,
    successCheck: testsSuccessCheck(SENSOR_TESTS)
  },
  {
    id: 66,
    world: WORLD,
    type: 'terminal',
    title: 'Hälsa flera robotar',
    concept: 'funktioner med en parameter',
    objective:
      'Skapa en funktion halsa(namn) som tar emot ett namn och skriver ut en hälsning som innehåller det. Anropa den själv för minst två olika robotnamn.',
    ...NO_GRID,
    availableCommands: ['def namn(parameter):', 'print()'],
    starterCode:
      '# Skapa en funktion halsa(namn) som skriver ut en hälsning som innehåller namnet.\n# Anropa den själv för minst två olika robotnamn.\n\ndef halsa(namn):\n    # skriv din hälsning här, använd parametern namn\n',
    hints: [
      'En parameter är ett namn inom parenteserna: def halsa(namn):',
      'Använd parametern i din print()-sats, till exempel print("Hej, " + namn + "!").',
      'Anropa funktionen två gånger, med olika namn varje gång: halsa("ATLAS") och halsa("NOVA").',
      'Prova:\ndef halsa(namn):\n    print("Hej, " + namn + "!")\n\nhalsa("ATLAS")\nhalsa("NOVA")'
    ],
    successTip: 'En parameter låter samma funktion göra olika saker beroende på vad du skickar in.',
    requireFunctionDef: true,
    successCheck: (ctx) => ctx.consoleLines.length >= 2 && new Set(ctx.consoleLines.map((line) => line.trim())).size >= 2
  },
  {
    id: 67,
    world: WORLD,
    type: 'terminal',
    title: 'Beräkna energikostnad',
    concept: 'funktioner med flera parametrar och return',
    objective:
      'Skapa en funktion energikostnad(steg, kostnad_per_steg) som returnerar den totala energikostnaden. Anropa den och skriv ut resultatet.',
    ...NO_GRID,
    availableCommands: ['def namn(a, b):', 'return', '*'],
    starterCode:
      '# Skapa en funktion energikostnad(steg, kostnad_per_steg) som returnerar\n# den totala energikostnaden. Anropa den och skriv ut resultatet.\n\ndef energikostnad(steg, kostnad_per_steg):\n    # returnera steg * kostnad_per_steg\n\n\ntotal = energikostnad(5, 3)\nprint(total)\n',
    hints: [
      'En funktion kan skicka tillbaka ett värde med return.',
      'return steg * kostnad_per_steg räcker.',
      'Testa att ändra siffrorna i anropet — resultatet ska ändras med.',
      'Prova:\ndef energikostnad(steg, kostnad_per_steg):\n    return steg * kostnad_per_steg\n\ntotal = energikostnad(5, 3)\nprint(total)'
    ],
    successTip: 'Ett returvärde kan sparas i en variabel och användas vidare, precis som andra värden.',
    requireFunctionDef: true,
    successCheck: (ctx) => ctx.variables.total === 15
  },
  {
    id: 68,
    world: WORLD,
    type: 'tests',
    title: 'Temperaturkontroll',
    concept: 'funktioner med if/else',
    objective:
      'En sensor är säker om temperaturen är högst 80 grader. Skriv en funktion is_safe(temperature) som returnerar True eller False, med if och else.',
    ...NO_GRID,
    availableCommands: ['def namn(parameter):', 'if/else', '<=', 'return'],
    starterCode:
      '# En sensor är säker om temperaturen är högst 80 grader.\n# Skriv en funktion is_safe(temperature) som returnerar True eller False.\n# Använd if och else.\n\ndef is_safe(temperature):\n    # skriv din kod här\n',
    hints: [
      'Jämför temperature med 80 med <=.',
      'Använd if för det säkra fallet och else för det osäkra, och return i båda grenarna.',
      'Returnera bara True eller False, inget annat.',
      'Prova:\ndef is_safe(temperature):\n    if temperature <= 80:\n        return True\n    else:\n        return False'
    ],
    successTip: 'if/else inuti en funktion låter den välja vilket värde den ska returnera.',
    showConsole: true,
    requireIfStatement: true,
    testFunction: 'is_safe',
    tests: IS_SAFE_TESTS,
    successCheck: testsSuccessCheck(IS_SAFE_TESTS)
  },
  {
    id: 69,
    world: WORLD,
    type: 'tests',
    title: 'Klassificera lådan',
    concept: 'funktioner med if/elif/else och textsvar',
    objective:
      'Klassificera en låda efter vikt i kg: under 5 kg är "lätt", 5 till 20 kg är "medel", över 20 kg är "tung". Skriv en funktion classify(weight) som returnerar rätt text.',
    ...NO_GRID,
    availableCommands: ['def namn(parameter):', 'if/elif/else', 'return "text"'],
    starterCode:
      '# Klassificera en låda efter vikt (i kg):\n# under 5 kg är "lätt", 5 till 20 kg (båda inkluderade) är "medel",\n# över 20 kg är "tung".\n# Skriv en funktion classify(weight) som returnerar rätt sträng.\n\ndef classify(weight):\n    # skriv din kod här\n',
    hints: [
      'Använd if, elif och else för de tre fallen.',
      'Kontrollera weight < 5 först, sedan weight <= 20.',
      'Returnera en av texterna "lätt", "medel" eller "tung" — stavningen måste stämma exakt.',
      'Prova:\ndef classify(weight):\n    if weight < 5:\n        return "lätt"\n    elif weight <= 20:\n        return "medel"\n    else:\n        return "tung"'
    ],
    successTip: 'En funktion kan returnera text precis som den kan returnera tal eller True/False.',
    showConsole: true,
    requireIfStatement: true,
    testFunction: 'classify',
    tests: CLASSIFY_TESTS,
    successCheck: testsSuccessCheck(CLASSIFY_TESTS)
  },
  {
    id: 70,
    world: WORLD,
    type: 'tests',
    title: 'Räkna trasiga sensorer',
    concept: 'funktioner med for-loop och räknare',
    objective:
      'Skriv en funktion count_errors(readings) som räknar hur många gånger talet -1 förekommer i listan readings. Använd en for-loop och en räknare.',
    ...NO_GRID,
    availableCommands: ['def namn(parameter):', 'for värde in lista:', 'if villkor:', 'return'],
    starterCode:
      '# Skriv en funktion count_errors(readings) som räknar hur många gånger\n# talet -1 (en trasig sensor) förekommer i listan readings.\n# Använd en for-loop och en räknare.\n\ndef count_errors(readings):\n    # skriv din kod här\n',
    hints: [
      'Skapa en räknare (till exempel count = 0) innan loopen.',
      'Gå igenom readings med for och kontrollera om varje värde är -1.',
      'Öka räknaren med count = count + 1 när du hittar ett fel. Returnera räknaren sist.',
      'Prova:\ndef count_errors(readings):\n    count = 0\n    for value in readings:\n        if value == -1:\n            count = count + 1\n    return count'
    ],
    successTip: 'En for-loop inuti en funktion kan bearbeta hela listan innan funktionen returnerar ett resultat.',
    showConsole: true,
    requireForLoop: true,
    testFunction: 'count_errors',
    tests: COUNT_ERRORS_TESTS,
    successCheck: testsSuccessCheck(COUNT_ERRORS_TESTS)
  },
  {
    id: 71,
    world: WORLD,
    type: 'tests',
    title: 'Summera lasten',
    concept: 'funktioner med for-loop och summering',
    objective:
      'Skriv en funktion total_weight(items) som summerar alla vikter i listan items. Använd en for-loop och en summeringsvariabel.',
    ...NO_GRID,
    availableCommands: ['def namn(parameter):', 'for värde in lista:', 'return'],
    starterCode:
      '# Skriv en funktion total_weight(items) som returnerar summan av\n# alla tal i listan items. Använd en for-loop.\n\ndef total_weight(items):\n    # skriv din kod här\n',
    hints: [
      'Skapa en summeringsvariabel (till exempel total = 0) innan loopen.',
      'Gå igenom items med for och lägg till varje vikt: total = total + weight.',
      'Returnera total sist, efter loopen.',
      'Prova:\ndef total_weight(items):\n    total = 0\n    for weight in items:\n        total = total + weight\n    return total'
    ],
    successTip: 'Det här kallas ett ackumulatormönster — en variabel som växer fram, ett varv i taget.',
    showConsole: true,
    requireForLoop: true,
    testFunction: 'total_weight',
    tests: TOTAL_WEIGHT_TESTS,
    successCheck: testsSuccessCheck(TOTAL_WEIGHT_TESTS)
  },
  {
    id: 72,
    world: WORLD,
    type: 'tests',
    title: 'Hitta tyngsta lådan',
    concept: 'funktioner, for-loop och jämförelser',
    objective:
      'Skriv en funktion heaviest(items) som hittar det största talet i listan items — utan att använda den inbyggda funktionen max(). Använd en for-loop och en variabel som sparar det största värdet du sett hittills.',
    ...NO_GRID,
    availableCommands: ['def namn(parameter):', 'for värde in lista:', 'if villkor:', 'return'],
    starterCode:
      '# Skriv en funktion heaviest(items) som returnerar det största talet\n# i listan items. Bygg jämförelsen själv med en for-loop — använd\n# inte den inbyggda funktionen max().\n\ndef heaviest(items):\n    # skriv din kod här\n',
    hints: [
      'Börja med largest = items[0] innan loopen.',
      'Gå igenom items med for och jämför varje värde mot largest.',
      'Om värdet är större än largest, spara det nya värdet i largest. Returnera largest sist.',
      'Prova:\ndef heaviest(items):\n    largest = items[0]\n    for value in items:\n        if value > largest:\n            largest = value\n    return largest'
    ],
    successTip: 'Att hitta ett max för hand bygger samma logik som är gömd inuti den inbyggda funktionen max().',
    showConsole: true,
    requireForLoop: true,
    testFunction: 'heaviest',
    tests: HEAVIEST_TESTS,
    successCheck: testsSuccessCheck(HEAVIEST_TESTS)
  },
  {
    id: 73,
    world: WORLD,
    type: 'robot',
    title: 'Stega N steg',
    concept: 'funktioner med en parameter och for-loop',
    objective: 'Skapa en funktion move_n(n) som flyttar roboten n steg framåt med en for-loop. Anropa den med rätt antal steg för att nå målet.',
    width: 8,
    height: 3,
    tileGrid: parseGrid(['########', '#S....G#', '########']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['def namn(parameter):', 'for i in range(n):', 'move()'],
    starterCode:
      '# Skapa en funktion move_n(n) som flyttar roboten n steg framåt med en for-loop.\n# Anropa den med rätt antal steg för att nå målet.\n\ndef move_n(n):\n    # upprepa move() n gånger\n\n\nmove_n(5)\n',
    hints: [
      'En for-loop kan köras exakt n gånger med for i in range(n):.',
      'Lägg move() inuti for-loopen.',
      'Du behöver inte räkna resan själv — move_n(5) är redan skrivet.',
      'Prova:\ndef move_n(n):\n    for i in range(n):\n        move()\n\nmove_n(5)'
    ],
    successTip: 'En parameter kan styra hur många gånger en loop upprepas — samma funktion funkar för alla sträckor.',
    requireFunctionDef: true,
    requireForLoop: true
  },
  {
    id: 74,
    world: WORLD,
    type: 'robot',
    title: 'Mönster med parameter',
    concept: 'funktioner, parametrar och for-loop tillsammans',
    objective:
      'Skapa en funktion trappa(steg) som upprepar mönstret (gå fram, sväng höger, gå fram, sväng vänster) steg gånger med en for-loop. Anropa funktionen med rätt antal steg för att nå målet.',
    width: 8,
    height: 8,
    tileGrid: parseGrid(['########', '#S.#####', '##..####', '###..###', '####..##', '#####..#', '######G#', '########']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['def namn(parameter):', 'for i in range(n):', 'move()', 'turn_left()', 'turn_right()'],
    starterCode:
      '# Skapa en funktion trappa(steg) som upprepar mönstret (gå fram, sväng\n# höger, gå fram, sväng vänster) steg gånger med en for-loop.\n# Anropa funktionen med rätt antal steg för att nå målet.\n\ndef trappa(steg):\n    # upprepa mönstret steg gånger\n\n\ntrappa(5)\n',
    hints: [
      'Mönstret per steg är move(), turn_right(), move(), turn_left().',
      'Lägg de fyra raderna inuti en for-loop som körs steg gånger.',
      'trappa(5) är redan skrivet — du behöver bara fylla i funktionen.',
      'Prova:\ndef trappa(steg):\n    for i in range(steg):\n        move()\n        turn_right()\n        move()\n        turn_left()\n\ntrappa(5)'
    ],
    successTip: 'Nu styr en parameter både mönstret OCH hur många gånger det upprepas.',
    requireFunctionDef: true,
    requireForLoop: true
  },
  {
    id: 75,
    world: WORLD,
    type: 'robot',
    title: 'Patrullera',
    concept: 'funktioner som returnerar ett villkor för en while-loop',
    objective:
      'Skriv en funktion patrullera() som gör ETT steg framåt och returnerar om roboten står på målet. Kör sedan patrullera() upprepade gånger i en while-loop tills den lyckas.',
    width: 7,
    height: 3,
    tileGrid: parseGrid(['#######', '#S...G#', '#######']),
    playerStart: { x: 1, y: 1, direction: 'right' },
    availableCommands: ['def namn():', 'move()', 'at_goal()', 'while villkor:', 'return'],
    starterCode:
      '# Skriv en funktion patrullera() som gör ETT steg framåt och sedan\n# returnerar om roboten står på målet (at_goal()).\n# Kör sedan patrullera() upprepade gånger i en while-loop tills den lyckas.\n\ndef patrullera():\n    # gör ett steg och returnera om roboten är framme\n\n\nwhile not patrullera():\n    pass\n',
    hints: [
      'move() flyttar roboten ett steg.',
      'Returnera resultatet av at_goal() sist i funktionen.',
      'Så länge patrullera() returnerar False fortsätter while-loopen — while-raden och pass är redan skrivna.',
      'Prova:\ndef patrullera():\n    move()\n    return at_goal()\n\nwhile not patrullera():\n    pass'
    ],
    successTip: 'En funktion kan både göra något OCH rapportera tillbaka om det lyckades — det är precis vad ett villkor i en while-loop behöver.',
    requireFunctionDef: true,
    requireWhileLoop: true
  },
  {
    id: 76,
    world: WORLD,
    type: 'terminal',
    title: 'Starta och stoppa',
    concept: 'flera egna funktioner',
    objective:
      'Skapa två funktioner, starta_system() och stoppa_system(), som var och en skriver ut ett eget meddelande. Anropa dem i rätt ordning: starta_system() innan stoppa_system().',
    ...NO_GRID,
    availableCommands: ['def namn():', 'print()'],
    starterCode:
      '# Skapa två funktioner: starta_system() och stoppa_system().\n# Varje funktion ska skriva ut ett eget meddelande.\n# Anropa dem i rätt ordning: starta_system() innan stoppa_system().\n\ndef starta_system():\n    # skriv ett meddelande om att systemet startar\n\n\ndef stoppa_system():\n    # skriv ett meddelande om att systemet stängs av\n\n\nstarta_system()\nstoppa_system()\n',
    hints: [
      'Varje funktion behöver sin egen print()-rad.',
      'Meddelandena ska vara olika — ett för start och ett för stopp.',
      'Anropen längst ner är redan skrivna i rätt ordning.',
      'Prova:\ndef starta_system():\n    print("System igång.")\n\ndef stoppa_system():\n    print("System avstängt.")\n\nstarta_system()\nstoppa_system()'
    ],
    successTip: 'Ett program kan bestå av flera egna funktioner, var och en med sitt eget ansvar.',
    requireFunctionDef: true,
    successCheck: (ctx) => ctx.consoleLines.length === 2 && ctx.consoleLines[0].trim() !== ctx.consoleLines[1].trim()
  },
  {
    id: 77,
    world: WORLD,
    type: 'tests',
    title: 'Hjälpfunktion',
    concept: 'en funktion som anropar en annan funktion',
    objective:
      'Skriv en hjälpfunktion dubbel(x) som returnerar x fördubblat. Skriv sedan total(a, b) som använder dubbel() för båda talen och returnerar summan dubbel(a) + dubbel(b).',
    ...NO_GRID,
    availableCommands: ['def namn(parameter):', 'return', 'anropa en egen funktion'],
    starterCode:
      '# Skriv en hjälpfunktion dubbel(x) som returnerar x * 2.\n# Skriv sedan total(a, b) som använder dubbel() för båda talen\n# och returnerar summan: dubbel(a) + dubbel(b).\n\ndef dubbel(x):\n    # returnera x fördubblat\n\n\ndef total(a, b):\n    # använd dubbel() för a och b, returnera summan\n',
    hints: [
      'dubbel(x) kan vara en enda rad: return x * 2.',
      'Anropa dubbel(a) och dubbel(b) inuti total, och summera resultaten.',
      'total ska returnera ett tal, inte skriva ut något.',
      'Prova:\ndef dubbel(x):\n    return x * 2\n\ndef total(a, b):\n    return dubbel(a) + dubbel(b)'
    ],
    successTip: 'En funktion får gärna anropa en annan funktion — det kallas att bygga med hjälpfunktioner.',
    showConsole: true,
    testFunction: 'total',
    tests: TOTAL_TESTS,
    successCheck: testsSuccessCheck(TOTAL_TESTS)
  },
  {
    id: 78,
    world: WORLD,
    type: 'tests',
    title: 'Skottår',
    concept: 'funktioner, modulo och en känd algoritm',
    objective:
      'Skottårsregeln: ett år är skottår om det går att dela med 4, men INTE om det också går att dela med 100 — om det inte även går att dela med 400, då är det skottår igen. Implementera is_leap_year(year) i Python.',
    ...NO_GRID,
    availableCommands: ['def namn(parameter):', '% (modulo)', 'and / or', 'return'],
    starterCode:
      '# Skottårsregeln:\n#   Ett år är skottår om det går att dela med 4,\n#   MEN om året också går att dela med 100 är det INTE skottår,\n#   OM INTE året även går att dela med 400 — då är det skottår igen.\n#\n# Exempel: 2024 är skottår (delbart med 4, inte med 100).\n#          1900 är INTE skottår (delbart med 100, men inte med 400).\n#          2000 ÄR skottår (delbart med 100 OCH med 400).\n#\n# Skriv en funktion is_leap_year(year) som implementerar regeln ovan\n# och returnerar True eller False.\n\ndef is_leap_year(year):\n    # skriv din kod här\n',
    hints: [
      'Använd % (modulo) för att kontrollera delbarhet: year % 4 == 0 betyder att year går jämnt upp i 4.',
      'Kombinera villkoren med and/or, eller nästla flera if-satser efter varandra.',
      'Ett sätt: året är skottår om (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0).',
      'Prova:\ndef is_leap_year(year):\n    return (year % 4 == 0 and year % 100 != 0) or (year % 400 == 0)'
    ],
    successTip: 'Modulo (%) är verktyget för att testa delbarhet — grunden för många algoritmer, inte bara skottår.',
    showConsole: true,
    testFunction: 'is_leap_year',
    tests: LEAP_YEAR_TESTS,
    successCheck: testsSuccessCheck(LEAP_YEAR_TESTS)
  },
  {
    id: 79,
    world: WORLD,
    type: 'robot',
    title: 'Robotlabbet online',
    concept: 'slutuppdrag: funktioner, parametrar, villkor, loopar och return tillsammans',
    objective:
      'Skriv rapportera_status() utan parametrar som skriver ut ett statusmeddelande, och styr() som väljer riktning med vänsterhandsregeln (precis som i Produktionshallen), gör ett steg och returnerar om roboten är framme. Anropa rapportera_status() en gång och kör sedan styr() i en while-loop tills roboten når målet.',
    width: 5,
    height: 6,
    tileGrid: parseGrid(['#####', '#####', '#G..#', '###.#', '#S..#', '#####']),
    playerStart: { x: 1, y: 4, direction: 'right' },
    availableCommands: [
      'def namn():',
      'print()',
      'if/elif/else',
      'can_move_left()',
      'can_move()',
      'can_move_right()',
      'move()',
      'turn_left()',
      'turn_right()',
      'at_goal()',
      'while villkor:',
      'return'
    ],
    starterCode:
      '# Robotlabbet online! Kombinera allt du lärt dig i den här världen.\n#\n# 1. Skriv rapportera_status() utan parametrar som skriver ut ett\n#    statusmeddelande, och anropa den en gång.\n# 2. Skriv styr() som väljer riktning med vänsterhandsregeln\n#    (precis som i Produktionshallen), gör ETT steg och returnerar\n#    om roboten är framme (at_goal()).\n# 3. Kör styr() i en while-loop tills roboten når målet.\n\ndef rapportera_status():\n    # skriv ett statusmeddelande\n\n\ndef styr():\n    # vänsterhandsregeln: prova vänster, sedan rakt fram, sedan höger\n    # gå ett steg och returnera om du är framme\n\n\nrapportera_status()\nwhile not styr():\n    pass\n',
    hints: [
      'rapportera_status() kan vara en enda print()-rad.',
      'Regeln i styr() är samma som i Produktionshallen: if can_move_left(): turn_left(), elif can_move(): ingenting, elif can_move_right(): turn_right(), annars vänd helt om.',
      'Glöm inte move() och return at_goal() sist i styr().',
      'Prova:\ndef rapportera_status():\n    print("Robotlabbet redo för uppdrag.")\n\ndef styr():\n    if can_move_left():\n        turn_left()\n    elif can_move():\n        pass\n    elif can_move_right():\n        turn_right()\n    else:\n        turn_right()\n        turn_right()\n    move()\n    return at_goal()\n\nrapportera_status()\nwhile not styr():\n    pass'
    ],
    successTip: 'Du har nu kombinerat funktioner, parametrar, villkor, loopar och returvärden i samma uppdrag — precis så byggs riktiga program.',
    showConsole: true,
    requireFunctionDef: true,
    requireIfStatement: true,
    requireWhileLoop: true
  },
  {
    id: 80,
    world: WORLD,
    type: 'tests',
    title: 'Extrauppgift: Rekursion',
    concept: 'rekursion (frivillig bonusuppgift)',
    objective:
      'Frivillig bonusuppgift. En rekursiv funktion anropar sig själv med ett mindre delproblem, tills den når ett bas-fall där den kan svara direkt. Skriv om Summera lasten med rekursion: sum_recursive(items) ska summera listan items, UTAN att använda for eller while.',
    ...NO_GRID,
    availableCommands: ['def namn(parameter):', 'return', 'listskivning: lista[1:]', 'len()'],
    starterCode:
      '# EXTRAUPPGIFT (frivillig): rekursion.\n#\n# En rekursiv funktion anropar sig själv för att lösa ett mindre\n# delproblem, tills den når ett bas-fall där den kan svara direkt\n# utan att anropa sig själv igen.\n#\n# Skriv om Summera lasten med rekursion: sum_recursive(items) ska\n# summera alla tal i listan items, UTAN att använda for eller while.\n#\n# Bas-fall: en tom lista ([]) summerar till 0.\n# Rekursivt fall: det första talet (items[0]) plus summan av\n# resten av listan (items[1:]).\n\ndef sum_recursive(items):\n    # skriv din kod här\n',
    hints: [
      'Bas-fallet är när listan är tom: if len(items) == 0: return 0.',
      'I det rekursiva fallet: items[0] + sum_recursive(items[1:]) — items[1:] är en kortare lista (allt utom det första talet).',
      'Varje anrop jobbar med en kortare lista, tills den tomma listan nås — det är så rekursionen tar slut.',
      'Prova:\ndef sum_recursive(items):\n    if len(items) == 0:\n        return 0\n    return items[0] + sum_recursive(items[1:])'
    ],
    successTip: 'Rekursion löser samma problem som en loop, men låter funktionen anropa sig själv med ett mindre problem varje gång istället.',
    showConsole: true,
    forbidLoops: true,
    testFunction: 'sum_recursive',
    tests: RECURSION_TESTS,
    successCheck: testsSuccessCheck(RECURSION_TESTS)
  }
]
