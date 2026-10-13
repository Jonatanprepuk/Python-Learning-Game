import type { DoorCondition, LevelDefinition, SnapshotValue } from '../types'
import { evaluateDoorCondition } from '../engine/simulate'
import { buildDataMap } from './dataMaps'

interface DataExercise {
  title: string
  concept: string
  objective: string
  setup: string
  solution: string
  expected: Record<string, SnapshotValue>
  commands: string[]
  hints: [string, string]
  tip: string
}

export const DATA_EXERCISES: DataExercise[] = [
  {
    title: 'Serverhyllan', concept: 'skapa en lista',
    objective: 'Registrera tre servrar. Skapa listan servers med texterna "nova", "atlas" och "vega" i just den ordningen.',
    setup: '', solution: 'servers = ["nova", "atlas", "vega"]',
    expected: { servers: ['nova', 'atlas', 'vega'] }, commands: ['lista = [värde, värde]'],
    hints: ['En lista samlar flera värden mellan hakparenteser: [ och ].', 'Skriv servernamnen inom citattecken och skilj dem med kommatecken. Ordningen räknas.'],
    tip: 'En lista lagrar flera värden i en bestämd ordning.'
  },
  {
    title: 'Hitta huvudservern', concept: 'index från noll',
    objective: 'Läs första servern ur servers och spara den i primary. Läs tredje servern och spara den i backup. Behåll servers.',
    setup: 'servers = ["nova", "atlas", "vega"]', solution: 'primary = servers[0]\nbackup = servers[2]',
    expected: { servers: ['nova', 'atlas', 'vega'], primary: 'nova', backup: 'vega' }, commands: ['lista[index]'],
    hints: ['Första platsen har index 0, andra index 1 och tredje index 2.', 'Spara servers[0] i primary. Använd samma teknik för backup.'],
    tip: 'Index beskriver en position i listan. Python börjar räkna från noll.'
  },
  {
    title: 'Byt trasig disk', concept: 'ändra ett listelement',
    objective: 'Andra disken är trasig. Ersätt "TRASIG" i disks med "ssd-b" genom att tilldela på rätt index. Spara också sista disken i spare med index -1.',
    setup: 'disks = ["ssd-a", "TRASIG", "ssd-c"]', solution: 'disks[1] = "ssd-b"\nspare = disks[-1]',
    expected: { disks: ['ssd-a', 'ssd-b', 'ssd-c'], spare: 'ssd-c' }, commands: ['lista[index] = värde', 'lista[-1]'],
    hints: ['Ändra bara index 1: disks[1] = "ssd-b".', 'Negativa index räknar från slutet. -1 betyder sista elementet.'],
    tip: 'Listor går att ändra. Tilldelning till ett index ersätter ett befintligt värde.'
  },
  {
    title: 'Köa säkerhetskopior', concept: 'for, append() och len()',
    objective: 'Gå igenom incoming med en for-loop och lägg varje jobb sist i jobs med append(). Behåll ordningen och de jobb som redan finns. Spara sedan antalet i count med len(). Behåll incoming.',
    setup: 'jobs = ["databas"]\nincoming = ["bilder", "loggar"]', solution: 'for job in incoming:\n    jobs.append(job)\ncount = len(jobs)',
    expected: { jobs: ['databas', 'bilder', 'loggar'], incoming: ['bilder', 'loggar'], count: 3 }, commands: ['for värde in lista:', 'lista.append(värde)', 'len(lista)'],
    hints: ['for job in incoming: hämtar ett jobb i taget.', 'Lägg jobs.append(job) i loopen. Räkna med len(jobs) efter loopen.'],
    tip: 'En for-loop passar när samma handling ska utföras för varje element i en lista.'
  },
  {
    title: 'Töm arbetskön', concept: 'while och pop()',
    objective: 'Behandla jobs med en while-loop så länge len(jobs) > 0. Ta första jobbet med pop(0) och lägg det i completed. Spara till sist antalet kvarvarande jobb i remaining. Kön ska bli tom och completed ska behålla jobbens ordning.',
    setup: 'jobs = ["databas", "bilder", "loggar"]\ncompleted = []', solution: 'while len(jobs) > 0:\n    current = jobs.pop(0)\n    completed.append(current)\nremaining = len(jobs)',
    expected: { jobs: [], completed: ['databas', 'bilder', 'loggar'], remaining: 0 }, commands: ['while villkor:', 'lista.pop(index)', 'lista.append(värde)', 'len(lista)'],
    hints: ['pop(0) tar bort och returnerar första jobbet. Listan blir kortare varje varv.', 'Testa len(jobs) > 0 före varje pop(). En tom kö ska hoppa över loopen.'],
    tip: 'En while-loop passar när arbetet ska fortsätta tills kön är tom. pop() gör att stoppvillkoret till slut uppfylls.'
  },
  {
    title: 'Dela loggarkivet', concept: 'if/else och slicing',
    objective: 'Om logs har fler än tre poster ska recent få de tre sista och archived få alla tidigare poster. Annars ska recent få en kopia av hela logs och archived en tom lista. Använd if/else och slicing. Behåll logs oförändrad.',
    setup: 'logs = ["start", "login", "backup", "scan", "logout"]', solution: 'if len(logs) > 3:\n    recent = logs[-3:]\n    archived = logs[:-3]\nelse:\n    recent = logs[:]\n    archived = []',
    expected: { logs: ['start', 'login', 'backup', 'scan', 'logout'], recent: ['backup', 'scan', 'logout'], archived: ['start', 'login'] }, commands: ['if/else', 'len(lista)', 'lista[-3:]', 'lista[:-3]', 'lista[:]'],
    hints: ['Kontrollera längden innan du väljer hur arkivet delas.', 'logs[:-3] tar allt utom de tre sista posterna. logs[:] kopierar hela listan.'],
    tip: 'Villkor och slicing kan tillsammans hantera både korta och långa listor utan överlappande arkiv.'
  },
  {
    title: 'Mät serverbelastningen', concept: 'sum(), len() och medelvärde',
    objective: 'Beräkna total med sum(loads) och average som total / len(loads). Om average är minst 60 ska status bli "HÖG", annars "NORMAL". Behåll loads.',
    setup: 'loads = [40, 80, 60, 100]\nstatus = ""', solution: 'total = sum(loads)\naverage = total / len(loads)\nif average >= 60:\n    status = "HÖG"\nelse:\n    status = "NORMAL"',
    expected: { loads: [40, 80, 60, 100], total: 280, average: 70, status: 'HÖG' }, commands: ['sum(lista)', 'len(lista)', 'if/else'],
    hints: ['sum() summerar talen. len() räknar hur många tal som finns.', 'Räkna medelvärdet först och välj sedan status med if/else.'],
    tip: 'Du kan sammanfatta en hel lista med ett tal och använda det i ett beslut.'
  },
  {
    title: 'Filtrera heta servrar', concept: 'for, if och en resultatlista',
    objective: 'Gå igenom temperatures med en for-loop. Lägg alla temperaturer som är minst 70 i hot, i ursprunglig ordning. Spara antalet i hot_count och behåll temperatures.',
    setup: 'temperatures = [55, 70, 82, 61, 90]\nhot = []', solution: 'for temperature in temperatures:\n    if temperature >= 70:\n        hot.append(temperature)\nhot_count = len(hot)',
    expected: { temperatures: [55, 70, 82, 61, 90], hot: [70, 82, 90], hot_count: 3 }, commands: ['for värde in lista:', 'if villkor:', 'lista.append(värde)'],
    hints: ['Börja med den tomma listan hot. Undersök ett tal i taget.', 'Lägg hot.append(temperature) inuti if-blocket. Exakt 70 ska också följa med.'],
    tip: 'Filtrering bygger en ny lista med bara de värden som uppfyller ett villkor.'
  },
  {
    title: 'Serverns identitetskort', concept: 'dictionary och if/else',
    objective: 'Använd if/else: om power == 1 ska online bli True, annars False. Skapa sedan server som en dictionary med "name": "nova", "rack": 3 och "online" med värdet från variabeln online. Behåll power.',
    setup: 'power = 1', solution: 'if power == 1:\n    online = True\nelse:\n    online = False\nserver = {"name": "nova", "rack": 3, "online": online}',
    expected: { power: 1, online: true, server: { name: 'nova', rack: 3, online: true } }, commands: ['if/else', 'register = {"nyckel": värde}'],
    hints: ['Bestäm online med ett villkor innan du bygger registret.', 'Nyckeln "online" är text, men värdet online utan citattecken hämtas från variabeln.'],
    tip: 'En dictionary kan samla både fasta uppgifter och värden som programmet har räknat fram.'
  },
  {
    title: 'Utöka lagringsutrymmet', concept: 'while och uppdatering av nycklar',
    objective: 'Beräkna free som kapacitet minus använt utrymme. Så länge free < 80 ska en while-loop öka server["capacity"] med 50 och räkna om free. Behåll namn och använt utrymme. Om utrymmet redan räcker ska inget läggas till.',
    setup: 'server = {"name": "atlas", "capacity": 100, "used": 65}', solution: 'free = server["capacity"] - server["used"]\nwhile free < 80:\n    server["capacity"] = server["capacity"] + 50\n    free = server["capacity"] - server["used"]',
    expected: { server: { name: 'atlas', capacity: 150, used: 65 }, free: 85 }, commands: ['while villkor:', 'register["nyckel"]', 'register["nyckel"] = värde'],
    hints: ['Beräkna free före loopen så att villkoret kan testas.', 'Räkna om free inne i loopen efter varje utökning. Annars kan loopen aldrig sluta.'],
    tip: 'En while-loop kan anpassa antalet uppdateringar efter hur mycket utrymme som saknas.'
  },
  {
    title: 'Städa nätregistret', concept: 'if, in och del',
    objective: 'Lägg till "gateway": "10.0.0.1" i network. Använd if för att kontrollera om "legacy" finns innan du raderar den med del. Behåll övriga fält och spara antalet kvarvarande nycklar i field_count.',
    setup: 'network = {"host": "nova", "ip": "10.0.0.8", "legacy": "gammal"}', solution: 'network["gateway"] = "10.0.0.1"\nif "legacy" in network:\n    del network["legacy"]\nfield_count = len(network)',
    expected: { network: { host: 'nova', ip: '10.0.0.8', gateway: '10.0.0.1' }, field_count: 3 }, commands: ['if nyckel in register:', 'register["nyckel"] = värde', 'del register["nyckel"]', 'len(register)'],
    hints: ['"legacy" in network kontrollerar om nyckeln finns.', 'Lägg del i if-blocket så att en saknad nyckel inte orsakar KeyError.'],
    tip: 'Ett villkor gör att samma städning fungerar även när en gammal nyckel redan har tagits bort.'
  },
  {
    title: 'Saknad inställning', concept: 'get() och if/elif/else',
    objective: 'Läs retries och timeout ur config med get() och standardvärdena 3 respektive 30. Skapa effective med dessa två nycklar. Välj sedan mode med if/elif/else: retries == 0 ger "AV", annars timeout < 5 ger "SNABB", annars "NORMAL". Behåll config.',
    setup: 'config = {"timeout": 10}', solution: 'retries = config.get("retries", 3)\ntimeout = config.get("timeout", 30)\neffective = {"retries": retries, "timeout": timeout}\nif retries == 0:\n    mode = "AV"\nelif timeout < 5:\n    mode = "SNABB"\nelse:\n    mode = "NORMAL"',
    expected: { config: { timeout: 10 }, retries: 3, timeout: 10, effective: { retries: 3, timeout: 10 }, mode: 'NORMAL' }, commands: ['register.get("nyckel", standardvärde)', 'if/elif/else'],
    hints: ['get() använder standardvärdet bara när nyckeln saknas. Ett befintligt värde på 0 ska behållas.', 'Kontrollera retries först. Läget AV har företräde även om timeout är kort.'],
    tip: 'Standardvärden och prioriterade villkor gör konfigurationen användbar även när vissa inställningar saknas.'
  },
  {
    title: 'Inventera diskutrymmet', concept: 'loopa över items()',
    objective: 'Använd en for-loop över capacity.items(). Summera värdena i total. Lägg namnen på diskar med mindre än 50 i low, i registrets ordning. Behåll capacity.',
    setup: 'capacity = {"nova": 40, "atlas": 100, "vega": 25}\ntotal = 0\nlow = []', solution: 'for name, space in capacity.items():\n    total = total + space\n    if space < 50:\n        low.append(name)',
    expected: { capacity: { nova: 40, atlas: 100, vega: 25 }, total: 165, low: ['nova', 'vega'] }, commands: ['for nyckel, värde in register.items():'],
    hints: ['items() ger både nyckeln och värdet under varje varv.', 'Summera varje space, men lägg bara till name när space < 50.'],
    tip: 'Med items() kan du arbeta med både servernamnet och dess mätvärde.'
  },
  {
    title: 'Räkna larmtyper', concept: 'while med index och get()',
    objective: 'Räkna varje larmtyp i events. Använd en while-loop med index i som börjar på 0 och fortsätter medan i < len(events). Läs events[i], öka räknaren i counts med get(..., 0) och öka i med 1. Behåll events.',
    setup: 'events = ["disk", "nät", "disk", "cpu", "nät", "disk"]\ncounts = {}', solution: 'i = 0\nwhile i < len(events):\n    event = events[i]\n    counts[event] = counts.get(event, 0) + 1\n    i = i + 1',
    expected: { events: ['disk', 'nät', 'disk', 'cpu', 'nät', 'disk'], counts: { disk: 3, nät: 2, cpu: 1 } }, commands: ['while i < len(lista):', 'lista[i]', 'register.get(nyckel, 0)', 'i = i + 1'],
    hints: ['Sista giltiga index är len(events) - 1. Använd <, inte <=.', 'Öka i varje varv så att nästa larm läses och loopen till slut stannar.'],
    tip: 'En indexstyrd while-loop låter dig gå igenom en lista utan att ändra dess innehåll.'
  },
  {
    title: 'Register inuti register', concept: 'nästlade dictionaries, for och if',
    objective: 'Gå igenom servers.items() med for. Om en server har mindre än 20 ledigt utrymme ska dess kapacitet ökas med 20 en gång. Låt övriga servrar och fält vara oförändrade. Spara därefter atlas lediga utrymme i free.',
    setup: 'servers = {"nova": {"capacity": 100, "used": 60}, "atlas": {"capacity": 80, "used": 70}}', solution: 'for name, server in servers.items():\n    if server["capacity"] - server["used"] < 20:\n        server["capacity"] = server["capacity"] + 20\nfree = servers["atlas"]["capacity"] - servers["atlas"]["used"]',
    expected: { servers: { nova: { capacity: 100, used: 60 }, atlas: { capacity: 100, used: 70 } }, free: 30 }, commands: ['for nyckel, värde in register.items():', 'if villkor:', 'register["server"]["fält"]'],
    hints: ['I loopen är server den inre dictionaryn. Ändringar där uppdaterar också servers.', 'Kontrollera capacity - used för varje server. Exakt 20 ska inte ge någon utökning.'],
    tip: 'Med for och if kan du uppdatera valda objekt i ett nästlat register.'
  },
  {
    title: 'Välj servrar för drift', concept: 'lista av dictionaries och nästlade villkor',
    objective: 'Gå igenom servers. Lägg serverns namn i ready bara om online är True och load är högst 70. Använd ett if inuti ett annat och behåll ordningen och servers.',
    setup: 'servers = [{"name": "nova", "online": True, "load": 70}, {"name": "atlas", "online": False, "load": 20}, {"name": "vega", "online": True, "load": 85}, {"name": "luna", "online": True, "load": 40}]\nready = []',
    solution: 'for server in servers:\n    if server["online"] == True:\n        if server["load"] <= 70:\n            ready.append(server["name"])',
    expected: { servers: [{ name: 'nova', online: true, load: 70 }, { name: 'atlas', online: false, load: 20 }, { name: 'vega', online: true, load: 85 }, { name: 'luna', online: true, load: 40 }], ready: ['nova', 'luna'] }, commands: ['for register in lista:', 'register["nyckel"]', 'nästlade if'],
    hints: ['Varje varv ger en dictionary som beskriver en server.', 'Kontrollera online först. Inuti den grenen kontrollerar du load <= 70 innan du sparar namnet.'],
    tip: 'En lista av dictionaries är ett vanligt sätt att lagra många objekt med samma slags fält.'
  },
  {
    title: 'Temperaturer per rack', concept: 'nästlade listor och loopar',
    objective: 'Varje inre lista i racks är ett rack. Beräkna en summa per rack med nästlade for-loopar och lägg summorna i totals. Räkna samtidigt alla temperaturer över 70 i hot_count. Behåll racks.',
    setup: 'racks = [[40, 75], [80, 60, 90], [70]]\ntotals = []\nhot_count = 0', solution: 'for rack in racks:\n    rack_total = 0\n    for temperature in rack:\n        rack_total = rack_total + temperature\n        if temperature > 70:\n            hot_count = hot_count + 1\n    totals.append(rack_total)',
    expected: { racks: [[40, 75], [80, 60, 90], [70]], totals: [115, 230, 70], hot_count: 3 }, commands: ['for rad in lista:', 'for värde in rad:', 'lista.append(värde)'],
    hints: ['Nollställ rack_total i den yttre loopen men hot_count bara före alla loopar.', 'Lägg till rack_total efter den inre loopen. Exakt 70 ska inte räknas som hett.'],
    tip: 'Indraget avgör om en räknare gäller ett enda rack eller hela datacentret.'
  },
  {
    title: 'Gruppera jobb per server', concept: 'dictionary med listor',
    objective: 'Gruppera jobs efter "server". Varje nyckel i grouped ska innehålla en lista av jobbens "task", i ursprunglig ordning. Skapa en tom lista när en server dyker upp första gången. Behåll jobs.',
    setup: 'jobs = [{"server": "nova", "task": "backup"}, {"server": "atlas", "task": "scan"}, {"server": "nova", "task": "rapport"}]\ngrouped = {}', solution: 'for job in jobs:\n    name = job["server"]\n    if name not in grouped:\n        grouped[name] = []\n    grouped[name].append(job["task"])',
    expected: { jobs: [{ server: 'nova', task: 'backup' }, { server: 'atlas', task: 'scan' }, { server: 'nova', task: 'rapport' }], grouped: { nova: ['backup', 'rapport'], atlas: ['scan'] } }, commands: ['nyckel not in register', 'register[nyckel] = []', 'register[nyckel].append(värde)'],
    hints: ['name not in grouped testar om nyckeln saknas.', 'Skapa bara listan första gången, annars skulle tidigare jobb skrivas över. append() ska köras varje varv.'],
    tip: 'Gruppering samlar flera poster under samma nyckel utan att tappa deras ordning.'
  },
  {
    title: 'En säker testkopia', concept: 'copy(), for och if not in',
    objective: 'Kopiera config till trial med copy() och kopiera också den inre listan "ports". Gå igenom proposed_ports med for. Lägg till en port sist i trial["ports"] bara om den inte redan finns där. Sätt trial["mode"] till "test". Behåll config och proposed_ports oförändrade.',
    setup: 'config = {"ports": [80, 443], "mode": "live"}\nproposed_ports = [443, 8080, 8080, 9090]', solution: 'trial = config.copy()\ntrial["ports"] = config["ports"].copy()\nfor port in proposed_ports:\n    if port not in trial["ports"]:\n        trial["ports"].append(port)\ntrial["mode"] = "test"',
    expected: { config: { ports: [80, 443], mode: 'live' }, proposed_ports: [443, 8080, 8080, 9090], trial: { ports: [80, 443, 8080, 9090], mode: 'test' } }, commands: ['register.copy()', 'lista.copy()', 'for värde in lista:', 'if värde not in lista:'],
    hints: ['En ytlig kopia delar fortfarande den inre listan. Kopiera ports separat före loopen.', 'Kontrollera medlemskap i trial["ports"], som växer under körningen, så att upprepade förslag inte ger dubbletter.'],
    tip: 'Kopiering skyddar originalet medan for och if bygger en testkonfiguration utan nya dubbletter.'
  },
  {
    title: 'Datacentret online', concept: 'slutuppdrag: filtrera, gruppera och prioritera',
    objective: 'Behandla jobs i ordning. Om jobbet inte är enabled ska dess namn läggas i skipped. Annars, om cost ryms i remaining, lägg namnet i deployed, dra av kostnaden och summera kostnaden per team i totals. Om budgeten inte räcker lägger du namnet i waiting. Använd for och if/elif/else. Skapa till sist report med nycklarna "deployed", "waiting", "skipped", "totals" och "remaining". Behåll jobs och budget.',
    setup: 'jobs = [{"name": "backup", "team": "drift", "cost": 30, "enabled": True}, {"name": "index", "team": "sök", "cost": 50, "enabled": False}, {"name": "scan", "team": "drift", "cost": 25, "enabled": True}, {"name": "analys", "team": "sök", "cost": 60, "enabled": True}, {"name": "cache", "team": "sök", "cost": 45, "enabled": True}]\nbudget = 100\nremaining = budget\ndeployed = []\nwaiting = []\nskipped = []\ntotals = {}',
    solution: 'for job in jobs:\n    if job["enabled"] == False:\n        skipped.append(job["name"])\n    elif job["cost"] <= remaining:\n        deployed.append(job["name"])\n        remaining = remaining - job["cost"]\n        team = job["team"]\n        totals[team] = totals.get(team, 0) + job["cost"]\n    else:\n        waiting.append(job["name"])\nreport = {"deployed": deployed, "waiting": waiting, "skipped": skipped, "totals": totals, "remaining": remaining}',
    expected: {
      jobs: [{ name: 'backup', team: 'drift', cost: 30, enabled: true }, { name: 'index', team: 'sök', cost: 50, enabled: false }, { name: 'scan', team: 'drift', cost: 25, enabled: true }, { name: 'analys', team: 'sök', cost: 60, enabled: true }, { name: 'cache', team: 'sök', cost: 45, enabled: true }],
      budget: 100, remaining: 0, deployed: ['backup', 'scan', 'cache'], waiting: ['analys'], skipped: ['index'], totals: { drift: 55, sök: 45 },
      report: { deployed: ['backup', 'scan', 'cache'], waiting: ['analys'], skipped: ['index'], totals: { drift: 55, sök: 45 }, remaining: 0 }
    }, commands: ['for register in lista:', 'if/elif/else', 'register.get(nyckel, 0)', 'lista.append(värde)'],
    hints: ['Kontrollera enabled före budgeten. Ett avstängt jobb ska aldrig kosta något.', 'Uppdatera remaining direkt när ett jobb startas. Fortsätt efter ett för dyrt jobb: nästa kan vara billigare. Skapa report efter loopen.'],
    tip: 'Du har byggt en driftplan med listor, dictionaries, villkor och en budget som uppdateras under körningen.'
  }
]

