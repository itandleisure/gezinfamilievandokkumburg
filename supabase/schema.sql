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
  source text default 'eigen',          -- 'eigen' of 'menu'
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
