# Handledarstöd — NV-041

Detta dokument innehåller fallets tänkta lösning. Använd först efter att deltagarna har prövat egna hypoteser.

## Den belagda avvikelsen

- Nät: studio, `10.20.20.0/24`.
- Källadress: `10.20.20.23`.
- Dator vid händelsen: **FORM-07**, enligt `DHCP-02` den 4 november. `DHCP-01` visar att samma IP-adress tillhörde FORM-02 dagen före.
- Motpart: `203.0.113.77`, port `8443`, namn `collab-sync.example` enligt `DNS-01` och observerat servernamn i trafikfilen.
- DNS-uppslag: **2026-11-04 18:41:58 UTC**.
- Första TCP-anslutning: **2026-11-04 18:42:10 UTC**.
- Sista utgående datapaket: **2026-11-04 18:47:55 UTC**.
- Utgående TCP-nyttolast: **129 760 byte**, inklusive klientens TLS-handshakebyte. Summan är inte den eventuellt skickade filens storlek.
- Konversationen finns i `CAP-S-04` och saknar motsvarighet i `CAP-S-03`.

Slutsatsen är **misstänkt datautflöde som behöver undersökas vidare**. Tidpunkt, ny destination, trafikens riktning och driftens lista över tjänster stärker hypotesen. Det är inte bevis för en viss fil, en viss person, intrångsväg eller vilket program som kommunicerade.

## Rimliga alternativa spår

**Drift / backup:** `10.20.30.30` skickar mer data till `203.0.113.80` än den misstänkta datorn. Mönstret återkommer båda dagarna och förklaras av `OPS-01` och `DNS-02`.

**Kontor / videomöte:** `10.20.10.22` har ett stort utgående flöde till `198.51.100.60`. Den planerade tvådagarsworkshopen dokumenteras i `OPS-02` och destinationen i `DNS-03`.

**Studio / kundleveranser:** `10.20.20.22` skickar filer till en godkänd kundportal båda dagarna. Detta ger ytterligare en jämförelse med legitim verksamhet.

Det är värdefullt om deltagaren först följer ett sådant spår och sedan ändrar bedömning. Hjälp genom att fråga ”hur såg samma flöde ut dagen före?” eller ”vilken källa kan förklara verksamheten?”, inte genom att ange rätt IP-adress.

## Förslag på handledning

1. Fråga vad deltagaren förväntar sig innan nästa filter körs.
2. Om resultatet blir tomt: ändra ett villkor åt gången och diskutera vilka filer urvalet bygger på.
3. Om bara stora datapaket analyseras: följ hela konversationen och fråga vad SYN och ACK tillför.
4. Om en dator identifieras: be deltagaren ange rätt dags adresslån.
5. Om innehåll eller gärningsperson påstås: fråga vilken källa som skulle krävas för att stödja påståendet.
6. Uppmuntra både nybörjare och programmeringsvana att dokumentera när en hypotes försvagas.

Låt gärna två personer arbeta tillsammans: en gör urval och en förutspår och antecknar. Byt roller under labben.

## Återkoppling och åtgärder

Återkopplingen är stöd för ett samtal, inte ett betyg. Den kontrollerar sju områden och ger förslag på fortsatta undersökningar. Textkontrollerna bedömer endast att reflektioner är dokumenterade; de kan inte avgöra om ett resonemang är väl underbyggt.

Ett proportionerligt åtgärdsförslag är att begränsa den berörda datorn och bevara dess spår, därefter samla in process- och filhändelser. Kontroller för tillåtna externa tjänster och larm om nya destinationer är en rimlig förebyggande förändring. Deltagaren ska också beskriva verksamhetspåverkan och osäkerheten i valet.

Den automatiska kontrollen av bevisreferenser förväntar sig första anslutningspaketet och sista utgående datapaketet, `DHCP-02`, `DNS-01`, `OPS-03`, jämförelsekällan `CAP-S-03` samt `OPS-01` eller `OPS-02` för ett alternativt flöde. Andra välmotiverade resonemang ska kunna diskuteras även om den automatiska kontrollen ber om komplettering.

## Möjliga fortsättningar

Lägg till processloggar för att undersöka innehåll och orsak, en ny dag för att testa hypotesens hållbarhet eller alternativa fall med andra korrekta utfall. Justera först uppgiftens språk och mängden stöd efter ett provpass med deltagare.