export const DATA_LEVELS: LevelDefinition[] = DATA_EXERCISES.map((exercise, index) => {
  const condition: DoorCondition = { all: Object.entries(exercise.expected).map(([variable, value]) => ({ variable, op: '==', value })) }
  const { approach, travel, ...map } = buildDataMap(index, condition)
  return {
    id: index + 43, world: 'datacentret', type: 'robot', ...map,
    title: `Rum ${index + 1} — ${exercise.title}`, concept: exercise.concept,
    objective: `${exercise.objective} Gå till panel A, lös datauppgiften och använd activate() för att öppna datagrinden. Nå sedan den gröna målrutan.`,
    availableCommands: [...exercise.commands, 'move()', 'turn_left()', 'turn_right()', 'activate()'],
    starterCode: `# ${exercise.title}\n${exercise.setup}\n\n# 1. Gå till panel A.\n\n# 2. Lös datauppgiften och använd activate().\n\n# 3. Gå genom datagrinden till målet.\n`,
    hints: [...exercise.hints, 'move() går en ruta. turn_left() och turn_right() svänger. Panel A kontrollerar hela innehållet: listornas ordning, registrets nycklar och värden samt eventuella beräkningar.', `Prova:\n${exercise.setup}\n\n# Gå till panel A.\n${approach}\n\n${exercise.solution}\nactivate()\n\n# Gå till målet.\n${travel}`],
    successTip: exercise.tip, showVariables: true,
    watchVariables: Object.keys(exercise.expected),
    successCheck: ctx => ctx.ranWithoutError && evaluateDoorCondition(condition, ctx.variables)
  }
})
