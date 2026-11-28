// Tabblad Gezond: gewicht per ochtend, weekgemiddelde met grafiek, doellijn, trendlijn en verwachte doeldatum,
// sport afvinken per dag met een sportstreak (weken op rij minstens 3 dagen bewogen),
// plus het duwtje ("Heb je vandaag al bewogen?") dat bovenaan de app verschijnt.
// Elke ingelogde gebruiker ziet alleen zijn eigen gegevens (kolom owner, RLS).

import { extrasHtml, celebrate, milestones, reached } from './gezondplus.js';

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const kgf = n => Number(n).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const sgn = n => Math.abs(n) < 0.05 ? 'gelijk' : (n > 0 ? '+' : '−') + kgf(Math.abs(n));
const pad = n => String(n).padStart(2, '0');
export const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dt = s => new Date(s + 'T12:00:00');
const addDays = (s, n) => { const d = dt(s); d.setDate(d.getDate() + n); return iso(d); };
const monday = s => { const d = dt(s); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
const daysBetween = (a, b) => Math.round((dt(b) - dt(a)) / 864e5);
const DAGEN = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
const kort = s => dt(s).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
function weekNr(s) { const d = dt(s); d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7)); const j = new Date(d.getFullYear(), 0, 4); return 1 + Math.round(((d - j) / 864e5 - 3 + ((j.getDay() + 6) % 7)) / 7); }

// Nieuwe sporten achteraan toevoegen; de sleutel staat in de database
export const SPORT = [
  { k: 'padel', n: 'Padel', x: 'ma en wo 11–12', i: '<circle cx="10" cy="9" r="6"/><path d="M14 13l6 7M7 7l6 4M9 13l3-6"/>' },
  { k: 'kracht', n: 'Kracht', x: 'BODYPUMP of kettlebell', i: '<path d="M9 7a3 3 0 0 1 6 0"/><path d="M8 7h8l1.5 3A6 6 0 1 1 6.5 10z"/>' },
  { k: 'wandelen', n: 'Wandelen', x: 'in de bergen', i: '<path d="M3 20l6-10 4 6 2-3 6 7z"/><circle cx="16" cy="5" r="2"/>' },
  { k: 'hardlopen', n: 'Hardlopen', x: 'of strandwandeling', i: '<circle cx="14" cy="4.5" r="2"/><path d="M6 21l3.5-6 3 2.5V22M9.5 15l1.5-6 4 3h3M11 9l-4 1-1.5 3"/>' }
];
const SPORTN = Object.fromEntries(SPORT.map(s => [s.k, s.n]));

// ---------- Berekeningen ----------
const sorted = rows => rows.filter(r => r.kg != null).map(r => ({ day: r.day, kg: Number(r.kg) })).sort((a, b) => (a.day < b.day ? -1 : 1));
// Weekgemiddelden (week begint op maandag)
export function weeks(rows) {
  const m = new Map();
  for (const r of sorted(rows)) { const w = monday(r.day); if (!m.has(w)) m.set(w, []); m.get(w).push(r.kg); }
  return [...m].map(([w, l]) => ({ w, avg: l.reduce((a, b) => a + b, 0) / l.length, n: l.length }));
}
// Voortschrijdend gemiddelde over de laatste 7 dagen, per weegdag
function rolling(rows) {
  const s = sorted(rows);
  return s.map((r, i) => { const l = s.slice(0, i + 1).filter(x => daysBetween(x.day, r.day) < 7); return { day: r.day, kg: l.reduce((a, b) => a + b.kg, 0) / l.length }; });
}

// Trendlijn: rechte lijn door de weegmomenten van de laatste 4 weken (kleinste kwadraten).
// Geeft ook het tempo per week en de verwachte datum waarop het doel gehaald wordt.
export function trend(rows, goal, days = 28) {
  const s = sorted(rows); if (s.length < 4) return null;
  const end = s[s.length - 1].day, p = s.filter(r => r.day > addDays(end, -days));
  if (p.length < 4 || daysBetween(p[0].day, end) < 10) return null;
  const xs = p.map(r => daysBetween(p[0].day, r.day)), n = p.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n, my = p.reduce((a, r) => a + r.kg, 0) / n;
  let sxy = 0, sxx = 0; p.forEach((r, i) => { sxy += (xs[i] - mx) * (r.kg - my); sxx += (xs[i] - mx) ** 2; });
  const b = sxx ? sxy / sxx : 0, a = my - b * mx, at = d => a + b * daysBetween(p[0].day, d);
  const now = at(end), perWeek = -b * 7;
  let eta = null, reached = now <= goal;
  if (!reached && perWeek > 0.05) { const dd = Math.round((now - goal) / -b); if (dd <= 730) eta = addDays(end, dd); }
  return { from: p[0].day, end, at, now, perWeek, eta, reached };
}

