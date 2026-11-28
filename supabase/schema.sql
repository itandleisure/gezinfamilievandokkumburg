-- Gezinsapp: databaseschema
-- Plak dit in Supabase > SQL Editor > New query en klik op Run.
-- Alleen ingelogde gebruikers kunnen iets lezen of wijzigen.
-- Zet daarnaast in Authentication > Sign In / Providers "Allow new users to sign up" UIT,
-- zodat alleen de accounts die jij aanmaakt kunnen inloggen.

create extension if not exists pgcrypto;

-- Boodschappen
create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  qty text default '',
  category text default 'Overig',
  store text default 'Maakt niet uit',
  checked boolean default false,
  recurring boolean default false,
  source text default 'eigen',          -- 'eigen', 'menu' of 'recept'
  created_at timestamptz default now()
);

-- Eigen items voor de keuzelijst
create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default 'Overig',
  created_at timestamptz default now()
);

-- Weekmenu (één rij per persoon/menu)
create table if not exists public.menu_plan (
  id text primary key,
  plan jsonb not null,
  updated_at timestamptz default now()
);

-- Notities
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  title text default '',
  body text default '',
  pinned boolean default false,
  updated_at timestamptz default now()
);

-- Belangrijke nummers
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  category text default 'Overig',
  note text default '',
  created_at timestamptz default now()
);

-- Cadeaulijstjes
create table if not exists public.gift_lists (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date,
  created_at timestamptz default now()
);
create table if not exists public.gift_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references public.gift_lists(id) on delete cascade,
  name text not null,
  note text default '',
  bought boolean default false,
  created_at timestamptz default now()
);

-- Toegang tot de Data API voor ingelogde gebruikers
-- (nodig als "Grant API access to new tables automatically" uit staat)
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.shopping_items, public.catalog_items, public.menu_plan, public.notes,
  public.contacts, public.gift_lists, public.gift_items
to authenticated;

