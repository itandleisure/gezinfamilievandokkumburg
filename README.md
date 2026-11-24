# Gezin

Een eigen gezinsapp voor Frans en partner op **gezin.fransvandokkumburg.com**. Er zitten vijf onderdelen in:

- **Boodschappen.** Je vinkt af met een groen vinkje en filtert per winkel (Lidl, Aldi, Mercadona). Er is een keuzemenu met algemene spullen, en je kunt eigen items toevoegen die de app onthoudt. Items kunnen elke week terugkomen. Met **Nieuwe week** ruim je de lijst op en met **Lijst delen** stuur je hem door.
- **Weekmenu.** Het afvalschema van Frans, met ongeveer 1.600 tot 1.950 kcal per dag en gewoon, makkelijk eten. Je kunt onderdelen wisselen, ook voor de hele week tegelijk, en met **Zet op boodschappenlijst** komt alles op de lijst.
- **Cadeaus.** Een lijst per verjaardag of gelegenheid. Ideeën vink je af zodra ze gekocht zijn.
- **Notities.** Je kunt zoeken en notities bovenaan vastzetten.
- **Nummers.** Belangrijke telefoonnummers die je met één tik belt.
- **Taken.** Terugkerende klusjes, zoals het airco-filter elke 3 maanden. Afvinken zet de volgende datum; wat aan de beurt is staat bovenaan en als getal op het tabblad.

Je partner en jij zien wijzigingen live.

Techniek: een statische site op GitHub Pages, met Supabase voor de database en het inloggen. Er is geen build-stap nodig.

---

## Installatie

### 1. Supabase
1. Maak in je Supabase-organisatie een nieuw project aan, bijvoorbeeld `gezin`, in een Europese regio. Gratis kan dat naast je bestaande project.
2. Ga naar **SQL Editor → New query**, plak de inhoud van `supabase/schema.sql` en klik op **Run**.
3. Ga naar **Authentication → Sign In / Providers** en zet **Allow new users to sign up** **uit**.
4. Ga naar **Authentication → Users → Add user → Create new user**. Maak een account voor jezelf en een voor je partner, met e-mail en wachtwoord en met *Auto confirm user* aangevinkt.
5. Ga naar **Authentication → URL Configuration**:
   - Zet *Site URL* op `https://gezin.fransvandokkumburg.com`.
   - Voeg bij *Redirect URLs* `https://gezin.fransvandokkumburg.com/**` toe.
6. Ga naar **Project Settings → API (Data API)** en kopieer de **Project URL** en de **anon/publishable key** naar `config.js`.
   Gebruik **nooit** de service_role- of secret-key.

### 2. GitHub
1. Zet deze bestanden in een repo, bijvoorbeeld `gezin`. Die mag privé zijn als je een betaald GitHub-abonnement hebt. Bij een gratis account moet de repo openbaar zijn voor Pages. Dat is geen probleem, want er staan geen geheimen in.
2. Ga naar **Settings → Pages → Build and deployment**, kies *Deploy from a branch*, met branch `main` en map `/ (root)`.
3. Vul bij **Custom domain** `gezin.fransvandokkumburg.com` in. Het bestand `CNAME` staat al in de repo. Vink **Enforce HTTPS** aan zodra dat kan.
4. Ga naar **Actions** en zet de workflow *Supabase actief houden* aan als GitHub daarom vraagt. Die stuurt op maandag en donderdag een klein seintje naar de database, zodat het gratis project niet gepauzeerd wordt.

### 3. DNS (bij de beheerder van fransvandokkumburg.com)
Voeg één record toe:

| Type  | Naam  | Waarde                         |
|-------|-------|--------------------------------|
| CNAME | gezin | `<jouw-github-naam>.github.io` |

Het kan van een paar minuten tot een paar uur duren voordat het record werkt.

### 4. Op de iPhone
Open `https://gezin.fransvandokkumburg.com` in Safari, log in en kies **Deel → Zet op beginscherm**. De app opent dan zonder adresbalk, net als een gewone app.

---

## Later uitbreiden
Een nieuw onderdeel bestaat uit drie dingen: een tabel in `supabase/schema.sql` (met dezelfde regel "alleen gezin"), een `<section class="view">` in `index.html` en een render-functie in `app.js`. Ideeën daarvoor zijn taken en klusjes, terugkerende taken, voorraad, en gewicht en sport.
