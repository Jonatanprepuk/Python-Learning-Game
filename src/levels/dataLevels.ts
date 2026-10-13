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
    title: 'Köa säkerhetskopior', concept: 'append() och len()',
    objective: 'Lägg "bilder" och sedan "loggar" sist i jobs med append(). Spara antalet jobb i count med len(). Behåll det första jobbet.',
    setup: 'jobs = ["databas"]', solution: 'jobs.append("bilder")\njobs.append("loggar")\ncount = len(jobs)',
    expected: { jobs: ['databas', 'bilder', 'loggar'], count: 3 }, commands: ['lista.append(värde)', 'len(lista)'],
    hints: ['append() lägger till ett värde sist och ändrar listan direkt.', 'Anropa jobs.append(...) två gånger. Räkna sedan med count = len(jobs).'],
    tip: 'append() ändrar listan på plats. Skriv inte jobs = jobs.append(...), eftersom metoden returnerar None.'
  },
  {
    title: 'Behandla första jobbet', concept: 'pop() tar bort och returnerar',
    objective: 'Ta bort första jobbet ur jobs med pop(0) och spara det i current. Lägg sedan "rapport" sist. Spara återstående antal jobb i remaining.',
    setup: 'jobs = ["databas", "bilder", "loggar"]', solution: 'current = jobs.pop(0)\njobs.append("rapport")\nremaining = len(jobs)',
    expected: { jobs: ['bilder', 'loggar', 'rapport'], current: 'databas', remaining: 3 }, commands: ['lista.pop(index)', 'lista.append(värde)', 'len(lista)'],
    hints: ['pop(0) tar bort första elementet och lämnar tillbaka det.', 'Spara returvärdet: current = jobs.pop(0). Lägg till rapporten efteråt.'],
    tip: 'Med pop() kan du både hämta ett värde och ta bort det ur kön.'
  },
  {
    title: 'Dela loggarkivet', concept: 'slicing utan att ändra originalet',
    objective: 'Skapa recent med de tre sista posterna i logs och archived med de två första. Använd slicing och behåll hela logs oförändrad.',
    setup: 'logs = ["start", "login", "backup", "scan", "logout"]', solution: 'recent = logs[-3:]\narchived = logs[:2]',
    expected: { logs: ['start', 'login', 'backup', 'scan', 'logout'], recent: ['backup', 'scan', 'logout'], archived: ['start', 'login'] }, commands: ['lista[start:stopp]', 'lista[-3:]', 'lista[:2]'],
    hints: ['En slice skapar en ny lista. Stoppindex ingår inte.', 'logs[-3:] tar allt från tredje sista posten. logs[:2] tar index 0 och 1.'],
    tip: 'Slicing låter dig dela upp data utan att plocka bort något ur källistan.'
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
    title: 'Serverns identitetskort', concept: 'skapa en dictionary',
    objective: 'Skapa registret server som en dictionary med nycklarna "name", "rack" och "online". Värdena ska vara "nova", 3 och True. rack ska vara ett tal och online ett booleskt värde.',
    setup: '', solution: 'server = {"name": "nova", "rack": 3, "online": True}',
    expected: { server: { name: 'nova', rack: 3, online: true } }, commands: ['register = {"nyckel": värde}'],
    hints: ['En dictionary använder klammerparenteser { }. Varje nyckel följs av kolon och ett värde.', 'Sätt citattecken runt nycklar och textvärden, men inte runt 3 eller True.'],
    tip: 'En dictionary slår upp värden med namn på nycklar i stället för positioner.'
  },
  {
    title: 'Utöka lagringsutrymmet', concept: 'läsa och uppdatera en nyckel',
    objective: 'Öka server["capacity"] med 50. Spara sedan ledigt utrymme i free genom att dra server["used"] från den nya kapaciteten. Behåll namn och använt utrymme.',
    setup: 'server = {"name": "atlas", "capacity": 100, "used": 65}', solution: 'server["capacity"] = server["capacity"] + 50\nfree = server["capacity"] - server["used"]',
    expected: { server: { name: 'atlas', capacity: 150, used: 65 }, free: 85 }, commands: ['register["nyckel"]', 'register["nyckel"] = värde'],
    hints: ['Läs det gamla värdet och addera 50 innan du sparar tillbaka på samma nyckel.', 'Beräkna free efter uppdateringen, så att den nya kapaciteten används.'],
    tip: 'Tilldelning till en befintlig nyckel uppdaterar bara det värdet.'
  },
  {
    title: 'Städa nätregistret', concept: 'lägga till och radera nycklar',
    objective: 'Lägg till "gateway": "10.0.0.1" i network. Radera nyckeln "legacy" med del. Behåll host och ip, och spara antalet kvarvarande nycklar i field_count.',
    setup: 'network = {"host": "nova", "ip": "10.0.0.8", "legacy": "gammal"}', solution: 'network["gateway"] = "10.0.0.1"\ndel network["legacy"]\nfield_count = len(network)',
    expected: { network: { host: 'nova', ip: '10.0.0.8', gateway: '10.0.0.1' }, field_count: 3 }, commands: ['register["nyckel"] = värde', 'del register["nyckel"]', 'len(register)'],
    hints: ['Tilldelning till en ny nyckel lägger till den i registret.', 'del network["legacy"] tar bort både nyckeln och dess värde.'],
    tip: 'len() räknar antalet nycklar i en dictionary.'
  },
  {
    title: 'Saknad inställning', concept: 'get() med standardvärde',
    objective: 'Läs "retries" ur config med standardvärdet 3 och spara i retries. Läs "timeout" med standardvärdet 30 och spara i timeout. Använd get(). Skapa sedan effective med dessa båda nycklar och värden. Behåll config oförändrad.',
    setup: 'config = {"timeout": 10}', solution: 'retries = config.get("retries", 3)\ntimeout = config.get("timeout", 30)\neffective = {"retries": retries, "timeout": timeout}',
    expected: { config: { timeout: 10 }, retries: 3, timeout: 10, effective: { retries: 3, timeout: 10 } }, commands: ['register.get("nyckel", standardvärde)'],
    hints: ['get() ger standardvärdet bara när nyckeln saknas. Det lägger inte till nyckeln i config.', 'timeout finns redan och ska därför behålla värdet 10.'],
    tip: 'get() låter programmet hantera saknade inställningar utan KeyError.'
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
    title: 'Räkna larmtyper', concept: 'frekvenstabell med get()',
    objective: 'Räkna hur många gånger varje larmtyp förekommer i events. Bygg counts med en for-loop och get(..., 0). Bara larmtyper som faktiskt förekommer ska finnas i counts. Behåll events.',
    setup: 'events = ["disk", "nät", "disk", "cpu", "nät", "disk"]\ncounts = {}', solution: 'for event in events:\n    counts[event] = counts.get(event, 0) + 1',
    expected: { events: ['disk', 'nät', 'disk', 'cpu', 'nät', 'disk'], counts: { disk: 3, nät: 2, cpu: 1 } }, commands: ['register.get(nyckel, 0)', 'for värde in lista:'],
    hints: ['En ny larmtyp börjar på 0. Öka sedan dess räknare med 1.', 'Använd event som nyckel, utan citattecken: counts[event].'],
    tip: 'En frekvenstabell växer när nya typer dyker upp och räknar dubbletter automatiskt.'
  },
  {
    title: 'Register inuti register', concept: 'nästlade dictionaries',
    objective: 'Öka bara atlas kapacitet med 20 i servers. Spara sedan atlas lediga utrymme i free. Nova och övriga fält ska vara oförändrade.',
    setup: 'servers = {"nova": {"capacity": 100, "used": 60}, "atlas": {"capacity": 80, "used": 70}}', solution: 'servers["atlas"]["capacity"] = servers["atlas"]["capacity"] + 20\nfree = servers["atlas"]["capacity"] - servers["atlas"]["used"]',
    expected: { servers: { nova: { capacity: 100, used: 60 }, atlas: { capacity: 100, used: 70 } }, free: 30 }, commands: ['register["server"]["fält"]'],
    hints: ['Första nyckeln väljer server, andra väljer fält i den serverns register.', 'servers["atlas"]["capacity"] är värdet som ska ändras.'],
    tip: 'Nästlade dictionaries beskriver flera objekt med egna egenskaper.'
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
    title: 'En säker testkopia', concept: 'kopiering och delade nästlade listor',
    objective: 'Skapa trial som en kopia av config med copy(). Kopiera även den inre listan "ports" så att den blir oberoende. Lägg 8080 sist i trial["ports"] och sätt trial["mode"] till "test". Originalet config måste förbli oförändrat.',
    setup: 'config = {"ports": [80, 443], "mode": "live"}', solution: 'trial = config.copy()\ntrial["ports"] = config["ports"].copy()\ntrial["ports"].append(8080)\ntrial["mode"] = "test"',
    expected: { config: { ports: [80, 443], mode: 'live' }, trial: { ports: [80, 443, 8080], mode: 'test' } }, commands: ['register.copy()', 'lista.copy()'],
    hints: ['trial = config ger två namn för samma objekt. copy() skapar en ny dictionary.', 'En ytlig kopia delar fortfarande den inre listan. Kopiera ports separat före append().'],
    tip: 'När datastrukturer är nästlade behöver du också kopiera de inre delar som ska ändras.'
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
