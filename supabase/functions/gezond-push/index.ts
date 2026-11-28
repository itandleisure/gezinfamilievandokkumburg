// Pushmeldingen voor het tabblad Gezond.
// - ?action=key  : geeft de openbare VAPID-sleutel (maakt het sleutelpaar de eerste keer aan; de geheime helft blijft in de tabel push_keys)
// - ?action=test : stuurt een testmelding naar één abonnement (body: {endpoint})
// - ?action=run  : door pg_cron elke 10 minuten aangeroepen; stuurt per persoon hooguit één keer per dag per soort melding
// - ?action=week : (test) stuurt het weekoverzicht nu naar één abonnement (body: {endpoint})
// Taken: elke dag vanaf 09:00 één melding per persoon als er taken over tijd zijn (eigen taken plus taken van samen).
// - ?action=f1   : de Formule 1-sessies van dit seizoen (uit de openbare jolpica-kalender), voor het tabblad Kijken
// Kijken: bij elke run ook een seintje vlak voor wat je wilt kijken (watch_items en Formule 1, watch_prefs).
// Op zondag tussen 19:00 en 21:00 gaat het weekoverzicht: gewicht, bewegen en water van de week, met een complimentje of tip.
// Cadeaus: vanaf 10:00 een seintje als een verjaardag (gift_lists.yearly) of andere datum over precies 14 dagen is. Naar iedereen.
// Dagvragen: op het gekozen uur (standaard 21:00) de 3 vragen van de dag, alleen voor wie het aanzet in dagvraag_prefs.
//   De vragen komen uit dagvragen.json op de site. Opent /#dagvragen.
// Vaste lasten: vanaf 10:00 een seintje remind_days vóór een afschrijving uit expenses (IBI, verzekering...). Naar iedereen, opent /#lasten.
// Regen: op het gekozen uur (standaard 07:00) een seintje als het die dag in Cómpeta gaat regenen, met de tijdvakken erbij.
//   Alleen voor wie het aanzet in weer_prefs. Bronnen: Open-Meteo per model, net als weer.js. Opent /#weer.
// Geen geheimen in de code: de service-role-sleutel zet Supabase zelf in de omgeving van de functie.
import webpush from 'npm:web-push@3.6.7';
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const MSG: Record<string, { title: string; body: string }> = {
  wegen: { title: 'Goedemorgen!', body: 'Even op de weegschaal? Vul je gewicht in, vóór het ontbijt.' },
  padel: { title: '¿Qué tal el pádel?', body: 'Gespeeld vandaag? Vink het even af.' },
  bewegen: { title: 'Heb je vandaag al bewogen?', body: 'Een wandeling in de bergen telt ook.' },
  test: { title: 'Het werkt!', body: 'Meldingen van de gezinsapp staan aan op deze telefoon.' }
};

async function keys() {
  let { data } = await db.from('push_keys').select('public_key, private_key').eq('id', 1).maybeSingle();
  if (!data) {
    const k = webpush.generateVAPIDKeys();
    await db.from('push_keys').upsert({ id: 1, public_key: k.publicKey, private_key: k.privateKey }, { onConflict: 'id', ignoreDuplicates: true });
    ({ data } = await db.from('push_keys').select('public_key, private_key').eq('id', 1).single());
  }
  webpush.setVapidDetails('https://gezin.fransvandokkumburg.com', data!.public_key, data!.private_key);
  return data!;
}

// Tijd in Cómpeta
function madrid(now = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23', weekday: 'short' }).formatToParts(now).map(x => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour), dow: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(p.weekday) };
}

type Sub = { endpoint: string; owner: string; p256dh: string; auth: string };
async function send(sub: Sub, kind: string, msg?: { title: string; body: string; url?: string }) {
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ url: '/#gezond', ...(msg || MSG[kind]), tag: kind }), { TTL: 4 * 3600, urgency: 'normal' });
    return true;
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    console.error('push mislukt', code, String(e));
    return false;
  }
}