-- Beveiliging: alleen ingelogde gebruikers
do $$
declare t text;
begin
  foreach t in array array['shopping_items','catalog_items','menu_plan','notes','contacts','gift_lists','gift_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "alleen gezin" on public.%I', t);
    execute format('create policy "alleen gezin" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Live bijwerken tussen telefoons
do $$
declare t text;
begin
  foreach t in array array['shopping_items','catalog_items','menu_plan','notes','contacts','gift_lists','gift_items'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- Klein 'seintje' zodat het gratis project niet gepauzeerd wordt (geeft alleen een getal terug)
create or replace function public.ping() returns integer
language sql security definer set search_path = public as $$
  select count(*)::int from public.notes;
$$;
revoke all on function public.ping() from public;
grant usage on schema public to anon;
grant execute on function public.ping() to anon, authenticated;

-- Startnummers (Spanje)
insert into public.contacts (name, phone, category, note)
select * from (values
  ('Alarmnummer', '112', 'Nood', 'Ambulance, brandweer, politie'),
  ('Medische spoed Andalucía', '061', 'Nood', ''),
  ('Guardia Civil', '062', 'Nood', ''),
  ('Policía Nacional', '091', 'Nood', '')
) as v(name, phone, category, note)
where not exists (select 1 from public.contacts);

-- Notities afvinken en archiveren (toegevoegd later)
alter table public.notes add column if not exists done boolean default false;
alter table public.notes add column if not exists done_at timestamptz;

-- Eigen volgorde van de cadeaulijsten (pijltjes omhoog/omlaag)
alter table public.gift_lists add column if not exists position integer;

-- Terugkerende taken en klusjes (tabblad Taken)
-- every_n + every_unit ('dag','week','maand','jaar') = hoe vaak; next_due = wanneer weer aan de beurt.
-- prev_due/prev_done bewaren de vorige stand, zodat een per ongeluk afgevinkte taak terug kan.
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  note text default '',
  every_n integer not null default 1 check (every_n > 0),
  every_unit text not null default 'maand' check (every_unit in ('dag','week','maand','jaar')),
  next_due date not null default current_date,
  last_done date,
  prev_due date,
  prev_done date,
  created_at timestamptz default now()
);
grant select, insert, update, delete on public.tasks to authenticated;
alter table public.tasks enable row level security;
drop policy if exists "alleen gezin" on public.tasks;
create policy "alleen gezin" on public.tasks for all to authenticated using (true) with check (true);
do $$ begin
  alter publication supabase_realtime add table public.tasks;
exception when duplicate_object then null;
end $$;
-- Een paar voorbeeldtaken (alleen als de tabel nog leeg is)
insert into public.tasks (title, note, every_n, every_unit, next_due)
select * from (values
  ('Airco-filters schoonmaken', 'Filters uitnemen, uitspoelen en goed laten drogen', 3, 'maand', current_date + 7),
  ('Rookmelders testen', 'Testknop indrukken, batterij vervangen als hij piept', 6, 'maand', current_date + 14),
  ('Afvoer op het terras vrijmaken', 'Vooral na de herfstbuien', 1, 'maand', current_date + 3),
  ('Koelkast schoonmaken', '', 1, 'maand', current_date + 10),
  ('Butaanfles controleren', 'Reservefles in huis?', 2, 'week', current_date)
) as v(title, note, every_n, every_unit, next_due)
where not exists (select 1 from public.tasks);

-- Gewicht en sport (tabblad Gezond). Iedereen ziet alleen zijn eigen gegevens.
create table if not exists public.weight_log (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  kg numeric(5,1) not null check (kg between 30 and 300),
  created_at timestamptz default now(),
  primary key (owner, day)
);
create table if not exists public.sport_log (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  kind text not null,                   -- 'padel', 'kracht', 'wandelen', 'hardlopen'
  created_at timestamptz default now(),
  primary key (owner, day, kind)
);
create table if not exists public.health_settings (
  owner uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  start_kg numeric(5,1) default 93.9,
  goal_kg numeric(5,1) default 78,
  height_cm integer default 179,
  reminders boolean default true,
  updated_at timestamptz default now()
);
grant select, insert, update, delete on public.weight_log, public.sport_log, public.health_settings to authenticated;
do $$
declare t text;
begin
  foreach t in array array['weight_log','sport_log','health_settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "alleen eigen gegevens" on public.%I', t);
    execute format('create policy "alleen eigen gegevens" on public.%I for all to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()))', t);
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- Pushmeldingen (Gezond): abonnementen per telefoon, logboek zodat elke melding hooguit één keer per dag gaat,
-- en het VAPID-sleutelpaar (alleen leesbaar voor de edge function gezond-push, niet voor de app).
create table if not exists public.push_subscriptions (
  endpoint text primary key,
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);
grant select, insert, update, delete on public.push_subscriptions to authenticated;
alter table public.push_subscriptions enable row level security;
drop policy if exists "alleen eigen gegevens" on public.push_subscriptions;
create policy "alleen eigen gegevens" on public.push_subscriptions for all to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create table if not exists public.push_log (
  owner uuid not null references auth.users(id) on delete cascade,
  day date not null,
  kind text not null,
  sent_at timestamptz default now(),
  primary key (owner, day, kind)
);
alter table public.push_log enable row level security;
create table if not exists public.push_keys (
  id integer primary key default 1 check (id = 1),
  public_key text not null,
  private_key text not null
);
alter table public.push_keys enable row level security;
revoke all on public.push_log, public.push_keys from anon, authenticated;
-- De edge function gebruikt de service_role; die heeft hier rechten nodig ("Grant API access to new tables automatically" staat uit)
grant select, insert, update, delete on public.push_keys, public.push_log, public.push_subscriptions, public.weight_log, public.sport_log to service_role;

-- Planner: elke 10 minuten kijkt de functie gezond-push of er een melding moet (pas aanzetten als de functie bestaat)
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('gezond-push') where exists (select 1 from cron.job where jobname = 'gezond-push');
select cron.schedule('gezond-push', '*/10 * * * *', $$
  select net.http_post(
    url := 'https://zopnuwnwceislikkvvsv.supabase.co/functions/v1/gezond-push?action=run',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body := '{}'::jsonb)
$$);

-- Gezond, vijf hulpmiddelen: water en snacks per dag (health_day), mijlpalen en waterdoel (health_settings)
create table if not exists public.health_day (
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  day date not null,
  water integer not null default 0 check (water between 0 and 30),   -- glazen water
  snacks jsonb not null default '{}'::jsonb,                          -- {"kwark": 1, "ei": 2}
  updated_at timestamptz default now(),
  primary key (owner, day)
);
alter table public.health_day add column if not exists sleep smallint check (sleep between 1 and 3);        -- 1 slecht, 2 matig, 3 goed
alter table public.health_day add column if not exists waist_cm numeric(4,1) check (waist_cm between 40 and 200);   -- taille, 1× per week
alter table public.health_settings add column if not exists water_goal integer default 8;
alter table public.health_settings add column if not exists snack_kcal integer default 400;
alter table public.sport_log add column if not exists minutes integer check (minutes between 1 and 600);   -- optioneel: hoe lang gewandeld of gelopen
alter table public.health_settings add column if not exists milestone_kg numeric(5,1);   -- laagste mijlpaal die al gevierd is
grant select, insert, update, delete on public.health_day to authenticated;
alter table public.health_day enable row level security;
drop policy if exists "alleen eigen gegevens" on public.health_day;
create policy "alleen eigen gegevens" on public.health_day for all to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
do $$ begin
  alter publication supabase_realtime add table public.health_day;
exception when duplicate_object then null;
end $$;
-- Weekoverzicht op zondag (pushmelding): de functie leest instellingen mee
grant select on public.health_settings, public.health_day to service_role;

-- Nummers: groep Nood heet voortaan Spoed (staat bovenaan met grote belknoppen)
update public.contacts set category = 'Spoed' where category = 'Nood';

-- Taken: wie doet het? (assignee = account van Frans of partner; leeg = samen)
-- family_members geeft elk account een naam voor in de app. Beide mogen beide namen aanpassen.
create table if not exists public.family_members (
  owner uuid primary key references auth.users(id) on delete cascade,
  name text not null check (length(name) between 1 and 30),
  updated_at timestamptz default now()
);
grant select, insert, update, delete on public.family_members to authenticated;
alter table public.family_members enable row level security;
drop policy if exists "alleen gezin" on public.family_members;
create policy "alleen gezin" on public.family_members for all to authenticated using (true) with check (true);
do $$ begin
  alter publication supabase_realtime add table public.family_members;
exception when duplicate_object then null;
end $$;
alter table public.tasks add column if not exists assignee uuid references auth.users(id) on delete set null;
-- Melding "taak over tijd": de functie gezond-push leest taken en namen
grant select on public.tasks, public.family_members to service_role;

-- Cadeaus: verjaardag (elk jaar terug, seintje twee weken vooraf via gezond-push) en budget per lijst, prijs per idee
alter table public.gift_lists add column if not exists yearly boolean default false;
alter table public.gift_lists add column if not exists budget numeric(8,2);
alter table public.gift_items add column if not exists price numeric(8,2);
grant select on public.gift_lists, public.gift_items to service_role;

-- Kijken: eigen kijklijst (series, films, sport), alleen voor jezelf. Formule 1 komt automatisch uit de openbare F1-kalender (jolpica).
create table if not exists public.watch_items (
  id uuid primary key default gen_random_uuid(),
  owner uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  kind text not null default 'serie',          -- 'serie', 'film', 'sport', 'programma'
  service text not null default '',            -- 'Ziggo', 'Videoland', 'Disney+', 'Amazon Prime', 'NPO Start', ''
  weekday smallint check (weekday between 0 and 6),   -- elke week op deze dag (0 = maandag)
  on_date date,                                -- of één keer op deze datum
  at_time time,                                -- tijd in Spaanse tijd
  remind_min integer not null default 30 check (remind_min between 0 and 1440),   -- 0 = geen melding
  note text not null default '',               -- bijv. 'op de laptop'
  seen boolean not null default false,
  created_at timestamptz default now()
);
create table if not exists public.watch_prefs (
  owner uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  f1 smallint not null default 1 check (f1 between 0 and 3),   -- 0 uit, 1 alleen race, 2 ook kwalificatie en sprint, 3 ook trainingen
  f1_service text not null default 'Ziggo',
  f1_remind_min integer not null default 30 check (f1_remind_min between 0 and 1440),
  updated_at timestamptz default now()
);
grant select, insert, update, delete on public.watch_items, public.watch_prefs to authenticated;
grant select on public.watch_items, public.watch_prefs to service_role;
alter table public.watch_items enable row level security;
alter table public.watch_prefs enable row level security;
drop policy if exists "alleen eigen gegevens" on public.watch_items;
create policy "alleen eigen gegevens" on public.watch_items for all to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
drop policy if exists "alleen eigen gegevens" on public.watch_prefs;
create policy "alleen eigen gegevens" on public.watch_prefs for all to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));
create index if not exists watch_items_owner on public.watch_items (owner);
do $$ begin
  alter publication supabase_realtime add table public.watch_items;
