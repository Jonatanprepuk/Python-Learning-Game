import { ADVANCED_EXPEDITION_LEVELS } from './expeditionAdvanced'
import type { LevelDefinition, TileKind } from '../types'

const manual = `Stå på rutan direkt före hindret och vänd roboten mot det. use_tool("drill", 3) borrar sten, use_tool("bridge", 2) bygger bro, use_tool("shield", 4) säkrar storm och use_tool("repair", 1) reparerar relä. Första argumentet är verktygets namn inom citattecken, det andra är dess effekt som ett tal. Verktyget flyttar inte roboten: använd move() efteråt. Ett steg kostar 1 energi, ett verktyg sin effekt. collect() på en gul cell ger +5. Nå det gröna målet, samla banans celler och reparera dess reläer.`
const pilot = `# Färdig hjälpfunktion: gå n steg, hantera hinder och samla celler.
# Anropa fram(n) i din lösning. Du behöver inte ändra funktionen.
def fram(n):
    for i in range(n):
        data = scan()
        if data["blocked"]:
            use_tool(data["tool"], data["power"])
        move()
        if data["kind"] == "resource":
            collect()
`
const toolHelp = { code: 'use_tool("drill", 3)', description: 'Borrar stenen framför roboten. "drill" är verktygets namn och 3 är effekten. Roboten står kvar; move() går sedan fram.' }
const scanHelp = { code: 'data = scan()', description: 'Läser rutan framför roboten. data["blocked"] är True för ett verktygshinder; data["tool"] och data["power"] anger rätt verktyg och effekt.' }
const pilotHelp = { code: 'fram(n)', description: 'Den färdiga funktionen går n steg i nuvarande riktning, använder rätt verktyg och samlar eventuella celler. Svängar skriver du separat.' }
interface Mission {
  title: string; concept: string; story: string; path: string; objects: Record<number, TileKind>; energy: number
  setup: string; starter: string; solution: string; hint: string; instructions: string[]
  help: NonNullable<LevelDefinition['commandHelp']>; fn?: boolean; loop?: 'for' | 'while'; input?: boolean
}
// Compass routes author the terrain, not the player's program. Index 1 is the
// first tile after the landing site. Every layout is checked by the test suite.
const missions: Mission[] = [
  { title: 'Första borrningen', concept: 'variabler, matematik och ett verktygsanrop',
    story: 'En sten blockerar vägen till baslägret. Din uppgift är att beräkna borrens effekt. Robotens färd är redan skriven.',
    instructions: ['Ersätt 0 på raden power = 0 med cell_a + cell_b.', 'Läs anropet use_tool("drill", power): det använder din beräknade effekt. Kör koden och följ roboten till det gröna målet.'],
    help: [toolHelp], path: 'RRRRUU', objects: { 2: 'rock' }, energy: 12,
    setup: 'cell_a = 1\ncell_b = 2',
    starter: 'power = 0  # TODO: beräkna cell_a + cell_b\n\n# Färdig färd: stå framför stenen, borra och gå till målet.\nmove()\nuse_tool("drill", power)\nmove()\nmove()\nmove()\nturn_left()\nmove()\nmove()',
    solution: 'power = cell_a + cell_b\nmove()\nuse_tool("drill", power)\nmove()\nmove()\nmove()\nturn_left()\nmove()\nmove()',
    hint: 'Borrens effekt måste vara 3. Räkna fram den med de två variablerna; verktygsanropet och färden är redan på plats.' },
  { title: 'Scannern i dimman', concept: 'while, if och dictionary från sensorn',
    story: 'Roboten ska följa en rak gång med en sten. Låt sensorn avgöra när borren behövs.',
    instructions: ['Ersätt break i while-loopen med: läs scan() till data och kontrollera data["blocked"] med if.', 'Inuti if: anropa use_tool(data["tool"], data["power"]). Efter if: anropa move() så att roboten alltid tar nästa steg.'],
    help: [scanHelp], path: 'RRRRRRR', objects: { 2: 'rock' }, energy: 14, setup: '', loop: 'while',
    starter: 'while not at_goal():\n    # TODO: läs sensorn, åtgärda eventuellt hinder och gå ett steg.\n    break  # Ta bort när du fyller i loopens innehåll.',
    solution: 'while not at_goal():\n    data = scan()\n    if data["blocked"]:\n        use_tool(data["tool"], data["power"])\n    move()',
    hint: 'move() ska ligga på samma indragsnivå som if. Då går roboten också när sensorn ser en tom ruta.' },
  { title: 'Radiokodad rutt', concept: 'input, strängar, listor, for och elif',
    story: 'Basen har redan planerat rutten. Översätt dess bokstäver till robotkommandon. Här finns inga verktygshinder.',
    instructions: ['Behåll input och print. Skriv ditt anropsnamn när programmet frågar.', 'Ersätt pass i for-loopen med if/elif/else: F ger move(), V ger turn_left() och H ger turn_right().'],
    help: [{ code: 'turn_left() / turn_right()', description: 'Vrider roboten ett kvarts varv utan att flytta den. F betyder ett steg i den riktning roboten nu pekar.' }],
    path: 'RRDDRRU', objects: {}, energy: 12, input: true, loop: 'for',
    setup: 'route = ["F", "F", "H", "F", "F", "V", "F", "F", "V", "F"]',
    starter: 'name = input("Anropsnamn: ")\nprint("Expedition " + name)\nfor command in route:\n    pass  # TODO: välj rörelse utifrån command.',
    solution: 'name = input("Anropsnamn: ")\nprint("Expedition " + name)\nfor command in route:\n    if command == "F":\n        move()\n    elif command == "H":\n        turn_right()\n    else:\n        turn_left()',
    hint: 'Jämför med strängar, till exempel command == "F". En bokstav ska ge exakt ett robotkommando.' },
  { title: 'Sista batteristrecket', concept: 'villkor och insamling',
    story: 'Robotens 5 energi räcker inte hela vägen. Ett enda laddstopp före bron räcker. Resten av färden är förberedd.',
    instructions: ['Läs if-satsen: roboten går fram om det ligger en cell framför den.', 'Lägg collect() på den markerade raden inne i if-satsen. Kör färden och kontrollera hur energin ändras.'],
    help: [{ code: 'collect()', description: 'Samlar den gula cellen när roboten står på den och ger 5 energi. use_tool("bridge", 2) bygger sedan bron framför roboten.' }],
    path: 'RRRDDDD', objects: { 2: 'resource', 3: 'gap' }, energy: 5, setup: '',
    starter: 'move()\nif resource_ahead():\n    move()\n    # TODO: samla cellen här, innan roboten bygger bron.\n\n# Färdig färd till målet.\nuse_tool("bridge", 2)\nmove()\nturn_right()\nfor i in range(4):\n    move()',
    solution: 'move()\nif resource_ahead():\n    move()\n    collect()\nuse_tool("bridge", 2)\nmove()\nturn_right()\nfor i in range(4):\n    move()',
    hint: 'Använd collect() efter move() inne i if-satsen. Bron kostar 2 energi och hela färden 7; med cellen får du totalt 10.' },
  { title: 'Stormutrustningen', concept: 'dictionary, beräkningar och for',
    story: 'Två stormfält ligger på vägen till väderstationen. Färden och sensorkontrollen är skrivna; du ska koppla in skölden.',
    instructions: ['Ersätt pass med ett use_tool-anrop. Hämta verktygsnamnet från gear["tool"].', 'Använd gear["base"] + gear["boost"] som effekt. Behåll resten av färden.'],
    help: [{ code: 'use_tool("shield", 4)', description: 'Säkrar ett stormfält framför roboten. I uppgiften ska du hämta namnet och beräkna effekten från gear.' }],
    path: 'RRRRRUUU', objects: { 2: 'storm', 4: 'storm' }, energy: 22, loop: 'for',
    setup: 'gear = {"tool": "shield", "base": 2, "boost": 2}',
    starter: 'for i in range(5):\n    data = scan()\n    if data["blocked"]:\n        pass  # TODO: använd skölden med värden från gear.\n    move()\nturn_left()\nfor i in range(3):\n    move()',
    solution: 'for i in range(5):\n    data = scan()\n    if data["blocked"]:\n        use_tool(gear["tool"], gear["base"] + gear["boost"])\n    move()\nturn_left()\nfor i in range(3):\n    move()',
    hint: 'use_tool tar två argument. Det andra kan vara en beräkning; 2 + 2 ger den effekt skölden behöver.' },
  { title: 'Robotens verktygsväljare', concept: 'funktion med returvärde, if och while',
    story: 'Samla sensorkontrollen i funktionen sakra(). Den ska göra rutan framför roboten säker och berätta om roboten kan gå.',
    instructions: ['Fyll i sakra(): läs scan(), använd rätt verktyg om data["blocked"] är True och returnera can_move().', 'Ersätt break längst ned med if sakra(): följt av move() inne i if-satsen.'],
    help: [scanHelp, { code: 'return can_move()', description: 'Returnerar True om roboten kan gå framåt. Funktionen sakra() ska säkra vägen, men själva move() ligger i loopen.' }],
    path: 'UUUUUU', objects: { 1: 'rock', 3: 'storm' }, energy: 20, setup: '', fn: true, loop: 'while',
    starter: 'def sakra():\n    # TODO: läs sensorn och använd verktyg vid behov.\n    return False  # TODO: returnera can_move() i stället.\n\nturn_left()\nwhile not at_goal():\n    break  # TODO: gå ett steg om sakra() returnerar True.',
    solution: 'def sakra():\n    data = scan()\n    if data["blocked"]:\n        use_tool(data["tool"], data["power"])\n    return can_move()\n\nturn_left()\nwhile not at_goal():\n    if sakra():\n        move()',
    hint: 'Returnera värdet efter if-satsen, så att funktionen också ger ett svar när rutan redan är fri.' },
  { title: 'Servicekonvojen', concept: 'lista av dictionaries och funktionsanrop',
    story: 'Tre etapper leder till serviceposten. Nu får du en färdig fram(n) som sköter hinder. Din uppgift är att styra etapperna med data.',
    instructions: ['Behåll hjälpfunktionen fram(n). Fyll i for-loopen under den.', 'För varje leg: anropa fram(leg["steps"]) och sväng sedan höger. Funktionen reparerar även reläet längs vägen.'],
    help: [pilotHelp], path: 'RRRDDDLLLL', objects: { 2: 'rock', 8: 'beacon' }, energy: 20, fn: true, loop: 'for',
    setup: 'legs = [{"steps": 3}, {"steps": 3}, {"steps": 4}]\n\n' + pilot,
    starter: 'for leg in legs:\n    pass  # TODO: kör etappen och sväng höger.',
    solution: 'for leg in legs:\n    fram(leg["steps"])\n    turn_right()',
    hint: 'leg är en dictionary. leg["steps"] är antalet steg. En sista högersväng på målet är ofarlig.' },
  { title: 'Två patrullmönster', concept: 'nästlade listor, nästlade loopar och funktioner',
    story: 'Basen skickar två grupper av sträckor. Låt nästlade loopar läsa dem och skicka avstånden till den färdiga rörelsefunktionen.',
    instructions: ['Skriv en for-loop över patterns och en inre for-loop över den aktuella gruppen.', 'För varje avstånd: anropa fram(distance) och därefter turn_right(). Du behöver inte lägga till verktygsanrop.'],
    help: [pilotHelp], path: 'RRRRRDDDLLLU', objects: { 3: 'gap', 9: 'storm' }, energy: 24, fn: true, loop: 'for',
    setup: 'patterns = [[5, 3], [3, 1]]\n\n' + pilot,
    starter: '# TODO: skriv två nästlade for-loopar här.\n# Den inre loopen ska gå en sträcka och svänga höger.',
    solution: 'for pattern in patterns:\n    for distance in pattern:\n        fram(distance)\n        turn_right()',
    hint: 'for pattern in patterns väljer en lista. for distance in pattern väljer ett tal i den listan.' },
  { title: 'Reläräddningen', concept: 'egna funktioner och parametrar',
    story: 'Ett relä i sidogången måste repareras före målet. Huvudrutten är färdig; skriv en funktion för utflykten och återkomsten.',
    instructions: ['Fyll i besok_rela(distance): sväng vänster, gå distance med fram(), vänd helt om och gå samma sträcka tillbaka.', 'Avsluta funktionen med en vänstersväng så att roboten åter pekar åt höger längs huvudgången. Behåll anropen längst ned.'],
    help: [pilotHelp, { code: 'turn_right(); turn_right()', description: 'Två högersvängar vänder roboten helt om. Reläet repareras av fram() när det ligger framför roboten.' }],
    path: 'RRUUDDRRR', objects: { 4: 'beacon' }, energy: 16, fn: true,
    setup: pilot,
    starter: 'def besok_rela(distance):\n    pass  # TODO: färden till reläet och tillbaka.\n\n# Färdig huvudrutt.\nfram(2)\nbesok_rela(2)\nfram(3)',
    solution: 'def besok_rela(distance):\n    turn_left()\n    fram(distance)\n    turn_right()\n    turn_right()\n    fram(distance)\n    turn_left()\n\nfram(2)\nbesok_rela(2)\nfram(3)',
    hint: 'Använd parametern distance både på ditvägen och hemvägen. Två anrop till turn_right() ger en helomvändning.' },
  { title: 'Autopilot genom ruinen', concept: 'while, elif och sensorvillkor',
    story: 'Låt roboten välja svängarna själv genom ruinen. Du får fram(1) för steget och can_move_left() för att undersöka vänster sida.',
    instructions: ['Ersätt break med en if/elif/else-kedja: om can_move() eller scan()["blocked"] är True, anropa fram(1).', 'Annars: sväng vänster om can_move_left() är True; sväng höger i återstående fall. Upprepa tills at_goal().'],
    help: [pilotHelp, { code: 'can_move() or scan()["blocked"]', description: 'True för både fri väg och ett hinder som fram(1) kan ta bort. En vanlig vägg ger False.' }],
    path: 'RRRUUURRRDD', objects: { 2: 'rock', 7: 'gap' }, energy: 22, fn: true, loop: 'while',
    setup: pilot,
    starter: 'while not at_goal():\n    break  # TODO: välj framåt, vänster eller höger med villkor.',
    solution: 'while not at_goal():\n    if can_move() or scan()["blocked"]:\n        fram(1)\n    elif can_move_left():\n        turn_left()\n    else:\n        turn_right()',
    hint: 'Pröva framåt först. Lägg inga extra move() efter fram(1): funktionen går redan ett steg.' },
  { title: 'Signalstegen', concept: 'returvärden, listor, beräkningar och villkor',
    story: 'Tre reläer ska startas. Beräkna först om energin räcker och låt sedan roboten köra den planerade rutten.',
    instructions: ['Fyll i kostnad(plan): summera alla tal i plan["steps"], lägg till plan["relays"] och returnera summan. Varje relä kostar 1 energi.', 'Spara svaret i needed. Om needed <= budget: kör sträckorna med fram() i en for-loop och sväng vänster efter varje sträcka.'],
    help: [pilotHelp, { code: 'return total + plan["relays"]', description: 'Returnerar summan av stegens och reläernas energikostnad. I denna bana finns inga andra hinder eller energiceller.' }],
    path: 'RRRRRRUULL', objects: { 1: 'beacon', 5: 'beacon', 8: 'beacon' }, energy: 16, fn: true, loop: 'for',
    setup: 'plan = {"steps": [6, 2, 2], "relays": 3}\nbudget = 16\n\n' + pilot,
    starter: 'def kostnad(plan):\n    total = 0\n    # TODO: summera sträckorna och returnera total + antalet reläer.\n    return total\n\nneeded = kostnad(plan)\n# TODO: kontrollera budgeten med if och kör sedan rutten med for.',
    solution: 'def kostnad(plan):\n    total = 0\n    for distance in plan["steps"]:\n        total = total + distance\n    return total + plan["relays"]\n\nneeded = kostnad(plan)\nif needed <= budget:\n    for distance in plan["steps"]:\n        fram(distance)\n        turn_left()',
    hint: 'Sträckorna är 6 + 2 + 2 = 10 steg. Tre reläer ger totalt 13 energi. Funktionen ska returnera ett tal, inte skriva ut det.' },
  { title: 'Expeditionens hjärta', concept: 'funktioner, nästlade data, villkor och loopar',
    story: 'Återstarta utpostens nät. Kombinera etapper och svängar från uppdragsdata; den färdiga rörelsefunktionen sköter verktygen och det enda laddstoppet.',
    instructions: ['Loopa över mission["legs"]. Anropa fram() med etappens steps och använd if/elif för turn: V betyder vänster, H höger och STOP ingen sväng.', 'Efter loopen: skriv ut uppdragets name följt av " online". Målet kräver den gula cellen och båda reläerna, som fram() hanterar längs rutten.'],
    help: [pilotHelp],
    path: 'RRRRUUUURRRDDDDRR', objects: { 3: 'rock', 5: 'beacon', 7: 'gap', 9: 'resource', 10: 'storm', 12: 'beacon' }, energy: 28, fn: true, loop: 'for',
    setup: 'mission = {\n    "name": "UTPOST",\n    "legs": [\n        {"steps": 4, "turn": "V"},\n        {"steps": 4, "turn": "H"},\n        {"steps": 3, "turn": "H"},\n        {"steps": 4, "turn": "V"},\n        {"steps": 2, "turn": "STOP"}\n    ]\n}\n\n' + pilot,
    starter: '# TODO: kör etapperna och välj sväng utifrån uppdragsdata.\n# Skriv rapporten efter loopen.',
    solution: 'for leg in mission["legs"]:\n    fram(leg["steps"])\n    if leg["turn"] == "V":\n        turn_left()\n    elif leg["turn"] == "H":\n        turn_right()\nprint(mission["name"] + " online")',
    hint: 'mission["legs"] är en lista av dictionaries. Varje leg har steps och turn. Ingen else behövs: STOP ska inte ge någon sväng.' },

]

