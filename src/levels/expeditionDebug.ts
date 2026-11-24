import type { Assignment } from './expeditionAdvanced'

// Both starters are complete, executable programs. Only their route plans
// are faulty; successful alternatives are accepted by the simulation.
export const DEBUG_ASSIGNMENTS: Assignment[] = [
  {
    title: 'Felsökning: batteriet tar slut',
    concept: 'felsöka en körbar rutt och planera laddstopp',
    story: 'Två områden med laddningsslingor skiljer roboten från utgången. Den raka leveransrutten tömmer batteriet. Planera laddningen genom båda områdena och återställ tre reläer längs huvudgången.',
    instructions: [
      'Kör först startkoden oförändrad. Följ energin och robotens position, eller använd Felsök och Nästa steg. Läs fram() och kor(): hur används verktygen, och när samlas en cell?',
      'Ändra route och planera två laddningsetapper. Vid båda områdena finns en nordlig och en sydlig slinga. Du kan kombinera dem på fyra olika sätt, men måste räkna steg, verktyg och tidpunkten för varje laddning.',
      'Behåll hjälpfunktionerna och startenergin. N/E/S/W är norr/öster/söder/väster. Reparera alla tre reläer och spara energi till slutsträckan. Celler på den valda vägen behövs; du behöver inte samla celler i slingor du inte använder.'
    ],
    width: 19, height: 11, start: [1, 5], goal: [17, 5],
    corridors: [[1, 5, 'EEEEEEEEEEEEEEEE'], [3, 5, 'NNNEEEESSS'], [3, 5, 'SSSEEEENNN'], [9, 5, 'NNEEEESS'], [9, 5, 'SSSEEEENNN']],
    objects: [
      [3, 4, 'resource'], [3, 3, 'rock'], [5, 2, 'resource'], [7, 4, 'resource'],
      [3, 6, 'gap'], [3, 7, 'resource'], [5, 8, 'resource'], [7, 6, 'resource'],
      [9, 4, 'resource'], [10, 3, 'resource'], [11, 3, 'storm'], [13, 4, 'resource'],
      [9, 6, 'resource'], [10, 8, 'resource'], [11, 8, 'rock'], [13, 6, 'resource'],
      [8, 5, 'beacon'], [14, 5, 'beacon'], [16, 5, 'beacon']
    ],
    energy: 7,
    data: '# Befintlig färdplan: kör raka vägen till utgången.\n# Uppdrag: hitta varför den misslyckas och planera om route.',
    starter: `route = [["E", 16]]
facing = kor(route, "E")
print("Pa malrutan:", at_goal())
print("Energi kvar:", scan()["energy"])`,
    solution: `# En lösning: norra laddningsslingan i båda områdena.
route = [["E", 2], ["N", 3], ["E", 4], ["S", 3], ["E", 2], ["N", 2], ["E", 4], ["S", 2], ["E", 4]]
facing = kor(route, "E")
print("Pa malrutan:", at_goal())
print("Energi kvar:", scan()["energy"])`,
    hint: 'Första vägskälet ligger två steg österut. Första områdets slingor går tre steg norrut/söderut, fyra österut och tre tillbaka. Efter återanslutningen: två steg österut till nästa vägskäl. Där är norra slingan två rutor djup, södra tre. Spara sex energi till sista huvudsträckans fyra steg och två reläer.',
    check: () => true
  },
  {
    title: 'Felsökning: det bortglömda reläet',
    concept: 'felsöka uppdragsvillkor och lägga om en rutt',
    story: 'Serviceprogrammet laddar i två områden och når utgången, men bara två av tre reläer är reparerade. Det missade reläet ligger i första områdets norra slinga. Planera om utan att förlora nödvändiga laddstopp.',
    instructions: [
      'Kör startkoden oförändrad. Jämför konsolens at_goal() med reläräknaren. Att stå på målrutan innebär inte att alla uppdragsvillkor är uppfyllda.',
      'Läs scan(), use_tool() och fram(). De hanterar bara rutan framför roboten. Första områdets norra slinga kan ersätta den södra laddningsvägen, eller besökas från höger efter den södra slingan.',
      'Andra området har ytterligare två laddningsvägar med olika verktygskostnader. Jämför energin innan du väljer väg. Behåll hjälpfunktionerna och nå målet med alla tre reläer reparerade; en omväg utan tillräcklig laddning kan skapa ett nytt fel.'
    ],
    width: 17, height: 11, start: [1, 5], goal: [15, 5],
    corridors: [[1, 5, 'EEEEEEEEEEEEEE'], [3, 5, 'NNNEEEESSS'], [3, 5, 'SSSEEEENNN'], [9, 5, 'NNEEESS'], [9, 5, 'SSEEENN']],
    objects: [
      [3, 4, 'resource'], [4, 2, 'rock'], [5, 2, 'beacon'], [6, 2, 'resource'], [7, 4, 'resource'],
      [3, 6, 'resource'], [3, 7, 'gap'], [5, 8, 'resource'], [7, 6, 'resource'],
      [9, 4, 'resource'], [10, 3, 'storm'], [12, 4, 'resource'],
      [9, 6, 'resource'], [10, 7, 'rock'], [12, 6, 'resource'],
      [9, 5, 'beacon'], [11, 5, 'storm'], [14, 5, 'beacon']
    ],
    energy: 12,
    data: '# Befintlig färdplan: målrutan nås, men räcker det för att klara uppdraget?',
    starter: `route = [["E", 2], ["S", 3], ["E", 4], ["N", 3], ["E", 2], ["S", 2], ["E", 3], ["N", 2], ["E", 3]]
facing = kor(route, "E")
print("Pa malrutan:", at_goal())
print("Energi kvar:", scan()["energy"])`,
    solution: `# En lösning: första områdets norra och andra områdets södra slinga.
route = [["E", 2], ["N", 3], ["E", 4], ["S", 3], ["E", 2], ["S", 2], ["E", 3], ["N", 2], ["E", 3]]
facing = kor(route, "E")
print("Pa malrutan:", at_goal())
print("Energi kvar:", scan()["energy"])`,
    hint: 'Det missade reläet ligger två steg öster om första norra slingans vänstra hörn. Från höger kan du nå det och vända tillbaka utan att borra stenen till vänster. Samla nya celler under omvägen: redan insamlade celler laddar inte igen. at_goal() kontrollerar bara positionen, inte reläerna.',
    check: () => true
  }
]