// Sportstreak: weken op rij met minstens STREAK_DAGEN dagen bewogen. Padel op ma en wo telt gewoon mee.
// De lopende week telt mee zodra hij gehaald is; anders breekt hij de reeks (nog) niet.
export const STREAK_DAGEN = 3;
export function streak(sport, today) {
  const dagen = w => new Set(sport.filter(r => r.day >= w && r.day <= addDays(w, 6)).map(r => r.day)).size;
  const thisW = monday(today), nu = dagen(thisW);
  let n = nu >= STREAK_DAGEN ? 1 : 0, w = addDays(thisW, -7);
  while (n < 520 && dagen(w) >= STREAK_DAGEN) { n++; w = addDays(w, -7); }
  const last8 = Array.from({ length: 8 }, (_, i) => { const m = addDays(thisW, -7 * (7 - i)); return { w: m, n: dagen(m), cur: m === thisW }; });
  // Padel: ma- en wo-sessies op rij gespeeld (vandaag telt alleen mee als hij al is afgevinkt)
  const played = new Set(sport.filter(r => r.kind === 'padel').map(r => r.day));
  let padel = 0, d = today;
  for (let i = 0; i < 1500; i++, d = addDays(d, -1)) {
    const dow = (dt(d).getDay() + 6) % 7; if (dow !== 0 && dow !== 2) continue;
    if (played.has(d)) padel++; else if (d !== today) break;
  }
  return { n, nu, last8, padel };
}
function streakHtml(sport, today) {
  const st = streak(sport, today), nog = Math.max(0, STREAK_DAGEN - st.nu);
  const kop = st.n ? `<b>${st.n} ${st.n === 1 ? 'week' : 'weken'} op rij</b> minstens ${STREAK_DAGEN} dagen bewogen` : `Beweeg ${STREAK_DAGEN} dagen in een week en je reeks begint`;
  const sub = nog ? `Deze week nog ${nog} ${nog === 1 ? 'dag' : 'dagen'} nodig${st.n ? ' om je reeks te verlengen' : ''}.` : 'Deze week is binnen. Lekker bezig!';
  return `<div class="gz-streak">
    <div class="gz-st-top"><span class="gz-fire${st.n ? ' on' : ''}" aria-hidden="true">🔥</span><p>${kop}<br><small class="mut">${sub}</small></p></div>
    <div class="gz-st-wk" aria-label="De laatste 8 weken">${st.last8.map(w => `<span class="${w.n >= STREAK_DAGEN ? 'ok' : ''}${w.cur ? ' cur' : ''}" title="Week ${weekNr(w.w)}: ${w.n} ${w.n === 1 ? 'dag' : 'dagen'}"><i>${w.n}</i><small>${weekNr(w.w)}</small></span>`).join('')}</div>
    ${st.padel ? `<p class="gz-st-padel">Padel: <b>${st.padel}× op rij</b> gespeeld op ma en wo.</p>` : ''}
  </div>`;
}

// Het duwtje voor bovenaan de app (of null)
export function nudge({ weights, sport, settings }, now = new Date()) {
  if (settings && settings.reminders === false) return null;
  const today = iso(now), h = now.getHours(), dow = (now.getDay() + 6) % 7;
  const wogen = weights.some(r => r.day === today), mine = sport.filter(r => r.day === today).map(r => r.kind);
  if (!wogen && h >= 7 && h < 12) return { id: 'wegen', text: 'Goedemorgen! Even op de weegschaal? Het liefst nu, vóór het ontbijt.' };
  if ((dow === 0 || dow === 2) && h >= 12 && !mine.includes('padel')) return { id: 'padel', text: '¿Qué tal el pádel? Gespeeld vandaag? Vink het even af.' };
  if (!mine.length && h >= 17) return { id: 'bewegen', text: 'Heb je vandaag al bewogen? Een wandeling in de bergen telt ook.' };
  return null;
}

