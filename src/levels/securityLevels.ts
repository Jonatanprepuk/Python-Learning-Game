import type { LevelDefinition } from '../types'
import { buildSecurityMission } from './securityMaps'

interface Exercise {
  title: string
  concept: string
  objective: string
  setup: string
  solution: string
  expected: Record<string, number | string | boolean>
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
    title: 'Ladda eller fortsätt?', concept: 'if, else och <',
    objective: 'Välj mellan två beslut. Om battery är mindre än 20 ska charge_needed bli True. Annars ska charge_needed bli False. Använd if och else.',
    setup: 'battery = 12\ncharge_needed = False',
    solution: 'if battery < 20:\n    charge_needed = True\nelse:\n    charge_needed = False', expected: { battery: 12, charge_needed: true },
    hint: 'Skriv else: i samma kolumn som if. else har inget villkor. Båda kodblocken har fyra mellanslags indrag.',
    tip: 'if/else väljer exakt en av två grenar. Vid battery = 20 behövs ingen laddning.'
  },
  {
    title: 'Behörighet på gränsen', concept: 'if/else och >=',
    objective: 'Arkivdörren kräver minst behörighetsnivå 3. Om clearance är minst 3 ska archive_open bli True, annars False. Använd if/else och kontrollera att exakt 3 godkänns.',
    setup: 'clearance = 3\narchive_open = False',
    solution: 'if clearance >= 3:\n    archive_open = True\nelse:\n    archive_open = False', expected: { clearance: 3, archive_open: true },
    hint: '>= betyder större än eller lika med. Även exakt 3 ska godkännas.',
    tip: 'Minst betyder >=. Gränsvärdet räknas med.'
  },
  {
    title: 'Packa säkerhetshissen', concept: 'addition och if/else',
    objective: 'Beräkna load som robot_weight + cargo_weight. Hissen får bära högst 100 kg. Sätt lift_ready till True om load <= 100, annars False, med if/else.',
    setup: 'robot_weight = 65\ncargo_weight = 35\nlift_ready = False',
    solution: 'load = robot_weight + cargo_weight\nif load <= 100:\n    lift_ready = True\nelse:\n    lift_ready = False', expected: { robot_weight: 65, cargo_weight: 35, load: 100, lift_ready: true },
    hint: 'Beräkna vikten före if-satsen. Högst skrivs <= så att exakt 100 kg också tillåts.',
    tip: 'Du kan först beräkna ett värde och sedan välja gren med resultatet.'
  },
  {
    title: 'Ett larm som ska förbli tyst', concept: 'ett falskt if-villkor',
    objective: 'Felsök gränsen: larmet ska vara tyst vid exakt 40. Sätt alarm_on till True om temperature > 40, annars False med else. Sätt sedan checked till True utanför båda grenarna. Aktivera bron efter checked.',
    setup: 'temperature = 40\nalarm_on = False\nchecked = False',
    solution: 'if temperature > 40:\n    alarm_on = True\nelse:\n    alarm_on = False\nchecked = True', expected: { temperature: 40, alarm_on: false, checked: true },
    hint: 'checked = True ska inte ha indrag. Den raden ska köras även när if-villkoret är falskt.',
    tip: 'När villkoret är falskt hoppas if-blocket över. Koden efter blocket fortsätter ändå.'
  },
  {
    title: 'Tre sorters passerkort', concept: 'if, elif och else med text',
    objective: 'Om access_code är "NOVA" ska status bli "ÖPPEN". Om koden i stället är "SERVICE" ska status bli "SERVICE". Alla andra koder ger "LÅST". Använd if, elif och else.',
    setup: 'access_code = "SERVICE"\nstatus = ""',
    solution: 'if access_code == "NOVA":\n    status = "ÖPPEN"\nelif access_code == "SERVICE":\n    status = "SERVICE"\nelse:\n    status = "LÅST"', expected: { access_code: 'SERVICE', status: 'SERVICE' },
    hint: 'elif betyder annars om. Skriv elif access_code == "SERVICE": mellan if och else, på samma indragsnivå.',
    tip: 'if/elif/else testar uppifrån och kör bara den första gren som passar.'
  },
  {
    title: 'Välj patrullens längd', concept: 'elif med ordnade gränser',
    objective: 'Välj patrol med if/elif/else: minst 80 i battery ger "LÅNG", annars minst 50 ger "STARTA", annars "LADDA". Börja med den högsta gränsen.',
    setup: 'battery = 50\npatrol = ""',
    solution: 'if battery >= 80:\n    patrol = "LÅNG"\nelif battery >= 50:\n    patrol = "STARTA"\nelse:\n    patrol = "LADDA"', expected: { battery: 50, patrol: 'STARTA' },
    hint: 'Testa >= 80 före >= 50. Annars skulle ett batteri på 90 fastna i grenen för den kortare patrullen.',
    tip: 'Ordningen på villkoren avgör vilken gren som körs när flera jämförelser är sanna.'
  },
  {
    title: 'Välj skyddets styrka', concept: 'beräkning och flera tilldelningar',
    objective: 'Beräkna energy = cell_a + cell_b. Med if/elif/else: minst 100 ger mode = "FULLT" och shield_on = True; annars minst 60 ger mode = "EKO" och shield_on = True; annars mode = "AV" och shield_on = False.',
    setup: 'cell_a = 25\ncell_b = 35\nmode = ""\nshield_on = False',
    solution: 'energy = cell_a + cell_b\nif energy >= 100:\n    mode = "FULLT"\n    shield_on = True\nelif energy >= 60:\n    mode = "EKO"\n    shield_on = True\nelse:\n    mode = "AV"\n    shield_on = False', expected: { cell_a: 25, cell_b: 35, energy: 60, mode: 'EKO', shield_on: true },
    hint: 'Varje gren sätter två variabler. Aktivera först när både mode och shield_on har fått rätt värden.',
    tip: 'Flera indragna rader kan tillsammans beskriva ett beslut.'
  },
  {
    title: 'Välj väg efter energikostnaden', concept: 'subtraktion och tre intervall',
    objective: 'Beräkna remaining = energy - unlock_cost. Med if/elif/else: om remaining < 10 ska route bli "NÖDSTOPP", annars om remaining < 30 ska route bli "LADDA", annars "FORTSÄTT". Här börjar du med den lägsta gränsen.',
    setup: 'energy = 70\nunlock_cost = 45\nroute = ""',
    solution: 'remaining = energy - unlock_cost\nif remaining < 10:\n    route = "NÖDSTOPP"\nelif remaining < 30:\n    route = "LADDA"\nelse:\n    route = "FORTSÄTT"', expected: { energy: 70, unlock_cost: 45, remaining: 25, route: 'LADDA' },
    hint: 'Kontrollera < 10 före < 30. När elif nås vet du redan att remaining är minst 10.',
    tip: 'Med stigande övre gränser delar du upp tal i intervall utan att skriva dubbla jämförelser.'
  },
  {
    title: 'Lasercentralens fyra lägen', concept: 'flera elif och multiplikation',
    objective: 'Beräkna total_power = lasers * power_each. Välj laser_mode: över 150 ger "NÖDSTOPP", annars över 100 ger "KYL", annars över 0 ger "AKTIV", annars "AV". Använd if, två elif och else.',
    setup: 'lasers = 6\npower_each = 18\nlaser_mode = ""',
    solution: 'total_power = lasers * power_each\nif total_power > 150:\n    laser_mode = "NÖDSTOPP"\nelif total_power > 100:\n    laser_mode = "KYL"\nelif total_power > 0:\n    laser_mode = "AKTIV"\nelse:\n    laser_mode = "AV"', expected: { lasers: 6, power_each: 18, total_power: 108, laser_mode: 'KYL' },
    hint: 'Det går att ha flera elif i samma kedja. Exakt 100 hör till AKTIV och exakt 150 till KYL.',
    tip: 'Fyra utfall kräver här tre villkor och en avslutande else-gren.'
  },
  {
    title: 'Fördela kraft med marginal', concept: 'division och elif',
    objective: 'Beräkna per_sensor = reserve / sensors. Välj sensor_status med if/elif/else: minst 20 ger "TURBO", annars minst 15 ger "REDO", annars "SPARA". Ett resultat med decimaler ska också fungera.',
    setup: 'reserve = 90\nsensors = 6\nsensor_status = ""',
    solution: 'per_sensor = reserve / sensors\nif per_sensor >= 20:\n    sensor_status = "TURBO"\nelif per_sensor >= 15:\n    sensor_status = "REDO"\nelse:\n    sensor_status = "SPARA"', expected: { reserve: 90, sensors: 6, per_sensor: 15, sensor_status: 'REDO' },
    hint: '/ dividerar i Python. 90 / 6 ger 15.0, som är lika med 15 vid jämförelse.',
    tip: 'Division med / ger ett flyttal. Det går att jämföra med heltal.'
  },
  {
    title: 'Batterier bakom låst förråd', concept: 'första nästlade if-satsen',
    objective: 'Beräkna ready_guards = batteries // batteries_each. Kontrollera först om storage_open == True. Bara inuti den grenen ska du med ett nytt if kontrollera om ready_guards >= 4 och sätta patrol_ready till True. Annars behåller patrol_ready sitt startvärde.',
    setup: 'batteries = 19\nbatteries_each = 4\nstorage_open = True\npatrol_ready = False',
    solution: 'ready_guards = batteries // batteries_each\nif storage_open == True:\n    if ready_guards >= 4:\n        patrol_ready = True', expected: { batteries: 19, batteries_each: 4, storage_open: true, ready_guards: 4, patrol_ready: true },
    hint: 'Det inre if-blocket har fyra mellanslags indrag. patrol_ready = True och aktiveringen inuti det har åtta. // räknar hela batteripaket.',
    tip: 'Ett nästlat if körs bara när det yttre villkoret är sant. Batterierna hjälper inte om förrådet är låst.'
  },
  {
    title: 'Synkronisera signallampan', concept: 'nästlad if/else och %',
    objective: 'Beräkna remainder = tick % 2. Om signal_enabled == True ska ett inre if/else sätta signal till "BLINK" vid remainder == 0, annars "VÄNTA". Yttre else ska sätta signal till "AV" när signalen är avstängd.',
    setup: 'tick = 14\nsignal_enabled = True\nsignal = ""',
    solution: 'remainder = tick % 2\nif signal_enabled == True:\n    if remainder == 0:\n        signal = "BLINK"\n    else:\n        signal = "VÄNTA"\nelse:\n    signal = "AV"', expected: { tick: 14, signal_enabled: true, remainder: 0, signal: 'BLINK' },
    hint: 'Det inre else står under det inre if med fyra mellanslags indrag. Yttre else saknar indrag. % 2 ger 0 för jämna tick.',
    tip: 'Indraget visar vilket if ett else hör till.'
  },
  {
    title: 'Lita bara på en fungerande sensor', concept: 'if/elif/else inuti if',
    objective: 'Kontrollera först sensor_ok == True. Inuti detta if: risk >= 80 ger status = "LARM", annars risk >= 40 ger "VARNING", annars "LUGNT". Använd en nästlad if/elif/else-kedja. Yttre else ska ge status = "SENSORFEL".',
    setup: 'sensor_ok = True\nrisk = 55\nstatus = ""',
    solution: 'if sensor_ok == True:\n    if risk >= 80:\n        status = "LARM"\n    elif risk >= 40:\n        status = "VARNING"\n    else:\n        status = "LUGNT"\nelse:\n    status = "SENSORFEL"', expected: { sensor_ok: true, risk: 55, status: 'VARNING' },
    hint: 'Hela riskkedjan har fyra extra mellanslags indrag. SENSORFEL hör till det yttre else och kräver ingen riskjämförelse.',
    tip: 'Kontrollera först om ett mätvärde går att lita på och klassificera det sedan.'
  },
  {
    title: 'Två skydd under samma huvudbrytare', concept: 'oberoende if inuti if',
    objective: 'Båda panelerna kräver power == 1 som yttre if. Vid A ska ett inre if sätta fan_on = True om temperature > 40. Vid B ska ett inre if sätta pump_on = True om water_level >= 70. Behåll False när ett villkor inte stämmer. Använd separata kontroller så att båda skydden kan starta.',
    setup: 'power = 1\ntemperature = 45\nwater_level = 70\nfan_on = False\npump_on = False',
    solution: 'if power == 1:\n    if temperature > 40:\n        fan_on = True\n    if water_level >= 70:\n        pump_on = True', expected: { power: 1, temperature: 45, water_level: 70, fan_on: true, pump_on: true },
    hint: 'Varje panel behöver sin egen nästlade kontroll. Aktivera fläkten vid A, gå till B och kontrollera sedan pumpen. Ett elif skulle hoppa över pumpen när fläkten behövs.',
    tip: 'Två separata if kan båda bli sanna. Nästling lägger till ett gemensamt grundkrav.'
  },
  {
    title: 'Slussens felmeddelanden', concept: 'nästlade beslut med flera utfall',
    objective: 'Vid A: om access_code == "NOVA", sätt card_ok = True och passera. Vid B: kontrollera koden igen med ett yttre if. För rätt kod ska inre if/elif/else välja status: pressure > 5 ger "SÄNK TRYCKET", annars oxygen < 19 ger "FYLL SYRE", annars "ÖPPEN" och airlock_open = True. Fel kod ger "NEKAD" i yttre else.',
    setup: 'access_code = "NOVA"\npressure = 5\noxygen = 21\ncard_ok = False\nstatus = ""\nairlock_open = False',
    solution: 'if access_code == "NOVA":\n    if pressure > 5:\n        status = "SÄNK TRYCKET"\n    elif oxygen < 19:\n        status = "FYLL SYRE"\n    else:\n        status = "ÖPPEN"\n        airlock_open = True\nelse:\n    status = "NEKAD"', expected: { access_code: 'NOVA', pressure: 5, oxygen: 21, card_ok: true, status: 'ÖPPEN', airlock_open: true },
    hint: 'Avvisa först fel kod. Inuti grenen för rätt kod kontrollerar du tryck före syre. Bara det inre else får öppna slussen.',
    tip: 'Nästlade beslut kan förklara varför en passage är stängd, inte bara ge True eller False.'
  },
  {
    title: 'Säkerhetssystemet online', concept: 'slutuppdrag: beräkningar och villkor',
    objective: 'Slutuppdrag! Vid A: rätt access_code ("NOVA") sätter card_ok = True. Vid B: beräkna remaining = main_power + backup_power - sensors * sensor_cost; minst 50 sätter bridge_ready = True. Vid C: använd yttre if/else för koden (fel kod ger status = "NEKAD"). Inuti rätt-kod-grenen: remaining < 50 ger "LÅG ENERGI", elif risk >= 80 ger "LARM", annars gör ett tredje if/else: coolant >= 30 ger "ONLINE" och system_on = True, annars "BEHÖVER KYLNING".',
    setup: 'main_power = 80\nbackup_power = 30\nsensors = 4\nsensor_cost = 15\naccess_code = "NOVA"\nrisk = 55\ncoolant = 30\ncard_ok = False\nbridge_ready = False\nstatus = ""\nsystem_on = False',
    solution: 'remaining = main_power + backup_power - sensors * sensor_cost\nif access_code == "NOVA":\n    if remaining < 50:\n        status = "LÅG ENERGI"\n    elif risk >= 80:\n        status = "LARM"\n    else:\n        if coolant >= 30:\n            status = "ONLINE"\n            system_on = True\n        else:\n            status = "BEHÖVER KYLNING"\nelse:\n    status = "NEKAD"', expected: { main_power: 80, backup_power: 30, sensors: 4, sensor_cost: 15, access_code: 'NOVA', risk: 55, coolant: 30, card_ok: true, bridge_ready: true, remaining: 50, status: 'ONLINE', system_on: true },
    hint: 'Bygg ett beslut i taget: kod → energi/risk → kylning. Den djupaste grenen har tolv mellanslags indrag. Sätt både status och system_on före activate() vid C.',
    tip: 'Säkerhetssystemet är online! Du har kombinerat beräkningar, if/elif/else och tre nivåer av villkor.'
  }
]

