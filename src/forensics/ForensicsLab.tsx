import { useEffect, useMemo, useRef, useState } from 'react'
import { CodeEditor } from '../editor/CodeEditor'
import { PACKETS, SOURCES, LOGS, freshInvestigation, formatBytes } from './case'
import type { InvestigationState, Packet } from './case'
import { STAGES } from './stages'
import { LESSONS } from './lessons'
import { FORENSICS_HELPERS } from './python'
import { compileDisplayFilter } from './displayFilter'
import { STORAGE_KEY, restoreInvestigation, applyEvents } from './state'
import { evidenceIds, isAvailableEvidence, reviewInvestigation } from './grading'
import { MaterialView, PacketView, ConversationView, LogsView, JournalView, NotesView, ReportView } from './LabViews'
import { useForensicsRunner } from './useForensicsRunner'
import './forensics.css'

type View = 'material' | 'packets' | 'conversations' | 'timeline' | 'logs' | 'notes' | 'journal' | 'report'
const VIEWS: { id: View; label: string }[] = [
  { id: 'material', label: 'Material' }, { id: 'packets', label: 'Paket' },
  { id: 'conversations', label: 'Konversationer' }, { id: 'timeline', label: 'Tidslinje' },
  { id: 'logs', label: 'Loggar' }, { id: 'notes', label: 'Labblogg' },
  { id: 'journal', label: 'Bevisjournal' }, { id: 'report', label: 'Rapport' }
]
const stageViews: View[] = ['material', 'material', 'material', 'packets', 'timeline', 'report', 'report']
function load() { try { return restoreInvestigation(localStorage.getItem(STORAGE_KEY)) } catch { return freshInvestigation() } }

