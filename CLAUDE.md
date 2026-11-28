# Gezinsapp familie Van Dokkumburg: instructies voor Claude

Lees dit eerst in elke chat die aan deze app werkt. Er werken meerdere chats aan dezelfde repo.

## Wat het is
Een eigen gezinsapp voor Frans en zijn partner. Hij draait op **https://gezin.fransvandokkumburg.com**, staat op GitHub Pages (branch `main`, root) en gebruikt Supabase voor de database en het inloggen.
De gebruikers zitten in Cómpeta (Málaga, Spanje). De app is Nederlandstalig en wordt vooral op de iPhone gebruikt, op het beginscherm.

## Onderdelen (tabbladen)
De app opent op **Menu**: eten en afvallen staan voorop. De tabbalk heeft vier knoppen: Menu, Gezond, Lijst en **Meer**. Onder Meer staan Recepten, Cadeaus, Notities, Nummers, Spaans en Taken als tegels (`#view-meer` in `index.html`). Het getal van Taken staat op de knop Meer en op de tegel. Links als `#spaans` blijven gewoon werken.

| Tab | Bestand | Data |
|---|---|---|
| Lijst (boodschappen) | `app.js`, deel Boodschappen | `shopping_items`, `catalog_items` |
| Menu (afvalschema Frans, ca. 1.600–1.950 kcal) | `menu.js` | `menu_plan` (id `frans-v2` = weekplan, `frans-v2-gegeten` = afgevinkte eetmomenten per datum, `frans-v2-standaard` = eigen standaardmenu via de knop "Maak standaardmenu"; zonder die rij geldt `freshPlan()`; zondag is daarin de "strandzondag" met een groot broodje, afwijkende standaardporties staan in `DEFQ`; `frans-v2-gerechten` = gedeelde ideeënlijst van vaste avondmaaltijden, met één tik op een dag te zetten; zonder die rij gelden de ingebouwde `DISHES` in `menu.js`. Het plan staat per weekdag opgeslagen, maar de dagtabs lopen rollend 7 dagen vooruit vanaf vandaag (`ahead()`), dus een voorbije dag is vanzelf de dag van volgende week) |
| Cadeaus (volgorde van de lijsten met pijltjes omhoog/omlaag, gedeeld via `gift_lists.position`; zonder eigen volgorde op datum) | `app.js` | `gift_lists`, `gift_items` |
| Notities (met afvinken en archief) | `app.js` | `notes` (`done`, `done_at`) |
| Nummers (bellen met één tik) | `app.js` | `contacts` |
| Spaans ("Woorden en zinnen": losse woorden, voorstellen, winkel, dagen, getallen, vaste fouten; plus "Werkwoorden". Alleen typen, geen inspreken) | `spaans.js` (nieuwe lesstof achteraan in `ZIN` toevoegen) | localStorage op het toestel |
| Gezond (gewicht per ochtend met weekgemiddelde, grafiek met doellijn en tempo, BMI-meter als halve maan; sport afvinken per dag: padel, kracht, wandelen, hardlopen. Plus het duwtje bovenaan de app, bijv. "Heb je vandaag al bewogen?", `nudge()` in `gezond.js`: wegen vanaf 07:00 (Frans weegt zich om 7 uur; ook de tijd voor latere pushmeldingen), padel ma/wo na 12:00, bewegen na 17:00; wegtikken geldt per dag via localStorage. Iedereen ziet alleen zijn eigen gegevens. Bij wandelen en hardlopen kun je optioneel de minuten kiezen (30/45/60/90/anders, `sport_log.minutes`). Daaronder in `gezondplus.js`: **slaap** (elke ochtend één tik: slecht/matig/goed, `health_day.sleep` 1–3), **taille** (1× per week in cm, met verloop, `health_day.waist_cm`), **waterteller** (glazen per dag, doel instelbaar), **snackkaart** (vaste tussendoortjes met kcal tegen een dagbudget, standaard 400; nieuwe snacks achteraan in `SNACKS`), **trainingskaart** (sessies van ca. 15 min met kettlebell 20 kg of LES MILLS+, per weekdag in `PLAN`; ma/wo padel, zo rust; "Gedaan" vinkt Kracht af) en **mijlpalen** (elke 2 kg vanaf het startgewicht plus het doel, met een feestje één keer per mijlpaal). Het **weekoverzicht** komt op zondag om 19:00 als pushmelding) | `gezond.js`, `gezondplus.js` | `weight_log`, `sport_log`, `health_day` (water, snacks, slaap en taille per dag; ontbreekt de tabel, dan werkt de rest gewoon), `health_settings` (met `start_kg` 93,9, `goal_kg` 78, `height_cm` 179 voor de BMI-meter, `water_goal`, `snack_kcal`, `milestone_kg` = laatst gevierde mijlpaal; kolom `owner` = auth.uid(), RLS "alleen eigen gegevens"; nieuwe sporten achteraan in `SPORT`) |
| Receptenboekje (avondeten met foto, voor 4 personen, ingedeeld op soort avond: Snel = ma/wo sportavond, Meer tijd = di/do/vr, Zaterdag = uitgebreid en leuk, Zondag = patat, borrelplank of pizza. Elk recept heeft een vega-variant met eigen extra ingrediënten en een regel voor de kinderen; elk ingrediënt heeft een Spaanse naam met lidwoord (`ES` in `recepten.js`, sleutel = Nederlandse naam precies zoals in het recept; geef nieuwe ingrediënten er ook een), die ook mee op de boodschappenlijst gaat. Boven de soorten staan **filters** (`FILTERS` in `recepten.js`, per groep één keuze, groepen combineerbaar): ⏱ Binnen 25 min, 🌱 Vega (helemaal vegetarisch) / Vlees / Vis, en Pasta / Rijst / Aardappel / Brood & wraps; vis en de basis volgen uit `k` (posities in `menu.js`). De knop **🎲 Wat eten we vandaag?** kiest willekeurig uit wat er op dat moment getoond wordt (soort + filters), liefst iets wat deze week nog niet op het menu staat, met "Zet op vandaag", "Bekijk recept" en "Nog eens". Een recept kan bij meer soorten horen (`soort` als lijst, bijv. pizza bij Zondag en Snel). Te openen via de knop onder Avondeten in Menu en via de tegel Recepten onder Meer. Per recept: "Zet op het menu" (zet de vier onderdelen van Avondeten op die dag en bewaart het recept-id als `d.rec` in het weekplan), aangevinkte ingrediënten naar de boodschappenlijst (`source` 'recept'; basisspullen zoals olie staan standaard uit) en "Bewaar bij vaste gerechten". Foto's komen van Pexels (gratis licentie), via het fotonummer in `foto`; laadt een foto niet, dan verschijnt een blauw tegeltje. Nieuwe recepten achteraan in `RECIPES`; `k` verwijst naar de opties van Avondeten in `menu.js`) | `recepten.js` | geen eigen tabel: `menu_plan` (weekplan en vaste gerechten) en `shopping_items` |
| Taken (terugkerende klusjes, bijv. airco-filter elke 3 maanden. Afvinken zet `next_due` op vandaag + interval; nog een tik op dezelfde dag zet hem terug via `prev_due`/`prev_done`. Wat aan de beurt is staat bovenaan, met een terracotta getal op het tabblad. Geen agenda: die staat in Apple Agenda) | `taken.js` | `tasks` (`every_n` + `every_unit` dag/week/maand/jaar, `next_due`, `last_done`) |

Er is geen build-stap. Alles is gewone ES-modules plus `styles.css`. Supabase-js wordt geladen vanaf jsDelivr, vastgezet op een versie.

## Pushmeldingen (iPhone)
- `sw.js` is een service worker **alleen voor push** (geen cache, geen fetch-handler). `push.js` zet meldingen aan/uit per telefoon; de knop staat onderaan Gezond.
- Abonnementen staan in `push_subscriptions` (per `owner`). Versturen doet de edge function `gezond-push` (`supabase/functions/gezond-push/index.ts`, verify_jwt uit): `?action=key` (openbare VAPID-sleutel), `?action=test`, `?action=run`.
- pg_cron roept elke 10 minuten `?action=run` aan. Tijden in Europe/Madrid: wegen 07:00–12:00 als er nog geen gewicht is, padel ma/wo 12:00–17:00, bewegen 17:00–21:00 als er nog niets is afgevinkt. Zondag 19:00–21:00 het weekoverzicht (`weekMsg()`: weekgemiddelde, dagen bewogen, minuten, waterdoel, slaap, taille, plus complimentje of tip); `?action=week` stuurt het meteen (knop "Weekoverzicht nu"). Elke soort hooguit één keer per dag (`push_log`).
- Het VAPID-sleutelpaar maakt de functie zelf aan in `push_keys` (RLS aan, geen policies: alleen de functie kan erbij). Er staat dus geen geheime sleutel in de repo of in een chat.
- iPhone: werkt alleen vanaf het beginscherm-icoon (iOS 16.4+), na een tik op "Meldingen aanzetten".

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
- **De partner van Frans is vegetariër**: geen vlees en geen vis, wel eieren en zuivel. Elk recept in het receptenboekje heeft daarom een vega-variant (`VEGA` in `recepten.js`) die makkelijk naast het gewone gerecht te maken is. Doe dat bij nieuwe recepten ook.
- **De kinderen** eten het liefst pasta of rijst los, zonder saus erdoor, met alles apart naast elkaar op het bord. Elk recept heeft daarom ook een regel "Voor de kinderen" (`KIDS` in `recepten.js`). Doe dat bij nieuwe recepten ook.
- Eten: gewoon en makkelijk (kwark met muesli, brood met kaas, salami of serranoham, aardappel, pasta of rijst met groente en vlees; zondag patat). Geen culinaire hoogstandjes.
- Boodschappen: één lijst, ingedeeld per supermarktafdeling, zonder winkelkeuze.
- Home Assistant-knoppen (deur, poort, lampen) komen later als tabblad **Huis**, via webhooks. Bouw dit pas als Frans erom vraagt.
