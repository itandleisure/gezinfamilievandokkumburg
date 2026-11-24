// Tabblad Gezond: gewicht per ochtend, weekgemiddelde met grafiek en doellijn, sport afvinken per dag,
// plus het duwtje ("Heb je vandaag al bewogen?") dat bovenaan de app verschijnt.
// Elke ingelogde gebruiker ziet alleen zijn eigen gegevens (kolom owner, RLS).

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

// Het duwtje voor bovenaan de app (of null)
export function nudge({ weights, sport, settings }, now = new Date()) {
  if (settings && settings.reminders === false) return null;
  const today = iso(now), h = now.getHours(), dow = (now.getDay() + 6) % 7;
  const wogen = weights.some(r => r.day === today), mine = sport.filter(r => r.day === today).map(r => r.kind);
  if (!wogen && h >= 5 && h < 12) return { id: 'wegen', text: 'Goedemorgen! Even op de weegschaal? Het liefst nu, vóór het ontbijt.' };
  if ((dow === 0 || dow === 2) && h >= 12 && !mine.includes('padel')) return { id: 'padel', text: '¿Qué tal el pádel? Gespeeld vandaag? Vink het even af.' };
  if (!mine.length && h >= 17) return { id: 'bewegen', text: 'Heb je vandaag al bewogen? Een wandeling in de bergen telt ook.' };
  return null;
}

