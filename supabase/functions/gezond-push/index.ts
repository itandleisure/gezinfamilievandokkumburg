// Pushmeldingen voor het tabblad Gezond.
// - ?action=key  : geeft de openbare VAPID-sleutel (maakt het sleutelpaar de eerste keer aan; de geheime helft blijft in de tabel push_keys)
// - ?action=test : stuurt een testmelding naar één abonnement (body: {endpoint})
// - ?action=run  : door pg_cron elke 10 minuten aangeroepen; stuurt per persoon hooguit één keer per dag per soort melding
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
async function send(sub: Sub, kind: string) {
  try {
    await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ ...MSG[kind], url: '/#gezond', tag: kind }), { TTL: 4 * 3600, urgency: 'normal' });
    return true;
  } catch (e) {
    const code = (e as { statusCode?: number }).statusCode;
    if (code === 404 || code === 410) await db.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
    console.error('push mislukt', code, String(e));
    return false;
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
    if (hour >= 7 && hour < 12 && !(w || []).length) kind = 'wegen';
    else if ((dow === 0 || dow === 2) && hour >= 12 && hour < 17 && !kinds.includes('padel')) kind = 'padel';
    else if (hour >= 17 && hour < 21 && !kinds.length) kind = 'bewegen';
    if (!kind || sent.has(kind)) continue;
    const { error } = await db.from('push_log').insert({ owner, day, kind });
    if (error) continue; // al verstuurd door een gelijktijdige run
    for (const s of (subs as Sub[]).filter(s => s.owner === owner)) await send(s, kind);
    out[owner] = kind;
  }
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
    if (action === 'run') return json(await run());
    return json({ error: 'onbekende actie' }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