exception when duplicate_object then null;
end $$;

-- ---------- Dagvragen: melding met de 3 vragen van de dag (antwoorden worden niet opgeslagen) ----------
create table if not exists public.dagvraag_prefs (
  owner uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  push boolean not null default false,
  at_hour smallint not null default 21 check (at_hour between 0 and 23),   -- uur in Spaanse tijd
  updated_at timestamptz default now()
);
grant select, insert, update, delete on public.dagvraag_prefs to authenticated;
grant select on public.dagvraag_prefs to service_role;
alter table public.dagvraag_prefs enable row level security;
drop policy if exists "alleen eigen gegevens" on public.dagvraag_prefs;
create policy "alleen eigen gegevens" on public.dagvraag_prefs for all to authenticated using (owner = (select auth.uid())) with check (owner = (select auth.uid()));

-- ---------- Bonnetjes: aankopen met foto van de bon en einddatum van de garantie (gedeeld met het gezin) ----------
create table if not exists public.receipts (
  id uuid primary key default gen_random_uuid(),
  product text not null,
  store text not null default '',
  bought_on date not null default current_date,
  amount numeric(10,2),
  warranty_until date,                         -- standaard 3 jaar na aankoop (Spanje), aan te passen
  photo_path text,                             -- pad in de opslag-bucket 'fotos', map bonnetjes/
  note text not null default '',
  created_by uuid default auth.uid() references auth.users(id) on delete set null,
  created_at timestamptz default now()
);
grant select, insert, update, delete on public.receipts to authenticated;
grant select on public.receipts to service_role;
alter table public.receipts enable row level security;
drop policy if exists "alleen gezin" on public.receipts;
create policy "alleen gezin" on public.receipts for all to authenticated using (true) with check (true);
do $$ begin
  alter publication supabase_realtime add table public.receipts;