// ---------- Weekoverzicht (zondag) ----------
const kgf = (n: number) => n.toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const addDays = (s: string, n: number) => { const d = new Date(s + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
async function weekMsg(owner: string, day: string, dow: number) {
  const mon = addDays(day, -dow), prevMon = addDays(mon, -7), sun = addDays(mon, 6);
  const [{ data: w }, { data: sp }, { data: hd }, { data: st }] = await Promise.all([
    db.from('weight_log').select('day, kg').eq('owner', owner).gte('day', prevMon).lte('day', sun),
    db.from('sport_log').select('day, kind, minutes').eq('owner', owner).gte('day', mon).lte('day', sun),
    db.from('health_day').select('day, water, sleep, waist_cm').eq('owner', owner).gte('day', addDays(mon, -56)).lte('day', sun),
    db.from('health_settings').select('goal_kg, water_goal').eq('owner', owner).maybeSingle()
  ]);
  const avg = (l: { kg: number }[]) => l.length ? l.reduce((a, r) => a + Number(r.kg), 0) / l.length : null;
  const cur = avg((w || []).filter(r => r.day >= mon)), prev = avg((w || []).filter(r => r.day < mon));
  const days = new Set((sp || []).map(r => r.day)).size, padel = (sp || []).filter(r => r.kind === 'padel').length;
  const week = (hd || []).filter(r => r.day >= mon);
  const wgoal = Number(st?.water_goal ?? 8), waterDays = week.filter(r => r.water >= wgoal).length;
  const sleeps = week.filter(r => r.sleep != null).map(r => Number(r.sleep)), badSleep = sleeps.filter(v => v === 1).length;
  const waists = (hd || []).filter(r => r.waist_cm != null).sort((a, b) => (a.day < b.day ? -1 : 1));
  const wNow = waists.filter(r => r.day >= mon).pop(), wBefore = waists.filter(r => r.day < mon).pop();
  const parts: string[] = [];
  if (cur != null) parts.push(`Gemiddeld ${kgf(cur)} kg${prev != null ? (Math.abs(cur - prev) < 0.05 ? ' (gelijk)' : ` (${cur < prev ? '−' : '+'}${kgf(Math.abs(cur - prev))})`) : ''}.`);
  else parts.push('Deze week niet gewogen.');
  const mins = (sp || []).reduce((t, r) => t + (Number(r.minutes) || 0), 0);
  const dur = mins >= 60 ? `${Math.floor(mins / 60)} uur${mins % 60 ? ` en ${mins % 60} min` : ''}` : `${mins} min`;
  parts.push(`${days} ${days === 1 ? 'dag' : 'dagen'} bewogen${padel ? `, ${padel}× padel` : ''}${mins ? `, ${dur} gewandeld en gelopen` : ''}.`);
  if (week.some(r => r.water > 0)) parts.push(`${waterDays}× je waterdoel gehaald.`);
  if (sleeps.length) parts.push(`Slaap: ${sleeps.filter(v => v === 3).length}× goed, ${badSleep}× slecht.`);
  if (wNow) parts.push(`Taille ${kgf(Number(wNow.waist_cm))} cm${wBefore ? (Math.abs(wNow.waist_cm - wBefore.waist_cm) < 0.05 ? ' (gelijk)' : ` (${wNow.waist_cm < wBefore.waist_cm ? '−' : '+'}${kgf(Math.abs(wNow.waist_cm - wBefore.waist_cm))})`) : ''}.`);
  let tip = '';
  if (wNow && wBefore && wNow.waist_cm < wBefore.waist_cm - 0.4 && !(cur != null && prev != null && cur < prev - 0.2)) tip = 'Je taille wordt smaller, ook al zegt de weegschaal weinig. Goed bezig!';
  else if (cur != null && prev != null && cur < prev - 0.2) tip = '¡Muy bien! Je bent goed op weg.';
  else if (days >= 4) tip = 'Lekker actief geweest, hou dat vast!';
  else if (cur == null) tip = 'Tip: weeg je morgen om 7 uur, dan zie je volgende week je trend.';
  else if (badSleep >= 3) tip = 'Tip: je sliep een paar keer slecht. Probeer deze week wat eerder naar bed te gaan, dat scheelt trek.';
  else if (days < 3) tip = 'Tip: plan deze week twee trainingen van 15 minuten op de dagen zonder padel.';
  else if (!waists.some(r => r.day >= addDays(mon, -7))) tip = 'Tip: meet morgen je taille, dan zie je ook vooruitgang als de weegschaal stilstaat.';
  else tip = 'Stilstand hoort erbij. Let deze week op de tussendoortjes en drink genoeg water.';
  return { title: 'Jouw week 📊', body: parts.join(' ') + ' ' + tip };
}

// ---------- Taken over tijd ----------
type Task = { title: string; next_due: string; assignee: string | null };
function lateMsg(list: Task[], day: string) {
  const late = [...list].sort((a, b) => (a.next_due < b.next_due ? -1 : 1));
  const days = (t: Task) => Math.round((Date.parse(day) - Date.parse(t.next_due)) / 864e5);
  const one = (t: Task) => `${t.title} (${days(t) === 1 ? 'sinds gisteren' : days(t) + ' dagen te laat'})`;
  const body = late.length === 1 ? `${one(late[0])}. Tik om af te vinken.`
    : `${late.slice(0, 3).map(one).join(', ')}${late.length > 3 ? ` en nog ${late.length - 3}` : ''}.`;
  return { title: late.length === 1 ? 'Er is een taak over tijd' : `${late.length} taken over tijd`, body, url: '/#taken' };
}
async function runTasks(subs: Sub[], owners: string[], day: string, hour: number, out: Record<string, string>) {
  if (hour < 9 || hour >= 21) return;
  const { data: tasks, error } = await db.from('tasks').select('title, next_due, assignee').lt('next_due', day);
  if (error || !tasks?.length) return;   // kolom assignee nog niet aangemaakt, of niets over tijd
  for (const owner of owners) {
    const mine = (tasks as Task[]).filter(t => !t.assignee || t.assignee === owner);
    if (!mine.length) continue;
    const { error: dup } = await db.from('push_log').insert({ owner, day, kind: 'taken' });
    if (dup) continue; // vandaag al gestuurd
    const msg = lateMsg(mine, day);
    for (const s of subs.filter(s => s.owner === owner)) await send(s, 'taken', msg);
    out[owner] = out[owner] ? out[owner] + '+taken' : 'taken';
  }
}

// ---------- Cadeaus: twee weken vooraf ----------
type Gift = { id: string; title: string; event_date: string | null; yearly: boolean | null; budget: number | null };
function giftNext(l: Gift, today: string) {
  if (!l.event_date) return null;
  if (!l.yearly) return { date: l.event_date, age: null as number | null };
  const [y, m, d] = l.event_date.split('-').map(Number), ty = Number(today.slice(0, 4));
  const on = (yr: number) => new Date(Date.UTC(yr, m - 1, d, 12)).toISOString().slice(0, 10);
  const date = on(ty) >= today ? on(ty) : on(ty + 1), age = Number(date.slice(0, 4)) - y;
  return { date, age: age > 0 && age < 120 ? age : null };
}
const euro = (n: number) => '€ ' + Number(n).toLocaleString('nl-NL', { maximumFractionDigits: 2 });
async function giftMsg(day: string) {
  const target = addDays(day, 14);
  const { data: lists } = await db.from('gift_lists').select('id, title, event_date, yearly, budget');
  const due = (lists as Gift[] || []).map(l => ({ l, n: giftNext(l, day) })).filter(x => x.n && x.n.date === target);
  if (!due.length) return null;
  const { data: items } = await db.from('gift_items').select('list_id, bought').in('list_id', due.map(x => x.l.id));
  const when = new Date(target + 'T12:00:00Z').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  const parts = due.map(({ l, n }) => {
    const its = (items || []).filter(i => i.list_id === l.id), bought = its.some(i => i.bought);
    return `${l.title}${n!.age ? ` (wordt ${n!.age})` : ''}${l.budget != null ? `, budget ${euro(l.budget)}` : ''}. ${bought ? 'Er is al iets gekocht.' : its.length ? `${its.length} ${its.length === 1 ? 'idee' : 'ideeën'}, nog niets gekocht.` : 'Nog geen ideeën.'}`;
  });
  const anyBirthday = due.some(x => x.l.yearly);
  return { title: anyBirthday ? '🎂 Over twee weken jarig' : '🎁 Over twee weken', body: `${when}: ${parts.join(' ')}`, url: '/#cadeaus' };
}


// ---------- Kijken: Formule 1-kalender en seintje vooraf ----------
type F1 = { key: string; race: string; session: string; level: number; start: string };
const F1_SES: [string, string, number][] = [['FirstPractice', 'Training 1', 3], ['SecondPractice', 'Training 2', 3], ['ThirdPractice', 'Training 3', 3],
  ['SprintQualifying', 'Sprintkwalificatie', 2], ['Sprint', 'Sprintrace', 2], ['Qualifying', 'Kwalificatie', 2]];
const NL_RACE: Record<string, string> = { 'Australian': 'Australië', 'Chinese': 'China', 'Japanese': 'Japan', 'Bahrain': 'Bahrein', 'Saudi Arabian': 'Saoedi-Arabië', 'Miami': 'Miami',
  'Canadian': 'Canada', 'Monaco': 'Monaco', 'Spanish': 'Spanje', 'Barcelona-Catalunya': 'Barcelona', 'Austrian': 'Oostenrijk', 'British': 'Groot-Brittannië', 'Belgian': 'België',
  'Hungarian': 'Hongarije', 'Dutch': 'Nederland', 'Italian': 'Italië', 'Madrid': 'Madrid', 'Azerbaijan': 'Azerbeidzjan', 'Singapore': 'Singapore', 'United States': 'Verenigde Staten',
  'Mexico City': 'Mexico', 'São Paulo': 'Brazilië', 'Las Vegas': 'Las Vegas', 'Qatar': 'Qatar', 'Abu Dhabi': 'Abu Dhabi', 'Emilia Romagna': 'Imola' };
const raceNl = (n: string) => { const b = n.replace(/ Grand Prix$/, ''); return NL_RACE[b] ? `GP ${NL_RACE[b]}` : n; };
let f1Cache: { at: number; list: F1[] } | null = null;
async function f1Season(year: number): Promise<F1[]> {
  const r = await fetch(`https://api.jolpi.ca/ergast/f1/${year}/races.json?limit=40`);
  if (!r.ok) throw new Error('F1-kalender ' + r.status);
  const races = (await r.json())?.MRData?.RaceTable?.Races || [];
  const out: F1[] = [];
  for (const x of races) {
    const race = raceNl(x.raceName);
    const add = (d: { date?: string; time?: string } | undefined, session: string, level: number) => {
      if (d?.date && d?.time) out.push({ key: `${x.season}-${x.round}-${session}`, race, session, level, start: `${d.date}T${d.time}` });
    };
    for (const [k, name, lvl] of F1_SES) add(x[k], name, lvl);
    add({ date: x.date, time: x.time }, 'Race', 1);
  }
  return out;
}
async function f1Sessions(): Promise<F1[]> {
  if (f1Cache && Date.now() - f1Cache.at < 6 * 3600e3) return f1Cache.list;
  const y = new Date().getUTCFullYear();
  let list = await f1Season(y);
  if (!list.some(s => Date.parse(s.start) > Date.now())) list = list.concat(await f1Season(y + 1).catch(() => []));
  list = list.filter(s => Date.parse(s.start) > Date.now() - 7 * 864e5).sort((a, b) => a.start.localeCompare(b.start));
  f1Cache = { at: Date.now(), list };
  return list;
}
// Dag + tijd in Cómpeta naar een echt moment (ms)
function madridMs(day: string, time: string) {
  const guess = Date.parse(`${day}T${time.slice(0, 5)}:00Z`);
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(guess)).map(x => [x.type, x.value]));
  const asLocal = Date.parse(`${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:00Z`);
  return guess - (asLocal - guess);
}
const hhmm = (ms: number) => new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }).format(new Date(ms));
async function runKijk(subs: Sub[], day: string, dow: number) {
  const owners = [...new Set(subs.map(s => s.owner))];
  if (!owners.length) return {};
  const [{ data: items, error }, { data: prefs }] = await Promise.all([
    db.from('watch_items').select('*').in('owner', owners).eq('seen', false).gt('remind_min', 0).not('at_time', 'is', null),
    db.from('watch_prefs').select('*').in('owner', owners)
  ]);
  if (error) return {}; // tabel bestaat (nog) niet
  const now = Date.now(), tomorrow = addDays(day, 1);
  type Ev = { owner: string; key: string; start: number; remind: number; title: string; body: string };
  const ev: Ev[] = [];
  for (const it of items || []) {
    const days = it.weekday != null ? [[day, dow], [tomorrow, (dow + 1) % 7]].filter(([, d]) => d === it.weekday).map(([d]) => d as string) : it.on_date ? [it.on_date] : [];
    for (const d of days) {
      const start = madridMs(d, it.at_time);
      ev.push({ owner: it.owner, key: `kijk:${it.id}:${d}`, start, remind: it.remind_min, title: `Om ${hhmm(start)}: ${it.title}`,
        body: [it.service ? `Op ${it.service}` : '', it.note].filter(Boolean).join(' · ') || 'Zo begint het. Veel kijkplezier!' });
    }
  }
  const f1Fans = (prefs || []).filter(p => p.f1 > 0 && p.f1_remind_min > 0);
  if (f1Fans.length) {
    const ses = await f1Sessions().catch(() => [] as F1[]);
    for (const p of f1Fans) for (const s of ses) {
      if (s.level > p.f1) continue;
      const start = Date.parse(s.start);
      ev.push({ owner: p.owner, key: `kijk:f1:${s.key}`, start, remind: p.f1_remind_min, title: `Om ${hhmm(start)}: Formule 1, ${s.race}`,
        body: `${s.session}${p.f1_service ? ` op ${p.f1_service}` : ''}. ¡Vamos!` });
    }
  }
  const out: Record<string, string[]> = {};
  for (const e of ev) {
    if (!(now >= e.start - e.remind * 60e3 && now < e.start)) continue;
    const { error: dup } = await db.from('push_log').insert({ owner: e.owner, day: madrid(new Date(e.start)).day, kind: e.key });
    if (dup) continue; // al verstuurd
    for (const s of subs.filter(s => s.owner === e.owner)) await send(s, e.key, { title: e.title, body: e.body, url: '/#kijken' });
    (out[e.owner] ||= []).push(e.key);
  }
  return out;
}