// ---------- Grafiek ----------
function chart(rows, goal, range) {
  let s = sorted(rows);
  if (!s.length) return '<p class="empty">Nog geen gewicht ingevuld. Zodra je een paar ochtenden hebt gewogen, verschijnt hier je lijn.</p>';
  const end = s[s.length - 1].day;
  const tr = trend(rows, goal), naarDoel = range === 'doel' && tr && tr.eta;
  if (range !== 'alles' && range !== 'doel') { const from = addDays(end, -7 * Number(range)); s = s.filter(r => r.day >= from); }
  const avg = rolling(rows).filter(r => r.day >= s[0].day);
  const start = s[0].day, last = naarDoel ? tr.eta : end, span = Math.max(daysBetween(start, last), 6);
  const W = 340, H = 200, L = 34, R = 8, T = 10, B = 24;
  const vals = s.map(r => r.kg).concat(goal);
  const lo = Math.floor(Math.min(...vals) - 0.5), hi = Math.ceil(Math.max(...vals) + 0.5);
  const x = d => L + (daysBetween(start, d) / span) * (W - L - R);
  const y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  const step = Math.max(1, Math.ceil((hi - lo) / 5));
  let grid = '';
  for (let v = Math.ceil(lo); v <= hi; v += step) grid += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="gz-grid"/><text x="${L - 5}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  const ticks = [start, last].concat(span > 20 ? [addDays(start, Math.round(span / 2))] : []);
  const xl = ticks.map(d => `<text x="${x(d)}" y="${H - 6}" text-anchor="${d === start ? 'start' : d === last ? 'end' : 'middle'}">${kort(d)}</text>`).join('');
  const line = avg.map((r, i) => `${i ? 'L' : 'M'}${x(r.day).toFixed(1)} ${y(r.kg).toFixed(1)}`).join(' ');
  // Trendlijn (gestippeld) over de laatste 4 weken; bij "Tot doel" doorgetrokken tot de verwachte datum
  let trl = '';
  if (tr) {
    const a = tr.from < start ? start : tr.from, b = naarDoel ? tr.eta : tr.end;
    trl = `<path d="M${x(a).toFixed(1)} ${y(tr.at(a)).toFixed(1)} L${x(b).toFixed(1)} ${y(naarDoel ? goal : tr.at(b)).toFixed(1)}" class="gz-trend"/>`;
    if (naarDoel) trl += `<line x1="${x(end).toFixed(1)}" x2="${x(end).toFixed(1)}" y1="${T}" y2="${H - B}" class="gz-now"/><text x="${(x(end) - 4).toFixed(1)}" y="${T + 9}" text-anchor="end">nu</text>
      <circle cx="${x(tr.eta).toFixed(1)}" cy="${y(goal).toFixed(1)}" r="5.5" class="gz-flag"/><text x="${(x(tr.eta) - 2).toFixed(1)}" y="${(y(goal) - 10).toFixed(1)}" text-anchor="end" class="gz-goalt">doel ± ${kort(tr.eta)} ${dt(tr.eta).getFullYear()}</text>`;
  }
  return `<svg class="gz-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafiek van je gewicht met weekgemiddelde en doel ${kgf(goal)} kilo">
    ${grid}
    <line x1="${L}" x2="${W - R}" y1="${y(goal)}" y2="${y(goal)}" class="gz-goal"/><text x="${naarDoel ? L + 4 : W - R}" y="${y(goal) - 5}" text-anchor="${naarDoel ? 'start' : 'end'}" class="gz-goalt">doel ${kgf(goal)}</text>
    ${s.map(r => `<circle cx="${x(r.day).toFixed(1)}" cy="${y(r.kg).toFixed(1)}" r="2.6" class="gz-dot"/>`).join('')}
    <path d="${line}" class="gz-avg"/>
    ${trl}
    ${xl}</svg>
    <p class="gz-leg"><span class="gz-k1"></span>gemiddelde van 7 dagen <span class="gz-k2"></span>losse ochtenden ${tr ? '<span class="gz-k4"></span>trend ' : ''}<span class="gz-k3"></span>doel</p>
    ${range === 'doel' && !naarDoel ? `<p class="gz-pace">${tr && tr.reached ? 'Je trend zit al op je doel. Nu vasthouden!' : tr ? 'Je trend gaat nu niet (genoeg) omlaag, dus er is nog geen verwachte datum. Hierboven zie je al je metingen.' : 'Na een week of twee wegen zie je hier wanneer je je doel verwacht te halen.'}</p>` : ''}`;
}

