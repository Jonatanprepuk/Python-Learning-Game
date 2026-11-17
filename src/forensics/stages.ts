export interface ForensicsStage {
  id: number
  label: string
  title: string
  phase: string
  minutes: string
  message: string
  tasks: string[]
  deliverable: string
  hints: string[]
  guided: string
  independent: string
}
export const STAGES: ForensicsStage[] = [
  {
    id: 1, label: 'Identifiera', phase: 'Identification', minutes: '5–10 min', title: 'Vad är det vi ska undersöka?',
    message: 'Du är nätverksspecialist på Nordverk Design. Mira har samlat trafik från den 3 och 4 november. Ett aggregerat larm visar ovanlig extern trafik kvällen den 4:e, men pekar inte ut någon dator. Hon ber dig skilja en incident från vanliga arbetsflöden.',
    tasks: ['Läs överlämningen och jämför vilka nät och dagar som finns.', 'Välj minst två nät att börja jämföra. Du får ändra avgränsningen senare.', 'Formulera frågan som din undersökning ska besvara och kör kodmallen.'],
    deliverable: 'En sparad utredningsfråga och ett motiverat första urval. Inget nät är utpekat som rätt.',
    hints: ['En bra början är att jämföra samma nät båda dagarna.', 'Ett stort trafikflöde kan vara normalt. Du behöver även kunna undersöka alternativa förklaringar.'],
    guided: '# Välj nät från materialförteckningen.\nnetworks = ["10.20.10.0/24", "10.20.30.0/24"]\nquestion = "Vad förklarar den ovanliga externa trafiken den 4 november?"\n\nset_scope(networks, question)\n',
    independent: '# source_manifest() ger en lista med källornas metadata.\nmanifest = source_manifest()\nnetworks = []\n\n# Lägg till nät som ska ingå i din första avgränsning.\nquestion = ""\nset_scope(networks, question)\n'
  },
  {
    id: 2, label: 'Säkra', phase: 'Preservation', minutes: '5–10 min', title: 'Kan vi lita på arbetskopian?',
    message: 'Mira: ”Originalen ska ligga kvar. Min överlämning innehåller kontrollsummor. Gör arbetskopior och kontrollera att de har samma innehåll innan du börjar analysera.”',
    tasks: ['Läs källornas ursprung och SHA-256 i materialförteckningen.', 'Kör preserve_sources för de källor du vill säkra. Alla nio är en rimlig start.', 'Öppna Bevisjournal och kontrollera vad som faktiskt har kopierats och verifierats.'],
    deliverable: 'Verifierade arbetskopior med käll-ID, tid, metod och kontrollsumma. Hashen skyddar integritet, den avgör inte vilket nät som är misstänkt.',
    hints: ['SHA-256 är ett fingeravtryck av filens byte. Samma innehåll ger samma kontrollsumma.', 'I eget kodläge kan hashlib.sha256(read_original(id)).hexdigest() jämföras med manifestets sha256.'],
    guided: '# Alla källor från Miras överlämning.\nsource_ids = all_sources()\n\n# Skapar arbetskopior, beräknar SHA-256 och jämför.\npreserve_sources(source_ids)\n',
    independent: 'import hashlib\n\nfor source in source_manifest():\n    original = read_original(source["id"])\n    digest = hashlib.sha256(original).hexdigest()\n\n    # Komplettera kontrollen. Bevara bara en verifierad kopia.\n    if digest == source["sha256"]:\n        preserve_sources([source["id"]])\n'
  },
  {
    id: 3, label: 'Samla', phase: 'Collection', minutes: '5 min', title: 'Vilket underlag behöver du?',
    message: 'Mira: ”Sex trafikfiler täcker två dagar och tre nät. Adresslån, namnuppslag och driftanteckningar kommer från andra system. Samla in arbetskopiorna du vill använda och dokumentera varifrån de kommer.”',
    tasks: ['Välj käll-ID:n. Behåll föregående dag som jämförelse.', 'Samla in de bevarade arbetskopiorna med collect_sources.', 'Kontrollera att material och kompletterande loggar blir tillgängliga i arbetsytan. Du kan samla fler senare.'],
    deliverable: 'Ett undersökningsunderlag med spårbar källa. Du väljer själv om du börjar brett eller snävt.',
    hints: ['all_sources() tar med båda dagarna, alla nät och de tre kompletterande loggarna.', 'En ensam trafikfil kan visa ett mönster, men inte om mönstret var normalt dagen före.'],
    guided: '# Du kan ersätta all_sources() med en egen lista av käll-ID:n.\nsource_ids = all_sources()\ncollect_sources(source_ids)\n',
    independent: 'source_ids = []\n\n# Bygg din lista från source_manifest(), exempelvis efter dag/nät.\n# Glöm inte kompletterande loggar.\ncollect_sources(source_ids)\n'
  },
  {
    id: 4, label: 'Granska', phase: 'Examination', minutes: '15–20 min', title: 'Jämför mönster innan du väljer spår',
    message: 'Mira: ”Titta på kontor, studio och drift. Vilka stora överföringar återkommer båda dagarna? Vilka kontakter dyker upp först den 4:e? Jag vill se minst två hypoteser, även om du senare förkastar en av dem.”',
    tasks: ['Kör ett urval och byt mellan trafikfilerna. Prova även Konversationer för att jämföra mängder per dag.', 'Markera paket, läs detaljerna och följ konversationen. Radfärgerna visar protokoll, inte risk.', 'Spara minst två hypoteser i Anteckningar. Ange bevis-ID:n och en möjlig alternativ förklaring till varje.'],
    deliverable: 'Två prövbara hypoteser. Ett tomt filterresultat är också en observation, inget fel i sig.',
    hints: ['Börja brett med alla insamlade paket. Jämför samma källa och destination den 3 och 4 november.', 'Visningsfiltret ip.addr == 10.20.10.0/24 söker trafik till eller från det nätet. Använd ett annat nät för att pröva hypotesen igen.', 'Stora paket, mycket data och ovanliga portar är ledtrådar. De behöver sammanhang från andra källor.'],
    guided: '# Börja i ett nät. Byt fil-ID och jämför med dagen före.\nfiles = ["CAP-K-04"]\npackets = load_packets(files)\n\n# Tom text betyder att det filtret inte begränsar urvalet.\nselection = filter_packets(packets,\n    network="", host="", peer="", protocol="",\n    after="", before="", min_payload=0)\n\nshow_packets(selection)\n',
    independent: 'packets = load_packets()\nselection = []\n\nfor packet in packets:\n    # Ersätt True med ditt eget villkor.\n    # Fält: src, dst, protocol, time, payload_bytes, network.\n    if True:\n        selection.append(packet)\n\nshow_packets(selection)\n'
  },
  {
    id: 5, label: 'Analysera', phase: 'Analysis', minutes: '15–20 min', title: 'Håller din hypotes mot andra källor?',
    message: 'Mira: ”Förklara varför ett spår är mer oroande än de andra. IP-adresser kan ha bytt dator mellan dagarna. Ett okänt domännamn eller övertid bevisar inte ensamt ett intrång.”',
    tasks: ['Välj en kandidat och en extern motpart. Följ hela konversationen, inte bara de största datapaketen.', 'Kontrollera rätt dags DHCP-post, namnuppslaget och driftanteckningarna. Notera även vad som talar emot din hypotes.', 'Jämför med dagen före. Anteckna första anslutning, sista utgående datapaket och summan av utgående TCP-nyttolast.'],
    deliverable: 'En tidslinje, en koppling till rätt dator vid rätt tid och ett belagt resonemang. Resultaten bedöms först vid inlämningen.',
    hints: ['Använd YYYY-MM-DD HH:MM:SS när du filtrerar eller rapporterar. Alla tider är UTC.', 'Paketets length är hela Ethernet-ramen. payload_bytes är TCP-nyttolasten; det är fortfarande inte storleken på en okrypterad fil.', 'Följ konversation tar med båda riktningarna och även anslutningspaketen. Läs vilket adresslån som var giltigt vid händelsen.'],
    guided: '# Fyll i en kandidat från dina egna observationer.\ncandidate_ip = ""\npeer_ip = ""\npackets = load_packets()\n\nshow_timeline(packets, host=candidate_ip, peer=peer_ip)\nlookup("DHCP", candidate_ip)\nlookup("DNS", peer_ip)\nlookup("Drift")\n',
    independent: 'candidate_ip = ""\npeer_ip = ""\npackets = load_packets()\n\n# Skriv eget urval med båda riktningarna.\nselection = []\nfor packet in packets:\n    if candidate_ip in (packet["src"], packet["dst"]):\n        selection.append(packet)\n\n# Begränsa också till motpart och händelsedag.\nshow_timeline(selection)\nlookup("DHCP", candidate_ip)\nlookup("DNS", peer_ip)\nlookup("Drift")\n'
  },
  {
    id: 6, label: 'Presentera', phase: 'Presentation', minutes: '10 min', title: 'Skriv en rapport som någon annan kan följa',
    message: 'Mira: ”Skriv så att både IT och verksamhetschefen förstår slutsatsen. Visa vad du observerat, vad du bedömer och vad underlaget inte räcker till. Hänvisa till specifika spår och jämförelsematerial.”',
    tasks: ['Fyll i Rapport med sakuppgifter, tider och bevis-ID:n. Du kan använda formuläret eller Python.', 'Beskriv minst ett alternativt händelseförlopp och varför du bedömer det som svagare.', 'Spara ett utkast. Ingen rättning sker förrän du även valt nästa åtgärder i moment 7.'],
    deliverable: 'Ett sparat rapportutkast med slutsats, belägg, motargument och begränsningar.',
    hints: ['Markera källor och paket med Spara bevis. Käll-ID:t till en jämförelsefil kan belägga vilket tidsfönster du undersökt.', 'Trafikmetadata kan ge misstanke om datautflöde. Innehåll, ansvarig person och intrångsväg kan behöva andra loggar.'],
    guided: '# Formuläret Rapport och denna kod redigerar samma utkast.\nreport = report_draft()\n\n# Exempel på ett fält att fylla i med ditt eget fynd:\nreport["source_ip"] = ""\n\nsave_report(report)\n',
    independent: '# Bygg gärna en egen sammanställning innan du sparar.\nreport = report_draft()\n\n# Använd dina beräknade värden och egna slutsatser.\n# Fälten visas i formuläret Rapport.\nsave_report(report)\n'
  },
  {
    id: 7, label: 'Åtgärda', phase: 'Response', minutes: '5–10 min', title: 'Vad bör företaget göra nu?',
    message: 'Mira: ”Vi behöver begränsa en möjlig skada utan att förstöra spår eller stoppa hela verksamheten i onödan. Vad föreslår du, vilket underlag saknas och hur kan det här förebyggas?”',
    tasks: ['Välj en omedelbar åtgärd, nästa datakälla och en förebyggande förändring i Rapport.', 'Motivera avvägningen och kontrollera att rapporten hänvisar till insamlat material.', 'Lämna in hela utredningen för återkoppling. Gå tillbaka och pröva nya urval om du behöver.'],
    deliverable: 'En inlämnad utredning. Sakuppgifter och åtgärdsval granskas då; resonemangen används i en gemensam genomgång.',
    hints: ['En åtgärd bör ha ett tydligt mål och så begränsad påverkan som möjligt.', 'Vilken källa kan berätta vilket program som kommunicerade och vilka filer det läste?'],
    guided: '# Du kan fortsätta använda alla verktyg innan du lämnar in.\n# Åtgärdsförslag väljer du i formuläret Rapport.\nprint("Kontrollera belägg, alternativa förklaringar och åtgärder.")\n',
    independent: '# Använd detta som fri analysyta före inlämningen.\npackets = load_packets()\nshow_conversations(packets)\n'
  }
]