// ---------- Dagvragen ----------
// Zelfde rekenwijze als pick() in dagvragen.js. Pas je dit aan, doe het daar ook.
type Thema = { naam: string; vragen: string[] };
function pickDagvragen(themas: Thema[], day: string) {
  const T = themas.length, n = Math.round(Date.parse(day + 'T12:00:00Z') / 864e5);
  const mod = (a: number, b: number) => ((a % b) + b) % b;
  const set = (m: number) => [mod(m, T), mod(m + 1, T), mod(m + 3, T)];
  return set(n).sort((a, b) => a - b).map(t => {
    let occ = 3 * Math.floor(n / 6);
    for (let m = n - mod(n, 6); m < n; m++) if (set(m).includes(t)) occ++;
    const qs = themas[t].vragen;
    return qs[mod(occ, qs.length)];
  });
}
async function runDagvraag(subs: Sub[], day: string, hour: number) {
  const { data: prefs, error } = await db.from('dagvraag_prefs').select('owner, at_hour').eq('push', true);
  if (error || !prefs?.length) return {};
  const due = prefs.filter(p => hour >= p.at_hour && hour < p.at_hour + 2);
  if (!due.length) return {};
  const r = await fetch('https://gezin.fransvandokkumburg.com/dagvragen.json', { headers: { 'Cache-Control': 'no-cache' } });
  if (!r.ok) throw new Error('dagvragen.json ' + r.status);
  const qs = pickDagvragen((await r.json()).themas, day);
  const msg = { title: 'Drie vragen voor vandaag', body: qs.map((q, i) => `${i + 1}. ${q}`).join('\n'), url: '/#dagvragen' };
  const out: Record<string, string> = {};
  for (const p of due) {
    const mine = subs.filter(s => s.owner === p.owner);
    if (!mine.length) continue;
    const { error: dup } = await db.from('push_log').insert({ owner: p.owner, day, kind: 'dagvraag' });
    if (dup) continue; // vandaag al gestuurd
    for (const s of mine) await send(s, 'dagvraag', msg);
    out[p.owner] = 'dagvraag';
  }
  return out;
}