// ---------- BMI-meter (halve maan met wijzer) ----------
const BMI_MIN = 16, BMI_MAX = 36;
const BMI_ZONES = [[16, 18.5, 'gz-z0', 'Ondergewicht'], [18.5, 25, 'gz-z1', 'Gezond gewicht'], [25, 30, 'gz-z2', 'Overgewicht'], [30, 36, 'gz-z3', 'Obesitas']];
export const bmi = (kg, cm) => kg / ((cm / 100) ** 2);
function gauge(kg, goalKg, cm, bron) {
  const v = bmi(kg, cm), goal = bmi(goalKg, cm);
  const cx = 110, cy = 124, r = 86;
  const ang = x => Math.PI * (1 - (Math.min(Math.max(x, BMI_MIN), BMI_MAX) - BMI_MIN) / (BMI_MAX - BMI_MIN));
  const pt = (x, rr) => [cx + rr * Math.cos(ang(x)), cy - rr * Math.sin(ang(x))].map(n => n.toFixed(1));
  const arc = (a, b) => { const [x1, y1] = pt(a, r), [x2, y2] = pt(b, r); return `M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}`; };
  const zone = BMI_ZONES.find(z => v < z[1]) || BMI_ZONES[3];
  const [nx, ny] = pt(v, r - 18), [g1x, g1y] = pt(goal, r - 14), [g2x, g2y] = pt(goal, r + 14), [gtx, gty] = pt(goal, r + 22);
  const labels = [18.5, 25, 30].map(x => { const [lx, ly] = pt(x, r - 26); return `<text x="${lx}" y="${ly}" text-anchor="middle">${String(x).replace('.', ',')}</text>`; }).join('');
  const nodig = v >= 25 ? `Voor een BMI onder 25 zit je op ${kgf(24.9 * (cm / 100) ** 2)} kg of minder.` : 'Je zit in het groene gebied. Mooi zo!';
  return `<div class="card gz-bmi">
    <svg viewBox="0 0 220 142" role="img" aria-label="BMI-meter: ${kgf(v)}, ${zone[3].toLowerCase()}">
      ${BMI_ZONES.map(z => `<path d="${arc(z[0], z[1])}" class="gz-zone ${z[2]}"/>`).join('')}
      ${labels}
      <line x1="${g1x}" y1="${g1y}" x2="${g2x}" y2="${g2y}" class="gz-gtick"/><text x="${gtx}" y="${gty}" text-anchor="middle" class="gz-gtxt">doel</text>
      <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" class="gz-needle"/><circle cx="${cx}" cy="${cy}" r="7" class="gz-hub"/>
    </svg>
    <div class="gz-bmival"><b>${kgf(v)}</b> <span class="${zone[2]}t">${zone[3]}</span></div>
    <p class="gz-pace">BMI bij ${kgf(kg)} kg (${bron}) en ${String(cm / 100).replace('.', ',')} m. Je doel van ${kgf(goalKg)} kg is een BMI van ${kgf(goal)}. ${nodig}</p>
  </div>`;
}

