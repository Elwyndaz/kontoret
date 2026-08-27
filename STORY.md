# Projekt Samsyn: story, modell och arketyper

Utkast 2026-08-27. All text ligger i `src/data/story.ts` och är skriven för att kunna bytas ut utan kodändring. Det här dokumentet förklarar vad texten försöker göra.

## Premiss

Första dagen som chef. Projekt Samsyn har tre beställare som alla tror att de är den enda. Fem samtal under en dag, i fast ordning: Liv (08:12), Nadja (09:40), Göran (11:05), Mira (13:20), Liv igen (15:50). Spelaren är förstaperson och syns aldrig.

Varje samtal är ett dilemma med tre svar. Inget svar är "rätt", men varje svar har ett pris. Humorn är igenkänning och torr absurditet riktad uppåt: filnamn, nyhetsbrev, utvecklingssamtal, strategidagar.

## Psykologisk modell

Tre axlar, poäng -1/0/+1 per svar:

| Axel | Betyder | Forskningsankare |
|---|---|---|
| Tydlighet | Klargör du vem som bestämmer och vad som gäller? | Rollklarhet, rollotydlighet som stressor (Kahn m.fl. 1964, senare metaanalyser) |
| Trygghet | Gör du det säkert att säga obekväma saker? | Psykologisk trygghet (Edmondson 1999, 2018) |
| Delaktighet | Frågar du innan du bestämmer? | Autonomi och delaktighet (självbestämmandeteori, Deci & Ryan) |

Tydlighet och trygghet avgör arketyp. Delaktighet ger en underrad. Tröskel för "hög" är 2 poäng av maximalt 4 till 5.

## Konsekvenser

Varje svar sätter en tagg. Senare öppningsrepliker byts ut om en tagg finns (`openerIf` i `story.ts`):

- Bokade möte hos Liv → Nadja har redan gjort en agenda.
- Lät Nadja skicka spinn-nyhetsbrevet → Göran har sett "nystart" nummer fyra.
- Körde över Göran → Mira noterar att hörlurarna åkte på igen.
- Pratade med beställarna (eller bokade möte) → Livs sista öppning speglar det.

Det är medvetet tunt: en variant per samtal räcker för att spelaren ska känna att kontoret minns.

## Arketyper

| | Trygghet hög | Trygghet låg |
|---|---|---|
| **Tydlighet hög** | Dirigenten | Kaptenen |
| **Tydlighet låg** | Diplomaten | Mötesbokaren |

Varje arketyp har: vad du gör bra, vad det kostar, en forskningsmening. Mötesbokaren är komisk botten och beskrivs som "den vanligaste första dagen som chef" så att ingen känner sig utpekad.

## Att verifiera före publicering

- Forskningsmeningarna är skrivna ur minnet och ska kontrolleras mot primärkällor (Edmondson 1999 *Administrative Science Quarterly*; Edmondson 2018 *The Fearless Organization*; Kahn m.fl. 1964 *Organizational Stress*; Deci & Ryan 2000).
- Komikpass: läs alla 15 svar högt. Repliker som förklarar skämtet ska strykas.
- Psykologipass: kontrollera att inget svar belönar manipulation eller bestraffar rimlig försiktighet.
- Balans: Mötesbokaren ska vara nåbar utan att spelaren väljer dumt varje gång. Just nu krävs låg poäng på båda axlarna, vilket i praktiken betyder minst tre undvikande svar.