// ---------- Vaste lasten: seintje een paar dagen voordat iets wordt afgeschreven ----------
// Rekent net als occurrences() in lasten.js door vanaf next_date (elke every_months maanden, zelfde dag van de maand).
// Naar iedereen, vanaf 10:00. In push_log als day = afschrijfdatum, kind = 'last:<id>', dus één keer per afschrijving.
type Expense = { id: string; title: string; amount: number; every_months: number; next_date: string; remind_days: number; note: string };
function addMonthsUTC(s: string, n: number, day: number) {
  const [y, m] = s.split('-').map(Number), t = new Date(Date.UTC(y, m - 1 + n, 1, 12));
  const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0, 12)).getUTCDate();
  t.setUTCDate(Math.min(day, last));
  return t.toISOString().slice(0, 10);
}
function nextExpense(e: Expense, from: string) {
  const step = Math.max(1, e.every_months || 12), day = Number(e.next_date.slice(8, 10));
  let k = 0, d = e.next_date;
  while (d < from && k < 1000) d = addMonthsUTC(e.next_date, step * ++k, day);
  return d;
}
async function runLasten(subs: Sub[], owners: string[], day: string, hour: number) {
  if (hour < 10 || hour >= 21 || !owners.length) return {};
  const { data, error } = await db.from('expenses').select('id, title, amount, every_months, next_date, remind_days, note').gt('remind_days', 0);
  if (error || !data?.length) return {};   // tabel nog niet aangemaakt, of geen seintjes
  const out: Record<string, string> = {};
  for (const e of data as Expense[]) {
    const d = nextExpense(e, day), left = Math.round((Date.parse(d) - Date.parse(day)) / 864e5);
    if (left < 0 || left > e.remind_days) continue;
    const when = left === 0 ? 'vandaag' : left === 1 ? 'morgen' : new Date(d + 'T12:00:00Z').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
    const msg = { title: `💶 ${e.title}`, body: `${euro(e.amount)} gaat er ${left > 1 ? 'op ' : ''}${when} af.${e.note ? ' ' + e.note : ''}`, url: '/#lasten' };
    for (const owner of owners) {
      const { error: dup } = await db.from('push_log').insert({ owner, day: d, kind: 'last:' + e.id });
      if (dup) continue; // voor deze afschrijving al gestuurd
      for (const s of subs.filter(s => s.owner === owner)) await send(s, 'last', msg);
      out[owner] = out[owner] ? out[owner] + '+' + e.title : e.title;
    }
  }
  return out;
}