export function ForensicsLab({ onBack }: { onBack: () => void }) {
  const [state, setState] = useState<InvestigationState>(load)
  const [view, setView] = useState<View>(() => stageViews[load().stage - 1])
  const [sourceId, setSourceId] = useState(SOURCES[0].id)
  const [captureId, setCaptureId] = useState('all')
  const [resultIds, setResultIds] = useState<string[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filterText, setFilterText] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [filterError, setFilterError] = useState('')
  const [notice, setNotice] = useState('')
  const [hintLevel, setHintLevel] = useState(0)
  const [instructionsOpen, setInstructionsOpen] = useState(true)
  const [resetOpen, setResetOpen] = useState(false)
  const [timelineHost, setTimelineHost] = useState('')
  const [logResultIds, setLogResultIds] = useState<string[] | null>(null)
  const [storageProblem, setStorageProblem] = useState(false)
  const runToken = useRef(0)
  const runner = useForensicsRunner()
  const busy = runner.phase === 'running'
  const stage = STAGES[state.stage - 1]
  const lesson = LESSONS[state.stage - 1]
  const codeKey = `${state.stage}:${state.mode}`
  const code = state.codes[codeKey] ?? stage[state.mode]
  const pinned = evidenceIds(state.report.evidence)
  const available = useMemo(() => PACKETS.filter(packet => state.collected.includes(packet.source_id)), [state.collected])
  const rows = useMemo(() => {
    const ids = resultIds ? new Set(resultIds) : null
    const predicate = compileDisplayFilter(activeFilter)
    return available.filter(packet => (!ids || ids.has(packet.id)) && (captureId === 'all' || captureId === packet.source_id) && predicate(packet))
  }, [available, resultIds, captureId, activeFilter])
  const selected = rows.find(packet => packet.id === selectedId)
  const logs = LOGS.filter(row => state.collected.includes(row.source_id) && (!logResultIds || logResultIds.includes(row.id)))

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); setStorageProblem(false) }
    catch { setStorageProblem(true) }
  }, [state])
  useEffect(() => () => { runToken.current += 1 }, [])

  function update(changes: Partial<InvestigationState>) {
    setState(previous => ({ ...previous, ...changes, reviewed: undefined }))
  }
  function changeStage(id: number) {
    if (busy) return
    setState(previous => ({ ...previous, stage: id }))
    setView(stageViews[id - 1]); setHintLevel(0); setNotice(''); runner.clearView()
  }
  function clearSelection() {
    setResultIds(null); setCaptureId('all'); setFilterText(''); setActiveFilter(''); setFilterError(''); setSelectedId(null)
  }
  function applyFilter() {
    try { compileDisplayFilter(filterText); setActiveFilter(filterText); setFilterError(''); setSelectedId(null) }
    catch (error) { setFilterError(error instanceof Error ? error.message : String(error)) }
  }
  function follow(packet: Packet) {
    clearSelection()
    const expression = packet.protocol === 'DNS' ? `ip.addr == ${packet.src} && dns` : `tcp.stream == ${packet.stream}`
    setFilterText(expression); setActiveFilter(expression); setSelectedId(packet.id); setTimelineHost(packet.src.startsWith('10.20.') ? packet.src : packet.dst); setView('packets')
    setNotice('Hela konversationen visas från dina insamlade filer. Inspektera även anslutningspaket och motsatt riktning.')
  }
  function pin(id: string) {
    if (!isAvailableEvidence(id, state.collected)) { setNotice('Samla in denna källa innan du hänvisar till den.'); return }
    const refs = [...new Set([...pinned, id])]
    update({ report: { ...state.report, evidence: refs.join(', ') } })
    setNotice(`${id} sparat som bevisreferens. Det är du som motiverar vad spåret visar.`)
  }
  async function run() {
    const token = ++runToken.current
    setNotice('')
    const outcome = await runner.run(code, state)
    if (token !== runToken.current) return
    // Preserve completed operations even if a later statement fails. No event
    // in this path checks the learner's candidate against the solution.
    setState(previous => applyEvents(previous, outcome.events))
    const lastPackets = outcome.events.filter(event => event.packets).slice(-1)[0]
    const logEvents = outcome.events.filter(event => event.kind === 'logs')
    if (lastPackets?.packets) {
      clearSelection(); setResultIds(lastPackets.packets.map(packet => packet.id))
      setView(lastPackets.kind === 'timeline' ? 'timeline' : lastPackets.kind === 'conversations' ? 'conversations' : 'packets')
    } else if (outcome.events.some(event => event.kind === 'conversations')) {
      const packets = outcome.events.filter(event => event.packets).flatMap(event => event.packets ?? [])
      if (packets.length) { clearSelection(); setResultIds(packets.map(packet => packet.id)) }
      setView('conversations')
    } else if (logEvents.length) setView('logs')
    else if (outcome.events.some(event => ['preserved', 'collected'].includes(event.kind))) setView('material')
    else if (outcome.events.some(event => event.kind === 'report_draft')) setView('report')
    if (logEvents.length) setLogResultIds(logEvents.flatMap(event => event.records?.map(record => record.id) ?? []))
    if (!outcome.error) setNotice('Experimentet är kört. Beskriv vad du ser och vilket urval du vill pröva härnäst.')
  }
  function reset() {
    runToken.current++; runner.restart(); setState(freshInvestigation()); clearSelection()
    setView('material'); setSourceId(SOURCES[0].id); setHintLevel(0); setLogResultIds(null)
    setResetOpen(false); setInstructionsOpen(true); setTimelineHost(''); setNotice('Ett nytt labbärende är öppnat.')
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  const dataView = ['packets', 'conversations', 'timeline'].includes(view)
  const first = rows[0]?.time ?? '—'
  const last = rows[rows.length - 1]?.time ?? '—'
  const timelineBytes = rows.filter(packet => packet.src === timelineHost).reduce((sum, packet) => sum + packet.payload_bytes, 0)
  const output = runner.events.filter(event => event.kind === 'console')

  return <div className="nv-lab">
    <header className="nv-header"><a href={import.meta.env.BASE_URL} onClick={event => { event.preventDefault(); onBack() }}>← Till kursen</a><div className="nv-brand">N<span>_</span> <strong>NORDVERK</strong><span className="nv-brand-divider">/</span><span>FORENSIKLABB</span></div><span className="nv-case-id">NV-041 · UTBILDNINGSSIMULERING · UTC</span></header>
    <main className="nv-shell">
      <div className="nv-titlebar"><div><span className="nv-overline">DU ÄR NÄTVERKSSPECIALIST PÅ NORDVERK DESIGN</span><h1>Två dagar. Tre nät. Vad avviker?</h1></div><div className="nv-title-tools"><span>En labb att utforska i egen takt</span><button className="nv-link-button" onClick={() => setInstructionsOpen(open => !open)} aria-expanded={instructionsOpen}>{instructionsOpen ? 'Fäll ihop' : 'Visa'} labbinstruktionen</button></div></div>
      <nav className="nv-stages" aria-label="Labbens moment">{STAGES.map(item => <button key={item.id} disabled={busy} className={state.stage === item.id ? 'is-active' : ''} aria-current={state.stage === item.id ? 'step' : undefined} onClick={() => changeStage(item.id)}><span>{String(item.id).padStart(2, '0')}</span>{item.label}</button>)}</nav>
      <section className="nv-instruction"><div className="nv-task"><span className="nv-overline">MOMENT {stage.id} · {stage.phase.toUpperCase()} · CIRKA {stage.minutes}</span><h2>{stage.title}</h2>{instructionsOpen && <><p className="nv-story">{stage.message}</p><ol>{stage.tasks.map(task => <li key={task}>{task}</li>)}</ol></>}<p className="nv-deliverable"><strong>Att ta med vidare:</strong> {stage.deliverable}</p><div className="nv-task-actions">{state.stage > 1 && <button className="nv-link-button" disabled={busy} onClick={() => changeStage(state.stage - 1)}>← Föregående</button>}{state.stage < 7 && <button className="nv-button" disabled={busy} onClick={() => changeStage(state.stage + 1)}>Vidare till {STAGES[state.stage].label.toLowerCase()} →</button>}</div></div>{instructionsOpen && <aside className="nv-learn"><span className="nv-overline">LÄR DIG PÅ VÄGEN</span><h3>{lesson.title}</h3><p>{lesson.text}</p><details><summary>Ett experiment att börja med</summary><p>{lesson.experiment}</p></details><div className="nv-reflect"><strong>Fundera på</strong><p>{lesson.question}</p></div></aside>}</section>
      <div className="nv-workbench">
        <section id="nv-analysis" className="nv-analyzer" aria-label="Analysarbetsyta"><div className="nv-window-bar"><span className="nv-window-dots">● ● ●</span><strong>NV-041 / {VIEWS.find(item => item.id === view)?.label}</strong><span>{state.collected.length} av 9 källor insamlade</span></div><nav className="nv-tabs" aria-label="Arbetsvyer">{VIEWS.map(item => <button key={item.id} aria-pressed={view === item.id} onClick={() => setView(item.id)}>{item.label}{item.id === 'notes' && state.observations.length > 0 ? ` (${state.observations.length})` : ''}</button>)}</nav>
          {dataView && <div className="nv-filterbar"><div className="nv-filter-row"><label htmlFor="nv-capture">Trafikfil</label><select id="nv-capture" value={captureId} onChange={event => { setCaptureId(event.target.value); setResultIds(null); setSelectedId(null) }}><option value="all">Alla insamlade trafikfiler</option>{SOURCES.filter(source => source.kind === 'capture' && state.collected.includes(source.id)).map(source => <option key={source.id} value={source.id}>{source.filename}</option>)}</select><button className="nv-link-button" onClick={clearSelection}>Visa alla insamlade</button></div><form onSubmit={event => { event.preventDefault(); applyFilter() }}><span className="nv-filter-symbol">⌕</span><input aria-label="Visningsfilter" value={filterText} onChange={event => setFilterText(event.target.value)} placeholder="Visningsfilter, t.ex. tls && tcp.len > 1000" spellCheck={false} /><button className="nv-button nv-button--primary" type="submit">Använd</button></form>{filterError && <p className="nv-inline-error" role="alert">{filterError}</p>}<div className="nv-filter-meta"><span>{rows.length} visade / {available.length} insamlade paket{resultIds ? ' · Pythonurval aktivt' : ''}{activeFilter ? ' · visningsfilter aktivt' : ''}</span><details><summary>Filterhjälp</summary><p>Stöder ip.addr, ip.src, ip.dst, tcp.port, tcp.stream, tcp.len, frame.len, frame.time samt tcp, tls, dns och http. Använd ==, !=, &gt;, &gt;=, &lt;, &lt;=, &amp;&amp;, || och parenteser. Texttider skrivs inom citattecken. Detta är ett begränsat utbildningsfilter.</p><code>ip.addr == 10.20.10.0/24 &amp;&amp; tls</code></details></div></div>}
          <div className="nv-view">
            {view === 'material' && <MaterialView state={state} selectedId={sourceId} onSelect={setSourceId} onOpen={id => { clearSelection(); const source = SOURCES.find(item => item.id === id)!; setCaptureId(source.kind === 'capture' ? id : 'all'); setLogResultIds(null); setView(source.kind === 'capture' ? 'packets' : 'logs') }} pinned={pinned} onPin={pin} />}
            {view === 'packets' && <PacketView packets={rows} selected={selected} onSelect={packet => setSelectedId(packet.id)} onFollow={follow} pinned={pinned} onPin={pin} />}
            {view === 'conversations' && <ConversationView packets={rows} onChoose={(src, dst) => { clearSelection(); const filter = `ip.addr == ${src} && ip.addr == ${dst}`; setActiveFilter(filter); setFilterText(filter); setTimelineHost(src); setView('packets') }} />}
            {view === 'timeline' && <><div className="nv-timeline-summary"><div><span>Första paket i urvalet</span><strong>{first}</strong></div><div><span>Sista paket i urvalet</span><strong>{last}</strong></div><label>Summera TCP-nyttolast från<input aria-label="Källadress för summering" value={timelineHost} onChange={event => setTimelineHost(event.target.value)} placeholder="Din valda käll-IP" /><strong>{timelineHost ? `${timelineBytes.toLocaleString('sv-SE')} byte (${formatBytes(timelineBytes)})` : 'Välj en källa'}</strong></label></div><PacketView packets={rows} selected={selected} onSelect={packet => setSelectedId(packet.id)} onFollow={follow} pinned={pinned} onPin={pin} /></>}
            {view === 'logs' && <><div className="nv-log-reset"><span>{logResultIds ? 'Träffar från senaste Python-uppslaget' : 'Alla insamlade loggar'}</span><button className="nv-link-button" onClick={() => setLogResultIds(null)}>Visa alla insamlade loggar</button></div><LogsView records={logs} onPin={pin} pinned={pinned} /></>}
            {view === 'journal' && <JournalView state={state} />}
            {view === 'notes' && <NotesView state={state} pinned={pinned} onChange={observations => update({ observations })} />}
            {view === 'report' && <ReportView state={state} stage={state.stage} busy={busy} onUpdate={update} onSubmit={() => { setState(previous => ({ ...previous, reviewed: reviewInvestigation(previous) })); setNotice('Miras återkoppling finns under rapporten. Fortsätt gärna med ett nytt experiment.') }} />}
          </div>
          <div className="nv-statusbar" role="status"><span className={busy ? 'nv-running-dot' : ''}>●</span><p>{busy ? runner.events.slice(-1)[0]?.message ?? 'Python undersöker ditt urval…' : notice || 'Utforska materialet. Ingen hypotes bedöms innan du ber om en genomgång.'}</p></div>
        </section>
        <aside className="nv-python-panel" aria-label="Pythonverkstad"><div className="nv-python-top"><span>PYTHONVERKSTAD</span><span>moment_{state.stage}.py</span></div><div className="nv-code-modes" aria-label="Kodstöd"><button aria-pressed={state.mode === 'guided'} disabled={busy} onClick={() => update({ mode: 'guided' })}>Färdiga verktyg</button><button aria-pressed={state.mode === 'independent'} disabled={busy} onClick={() => update({ mode: 'independent' })}>Skriv mer själv</button></div><p className="nv-code-guidance">{state.mode === 'guided' ? 'Börja med kodmallen. Ändra värden och använd färdiga funktioner; du får redigera all kod.' : 'Skriv egna loopar, villkor och beräkningar. Samma paket och funktioner finns tillgängliga. Dina två kodversioner sparas separat.'}</p><div className="nv-runbar"><button className="nv-button nv-button--primary" disabled={runner.phase !== 'ready'} onClick={run}>{busy ? 'Undersöker…' : runner.phase === 'loading' ? 'Laddar Python…' : '▶ Kör experimentet'}</button>{busy ? <button className="nv-link-button" onClick={() => { runToken.current++; runner.restart(); setNotice('Körningen avbruten. Dina tidigare anteckningar finns kvar.') }}>Avbryt</button> : <button className="nv-link-button" onClick={() => update({ codes: { ...state.codes, [codeKey]: stage[state.mode] } })}>Återställ mall</button>}</div><div className="nv-result-note"><p>{busy ? "Experimentet körs i Python…" : runner.events.length ? runner.events[runner.events.length - 1].message : "Urval och loggträffar visas i arbetsytan."}</p><a href="#nv-analysis">Visa arbetsytan ↓</a></div><div className="nv-editor"><CodeEditor value={code} onChange={value => update({ codes: { ...state.codes, [codeKey]: value } })} highlightedLine={runner.line} readOnly={busy} /></div>
          {runner.error && <div className="nv-python-error" role="alert"><strong>Koden behöver justeras{runner.line ? ` · rad ${runner.line}` : ''}</strong><p>{runner.error}</p>{runner.phase === 'error' && <button className="nv-link-button" onClick={runner.restart}>Starta om Python</button>}</div>}
          <div className="nv-output"><span className="nv-overline">UTSKRIFT / EGNA BERÄKNINGAR</span><pre>{output.map(event => event.message).join('') || 'Använd print(...) för att undersöka värden.\nResultat är observationer, inte rätt/fel.'}</pre></div><div className="nv-hints"><button className="nv-link-button" onClick={() => setHintLevel(value => Math.min(value + 1, stage.hints.length))}>Ge mig {hintLevel ? 'ytterligare ' : ''}stöd för nästa experiment</button>{stage.hints.slice(0, hintLevel).map(hint => <p key={hint}>{hint}</p>)}</div><details className="nv-tools-help"><summary>Verktygsreferens och paketfält</summary><p>load_packets(["CAP-K-04"]) läser arbetskopior. Utelämna listan för alla insamlade trafikfiler.</p><p>filter_packets(...), show_packets(...), show_conversations(...), show_timeline(...) och lookup("DHCP" | "DNS" | "Drift", söktext) hjälper dig att undersöka.</p><p>Varje paket är en dictionary: id, no, source_id, network, time, src, dst, src_port, dst_port, protocol, length, payload_bytes, stream, flags och info.</p><p>Färdiga verktyg använder samma data som din egen kod. Ändra kopior i Python för egna beräkningar, men visa oförändrade originalposter med show_packets.</p><details><summary>Läs hjälpfunktionernas Python</summary><pre>{FORENSICS_HELPERS}</pre></details></details>
        </aside>
      </div>
      <section className="nv-lab-summary"><div><span>Avgränsning</span><strong>{state.scope.networks.join(' · ') || 'Ingen sparad avgränsning ännu'}</strong></div><div><span>Arbetskopior / insamlade källor</span><strong>{state.preserved.length} / {state.collected.length}</strong></div><div><span>Prövade hypoteser</span><strong>{state.observations.length}</strong></div><div><span>Sparade bevisreferenser</span><strong>{pinned.length}</strong></div></section><details className="nv-history"><summary>Undersökningshistorik · {state.history.length} körda urval</summary>{state.history.slice().reverse().map((item, i) => <p key={`${item.time}-${i}`}><time>{item.time.slice(11, 19)}</time> {item.description}</p>)}</details>
      <footer className="nv-footer"><span>{storageProblem ? 'Lokal lagring är inte tillgänglig. Dina ändringar finns kvar så länge sidan är öppen.' : 'Utkast och labblogg sparas i denna webbläsare.'} Alla företag, adresser och händelser i fallet är påhittade.</span><button className="nv-link-button" disabled={busy} onClick={() => setResetOpen(value => !value)}>Starta en ny labbomgång</button></footer>{resetOpen && <div className="nv-reset"><p>Detta tar bort denna labbomgångs kod, anteckningar och utkast. Den tidigare versionens sparade ärende påverkas inte.</p><button className="nv-button" onClick={() => setResetOpen(false)}>Behåll min labb</button><button className="nv-button nv-button--primary" onClick={reset}>Starta om labben</button></div>}
    </main>
  </div>
}
