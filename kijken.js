// Tabblad Kijken: eigen kijklijst (series, films, sport) met "Vanavond" en "Deze week".
// Formule 1 komt automatisch uit de openbare F1-kalender, via de edge function (?action=f1), in Spaanse tijd.
// Data: `watch_items` en `watch_prefs`, alleen van jezelf (RLS). De pushmelding vooraf stuurt gezond-push.
import { SUPABASE_URL } from './config.js';

export const SERVICES = ['Ziggo', 'Videoland', 'Disney+', 'Amazon Prime', 'NPO Start', 'Anders'];
const SVC_CLS = { 'Ziggo': 'zi', 'Videoland': 'vl', 'Disney+': 'dp', 'Amazon Prime': 'ap', 'NPO Start': 'np' };
const KINDS = [['serie', 'Serie'], ['film', 'Film'], ['sport', 'Sport'], ['programma', 'Programma']];
const DAYS = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag'];
const WHEN = ['Geen vaste tijd', 'Elke week', 'Eén keer'];
const REMIND = [['Geen melding', 0], ['15 min van tevoren', 15], ['30 min van tevoren', 30], ['1 uur van tevoren', 60]];
const F1_OPTS = ['Uit', 'Alleen de race', 'Race, kwalificatie en sprint', 'Alles, ook de trainingen'];
const TZ = 'Europe/Madrid';

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const dow = s => (parse(s).getDay() + 6) % 7;   // 0 = maandag
const hm = t => (t || '').slice(0, 5);
// UTC-tijd naar dag en tijd in Cómpeta
function madrid(utc) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(utc)).map(x => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}
const nowLocal = () => madrid(Date.now());
const remindLabel = n => (REMIND.find(r => r[1] === n) || [n ? `${n} min van tevoren` : 'Geen melding'])[0];

// Formule 1: sessies uit de edge function, 6 uur bewaard op het toestel
const F1_KEY = 'kijken-f1';
async function f1Sessions() {
  try {
    const c = JSON.parse(localStorage.getItem(F1_KEY) || 'null');
    if (c && Date.now() - c.at < 6 * 3600e3) return c.sessions;
  } catch { /* opnieuw ophalen */ }
  try {
    const r = await fetch(SUPABASE_URL + '/functions/v1/gezond-push?action=f1');
    if (!r.ok) throw new Error(r.status);
    const { sessions } = await r.json();
    localStorage.setItem(F1_KEY, JSON.stringify({ at: Date.now(), sessions }));
    return sessions;
  } catch {
    try { return JSON.parse(localStorage.getItem(F1_KEY) || 'null')?.sessions || []; } catch { return []; }
  }
}

// Alles wat de komende 7 dagen op de planning staat, op volgorde
export function upcoming(items, prefs, f1, from = nowLocal()) {
  const out = [], last = addDays(from.day, 6);
  for (const it of items) {
    if (it.seen) continue;
    if (it.weekday != null && it.at_time) {
      for (let i = 0; i < 7; i++) { const d = addDays(from.day, i); if (dow(d) === it.weekday) out.push({ day: d, time: hm(it.at_time), it }); }
    } else if (it.on_date && it.on_date >= from.day && it.on_date <= last) out.push({ day: it.on_date, time: hm(it.at_time), it });
  }
  const lvl = prefs?.f1 ?? 1;
  for (const s of f1 || []) {
    if (s.level > lvl) continue;
    const m = madrid(s.start);
    if (m.day < from.day || m.day > last) continue;
    out.push({ day: m.day, time: m.time, f1: s, it: { title: `Formule 1 · ${s.race}`, sub: s.session, service: prefs?.f1_service ?? 'Ziggo', kind: 'sport', note: '' } });
  }
  // Wat vandaag al ruim twee uur bezig is, valt eraf
  const cut = (() => { const [h, m] = from.time.split(':').map(Number); const t = h * 60 + m - 120; return t < 0 ? '00:00' : `${pad(Math.floor(t / 60))}:${pad(t % 60)}`; })();
  return out.filter(e => e.day > from.day || !e.time || e.time >= cut)
    .sort((a, b) => (a.day + (a.time || '99')).localeCompare(b.day + (b.time || '99')));
}

const ICON_CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ICON_EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';
const ICON_BELL = '<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/></svg>';