export const SECURITY_LEVELS: LevelDefinition[] = exercises.map((exercise, index) => {
  const mission = buildSecurityMission(index, exercise.solution, exercise.expected)
  return {
    id: index + 8, world: 'sakerhetssystemet', type: 'robot',
    title: `Rum ${index + 1} — ${exercise.title}`,
    concept: exercise.concept,
    objective: `${mission.story} ${exercise.objective} Behåll startvärdena. Skriv själv robotens rörelser. Stå på bokstavspanelen och använd activate() efter kontrollen innan du passerar hindret. Nå sedan den gröna målrutan.`,
    width: mission.width, height: mission.height, tileGrid: mission.tileGrid,
    playerStart: mission.playerStart, mechanisms: mission.mechanisms,
    availableCommands: ['move()', 'turn_left()', 'turn_right()', 'activate()', 'if villkor:', ...(index >= 4 ? ['else:'] : []), ...(index >= 8 ? ['elif villkor:'] : [])],
    starterCode: `# Rum ${index + 1}: ${exercise.title}\n${exercise.setup}\n\n# 1. Gå till panel A med move() och svängar.\n\n# 2. Skriv kontrollen. Använd activate() på panelen.\n# Lägg rörelser genom hindret i rätt if/else-gren.\n\n# 3. Fortsätt till nästa panel eller den gröna målrutan.\n`,
    hints: [exercise.hint, 'Ett move() går en ruta i pilens riktning. turn_left() och turn_right() vrider roboten ett kvarts varv. Bokstaven på en panel visar vilket hinder den styr.', 'activate() måste köras på panelrutan efter att rätt variabler har satts. Lägg aktivering och rörelser i samma gren. Flera paneler måste besökas i ordning.', `Prova:\n${exercise.setup}\n${mission.program}`],
    successTip: `${exercise.tip} Du har styrt roboten förbi hindren och fram till målet.`,
    showVariables: true, watchVariables: Object.keys(exercise.expected),
    successCheck: ctx => ctx.ranWithoutError && ctx.hasIfStatement === true && Object.entries(exercise.expected).every(([name, value]) => ctx.variables[name] === value)
  }
})