// ---------- Regenseintje voor Cómpeta ----------
// Per uur van vandaag (vanaf nu tot 23:00) tellen hoeveel modellen ≥ 0,2 mm geven. Meer dan de helft = regen, minstens één = mogelijk een bui.
// Opeenvolgende uren worden tijdvakken ("11:00–14:00"). In push_log als kind 'regen', dus één keer per dag.
const RAIN_MODELS = ['ecmwf_ifs025', 'icon_seamless', 'gfs_seamless', 'meteofrance_seamless', 'ukmo_seamless', ''];
const COMPETA = { lat: 36.8333, lon: -3.9726 };
type RainHour = { h: number; wet: number; n: number; mm: number; prob: number | null };
async function rainToday(day: string, fromHour: number): Promise<RainHour[]> {
  const res = await Promise.allSettled(RAIN_MODELS.map(async m => {
    const q = new URLSearchParams({ latitude: String(COMPETA.lat), longitude: String(COMPETA.lon), hourly: 'precipitation,precipitation_probability', timezone: 'Europe/Madrid', start_date: day, end_date: day });
    if (m) q.set('models', m);
    const r = await fetch('https://api.open-meteo.com/v1/forecast?' + q);
    if (!r.ok) throw new Error(m + ' ' + r.status);
    return (await r.json()).hourly as { time: string[]; precipitation: (number | null)[]; precipitation_probability?: (number | null)[] };
  }));
  const hours: RainHour[] = [];
  for (let h = fromHour; h <= 23; h++) {
    let wet = 0, n = 0, mm = 0, prob: number | null = null;
    for (const r of res) {
      if (r.status !== 'fulfilled') continue;
      const i = r.value.time.indexOf(`${day}T${String(h).padStart(2, '0')}:00`);
      const v = i < 0 ? null : r.value.precipitation[i];
      if (v == null) continue;
      n++; mm += v; if (v >= 0.2) wet++;
      const p = r.value.precipitation_probability?.[i];
      if (p != null) prob = Math.max(prob ?? 0, p);
    }
    if (n) hours.push({ h, wet, n, mm: mm / n, prob });
  }
  return hours;
}
function blocks(hs: number[]) {
  const out: string[] = [];
  for (let i = 0; i < hs.length; i++) {
    let j = i; while (j + 1 < hs.length && hs[j + 1] === hs[j] + 1) j++;
    out.push(`${String(hs[i]).padStart(2, '0')}:00–${String(Math.min(hs[j] + 1, 24)).padStart(2, '0')}:00`);
    i = j;
  }
  return out.length > 1 ? out.slice(0, -1).join(', ') + ' en ' + out.at(-1) : out[0];
}
function rainMsg(hours: RainHour[]) {
  if (!hours.length) return null;
  const n = Math.max(...hours.map(x => x.n));
  const sure = hours.filter(x => x.wet * 2 > x.n), maybe = hours.filter(x => x.wet > 0);
  const probMax = Math.max(0, ...hours.map(x => x.prob ?? 0));
  const total = Math.round(hours.reduce((s, x) => s + x.mm, 0) * 10) / 10;
  const mm = total >= 0.5 ? `, samen ca. ${String(total).replace('.', ',')} mm` : '';
  const kans = probMax ? ` Regenkans tot ${probMax}%.` : '';
  if (sure.length) {
    const most = Math.max(...sure.map(x => x.wet));
    return { title: '☔ Regen in Cómpeta vandaag', body: `Regen verwacht: ${blocks(sure.map(x => x.h))}${mm} (${most} van ${n} bronnen).${kans} Neem een paraplu mee.`, url: '/#weer' };
  }
  if (maybe.length >= 2 || probMax >= 40) {
    const most = Math.max(...maybe.map(x => x.wet));
    return { title: '🌦️ Misschien een bui in Cómpeta', body: `Bui mogelijk: ${blocks(maybe.map(x => x.h))} (${most} van ${n} bronnen, de rest houdt het droog).${kans}`, url: '/#weer' };
  }
  return null;
}
async function runRegen(subs: Sub[], day: string, hour: number) {
  const { data: prefs, error } = await db.from('weer_prefs').select('owner, at_hour').eq('rain_push', true);
  if (error || !prefs?.length) return {};   // tabel nog niet aangemaakt, of niemand heeft het aan
  const due = prefs.filter(p => hour >= p.at_hour && hour < p.at_hour + 2 && subs.some(s => s.owner === p.owner));
  if (!due.length) return {};
  const { data: done } = await db.from('push_log').select('owner').eq('day', day).eq('kind', 'regen').in('owner', due.map(p => p.owner));
  const todo = due.filter(p => !(done || []).some(d => d.owner === p.owner));
  if (!todo.length) return {};
  const msg = rainMsg(await rainToday(day, hour));
  const out: Record<string, string> = {};
  for (const p of todo) {
    const { error: dup } = await db.from('push_log').insert({ owner: p.owner, day, kind: 'regen' });
    if (dup) continue; // vandaag al gekeken
    if (!msg) { out[p.owner] = 'droog'; continue; } // droog: geen melding, en vandaag niet nog eens kijken
    for (const s of subs.filter(s => s.owner === p.owner)) await send(s, 'regen', msg);
    out[p.owner] = 'regen';
  }
  return out;
}

