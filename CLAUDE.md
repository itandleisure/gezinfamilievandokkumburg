# Gezinsapp familie Van Dokkumburg: instructies voor Claude

Lees dit eerst in elke chat die aan deze app werkt. Er werken meerdere chats aan dezelfde repo.

## Wat het is
Een eigen gezinsapp voor Frans en zijn partner. Hij draait op **https://gezin.fransvandokkumburg.com**, staat op GitHub Pages (branch `main`, root) en gebruikt Supabase voor de database en het inloggen.
De gebruikers zitten in Cómpeta (Málaga, Spanje). De app is Nederlandstalig en wordt vooral op de iPhone gebruikt, op het beginscherm.

## Onderdelen (tabbladen)
De app opent op **Menu**: eten en afvallen staan voorop. De tabbalk heeft vier knoppen: Menu, Gezond, Lijst en **Meer**. Onder Meer staan Cadeaus, Notities, Nummers, Spaans en Taken als tegels (`#view-meer` in `index.html`). Het getal van Taken staat op de knop Meer en op de tegel. Links als `#spaans` blijven gewoon werken.

| Tab | Bestand | Data |
|---|---|---|
| Lijst (boodschappen) | `app.js`, deel Boodschappen | `shopping_items`, `catalog_items` |
| Menu (afvalschema Frans, ca. 1.600–1.950 kcal) | `menu.js` | `menu_plan` (id `frans-v2` = weekplan, `frans-v2-gegeten` = afgevinkte eetmomenten per datum, `frans-v2-standaard` = eigen standaardmenu via de knop "Maak standaardmenu"; zonder die rij geldt `freshPlan()`; zondag is daarin de "strandzondag" met een groot broodje, afwijkende standaardporties staan in `DEFQ`; `frans-v2-gerechten` = gedeelde ideeënlijst van vaste avondmaaltijden, met één tik op een dag te zetten; zonder die rij gelden de ingebouwde `DISHES` in `menu.js`. Het plan staat per weekdag opgeslagen, maar de dagtabs lopen rollend 7 dagen vooruit vanaf vandaag (`ahead()`), dus een voorbije dag is vanzelf de dag van volgende week) |
| Cadeaus (volgorde van de lijsten met pijltjes omhoog/omlaag, gedeeld via `gift_lists.position`; zonder eigen volgorde op datum) | `app.js` | `gift_lists`, `gift_items` |
| Notities (met afvinken en archief) | `app.js` | `notes` (`done`, `done_at`) |
| Nummers (bellen met één tik) | `app.js` | `contacts` |
| Spaans ("Woorden en zinnen": losse woorden, voorstellen, winkel, dagen, getallen, vaste fouten; plus "Werkwoorden". Alleen typen, geen inspreken) | `spaans.js` (nieuwe lesstof achteraan in `ZIN` toevoegen) | localStorage op het toestel |
| Gezond (gewicht per ochtend met weekgemiddelde, grafiek met doellijn en tempo, BMI-meter als halve maan; sport afvinken per dag: padel, kracht, wandelen, hardlopen. Plus het duwtje bovenaan de app, bijv. "Heb je vandaag al bewogen?", `nudge()` in `gezond.js`: wegen vanaf 07:00 (Frans weegt zich om 7 uur; ook de tijd voor latere pushmeldingen), padel ma/wo na 12:00, bewegen na 17:00; wegtikken geldt per dag via localStorage. Iedereen ziet alleen zijn eigen gegevens) | `gezond.js` | `weight_log`, `sport_log`, `health_settings` (met `start_kg` 93,9, `goal_kg` 78, `height_cm` 179 voor de BMI-meter; kolom `owner` = auth.uid(), RLS "alleen eigen gegevens"; nieuwe sporten achteraan in `SPORT`) |
| Taken (terugkerende klusjes, bijv. airco-filter elke 3 maanden. Afvinken zet `next_due` op vandaag + interval; nog een tik op dezelfde dag zet hem terug via `prev_due`/`prev_done`. Wat aan de beurt is staat bovenaan, met een terracotta getal op het tabblad. Geen agenda: die staat in Apple Agenda) | `taken.js` | `tasks` (`every_n` + `every_unit` dag/week/maand/jaar, `next_due`, `last_done`) |

Er is geen build-stap. Alles is gewone ES-modules plus `styles.css`. Supabase-js wordt geladen vanaf jsDelivr, vastgezet op een versie.

## Supabase
- Project-id: `zopnuwnwceislikkvvsv` (naam `gezinfamilievandokkumburg`, regio eu-central-1, Free plan).
- **Raak het andere project in dezelfde organisatie (Escape Game The Hunt) nooit aan.**
- `config.js` bevat de URL en de *publishable* key. Die mogen openbaar zijn. Zet nooit een secret- of service_role-key in de repo.
- Beveiliging: RLS staat aan op alle tabellen, met de policy "alleen gezin" (alleen voor ingelogde gebruikers). Aanmelden staat uit, de accounts maakt Frans zelf aan.
- Schemawijzigingen: voeg ze toe aan `supabase/schema.sql` (idempotent, dus met `if not exists`). Pas ze daarna toe via de Supabase-tools als die beschikbaar zijn, of geef Frans de SQL om te plakken.
- Een GitHub Action (`.github/workflows/keepalive.yml`) pingt twee keer per week `rpc/ping`, zodat het gratis project niet gepauzeerd wordt.

## Werkafspraken
1. **Haal altijd eerst de laatste versie op voordat je pusht**, want andere chats pushen ook. Gebruik `git fetch --depth=20 origin main` en rebase daarna op `FETCH_HEAD`. Los conflicten op zo dat **beide** wijzigingen blijven bestaan.
2. Houd commits klein en schrijf commitberichten in het Nederlands.
3. Test na een wijziging (op zijn minst `node --check` en het liefst in een browser). Daarbij is `createClient` te vervangen door een in-memory mock.
4. Stijl: mobiel eerst, knoppen minimaal 44px, kleuren azulejo-blauw `#1d4e89`, terracotta `#c4502b` en groen voor afgevinkt. Licht en donker thema via `light-dark()`.
5. Waarden uit de database altijd escapen (`esc()`) voordat ze in HTML komen.
6. Wijzig je opties in `menu.js`: **voeg nieuwe opties achteraan toe**. De opgeslagen plannen verwijzen namelijk naar de positie in de lijst. Gooi je de volgorde toch om, verhoog dan `MENU_ID` in `app.js`.
7. Nieuw tabblad: voeg een `<section class="view">` toe in `index.html`, een entry in `VIEWS` en `render()` in `app.js`, en eventueel een eigen module zoals `spaans.js`. Zet het als **tegel onder Meer** (`#view-meer`); de tabbalk blijft bij vier knoppen, tenzij Frans iets anders vraagt. Zit het onder Meer, dan licht Meer vanzelf op.

## Voorkeuren van Frans
- Eten: gewoon en makkelijk (kwark met muesli, brood met kaas, salami of serranoham, aardappel, pasta of rijst met groente en vlees; zondag patat). Geen culinaire hoogstandjes.
- Boodschappen: één lijst, ingedeeld per supermarktafdeling, zonder winkelkeuze.
- Home Assistant-knoppen (deur, poort, lampen) komen later als tabblad **Huis**, via webhooks. Bouw dit pas als Frans erom vraagt.