// ctx: { root, sb, esc, run, toast, openDialog, getItems, getPrefs, isMissing, load, userId }
export function mountKijken(ctx) {
  const { root, sb, esc, run, toast } = ctx;
  let f1 = [];
  root.innerHTML = '<div id="kjPlan"></div><button class="btn primary wide" data-act="new">Iets toevoegen</button><div class="list" id="kjList"></div>';
  const plan = root.querySelector('#kjPlan'), list = root.querySelector('#kjList');
  f1Sessions().then(s => { f1 = s; render(); });

  const svc = s => s && s !== 'Anders' ? `<span class="kj-svc ${SVC_CLS[s] || ''}">${esc(s)}</span>` : '';
  const dayName = (d, today) => d === today ? 'Vandaag' : d === addDays(today, 1) ? 'Morgen' : DAYS[dow(d)][0].toUpperCase() + DAYS[dow(d)].slice(1) + ' ' + parse(d).getDate();
  function sched(it) {
    if (it.weekday != null && it.at_time) return `Elke ${DAYS[it.weekday]} ${hm(it.at_time)}`;
    if (it.on_date) return parse(it.on_date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }) + (it.at_time ? ' ' + hm(it.at_time) : '');
    return KINDS.find(k => k[0] === it.kind)?.[1] || '';
  }

  function render() {
    if (ctx.isMissing()) { plan.innerHTML = ''; list.innerHTML = '<p class="empty">De kijklijst staat nog niet in de database. Zodra die is klaargezet, kun je hier beginnen.</p>'; return; }
    const items = ctx.getItems(), prefs = ctx.getPrefs(), now = nowLocal();
    const ev = upcoming(items, prefs, f1, now);
    const tonight = ev.filter(e => e.day === now.day);
    const row = e => `<div class="kj-ev${e.f1 ? ' f1' : ''}"${e.it.id ? ` data-id="${esc(e.it.id)}"` : ''}><span class="kj-time">${esc(e.time || '–')}</span>
      <span class="kj-what"><b>${esc(e.it.title)}</b><small>${e.it.sub ? esc(e.it.sub) + ' ' : ''}${svc(e.it.service)}${e.it.note ? ' ' + esc(e.it.note) : ''}</small></span></div>`;
    const byDay = {};
    for (const e of ev) if (e.day !== now.day) (byDay[e.day] ||= []).push(e);
    plan.innerHTML = `<div class="card kj-tonight"><h3>Vandaag en vanavond</h3>${tonight.length ? tonight.map(row).join('') : '<p class="mut">Vandaag staat er niets gepland. Tijd voor iets uit je lijst?</p>'}</div>`
      + `<div class="kj-week"><h3 class="kj-h">Deze week</h3>${Object.keys(byDay).length ? Object.entries(byDay).map(([d, es]) => `<div class="kj-day"><h4>${esc(dayName(d, now.day))}</h4>${es.map(row).join('')}</div>`).join('') : '<p class="mut">De rest van de week is nog leeg.</p>'}</div>`
      + `<button class="kj-f1set" data-act="f1"><span>🏎️ Formule 1: <b>${esc(F1_OPTS[prefs?.f1 ?? 1])}</b>${(prefs?.f1 ?? 1) ? ` · ${esc(prefs?.f1_service ?? 'Ziggo')} · ${esc(remindLabel(prefs?.f1_remind_min ?? 30).replace(' van tevoren', ''))}` : ''}</span><em>Wijzig</em></button>`;

    const open = items.filter(i => !i.seen).sort((a, b) => a.title.localeCompare(b.title, 'nl'));
    const seen = items.filter(i => i.seen);
    const item = i => `<div class="task${i.seen ? ' done' : ''}" data-id="${esc(i.id)}">
      <button class="tick" data-act="seen" aria-label="${i.seen ? 'Terugzetten' : 'Gezien'}: ${esc(i.title)}"><span>${ICON_CHECK}</span></button>
      <button class="txt" data-act="edit"><b>${esc(i.title)}</b><small>${svc(i.service)} ${esc(sched(i))}${i.remind_min && (i.on_date || i.weekday != null) && i.at_time ? ` <span class="kj-bell" title="${esc(remindLabel(i.remind_min))}">${ICON_BELL}</span>` : ''}</small>${i.note ? `<small class="note-txt">${esc(i.note)}</small>` : ''}</button>
      <button class="mini" data-act="edit" aria-label="Bewerken: ${esc(i.title)}">${ICON_EDIT}</button></div>`;
    list.innerHTML = (open.length ? `<div class="group"><h3>Mijn lijst</h3>${open.map(item).join('')}</div>` : '<p class="empty">Nog niets op je lijst. Zet er een serie, film of wedstrijd op, met de dienst en eventueel de dag en tijd.</p>')
      + (seen.length ? `<details class="group kj-seen"><summary>Gezien (${seen.length})</summary>${seen.map(item).join('')}</details>` : '');
  }

  function edit(i = {}) {
    const when = i.weekday != null ? WHEN[1] : i.on_date ? WHEN[2] : WHEN[0];
    ctx.openDialog({
      title: i.id ? 'Bewerken' : 'Iets om te kijken',
      fields: [
        { name: 'title', label: 'Wat wil je kijken?', value: i.title, required: true },
        { name: 'kind', label: 'Soort', type: 'select', options: KINDS.map(k => k[1]), value: KINDS.find(k => k[0] === (i.kind || 'serie'))[1] },
        { name: 'service', label: 'Waar?', type: 'select', options: SERVICES, value: i.service || 'Ziggo' },
        { name: 'when', label: 'Wanneer?', type: 'select', options: WHEN, value: when },
        { name: 'weekday', label: 'Dag (bij elke week)', type: 'select', options: DAYS, value: DAYS[i.weekday ?? dow(nowLocal().day)] },
        { name: 'on_date', label: 'Datum (bij één keer)', type: 'date', value: i.on_date || nowLocal().day },
        { name: 'at_time', label: 'Hoe laat? (Spaanse tijd)', type: 'time', value: hm(i.at_time) || '21:00' },
        { name: 'remind', label: 'Melding', type: 'select', options: REMIND.map(r => r[0]), value: remindLabel(i.remind_min ?? 30) },
        { name: 'note', label: 'Notitie (optioneel), bijv. "op de laptop" of "seizoen 2"', value: i.note }
      ],
      onSave: async v => {
        if (!v.title) { toast('Vul in wat je wilt kijken'); return false; }
        const w = WHEN.indexOf(v.when);
        if (w > 0 && !v.at_time) { toast('Kies een tijd'); return false; }
        const data = {
          title: v.title, kind: (KINDS.find(k => k[1] === v.kind) || KINDS[0])[0], service: v.service === 'Anders' ? '' : v.service,
          weekday: w === 1 ? DAYS.indexOf(v.weekday) : null, on_date: w === 2 ? v.on_date || null : null, at_time: w > 0 ? v.at_time : null,
          remind_min: (REMIND.find(r => r[0] === v.remind) || REMIND[2])[1], note: v.note
        };
        const ok = await run(i.id ? sb.from('watch_items').update(data).eq('id', i.id) : sb.from('watch_items').insert(data), i.id ? 'Opgeslagen' : 'Op je lijst gezet');
        if (ok) { await ctx.load('watch_items'); render(); }
        return ok;
      },
      onDelete: i.id ? async () => { await run(sb.from('watch_items').delete().eq('id', i.id), 'Verwijderd'); await ctx.load('watch_items'); render(); } : null
    });
  }

  function editF1() {
    const p = ctx.getPrefs() || {};
    ctx.openDialog({
      title: 'Formule 1',
      fields: [
        { name: 'f1', label: 'Wat wil je zien? De tijden komen vanzelf uit de F1-kalender.', type: 'select', options: F1_OPTS, value: F1_OPTS[p.f1 ?? 1] },
        { name: 'svc', label: 'Waar kijk je?', type: 'select', options: SERVICES, value: p.f1_service ?? 'Ziggo' },
        { name: 'remind', label: 'Melding', type: 'select', options: REMIND.map(r => r[0]), value: remindLabel(p.f1_remind_min ?? 30) }
      ],
      onSave: async v => {
        const row = { owner: ctx.userId(), f1: Math.max(0, F1_OPTS.indexOf(v.f1)), f1_service: v.svc === 'Anders' ? '' : v.svc, f1_remind_min: (REMIND.find(r => r[0] === v.remind) || REMIND[2])[1], updated_at: new Date().toISOString() };
        const ok = await run(sb.from('watch_prefs').upsert(row), 'Opgeslagen');
        if (ok) { await ctx.load('watch_prefs'); render(); }
        return ok;
      }
    });
  }

  root.addEventListener('click', async e => {
    const el = e.target.closest('[data-act]');
    if (!el) { const ev = e.target.closest('.kj-ev[data-id]'); const i = ev && ctx.getItems().find(x => x.id === ev.dataset.id); if (i) edit(i); return; }
    if (ctx.isMissing()) { toast('De database is nog niet klaar voor de kijklijst'); return; }
    if (el.dataset.act === 'new') return edit();
    if (el.dataset.act === 'f1') return editF1();
    const i = ctx.getItems().find(x => x.id === el.closest('[data-id]')?.dataset.id); if (!i) return;
    if (el.dataset.act === 'edit') edit(i);
    if (el.dataset.act === 'seen') {
      i.seen = !i.seen; render();
      if (!await run(sb.from('watch_items').update({ seen: i.seen }).eq('id', i.id), i.seen ? 'Gezien ✓' : 'Teruggezet')) { await ctx.load('watch_items'); render(); }
    }
  });

  return { render };
}
