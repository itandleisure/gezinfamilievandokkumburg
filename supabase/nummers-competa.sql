-- Extra nummers voor Cómpeta en de Axarquía (gecontroleerd november 2026)
-- Plak in Supabase > SQL Editor > New query en klik op Run.
-- Nummers die al bestaan (zelfde naam) worden overgeslagen.
insert into public.contacts (name, phone, category, note)
select v.name, v.phone, v.category, v.note from (values
  ('Consultorio Cómpeta (huisarts)', '951 28 97 67', 'Medisch', 'Plaza de la Axarquía. 2e nummer: 951 28 97 91'),
  ('Urgencias Consultorio Cómpeta', '951 03 14 37', 'Medisch', 'Spoed bij de huisartsenpost'),
  ('Salud Responde (afspraak arts)', '955 54 50 60', 'Medisch', '24 uur; ook via app Salud Andalucía'),
  ('Hospital Comarcal de la Axarquía', '951 06 70 00', 'Medisch', 'Vélez-Málaga, Av. del Sol. Nummer nog even zelf checken'),
  ('Toxicologie (vergiftiging)', '91 562 04 20', 'Medisch', '24 uur, Instituto Nacional de Toxicología'),
  ('Farmacia Calle San Antonio', '952 51 60 31', 'Medisch', 'Bron ouder, nummer even checken'),
  ('Farmacia Plaza', '952 55 34 01', 'Medisch', 'Bron ouder, nummer even checken'),
  ('Ayuntamiento Cómpeta', '952 51 60 06', 'Gemeente & politie', 'Gemeentehuis, ook Juzgado de Paz'),
  ('Guardia Civil Cómpeta', '952 51 60 97', 'Gemeente & politie', 'Av. de Torrox 21 (spoed: 062)'),
  ('Policía Local Cómpeta', '605 27 63 02', 'Gemeente & politie', 'Niet officieel bevestigd, even checken'),
  ('Stroomstoring (e-distribución)', '900 850 840', 'Huis & klussen', '24 uur, storingen Andalucía')
) as v(name, phone, category, note)
where not exists (select 1 from public.contacts c where c.name = v.name);