// ---------- Grafiek ----------
function chart(rows, goal, range) {
  let s = sorted(rows);
  if (!s.length) return '<p class="empty">Nog geen gewicht ingevuld. Zodra je een paar ochtenden hebt gewogen, verschijnt hier je lijn.</p>';
  const end = s[s.length - 1].day;
  if (range !== 'alles') { const from = addDays(end, -7 * Number(range)); s = s.filter(r => r.day >= from); }
  const avg = rolling(rows).filter(r => r.day >= s[0].day);
  const start = s[0].day, span = Math.max(daysBetween(start, end), 6);
  const W = 340, H = 200, L = 34, R = 8, T = 10, B = 24;
  const vals = s.map(r => r.kg).concat(goal);
  const lo = Math.floor(Math.min(...vals) - 0.5), hi = Math.ceil(Math.max(...vals) + 0.5);
  const x = d => L + (daysBetween(start, d) / span) * (W - L - R);
  const y = v => T + (hi - v) / (hi - lo) * (H - T - B);
  const step = Math.max(1, Math.ceil((hi - lo) / 5));
  let grid = '';
  for (let v = Math.ceil(lo); v <= hi; v += step) grid += `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="gz-grid"/><text x="${L - 5}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
  const ticks = [start, end].concat(span > 20 ? [addDays(start, Math.round(span / 2))] : []);
  const xl = ticks.map(d => `<text x="${x(d)}" y="${H - 6}" text-anchor="${d === start ? 'start' : d === end ? 'end' : 'middle'}">${kort(d)}</text>`).join('');
  const line = avg.map((r, i) => `${i ? 'L' : 'M'}${x(r.day).toFixed(1)} ${y(r.kg).toFixed(1)}`).join(' ');
  return `<svg class="gz-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Grafiek van je gewicht met weekgemiddelde en doel ${kgf(goal)} kilo">
    ${grid}
    <line x1="${L}" x2="${W - R}" y1="${y(goal)}" y2="${y(goal)}" class="gz-goal"/><text x="${W - R}" y="${y(goal) - 5}" text-anchor="end" class="gz-goalt">doel ${kgf(goal)}</text>
    ${s.map(r => `<circle cx="${x(r.day).toFixed(1)}" cy="${y(r.kg).toFixed(1)}" r="2.6" class="gz-dot"/>`).join('')}
    <path d="${line}" class="gz-avg"/>
    ${xl}</svg>
    <p class="gz-leg"><span class="gz-k1"></span>gemiddelde van 7 dagen <span class="gz-k2"></span>losse ochtenden <span class="gz-k3"></span>doel</p>`;
}

// ---------- Tabblad ----------
export function mountGezond(root, api) {
  // api: { get() -> {weights, sport, settings}, saveWeight(day, kg), deleteWeight(day), toggleSport(day, kind, on), saveSettings(obj), openDialog }
  let day = iso(new Date()), range = '8', draft = null, draftDay = null;
  const $ = s => root.querySelector(s);

  function render() {
    const { weights, sport, settings, missing } = api.get();
    if (missing) { root.innerHTML = '<div class="task-alert">Nog één stap: de database voor gewicht en sport moet nog worden aangemaakt in Supabase. Daarna werkt dit tabblad.</div>'; return; }
    const today = iso(new Date());
    const startKg = Number(settings?.start_kg ?? 93), goal = Number(settings?.goal_kg ?? 78);
    const byDay = Object.fromEntries(weights.map(r => [r.day, Number(r.kg)]));
    const last = sorted(weights).filter(r => r.day <= day).pop();
    if (draftDay !== day) { draft = byDay[day] ?? (last ? last.kg : startKg); draftDay = day; }
    const saved = byDay[day];
    const mon = monday(day);
    const strip = DAGEN.map((n, i) => {
      const d = addDays(mon, i), cnt = sport.filter(r => r.day === d).length;
      return `<button class="gz-day${d === day ? ' sel' : ''}${d === today ? ' today' : ''}" data-day="${d}"${d > today ? ' disabled' : ''} aria-label="${dt(d).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}">
        <small>${n}</small><b>${dt(d).getDate()}</b><span>${byDay[d] != null ? '<i class="w"></i>' : ''}${'<i class="s"></i>'.repeat(Math.min(cnt, 3))}</span></button>`;
    }).join('');
    const mine = sport.filter(r => r.day === day).map(r => r.kind);
    const isToday = day === today;
    const dagNaam = isToday ? 'Vandaag' : dt(day).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });

    // Voortgang
    const wk = weeks(weights), cur = wk[wk.length - 1], prev = wk[wk.length - 2];
    let prog = '';
    if (cur) {
      const lost = startKg - cur.avg, togo = cur.avg - goal, pct = Math.max(0, Math.min(100, lost / (startKg - goal) * 100));
      const ref = wk.length >= 4 ? wk[wk.length - 4] : wk[0], nW = daysBetween(ref.w, cur.w) / 7;
      const rate = nW >= 2 ? (ref.avg - cur.avg) / nW : null;
      let pace = '';
      if (togo <= 0) pace = 'Doel gehaald! Nu vasthouden.';
      else if (rate && rate > 0.05) {
        const when = dt(cur.w); when.setDate(when.getDate() + Math.round(togo / rate * 7));
        pace = `Je gaat ${kgf(rate)} kg per week omlaag. In dit tempo haal je ${kgf(goal)} kg rond <b>${when.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}</b>.`;
      } else if (rate != null) pace = 'De laatste weken staat het stil. Kijk even naar het menu en of je genoeg beweegt.';
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
    const table = recentW.length ? `<details class="sp-box gz-weeks"><summary>Per week</summary>${recentW.map((w, i) => {
      const p = recentW[i + 1], d = p ? w.avg - p.avg : null;
      return `<div class="gz-wrow"><span>Week ${weekNr(w.w)} <small class="mut">${kort(w.w)}</small></span><b>${kgf(w.avg)}</b><span class="gz-delta ${d == null || Math.abs(d) < 0.05 ? '' : d < 0 ? 'down' : 'up'}">${d == null ? '' : sgn(d)}</span></div>`;
    }).join('')}</details>` : '';

    // Sport deze week
    const weekSport = sport.filter(r => r.day >= mon && r.day <= addDays(mon, 6));
    const actDays = new Set(weekSport.map(r => r.day)).size;
    const perKind = SPORT.map(s => [s.n, weekSport.filter(r => r.kind === s.k).length]).filter(x => x[1]);

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
        <p class="gz-weeksum">${actDays ? `Deze week ${actDays} ${actDays === 1 ? 'dag' : 'dagen'} bewogen${perKind.length ? ': ' + perKind.map(([n, c]) => `${n.toLowerCase()} ${c}×`).join(', ') : ''}.` : 'Deze week nog niets afgevinkt.'}</p>
      </div>
      <h2 class="gz-h2">Voortgang</h2>
      ${prog}
      <div class="chips" role="tablist" aria-label="Periode">${[['4', '4 weken'], ['8', '8 weken'], ['26', 'Half jaar'], ['alles', 'Alles']].map(([k, n]) => `<button class="chip" role="tab" data-range="${k}" aria-selected="${range === k}">${n}</button>`).join('')}</div>
      <div class="card">${chart(weights, goal, range)}</div>
      ${table}
      <div class="actions"><button class="btn" id="gzSet">Startgewicht, doel en herinneringen</button></div>`;
  }

  root.addEventListener('click', async e => {
    const t = e.target.closest('button'); if (!t || t.disabled) return;
    if (t.dataset.day) { day = t.dataset.day; render(); return; }
    if (t.dataset.nav) { const n = addDays(day, Number(t.dataset.nav)), today = iso(new Date()); day = n > today ? today : n; render(); return; }
    if (t.dataset.range) { range = t.dataset.range; render(); return; }
    if (t.dataset.pm) { readDraft(); draft = Math.round((draft + Number(t.dataset.pm) / 10) * 10) / 10; $('#gzKg').value = kgf(draft); refreshSave(); return; }
    if (t.dataset.sport) {
      const on = !t.classList.contains('on');
      t.classList.toggle('on', on); t.setAttribute('aria-pressed', on);
      await api.toggleSport(day, t.dataset.sport, on); render(); return;
    }
    if (t.id === 'gzDel') { await api.deleteWeight(day); draftDay = null; render(); return; }
    if (t.id === 'gzSet') settingsDialog();
  });
  function readDraft() { const v = parseFloat($('#gzKg').value.replace(',', '.')); if (v >= 30 && v <= 300) draft = Math.round(v * 10) / 10; }
  function refreshSave() { const b = $('#gzForm [type=submit]'); const saved = api.get().weights.find(r => r.day === day); b.className = 'btn primary'; b.textContent = saved ? 'Wijzigen' : 'Opslaan'; }
  root.addEventListener('input', e => { if (e.target.id === 'gzKg') refreshSave(); });
  root.addEventListener('submit', async e => {
    e.preventDefault();
    const v = parseFloat($('#gzKg').value.replace(',', '.'));
    if (!(v >= 30 && v <= 300)) { $('#gzKg').focus(); return; }
    draft = Math.round(v * 10) / 10;
    $('#gzKg').blur();
    if (await api.saveWeight(day, draft)) render();
  });
  function settingsDialog() {
    const s = api.get().settings || {};
    api.openDialog({
      title: 'Doel en herinneringen',
      fields: [
        { name: 'start_kg', label: 'Startgewicht (kg)', value: kgf(s.start_kg ?? 93), inputmode: 'decimal' },
        { name: 'goal_kg', label: 'Doelgewicht (kg)', value: kgf(s.goal_kg ?? 78), inputmode: 'decimal' },
        { name: 'reminders', label: 'Herinneringen bovenaan de app tonen ("Heb je vandaag al bewogen?")', type: 'checkbox', value: s.reminders !== false }
      ],
      onSave: async v => {
        const n = x => parseFloat(String(x).replace(',', '.'));
        const start_kg = n(v.start_kg), goal_kg = n(v.goal_kg);
        if (!(start_kg >= 30 && start_kg <= 300 && goal_kg >= 30 && goal_kg <= 300)) return false;
        return api.saveSettings({ start_kg, goal_kg, reminders: v.reminders });
      }
    });
  }
  return { render };
}