export const EXPEDITION_LEVELS: LevelDefinition[] = missions.map<LevelDefinition>((m, index) => {
  let x = 0, y = 0
  const cells = [{ x, y }]
  for (const d of m.path) { x += d === 'R' ? 1 : d === 'L' ? -1 : 0; y += d === 'D' ? 1 : d === 'U' ? -1 : 0; cells.push({ x, y }) }
  const minX = Math.min(...cells.map(p => p.x)) - 1, minY = Math.min(...cells.map(p => p.y)) - 1
  const width = Math.max(...cells.map(p => p.x)) - minX + 2, height = Math.max(...cells.map(p => p.y)) - minY + 2
  const grid: TileKind[][] = Array.from({ length: height }, () => Array<TileKind>(width).fill('wall'))
  cells.forEach(p => { grid[p.y - minY][p.x - minX] = 'empty' })
  Object.entries(m.objects).forEach(([i, tile]) => { const p = cells[Number(i)]; grid[p.y - minY][p.x - minX] = tile })
  grid[y - minY][x - minX] = 'goal'
  return {
    id: 81 + index, world: 'expeditionen', type: 'robot', title: m.title, concept: m.concept,
    objective: m.story, instructions: m.instructions, commandHelp: m.help,
    width, height, tileGrid: grid, playerStart: { x: -minX, y: -minY, direction: 'right' },
    expedition: { energy: m.energy }, requireAllResources: true, requireFunctionDef: m.fn,
    requireForLoop: m.loop === 'for', requireWhileLoop: m.loop === 'while',
    starterCode: `# Expedition ${index + 1}: ${m.title}\n${m.setup}\n\n${m.starter}\n`,
    availableCommands: ['scan()', 'use_tool(name, power)', 'move()', 'turn_left()', 'turn_right()', 'collect()', 'can_move()', 'can_move_left()', 'can_move_right()', 'resource_ahead()', 'at_goal()'],
    hints: [m.hint, manual, `Prova:\n${m.setup}\n${m.solution}`],
    showConsole: true, showVariables: true,
    successTip: index === 11 ? 'Utposten är online! Din robot har navigerat, laddat och återställt nätet med ditt eget program.' : 'Uppdrag klart. Robotens nästa expedition väntar!',
    successCheck: ctx => ctx.ranWithoutError && (!m.input || ctx.usedInput) && (index !== 10 || ctx.variables.needed === 13) && (index !== 11 || ctx.consoleLines.some(line => line.includes('UTPOST online')))
  }
}).concat(ADVANCED_EXPEDITION_LEVELS)