// ---------- Tabblad ----------
export function mountGezond(root, api) {
  // api: { get() -> {weights, sport, settings}, saveWeight(day, kg), deleteWeight(day), toggleSport(day, kind, on), saveSettings(obj), openDialog }
  let day = iso(new Date()), range = '8', draft = null, draftDay = null, dirty = false, openTrain = true;
  const $ = s => root.querySelector(s);

  function render() {
    const { weights, sport, settings, missing, days, daysMissing } = api.get();
    if (missing) { root.innerHTML = '<div class="task-alert">Nog één stap: de database voor gewicht en sport moet nog worden aangemaakt in Supabase. Daarna werkt dit tabblad.</div>'; return; }
    const today = iso(new Date());
    const startKg = Number(settings?.start_kg ?? 93.9), goal = Number(settings?.goal_kg ?? 78);
    const lengte = Number(settings?.height_cm ?? 179);
    const byDay = Object.fromEntries(weights.map(r => [r.day, Number(r.kg)]));
    const last = sorted(weights).filter(r => r.day <= day).pop();
    // Startwaarde: het gewicht van deze dag, anders het laatst ingevulde gewicht ervoor (meestal gisteren).
    // Opnieuw bepalen zolang je zelf nog niets hebt aangepast, zodat het klopt zodra de gegevens binnen zijn.
    if (draftDay !== day) dirty = false;
    if (draftDay !== day || !dirty) { draft = byDay[day] ?? (last ? last.kg : startKg); draftDay = day; }
    const saved = byDay[day];
    const mon = monday(day);
    const strip = DAGEN.map((n, i) => {
      const d = addDays(mon, i), cnt = sport.filter(r => r.day === d).length;
      return `<button class="gz-day${d === day ? ' sel' : ''}${d === today ? ' today' : ''}" data-day="${d}"${d > today ? ' disabled' : ''} aria-label="${dt(d).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}">
        <small>${n}</small><b>${dt(d).getDate()}</b><span>${byDay[d] != null ? '<i class="w"></i>' : ''}${'<i class="s"></i>'.repeat(Math.min(cnt, 3))}</span></button>`;
    }).join('');
    const mine = sport.filter(r => r.day === day).map(r => r.kind);
    const minsOf = k => { const r = sport.find(x => x.day === day && x.kind === k); return r && r.minutes ? Number(r.minutes) : null; };
    // Wandelen en hardlopen: optioneel hoe lang (snelle knoppen)
    const MIN_KINDS = { wandelen: 'Hoe lang gewandeld?', hardlopen: 'Hoe lang gelopen?' };
    const minRows = Object.entries(MIN_KINDS).filter(([k]) => mine.includes(k)).map(([k, q]) => {
      const cur = minsOf(k);
      return `<div class="gz-mins"><span>${q}</span><div class="sp-row">${[30, 45, 60, 90].map(m => `<button class="chip" data-mins="${m}" data-kind="${k}" aria-pressed="${cur === m}">${m} min</button>`).join('')}<button class="chip" data-mins="?" data-kind="${k}" aria-pressed="${cur != null && ![30, 45, 60, 90].includes(cur)}">${cur != null && ![30, 45, 60, 90].includes(cur) ? cur + ' min' : 'Anders'}</button></div></div>`;
    }).join('');
    const isToday = day === today;
    const dagNaam = isToday ? 'Vandaag' : dt(day).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });

    // Voortgang
    const wk = weeks(weights), cur = wk[wk.length - 1], prev = wk[wk.length - 2];
    let prog = '';
    if (cur) {
      const lost = startKg - cur.avg, togo = cur.avg - goal, pct = Math.max(0, Math.min(100, lost / (startKg - goal) * 100));
      const tr = trend(weights, goal);
      let pace = '';
      if (togo <= 0) pace = 'Doel gehaald! Nu vasthouden.';
      else if (tr && tr.eta) {
        const wkn = Math.round(daysBetween(today, tr.eta) / 7);
        pace = `Je trend gaat ${kgf(tr.perWeek)} kg per week omlaag. In dit tempo haal je ${kgf(goal)} kg rond <b>${dt(tr.eta).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</b>${wkn > 1 ? ` (nog ongeveer ${wkn} weken)` : ''}.${tr.perWeek > 1 ? ' Dat is snel: meer dan 1 kg per week houd je meestal niet vol.' : ''}`;
      } else if (tr && tr.perWeek > 0.05) pace = `Je trend gaat ${kgf(tr.perWeek)} kg per week omlaag. Mooi, maar je doel ligt in dit tempo nog meer dan twee jaar weg.`;
      else if (tr) pace = 'De laatste weken staat het stil. Kijk even naar het menu en of je genoeg beweegt.';
      else pace = 'Na twee weken wegen zie je hier je tempo. Gezond is 0,5 tot 0,7 kg per week.';
      prog = `<div class="msum gz-sum">
        <small class="mut">Weekgemiddelde${cur.w === monday(today) ? ' deze week' : ' week ' + weekNr(cur.w)} (${cur.n}× gewogen)</small>
        <div class="big">${kgf(cur.avg)} <small>kg</small></div>
        ${prev ? `<p class="gz-delta ${cur.avg < prev.avg - 0.04 ? 'down' : cur.avg > prev.avg + 0.04 ? 'up' : ''}">${Math.abs(cur.avg - prev.avg) < 0.05 ? 'Gelijk aan vorige week' : sgn(cur.avg - prev.avg) + ' kg t.o.v. vorige week'}</p>` : ''}
        <div class="meter" aria-hidden="true"><i style="width:${pct.toFixed(0)}%"></i></div>
        <p class="gz-line"><span>${lost >= 0 ? kgf(lost) + ' kg eraf' : kgf(-lost) + ' kg erbij'} sinds ${kgf(startKg)}</span><span>${togo > 0 ? 'nog ' + kgf(togo) + ' kg' : 'doel gehaald'}</span></p>
        <p class="gz-pace">${pace}</p></div>`;
    }
    const recentW = wk.slice(-8).reverse();
    const minKg = weights.length ? Math.min(...weights.map(r => Number(r.kg))) : null;
    const table = recentW.length ? `<details class="sp-box gz-weeks"><summary>Per week</summary>${recentW.map((w, i) => {
      const p = recentW[i + 1], d = p ? w.avg - p.avg : null;
      return `<div class="gz-wrow"><span>Week ${weekNr(w.w)} <small class="mut">${kort(w.w)}</small></span><b>${kgf(w.avg)}</b><span class="gz-delta ${d == null || Math.abs(d) < 0.05 ? '' : d < 0 ? 'down' : 'up'}">${d == null ? '' : sgn(d)}</span></div>`;
    }).join('')}</details>` : '';

    // Sport deze week
    const weekSport = sport.filter(r => r.day >= mon && r.day <= addDays(mon, 6));
    const actDays = new Set(weekSport.map(r => r.day)).size;
    const perKind = SPORT.map(s => [s.n, weekSport.filter(r => r.kind === s.k).length]).filter(x => x[1]);
    const weekMin = weekSport.reduce((t, r) => t + (Number(r.minutes) || 0), 0);

    root.innerHTML = `
      <div class="card gz-card list">
        <div class="gz-wk">
          <button class="mini" data-nav="-7" aria-label="Vorige week"><svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg></button>
          <b>Week ${weekNr(mon)}</b>
          <button class="mini" data-nav="7" aria-label="Volgende week"${addDays(mon, 7) > today ? ' disabled' : ''}><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
        </div>
        <div class="gz-strip">${strip}</div>
        <h2 class="gz-h">${esc(dagNaam)}</h2>
        <form class="gz-weigh" id="gzForm">
          <button type="button" class="btn gz-pm" data-pm="-1" aria-label="0,1 kilo minder">−</button>
          <label class="sr" for="gzKg">Gewicht in kilo</label>
          <input id="gzKg" inputmode="decimal" autocomplete="off" value="${kgf(draft)}">
          <button type="button" class="btn gz-pm" data-pm="1" aria-label="0,1 kilo meer">+</button>
          <button class="btn ${saved != null && Math.abs(saved - draft) < 0.05 ? 'done' : 'primary'}" type="submit">${saved != null && Math.abs(saved - draft) < 0.05 ? 'Opgeslagen ✓' : saved != null ? 'Wijzigen' : 'Opslaan'}</button>
        </form>
        ${saved != null ? `<button class="btn link gz-del" type="button" id="gzDel">Gewicht van deze dag wissen</button>` : `<p class="gz-tip mut">Weeg je 's ochtends, na het plassen en vóór het ontbijt. Losse dagen schommelen, het weekgemiddelde telt.</p>`}
        <h3 class="gz-h3">Bewogen</h3>
        <div class="gz-sport">${SPORT.map(s => `<button class="gz-sp${mine.includes(s.k) ? ' on' : ''}" data-sport="${s.k}" aria-pressed="${mine.includes(s.k)}">
          <svg viewBox="0 0 24 24">${s.i}</svg><b>${s.n}</b><small>${s.x}</small><span class="gz-ok">✓</span></button>`).join('')}</div>
        ${minRows}
        <p class="gz-weeksum">${actDays ? `Deze week ${actDays} ${actDays === 1 ? 'dag' : 'dagen'} bewogen${perKind.length ? ': ' + perKind.map(([n, c]) => `${n.toLowerCase()} ${c}×`).join(', ') : ''}.${weekMin ? ` Samen ${weekMin >= 60 ? Math.floor(weekMin / 60) + ' uur' + (weekMin % 60 ? ' en ' + (weekMin % 60) + ' min' : '') : weekMin + ' min'} wandelen en lopen.` : ''}` : 'Deze week nog niets afgevinkt.'}</p>
        ${streakHtml(sport, today)}
      </div>
      ${daysMissing ? '' : extrasHtml({ day, today, dow: (dt(day).getDay() + 6) % 7, info: (days || []).find(r => r.day === day), days, sport: mine, settings, minKg, startKg, goal, openTrain })}
      <h2 class="gz-h2">Voortgang</h2>
      ${prog}
      ${(() => { const lw = sorted(weights).pop(); return cur ? gauge(cur.avg, goal, lengte, 'weekgemiddelde') : gauge(lw ? lw.kg : startKg, goal, lengte, 'startgewicht'); })()}
      <div class="chips" role="tablist" aria-label="Periode">${[['4', '4 weken'], ['8', '8 weken'], ['26', 'Half jaar'], ['alles', 'Alles'], ['doel', 'Tot doel']].map(([k, n]) => `<button class="chip" role="tab" data-range="${k}" aria-selected="${range === k}">${n}</button>`).join('')}</div>
      <div class="card">${chart(weights, goal, range)}</div>
      ${table}
      <div class="card gz-push" id="gzPush"><h3 class="gz-h3">Meldingen op deze telefoon</h3><p class="mut" id="gzPushTxt">Even kijken…</p><div class="sp-row" id="gzPushBtns"></div></div>
      <div class="actions"><button class="btn" id="gzSet">Startgewicht, doel en herinneringen</button></div>`;
    fillPush();
    checkMilestone(weights, settings, startKg, goal);
  }

  // Feestje bij elke 2 kg eraf (één keer per mijlpaal, onthouden in health_settings.milestone_kg)
  let partied = null;
  function checkMilestone(weights, settings, startKg, goal) {
    if (!weights.length || !api.saveSettings) return;
    const m = reached(milestones(startKg, goal), Math.min(...weights.map(r => Number(r.kg))));
    if (m == null) return;
    let seen = settings?.milestone_kg != null ? Number(settings.milestone_kg) : null;
    try { const l = localStorage.getItem('gz-milestone'); if (l && (seen == null || Number(l) < seen)) seen = Number(l); } catch (e) {}
    if ((seen != null && m >= seen - 1e-9) || partied === m) return;
    partied = m;
    try { localStorage.setItem('gz-milestone', String(m)); } catch (e) {}
    celebrate(m, startKg, goal);
    api.saveSettings({ milestone_kg: m }, true);
  }

  root.addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t || t.disabled) return;
    if (t.dataset.day) { day = t.dataset.day; render(); return; }
    if (t.dataset.nav) { const n = addDays(day, Number(t.dataset.nav)), today = iso(new Date()); day = n > today ? today : n; render(); return; }
    if (t.dataset.range) { range = t.dataset.range; render(); return; }
    if (t.dataset.pm) { dirty = true; readDraft(); draft = Math.round((draft + Number(t.dataset.pm) / 10) * 10) / 10; $('#gzKg').value = kgf(draft); refreshSave(); return; }
    if (t.dataset.sport) {
      const on = !t.classList.contains('on');
      t.classList.toggle('on', on); t.setAttribute('aria-pressed', on);
      await api.toggleSport(day, t.dataset.sport, on); render(); return;
    }
    // Waterteller, snackkaart en trainingskaart
    const info = () => (api.get().days || []).find(r => r.day === day) || { water: 0, snacks: {} };
    if (t.dataset.water != null) { await api.saveDay(day, { water: Number(t.dataset.water) }); render(); return; }
    if (t.dataset.wpm) { await api.saveDay(day, { water: Math.max(0, Math.min(30, (info().water || 0) + Number(t.dataset.wpm))) }); render(); return; }
    if (t.dataset.snack || t.dataset.snackmin) {
      const k = t.dataset.snack || t.dataset.snackmin, sn = { ...(info().snacks || {}) };
      sn[k] = Math.max(0, (sn[k] || 0) + (t.dataset.snack ? 1 : -1)); if (!sn[k]) delete sn[k];
      await api.saveDay(day, { snacks: sn }); render(); return;
    }
    if (t.dataset.sleep) { const v = Number(t.dataset.sleep); await api.saveDay(day, { sleep: info().sleep === v ? null : v }); render(); return; }
    if (t.dataset.wst) { const i = $('#gpCm'), v = parseFloat(i.value.replace(',', '.')) || 100; i.value = String(Math.round((v + Number(t.dataset.wst)) * 2) / 2).replace('.', ','); const b = $('#gpWaist [type=submit]'); b.className = 'btn primary'; b.textContent = 'Taille opslaan'; return; }
    if (t.dataset.did) { const on = !api.get().sport.some(r => r.day === day && r.kind === 'kracht'); await api.toggleSport(day, 'kracht', on); render(); return; }
    if (t.dataset.mins) {
      const cur = api.get().sport.find(r => r.day === day && r.kind === t.dataset.kind);
      let m = t.dataset.mins === '?' ? parseInt(prompt('Hoeveel minuten?', cur?.minutes || '') || '', 10) : Number(t.dataset.mins);
      if (t.dataset.mins === '?' && !(m >= 1 && m <= 600)) return;
      if (t.getAttribute('aria-pressed') === 'true' && t.dataset.mins !== '?') m = null;   // nog een tik = minuten weg
      await api.setMinutes(day, t.dataset.kind, m); render(); return;
    }
    if (t.id === 'gzDel') { await api.deleteWeight(day); draftDay = null; render(); return; }
    if (t.id === 'gzSet') settingsDialog();
    if (t.dataset.push) {
      t.disabled = true; const old = t.textContent; t.textContent = 'Bezig…';
      const act = t.dataset.push;
      try {
        if (act === 'on') { const r = await api.push.enable(); if (!r.ok) pushMsg = r.msg; else pushMsg = 'Klaar! Om 07:00 krijg je de eerste herinnering, als je dan nog niet hebt gewogen.'; }
        if (act === 'off') { await api.push.disable(); pushMsg = 'Meldingen staan uit op deze telefoon.'; }
        if (act === 'week') pushMsg = await api.push.week() ? 'Je weekoverzicht is onderweg.' : 'Het weekoverzicht lukte niet. Zet meldingen uit en weer aan.';
        if (act === 'test') pushMsg = await api.push.test() ? 'Testmelding verstuurd. Hij komt binnen een paar seconden.' : 'De testmelding lukte niet. Zet meldingen uit en weer aan.';
      } catch (err) { pushMsg = 'Dat lukte niet: ' + err.message; }
      t.textContent = old; t.disabled = false; fillPush(); return;
    }
  });
  let pushMsg = '';
  async function fillPush() {
    const txt = $('#gzPushTxt'), btns = $('#gzPushBtns'); if (!txt || !api.push) return;
    const st = await api.push.state();
    const T = {
      'unsupported-ios': ['Meldingen werken alleen als je de app opent vanaf je beginscherm (het icoontje Gezin), niet in Safari.', ''],
      unsupported: ['Deze telefoon of browser ondersteunt geen pushmeldingen. De herinneringen bovenaan de app blijven gewoon werken.', ''],
      denied: ['Meldingen zijn geblokkeerd. Zet ze aan via Instellingen › Meldingen › Gezin, en tik daarna hier nog een keer.', ''],
      off: ['Krijg een seintje om 07:00 om te wegen, op ma en wo om 12:00 voor padel, en om 17:00 als je nog niet hebt bewogen. Alleen als je het nog niet hebt ingevuld. Op zondag om 19:00 krijg je je weekoverzicht.', '<button class="btn primary" data-push="on">Meldingen aanzetten</button>'],
      on: ['Meldingen staan aan ✓ Je krijgt alleen een seintje als je iets nog niet hebt ingevuld, en op zondag om 19:00 je weekoverzicht.', '<button class="btn" data-push="test">Testmelding</button><button class="btn" data-push="week">Weekoverzicht nu</button><button class="btn" data-push="off">Uitzetten</button>']
    }[st];
    txt.textContent = pushMsg || T[0]; pushMsg = '';
    txt.className = st === 'on' ? 'gz-ok-txt' : 'mut';
    btns.innerHTML = T[1];
  }
  function readDraft() { const v = parseFloat($('#gzKg').value.replace(',', '.')); if (v >= 30 && v <= 300) draft = Math.round(v * 10) / 10; }
  function refreshSave() { const b = $('#gzForm [type=submit]'); const saved = api.get().weights.find(r => r.day === day); b.className = 'btn primary'; b.textContent = saved ? 'Wijzigen' : 'Opslaan'; }
  root.addEventListener('toggle', e => { const d = e.target; if (d.matches && d.matches('.gp-tr') && !d.closest('.gp-more')) openTrain = d.open; }, true);
  root.addEventListener('input', e => { if (e.target.id === 'gzKg') { dirty = true; refreshSave(); } });
  root.addEventListener('submit', async e => {
    e.preventDefault();
    if (e.target.id === 'gpWaist') {
      const v = parseFloat($('#gpCm').value.replace(',', '.'));
      if (!(v >= 40 && v <= 200)) { $('#gpCm').focus(); return; }
      $('#gpCm').blur(); await api.saveDay(day, { waist_cm: Math.round(v * 10) / 10 }); render(); return;
    }
    const v = parseFloat($('#gzKg').value.replace(',', '.'));
    if (!(v >= 30 && v <= 300)) { $('#gzKg').focus(); return; }
    draft = Math.round(v * 10) / 10; dirty = false;
    $('#gzKg').blur();
    if (await api.saveWeight(day, draft)) render();
  });
  function settingsDialog() {
    const s = api.get().settings || {};
    api.openDialog({
      title: 'Doel, water, snacks en herinneringen',
      fields: [
        { name: 'start_kg', label: 'Startgewicht (kg)', value: kgf(s.start_kg ?? 93.9), inputmode: 'decimal' },
        { name: 'goal_kg', label: 'Doelgewicht (kg)', value: kgf(s.goal_kg ?? 78), inputmode: 'decimal' },
        { name: 'height_cm', label: 'Lengte (cm), voor de BMI', value: String(s.height_cm ?? 179), inputmode: 'numeric' },
        { name: 'water_goal', label: 'Glazen water per dag', value: String(s.water_goal ?? 8), inputmode: 'numeric' },
        { name: 'snack_kcal', label: 'Kcal voor tussendoortjes per dag', value: String(s.snack_kcal ?? 400), inputmode: 'numeric' },
        { name: 'reminders', label: 'Herinneringen bovenaan de app tonen ("Heb je vandaag al bewogen?")', type: 'checkbox', value: s.reminders !== false }
      ],
      onSave: async v => {
        const n = x => parseFloat(String(x).replace(',', '.'));
        const start_kg = n(v.start_kg), goal_kg = n(v.goal_kg);
        const height_cm = Math.round(n(v.height_cm));
        if (!(start_kg >= 30 && start_kg <= 300 && goal_kg >= 30 && goal_kg <= 300 && height_cm >= 100 && height_cm <= 230)) return false;
        const water_goal = Math.round(n(v.water_goal)), snack_kcal = Math.round(n(v.snack_kcal));
        if (!(water_goal >= 1 && water_goal <= 20 && snack_kcal >= 0 && snack_kcal <= 2000)) return false;
        return api.saveSettings({ start_kg, goal_kg, height_cm, reminders: v.reminders, water_goal, snack_kcal });
      }
    });
  }
  return { render };
}
