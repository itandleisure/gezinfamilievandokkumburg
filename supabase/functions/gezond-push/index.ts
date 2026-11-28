// Pushmeldingen voor het tabblad Gezond.
// - ?action=key  : geeft de openbare VAPID-sleutel (maakt het sleutelpaar de eerste keer aan; de geheime helft blijft in de tabel push_keys)
// - ?action=test : stuurt een testmelding naar één abonnement (body: {endpoint})
// - ?action=run  : door pg_cron elke 10 minuten aangeroepen; stuurt per persoon hooguit één keer per dag per soort melding
// - ?action=week : (test) stuurt het weekoverzicht nu naar één abonnement (body: {endpoint})
// Taken: elke dag vanaf 09:00 één melding per persoon als er taken over tijd zijn (eigen taken plus taken van samen).
// Op zondag tussen 19:00 en 21:00 gaat het weekoverzicht: gewicht, bewegen en water van de week, met een complimentje of tip.
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

async function run() {
  await keys();
  const { day, hour, dow } = madrid();
  const { data: subs } = await db.from('push_subscriptions').select('*');
  const owners = [...new Set((subs || []).map((s: Sub) => s.owner))];
  const out: Record<string, string> = {};
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
  return { day, hour, sent: out };
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
    return json({ error: 'onbekende actie' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