exception when duplicate_object then null;
end $$;

-- ---------- Vaste lasten: terugkerende uitgaven (IBI, IVTM, basura, verzekeringen, abonnementen) ----------
-- every_months = hoe vaak (1 maand, 3 kwartaal, 6 halfjaar, 12 jaar, 24 twee jaar); next_date = eerstvolgende afschrijving.
-- De app rekent de volgende keren zelf door, dus next_date hoeft niet elke keer bijgewerkt te worden.
-- remind_days = seintje zoveel dagen vooraf via gezond-push (0 = geen seintje). Gedeeld met het hele gezin.
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 80),
  cat text not null default 'Overig',              -- 'Huis', 'Auto', 'Verzekering', 'Abonnement', 'Overig'
  amount numeric(9,2) not null default 0 check (amount >= 0),
  every_months smallint not null default 12 check (every_months in (1, 2, 3, 6, 12, 24)),
  next_date date not null default current_date,
  remind_days smallint not null default 7 check (remind_days between 0 and 60),
  note text not null default '',
  created_at timestamptz default now()
);
grant select, insert, update, delete on public.expenses to authenticated;
grant select on public.expenses to service_role;
alter table public.expenses enable row level security;
drop policy if exists "alleen gezin" on public.expenses;
create policy "alleen gezin" on public.expenses for all to authenticated using (true) with check (true);
do $$ begin
  alter publication supabase_realtime add table public.expenses;
exception when duplicate_object then null;
end $$;