async function run() {
  await keys();
  const { day, hour, dow } = madrid();
  const { data: subs } = await db.from('push_subscriptions').select('*');
  const owners = [...new Set((subs || []).map((s: Sub) => s.owner))];
  const out: Record<string, string> = {};
  // Cadeauseintje: vanaf 10:00, één keer per dag per persoon (los van de Gezond-meldingen)
  const gift = hour >= 10 && hour < 21 ? await giftMsg(day) : null;
  if (gift) for (const owner of owners) {
    const { error } = await db.from('push_log').insert({ owner, day, kind: 'cadeau' });
    if (error) continue; // vandaag al gestuurd
    for (const s of (subs as Sub[]).filter(s => s.owner === owner)) await send(s, 'cadeau', gift);
    out[owner + ':cadeau'] = 'cadeau';
  }
  for (const owner of owners) {
    const [{ data: w }, { data: sp }, { data: log }] = await Promise.all([
      db.from('weight_log').select('day').eq('owner', owner).eq('day', day),
      db.from('sport_log').select('kind').eq('owner', owner).eq('day', day),
      db.from('push_log').select('kind').eq('owner', owner).eq('day', day)
    ]);
    const sent = new Set((log || []).map(r => r.kind)), kinds = (sp || []).map(r => r.kind);
    let kind = '';
    if (dow === 6 && hour >= 19 && hour < 21 && !sent.has('week')) kind = 'week';
    else if (hour >= 7 && hour < 12 && !(w || []).length) kind = 'wegen';
    else if ((dow === 0 || dow === 2) && hour >= 12 && hour < 17 && !kinds.includes('padel')) kind = 'padel';
    else if (hour >= 17 && hour < 21 && !kinds.length) kind = 'bewegen';
    if (!kind || sent.has(kind)) continue;
    const { error } = await db.from('push_log').insert({ owner, day, kind });
    if (error) continue; // al verstuurd door een gelijktijdige run
    const msg = kind === 'week' ? await weekMsg(owner, day, dow) : undefined;
    for (const s of (subs as Sub[]).filter(s => s.owner === owner)) await send(s, kind, msg);
    out[owner] = kind;
  }
  await runTasks((subs || []) as Sub[], owners, day, hour, out);
  let kijk = {};
  try { kijk = await runKijk((subs || []) as Sub[], day, dow); } catch (e) { console.error('kijken', e); }
  let dagvraag = {};
  try { dagvraag = await runDagvraag((subs || []) as Sub[], day, hour); } catch (e) { console.error('dagvragen', e); }
  let lasten = {};
  try { lasten = await runLasten((subs || []) as Sub[], owners, day, hour); } catch (e) { console.error('lasten', e); }
  let regen = {};
  try { regen = await runRegen((subs || []) as Sub[], day, hour); } catch (e) { console.error('regen', e); }
  return { day, hour, sent: out, kijk, dagvraag, lasten, regen };
}

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const action = new URL(req.url).searchParams.get('action');
  try {
    if (action === 'key') return json({ key: (await keys()).public_key });
    if (action === 'test') {
      const { endpoint } = await req.json();
      const { data: sub } = await db.from('push_subscriptions').select('*').eq('endpoint', endpoint).maybeSingle();
      if (!sub) return json({ ok: false, error: 'onbekend abonnement' }, 404);
      await keys();
      return json({ ok: await send(sub, 'test') });
    }
    if (action === 'week') {
      const { endpoint } = await req.json();
      const { data: sub } = await db.from('push_subscriptions').select('*').eq('endpoint', endpoint).maybeSingle();
      if (!sub) return json({ ok: false, error: 'onbekend abonnement' }, 404);
      await keys();
      const { day, dow } = madrid();
      const msg = await weekMsg(sub.owner, day, dow);
      return json({ ok: await send(sub, 'week', msg), msg });
    }
    if (action === 'run') return json(await run());
    if (action === 'f1') return new Response(JSON.stringify({ sessions: await f1Sessions() }), { headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } });
    return json({ error: 'onbekende actie' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
