# Forensiklabben — Nordverk Design

Den första övningen är ersatt med en ny labb på branchen `Forensik`. Ingången är fortfarande `/Python-Learning-Game/forensik`, eller den diskreta länken under **Fler övningar** på kursens startsida.

## Pedagogisk riktning

Deltagaren arbetar som nätverksspecialist på det påhittade företaget Nordverk Design. Kollegan Mira lämnar över två dagars trafik från kontor, studio och drift. Ett aggregerat kvällslarm behöver undersökas; det anger ingen säker källdator.

Labben är avsedd för cirka 60–90 minuter efter en introduktion. Deltagaren ska kunna lära sig under arbetet, ändra uppfattning och gå tillbaka. Den har ingen poängräkning eller automatisk rätt/fel-bedömning under undersökningen.

Varje moment innehåller:

- En berättelse som förklarar varför uppgiften behövs.
- Tre konkreta arbetssteg och ett tydligt förslag på vad som ska dokumenteras.
- En kort begreppsförklaring, ett första experiment och en reflektionsfråga.
- Stegvisa stödfrågor som föreslår nästa undersökning utan att ge en facitadress.

Alla moment går att läsa i valfri ordning. Materialåtkomst följer de praktiska förutsättningarna: en källa måste ha en verifierad arbetskopia innan den samlas in, och vara insamlad innan den kan analyseras.

## Berättelsen och progressionen

| Moment | Deltagaren lär sig och gör | Underlag att ta med |
| --- | --- | --- |
| Identifiera | Läser överlämningen, formulerar en fråga och väljer första nät att jämföra. | Fråga och avgränsning som kan ändras. |
| Säkra | Jämför SHA-256 på en bytekopia med Miras manifest och läser hanteringsjournalen. | Verifierade arbetskopior; källa, metod och tid. |
| Samla | Väljer trafikfiler och kompletterande loggar, med föregående dag som jämförelse. | Spårbart undersökningsunderlag. |
| Granska | Provar filter, läser paketfält, jämför kontakter mellan nät och dagar. | Minst två hypoteser med belägg och alternativa förklaringar. |
| Analysera | Följer hela konversationer, summerar nyttolast och kontrollerar DHCP, DNS och driftloggar. | Tidslinje, rätt dator vid rätt tid och ett resonemang. |
| Presentera | Skriver ett rapportutkast med sakuppgifter, bevis, motargument och osäkerhet. | Rapport att diskutera, inte ett omedelbart rättat svar. |
| Åtgärda | Föreslår begränsning, nästa datakälla och förebyggande förändring. | En motiverad avvägning och avslutande labbgenomgång. |

## Två sätt att använda Python

**Färdiga verktyg:** deltagaren börjar med fungerande mallar, ändrar fil-ID:n och filtervärden och använder exempelvis `filter_packets`, `lookup` och `show_timeline`.

**Skriv mer själv:** deltagaren får glesare mallar och kan skriva loopar, villkor, jämförelser och beräkningar över samma paket. Båda kodversionerna sparas separat per moment. All kod får redigeras i båda lägena.

Paket är dictionaries. Hjälpfunktionerna är vanlig Python i samma Pyodide-motor som det övriga spelet. De kan läsas i verktygsreferensen. Inga verkliga nätverksanslutningar görs.

## Arbetsytan

Den grafiska nätverkskartan är borttagen. Arbetsytan är inspirerad av Wiresharks paketlista, paketdetaljer och bytevy:

- Materialförteckning över sex trafikfiler och tre loggkällor.
- 1 712 syntetiska paket med rimliga ramstorlekar, beständiga ID:n, tider och protokollfält.
- Valbar trafikfil och ett begränsat Wireshark-liknande visningsfilter.
- Paketdetaljer som förklarar exempelvis SYN, ACK, källadress, destination och TCP-nyttolast.
- Bytevy som visar samma syntetiska rambyte som finns i arbetskopian.
- Konversationer som jämför utgående kontakter per dag och motpart.
- Tidslinje, kompletterande loggar, bevisjournal, labblogg och rapport.

Visningsfilter ändrar urvalet, inte originalmaterialet. Tomma urval förklaras som något att undersöka vidare, inte som felaktiga svar. Radfärger anger protokoll och markerar ingen trafik som farlig.

## Reflektion och återkoppling

Stora legitima flöden finns i materialet. Den som väljer största överföringen behöver jämföra med föregående dag och planerad verksamhet. Ett dynamiskt adresslån gör att rätt tidpunkt behövs för att identifiera datorn.

Deltagaren väljer själv vilka spår som ska sparas. Labbloggen skiljer hypotes, belägg och alternativ förklaring. Det finns ingen automatisk överföring av facitsvar till senare moment.

När deltagaren väljer **Be Mira om återkoppling** granskas sakuppgifter, källhantering, bevisreferenser och åtgärdsval. Återkopplingen pekar på vad som kan styrkas och vad som behöver undersökas vidare, utan betyg eller poäng. Den kontrollerar att resonemang finns, men bedömer inte fritextens kvalitet. Resonemangen och de avslutande diskussionsfrågorna är avsedda för en gemensam genomgång.

Arbetet kan fortsätta efter återkopplingen. En ny omgång kan startas separat. Version 2 använder en egen lagringsnyckel och skriver inte över den första prototypens sparade ärende.

## Utveckling och verifiering

- Fall, ramar, loggar och manifest: `src/forensics/case.ts` och `hashes.json`.
- Instruktioner och kodstöd: `stages.ts`; begrepp och experiment: `lessons.ts`.
- Pythonverktyg: `python.ts`; slutlig återkoppling: `grading.ts`.
- Filtrering: `displayFilter.ts`; lagring och händelser: `state.ts`.
- UI: `ForensicsLab.tsx`, `LabViews.tsx`, `forensics.css`.

Kör `npm run dev`, `npm run test:forensics` och `npm run build`. Om det syntetiska materialet avsiktligt ändras, uppdatera Miras kontrollsummor med `node scripts/refresh-forensics-hashes.mjs`. Tester kontrollerar oberoende att manifestet stämmer mot filernas byte.

Pyodide laddas från projektets befintliga CDN. Binärfilerna är syntetiska PCAP-behållare med Ethernet/IPv4-ramar; avkodade TLS-fält i labben är pedagogiska fixturedata, inte en fullständig TLS-dissektor eller importfunktion för godtyckliga PCAP-filer. Ramstorlek, TCP-nyttolast och filinnehåll ska hållas isär i undervisningen.

## Referenser

- [Wireshark: paketlistan](https://www.wireshark.org/docs/wsug_html_chunked/ChUsePacketListPaneSection.html) beskriver kopplingen mellan paketlista, detaljer och bytevy.
- [NIST SP 800-86](https://nvlpubs.nist.gov/nistpubs/legacy/sp/nistspecialpublication800-86.pdf) ger stöd för bevarande, insamling, granskning, analys och rapportering. De sju labbmomenten är en pedagogisk indelning utifrån användarens föreslagna process, inte ett påstående om att NIST använder exakt samma sju steg.
