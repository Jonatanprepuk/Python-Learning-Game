import type { LevelDefinition, SnapshotValue } from '../types'

interface Exercise {
  title: string
  concept: string
  objective: string
  setup: string
  solution: string
  expected: Record<string, SnapshotValue>
  hint: string
  tip: string
}

const exercises: Exercise[] = [
  {
    title: 'Väck vaktpanelen', concept: 'if och ==',
    objective: 'Kontrollcentralen är igång! Väck nu säkerhetssystemet. Om power är 1 ska du sätta panel_on till True med en if-sats.',
    setup: 'power = 1\npanel_on = False',
    solution: 'if power == 1:\n    panel_on = True', expected: { power: 1, panel_on: true },
    hint: '== jämför två värden. = tilldelar ett värde. Skriv if power == 1: och därefter panel_on = True på en ny rad med fyra mellanslags indrag.',
    tip: 'if kör sitt indragna kodblock när villkoret är sant. True och False är Pythons booleska värden.'
  },
  {
    title: 'Kontrollera passerkoden', concept: 'if och == med text',
    objective: 'Roboten hittar sitt passerkort. Om access_code är "NOVA" ska door_open bli True.',
    setup: 'access_code = "NOVA"\ndoor_open = False',
    solution: 'if access_code == "NOVA":\n    door_open = True', expected: { access_code: 'NOVA', door_open: true },
    hint: 'Text jämförs också med ==. Skriv "NOVA" med citattecken och stora bokstäver.',
    tip: 'Jämförelser fungerar för strängar också. "NOVA" och "nova" är olika texter.'
  },
  {
    title: 'Upptäck fel kod', concept: 'if och !=',
    objective: 'Ett gammalt kort har fel kod. Om access_code inte är "NOVA" ska alarm_on bli True.',
    setup: 'access_code = "GAMMALT"\nalarm_on = False',
    solution: 'if access_code != "NOVA":\n    alarm_on = True', expected: { access_code: 'GAMMALT', alarm_on: true },
    hint: '!= betyder inte lika med. Larmet ska aktiveras inne i if-blocket.',
    tip: '!= är sant när värdena skiljer sig åt.'
  },
  {
    title: 'Överhettad scanner', concept: 'if och >',
    objective: 'Scannern är varm efter år av stillestånd. Sätt fan_on till True om temperature är större än 40.',
    setup: 'temperature = 46\nfan_on = False',
    solution: 'if temperature > 40:\n    fan_on = True', expected: { temperature: 46, fan_on: true },
    hint: '> betyder större än. Vid exakt 40 är villkoret falskt.',
    tip: 'En strikt jämförelse med > tar inte med gränsvärdet.'
  },
  {
    title: 'Batterivarning', concept: 'if och <',
    objective: 'Vaktrobotens batteri börjar ta slut. Sätt charge_needed till True om battery är mindre än 20.',
    setup: 'battery = 12\ncharge_needed = False',
    solution: 'if battery < 20:\n    charge_needed = True', expected: { battery: 12, charge_needed: true },
    hint: '< betyder mindre än. Jämför battery med 20.',
    tip: 'Med < kan du upptäcka när ett värde hamnar under en gräns.'
  },
  {
    title: 'Precis tillräcklig behörighet', concept: 'if och >=',
    objective: 'Arkivdörren kräver minst behörighetsnivå 3. Sätt archive_open till True om clearance är större än eller lika med 3.',
    setup: 'clearance = 3\narchive_open = False',
    solution: 'if clearance >= 3:\n    archive_open = True', expected: { clearance: 3, archive_open: true },
    hint: '>= betyder större än eller lika med. Även exakt 3 ska godkännas.',
    tip: 'Minst betyder >=. Gränsvärdet räknas med.'
  },
  {
    title: 'Hissens lastgräns', concept: 'if och <=',
    objective: 'Säkerhetshissen får bära högst 100 kg. Sätt lift_ready till True om load är mindre än eller lika med 100.',
    setup: 'load = 100\nlift_ready = False',
    solution: 'if load <= 100:\n    lift_ready = True', expected: { load: 100, lift_ready: true },
    hint: '<= betyder mindre än eller lika med. Godkänn också lasten precis på gränsen.',
    tip: 'Högst betyder <=. Exakt 100 kg är tillåtet här.'
  },
  {
    title: 'Ett larm som ska förbli tyst', concept: 'ett falskt if-villkor',
    objective: 'Testa en frisk sensor. Skriv en if-sats som sätter alarm_on till True om temperature > 40. Vid 40 ska larmet förbli False. Sätt sedan checked till True utanför if-blocket.',
    setup: 'temperature = 40\nalarm_on = False\nchecked = False',
    solution: 'if temperature > 40:\n    alarm_on = True\nchecked = True', expected: { temperature: 40, alarm_on: false, checked: true },
    hint: 'checked = True ska inte ha indrag. Den raden ska köras även när if-villkoret är falskt.',
    tip: 'När villkoret är falskt hoppas if-blocket över. Koden efter blocket fortsätter ändå.'
  },
  {
    title: 'Välj dörrens status', concept: 'if och else',
    objective: 'Om access_code är "NOVA", sätt status till "ÖPPEN". Annars ska status bli "LÅST". Använd if och else.',
    setup: 'access_code = "OKÄND"\nstatus = ""',
    solution: 'if access_code == "NOVA":\n    status = "ÖPPEN"\nelse:\n    status = "LÅST"', expected: { access_code: 'OKÄND', status: 'LÅST' },
    hint: 'else: skrivs i samma kolumn som if och har inget eget villkor. Även dess kodblock ska ha indrag.',
    tip: 'else körs när if-villkoret är falskt. Exakt en av grenarna körs.'
  },
  {
    title: 'Starta nattpatrullen', concept: 'if/else och >=',
    objective: 'Om battery är minst 50 ska patrol bli "STARTA", annars "LADDA". Använd if och else.',
    setup: 'battery = 50\npatrol = ""',
    solution: 'if battery >= 50:\n    patrol = "STARTA"\nelse:\n    patrol = "LADDA"', expected: { battery: 50, patrol: 'STARTA' },
    hint: 'Minst 50 skrivs battery >= 50.',
    tip: 'Ett gränsvärde är ett bra test: > hade valt fel gren vid exakt 50.'
  },
  {
    title: 'Koppla reservcellerna', concept: 'addition och if',
    objective: 'Beräkna energy som cell_a + cell_b. Om energy är minst 60 ska shield_on bli True.',
    setup: 'cell_a = 25\ncell_b = 35\nshield_on = False',
    solution: 'energy = cell_a + cell_b\nif energy >= 60:\n    shield_on = True', expected: { cell_a: 25, cell_b: 35, energy: 60, shield_on: true },
    hint: 'Spara summan i energy innan du använder variabeln i jämförelsen.',
    tip: 'Resultatet av en beräkning kan användas i ett villkor.'
  },
  {
    title: 'Energi efter upplåsning', concept: 'subtraktion och if/else',
    objective: 'Beräkna remaining som energy - unlock_cost. Om remaining är minst 30 ska route bli "FORTSÄTT", annars "LADDA".',
    setup: 'energy = 70\nunlock_cost = 45\nroute = ""',
    solution: 'remaining = energy - unlock_cost\nif remaining >= 30:\n    route = "FORTSÄTT"\nelse:\n    route = "LADDA"', expected: { energy: 70, unlock_cost: 45, remaining: 25, route: 'LADDA' },
    hint: 'Dra bort upplåsningskostnaden. Jämför därefter återstående energi med 30.',
    tip: 'Kontrollera vad som finns kvar efter en kostnad innan roboten fortsätter.'
  },
  {
    title: 'Laserbarriärens effekt', concept: 'multiplikation och if',
    objective: 'Beräkna total_power som lasers * power_each. Sätt overload till True om total_power är större än 100.',
    setup: 'lasers = 6\npower_each = 18\noverload = False',
    solution: 'total_power = lasers * power_each\nif total_power > 100:\n    overload = True', expected: { lasers: 6, power_each: 18, total_power: 108, overload: true },
    hint: '* multiplicerar. Spara produkten i total_power.',
    tip: 'Multiplikation räknar ihop flera lika stora förbrukare.'
  },
  {
    title: 'Dela reservkraften', concept: 'division och if/else',
    objective: 'Beräkna per_sensor som reserve / sensors. Om varje sensor får minst 15 ska sensor_status bli "REDO", annars "SPARA".',
    setup: 'reserve = 90\nsensors = 6\nsensor_status = ""',
    solution: 'per_sensor = reserve / sensors\nif per_sensor >= 15:\n    sensor_status = "REDO"\nelse:\n    sensor_status = "SPARA"', expected: { reserve: 90, sensors: 6, per_sensor: 15, sensor_status: 'REDO' },
    hint: '/ dividerar i Python. 90 / 6 ger 15.0, som är lika med 15 vid jämförelse.',
    tip: 'Division med / ger ett flyttal. Det går att jämföra med heltal.'
  },
  {
    title: 'Fördela hela batterier', concept: 'heltalsdivision // och if',
    objective: 'Varje vakt behöver 4 batterier. Beräkna ready_guards som batteries // batteries_each. Sätt patrol_ready till True om minst 4 vakter kan utrustas.',
    setup: 'batteries = 19\nbatteries_each = 4\npatrol_ready = False',
    solution: 'ready_guards = batteries // batteries_each\nif ready_guards >= 4:\n    patrol_ready = True', expected: { batteries: 19, batteries_each: 4, ready_guards: 4, patrol_ready: true },
    hint: '// ger heltalsdivision: 19 // 4 ger 4. Resten räcker inte till en femte vakt.',
    tip: '// avrundar kvoten nedåt. Här räknar du bara kompletta batteripaket.'
  },
  {
    title: 'Kontrollera signalens rytm', concept: 'restoperatorn % och ==',
    objective: 'Säkerhetslampan ska blinka vid jämna tick. Beräkna remainder som tick % 2. Om resten är 0 ska signal bli "BLINK", annars "VÄNTA".',
    setup: 'tick = 14\nsignal = ""',
    solution: 'remainder = tick % 2\nif remainder == 0:\n    signal = "BLINK"\nelse:\n    signal = "VÄNTA"', expected: { tick: 14, remainder: 0, signal: 'BLINK' },
    hint: '% ger resten vid division. Jämna heltal ger resten 0 vid division med 2.',
    tip: 'Restoperatorn hjälper dig att känna igen återkommande mönster.'
  },
  {
    title: 'Tre larmnivåer', concept: 'if, elif och else',
    objective: 'Klassificera risk: minst 80 ger status "LARM", annars minst 40 ger "VARNING", annars "LUGNT". Använd if, elif och else i den ordningen.',
    setup: 'risk = 55\nstatus = ""',
    solution: 'if risk >= 80:\n    status = "LARM"\nelif risk >= 40:\n    status = "VARNING"\nelse:\n    status = "LUGNT"', expected: { risk: 55, status: 'VARNING' },
    hint: 'elif betyder annars om. Det får ett eget villkor och avslutas med kolon. Börja med den högsta gränsen.',
    tip: 'I en if/elif/else-kedja körs bara den första gren vars villkor stämmer, eller else om inget stämmer.'
  },
  {
    title: 'Två oberoende sensorer', concept: 'två separata if-satser',
    objective: 'Sätt fan_on till True om temperature > 40. Sätt pump_on till True om water_level >= 70. Båda kontrollerna ska göras med varsin if-sats.',
    setup: 'temperature = 45\nwater_level = 70\nfan_on = False\npump_on = False',
    solution: 'if temperature > 40:\n    fan_on = True\nif water_level >= 70:\n    pump_on = True', expected: { temperature: 45, water_level: 70, fan_on: true, pump_on: true },
    hint: 'Skriv två if på samma indragsnivå. Med elif skulle den andra kontrollen hoppas över när den första är sann.',
    tip: 'Separata if-satser kan köra flera block under samma körning.'
  },
  {
    title: 'Slussens dubbla kontroll', concept: 'nästlade if-satser',
    objective: 'Sätt airlock_open till True bara om access_code är "NOVA" och pressure är högst 5. Använd en if-sats inuti en annan för att öppna slussen.',
    setup: 'access_code = "NOVA"\npressure = 5\nairlock_open = False',
    solution: 'if access_code == "NOVA":\n    if pressure <= 5:\n        airlock_open = True', expected: { access_code: 'NOVA', pressure: 5, airlock_open: true },
    hint: 'Kontrollera kortet först. Den inre if-satsen om trycket har fyra mellanslags indrag. Tilldelningen inuti den har åtta.',
    tip: 'Ett nästlat villkor nås bara om det yttre villkoret är sant.'
  },
  {
    title: 'Säkerhetssystemet online', concept: 'slutuppdrag: beräkningar och villkor',
    objective: 'Starta anläggningens skydd! Beräkna remaining som main_power + backup_power - sensors * sensor_cost. Om access_code inte är "NOVA" ska status bli "NEKAD". Annars, om remaining är minst 50, sätt status till "ONLINE" och system_on till True. Annars ska status bli "LÅG ENERGI". Använd if/elif/else.',
    setup: 'main_power = 80\nbackup_power = 30\nsensors = 4\nsensor_cost = 15\naccess_code = "NOVA"\nstatus = ""\nsystem_on = False',
    solution: 'remaining = main_power + backup_power - sensors * sensor_cost\nif access_code != "NOVA":\n    status = "NEKAD"\nelif remaining >= 50:\n    status = "ONLINE"\n    system_on = True\nelse:\n    status = "LÅG ENERGI"', expected: { main_power: 80, backup_power: 30, sensors: 4, sensor_cost: 15, access_code: 'NOVA', remaining: 50, status: 'ONLINE', system_on: true },
    hint: 'Multiplikationen räknas först. Kontrollera fel kod före energin. ONLINE-grenen behöver två indragna tilldelningar.',
    tip: 'Säkerhetssystemet är online! Du har kombinerat beräkningar och beslut för att skydda anläggningen.'
  }
]

