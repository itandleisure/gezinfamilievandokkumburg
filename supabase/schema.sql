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