export const SECURITY_LEVELS: LevelDefinition[] = exercises.map((exercise, index) => ({
  id: index + 8,
  world: 'sakerhetssystemet',
  type: 'dashboard',
  title: exercise.title,
  concept: exercise.concept,
  objective: `${exercise.objective} Använd if, behåll startvärdena och använd variabelnamnen exakt som de står.`,
  width: 1,
  height: 1,
  tileGrid: [['empty']],
  playerStart: { x: 0, y: 0, direction: 'right' },
  availableCommands: ['if villkor:', '    indraget kodblock', ...(index >= 8 ? ['else:'] : []), ...(index >= 16 ? ['elif villkor:'] : []), exercise.concept],
  starterCode: `# Säkerhetssystemet · uppdrag ${index + 1}/20\n${exercise.setup}\n\n# Skriv din if-sats här.\n`,
  hints: [exercise.hint, 'Använd kolon efter villkoret och fyra mellanslag för varje indragsnivå. True och False börjar med stor bokstav.', `Prova:\n${exercise.setup}\n\n${exercise.solution}`],
  successTip: exercise.tip,
  showVariables: true,
  watchVariables: Object.keys(exercise.expected),
  successCheck: (ctx) => ctx.ranWithoutError && ctx.hasIfStatement === true && Object.entries(exercise.expected).every(([name, value]) => ctx.variables[name] === value)
}))
