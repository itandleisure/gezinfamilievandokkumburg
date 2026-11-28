// Tabblad Financieel (tegel onder Meer): het vermogen van het gezin, met subtegels.
// Gedeeld met iedereen die een account heeft, maar alleen na inloggen: RLS "alleen gezin" op alle fin_-tabellen.
// LET OP: de repo is openbaar. Zet hier dus NOOIT bedragen, rekeningnummers, geboortedata of namen van instellingen in.
// Alle gegevens staan alleen in Supabase:
//   fin_sources   = rekeningen en potten (saldo, datum, vrij vanaf, inleg, rendement)
//   fin_mortgage  = één rij (id 1): woningwaarde en hypotheek; de restschuld rekent de app zelf uit (annuïteit)
//   fin_snapshots = per maand vastgelegd (JJJJ-MM): bezittingen, schuld, netto, per soort en per gezinslid
//   fin_settings  = één rij (id 1) met `data` (jsonb): namen van de gezinsleden, maandverdeling, pensioendoel, herinnerdag
//   fin_todos     = afspraken en adviezen om af te vinken, met een optionele herinneringsdatum (remind_on)
// De pushmeldingen (saldi bijwerken op de 17e, herinneringen uit fin_todos) stuurt gezond-push (runFin).
// Rekenregels komen uit het eerdere vermogensoverzicht: maandelijks rente-op-rente, 4% behoudend, 6% en 8% als alternatief,
// pensioen = uitkering met zelfgekozen looptijd (annuïteit) vanaf de vrijvaldatum.

export const CATS = { pensioen: 'Pensioen', kind: 'Rekening kind', beleggen: 'Beleggen', sparen: 'Sparen', lopend: 'Lopende rekeningen' };
const CAT_ICON = { pensioen: '🧓', kind: '🧒', beleggen: '📈', sparen: '🐷', lopend: '💳', woning: '🏠' };
const CAT_COLOR = { pensioen: 'var(--blue)', kind: 'var(--terra)', beleggen: 'var(--ok)', sparen: 'light-dark(#6b8f3a,#a6c46f)', lopend: 'light-dark(#7a6aa8,#b4a6e0)', woning: 'var(--mut)' };
const LOCKED = new Set(['pensioen', 'kind']);
const STALE_DAYS = 35;
const SCEN = [
  { r: 0, label: 'Alleen inleg', color: 'var(--mut)', dash: '4 4' },
  { r: 4, label: '4% behoudend', color: 'var(--blue)', w: 3 },
  { r: 6, label: '6% gemiddeld', color: 'var(--ok)' },
  { r: 8, label: '8% gunstig', color: 'var(--terra)' }
];
const SUBS = {
  vermogen: 'Vermogen', rekeningen: 'Rekeningen', huis: 'Huis en hypotheek', pensioen: 'Pensioen en prognose',
  maand: 'Maandverdeling', afspraken: 'Afspraken en adviezen', bijwerken: 'Saldi bijwerken'
};

// ---------- Hulpjes ----------
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => iso(new Date());
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d || 1, 12); };
const num = v => (v === null || v === undefined || v === '' ? null : Number(v));
const daysAgo = s => (s ? Math.floor((parse(today()) - parse(s)) / 864e5) : null);
const eur = (v, dec = 0) => (v < 0 ? '−\u00a0€\u00a0' : '€\u00a0') + Math.abs(Number(v || 0)).toLocaleString('nl-NL', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const eurK = v => { const a = Math.abs(v); return a >= 1e6 ? '€ ' + (v / 1e6).toLocaleString('nl-NL', { maximumFractionDigits: 2 }) + ' mln' : a >= 1e4 ? '€ ' + Math.round(v / 1e3) + 'k' : eur(v); };
const fmtD = s => (s ? parse(s).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) : '–');
const monthName = ym => parse(ym + '-01').toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
const pct = v => String(v).replace('.', ',');
function addYears(s, y) { const d = parse(s); d.setFullYear(d.getFullYear() + y); return iso(d); }
function monthsUntil(s) { const n = new Date(), t = parse(s); return Math.max(0, (t.getFullYear() - n.getFullYear()) * 12 + (t.getMonth() - n.getMonth())); }
function ymPlus(k) { const n = new Date(); const d = new Date(n.getFullYear(), n.getMonth() + k, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
// Bedrag uit een invulveld: '1.234,56', '1234.56' of '85' → getal (leeg = null)
export function toAmount(s) {
  let t = String(s ?? '').replace(/[€\s]/g, '');
  if (!t) return null;
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t); return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}
const inAmt = v => (v === null || v === undefined || v === '' ? '' : String(v).replace('.', ','));

// ---------- Rekenwerk ----------
// Hypotheek: annuïteit. Geeft restschuld nu, maandlast, einddatum en het schema per jaar.
export function mortgage(m = {}) {
  const P = num(m.principal), r = num(m.rate_pct), start = m.start_date, years = num(m.years) || 20;
  if (!P || r === null || !start) return { remaining: num(m.override) || 0 };
  const N = years * 12, i = r / 1200, pmt = i ? P * i / (1 - Math.pow(1 + i, -N)) : P / N;
  const st = parse(start), now = new Date();
  const k = Math.max(0, Math.min(N, (now.getFullYear() - st.getFullYear()) * 12 + (now.getMonth() - st.getMonth())));
  const bal = j => Math.max(0, i ? P * Math.pow(1 + i, j) - pmt * (Math.pow(1 + i, j) - 1) / i : P - pmt * j);
  const end = new Date(st); end.setMonth(end.getMonth() + N);
  const schedule = []; for (let y = 0; y <= years; y++) schedule.push({ x: st.getFullYear() + y, y: bal(Math.min(N, y * 12)) });
  const computed = bal(k);
  return { remaining: num(m.override) ?? computed, computed, pmt, end: iso(end), paidPct: 1 - computed / P, schedule, k, N, P };
}
const unlockOf = s => s.unlock_date || (s.birth_date && s.category === 'kind' ? addYears(s.birth_date, 18) : null);

// Totalen voor één gezinslid of 'all'. Woning en hypotheek horen bij 'ouders'.
export function totals(sources, mort, member = 'all') {
  const list = member === 'all' ? sources : sources.filter(s => s.member === member);
  const house = member === 'all' || member === 'ouders';
  let assets = 0, liquid = 0; const byCat = {};
  for (const s of list) {
    const b = num(s.balance); if (b === null) continue;
    assets += b; byCat[s.category] = (byCat[s.category] || 0) + b;
    const u = unlockOf(s); if (!LOCKED.has(s.category) && (!u || u <= today())) liquid += b;
  }
  const hv = house ? num(mort.house_value) : null; if (hv) { assets += hv; byCat.woning = (byCat.woning || 0) + hv; }
  const m = mortgage(mort), debt = house ? (m.remaining || 0) : 0;
  return { assets, liquid, debt, net: assets - debt, byCat, m };
}
// Momentopname voor fin_snapshots
export function snapshot(sources, mort, members, month) {
  const t = totals(sources, mort, 'all'), r = x => Math.round(x * 100) / 100;
  const byMember = {};
  for (const k of members) { const x = totals(sources, mort, k); byMember[k] = { assets: Math.round(x.assets), debt: Math.round(x.debt), net: Math.round(x.net) }; }
  return { month, assets: Math.round(t.assets), debt: Math.round(t.debt), net: Math.round(t.net), by_cat: Object.fromEntries(Object.entries(t.byCat).map(([k, v]) => [k, r(v)])), by_member: byMember, saved_at: today() };
}
// Groei per maand: v = v·(1+i) + inleg; Y = extra inleg elke januari. C mag een functie van de maand k zijn.
export function project(V0, C, ratePct, months, Y = 0) {
  const i = ratePct / 1200, m0 = new Date().getMonth(), out = [V0]; let v = V0;
  for (let k = 1; k <= months; k++) { v = v * (1 + i) + (typeof C === 'function' ? C(k) : C); if (Y && (m0 + k) % 12 === 0) v += Y; out.push(v); }
  return out;
}
// Maandinleg van een bron in maand k vanaf nu (met geplande wijziging next_contribution vanaf next_contribution_from)
const contribAt = (s, k) => (s.next_contribution_from && ymPlus(k) >= s.next_contribution_from ? num(s.next_contribution) || 0 : num(s.monthly_contribution) || 0);
// Pensioenpot: groei tot de vrijvaldatum, daarna een uitkering over 10/15/20/25 jaar
export function projectPension(s, fallbackDate) {
  const d = s.unlock_date || fallbackDate, B = num(s.balance); if (!d || B === null) return null;
  const months = monthsUntil(d), r = num(s.expected_return_pct) ?? 4, q = (num(s.payout_rate_pct) ?? 2.5) / 1200;
  const fv = project(B, num(s.monthly_contribution) || 0, r, months, num(s.yearly_contribution) || 0)[months];
  const pay = y => (q ? fv * q / (1 - Math.pow(1 + q, -y * 12)) : fv / (y * 12));
  return { date: d, assumed: !s.unlock_date, months, fv, r, q: q * 1200, options: [10, 15, 20, 25].map(y => ({ y, pm: pay(y) })) };
}

// ---------- Grafieken (eigen SVG, geen bibliotheek) ----------
function lineChart(series, { labels = [], height = 190, money = true } = {}) {
  const W = 360, H = height, L = 50, R = 10, T = 10, B = 24;
  const n = Math.max(...series.map(s => s.v.length)); if (n < 2) return '';
  const all = series.flatMap(s => s.v), yMax = Math.max(...all) * 1.06 || 1, yMin = Math.min(0, ...all);
  const X = k => L + k / (n - 1) * (W - L - R), Y = v => T + (1 - (v - yMin) / (yMax - yMin)) * (H - T - B);
  let g = '';
  for (let k = 0; k <= 3; k++) { const v = yMin + (yMax - yMin) * k / 3; g += `<line x1="${L}" x2="${W - R}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}" stroke="var(--line)"/><text x="${L - 6}" y="${(Y(v) + 4).toFixed(1)}" text-anchor="end">${money ? eurK(v) : Math.round(v)}</text>`; }
  for (const [k, t] of labels) g += `<text x="${X(k).toFixed(1)}" y="${H - 6}" text-anchor="${k >= n - 1 ? 'end' : 'middle'}">${t}</text>`;
  const lines = series.map(s => `<path d="${s.v.map((v, k) => (k ? 'L' : 'M') + X(k).toFixed(1) + ',' + Y(v).toFixed(1)).join('')}" fill="none" stroke="${s.color}" stroke-width="${s.w || 2}"${s.dash ? ` stroke-dasharray="${s.dash}"` : ''}/>` +
    (s.dots ? s.v.map((v, k) => `<circle cx="${X(k).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="4" fill="${s.color}"/>`).join('') : `<circle cx="${X(s.v.length - 1).toFixed(1)}" cy="${Y(s.v[s.v.length - 1]).toFixed(1)}" r="3.5" fill="${s.color}"/>`)).join('');
  const area = series.length === 1 && series[0].area ? `<path d="${series[0].v.map((v, k) => (k ? 'L' : 'M') + X(k).toFixed(1) + ',' + Y(v).toFixed(1)).join('')}L${X(n - 1).toFixed(1)},${Y(yMin).toFixed(1)}L${X(0).toFixed(1)},${Y(yMin).toFixed(1)}Z" fill="${series[0].color}" fill-opacity=".12"/>` : '';
  const legend = series.length > 1 ? `<div class="fin-legend">${series.map(s => `<span><i style="background:${s.color}"></i>${s.label} <b>${eurK(s.v[s.v.length - 1])}</b></span>`).join('')}</div>` : '';
  return `<svg class="fin-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="grafiek">${g}${area}${lines}</svg>${legend}`;
}
// Scenario's 0/4/6/8% over M maanden, met jaarlabels
function scenChart(V0, C, M, Y = 0, scen = SCEN) {
  const ser = scen.map(sc => ({ ...sc, v: project(V0, C, sc.r, M, Y) }));
  const y0 = new Date().getFullYear(), yrs = Math.ceil(M / 12), step = yrs <= 10 ? 2 : yrs <= 20 ? 5 : 10, labels = [];
  for (let y = 0; y * 12 <= M; y += step) labels.push([y * 12, y0 + y]);
  return { ser, html: lineChart(ser, { labels }) };
}

// ctx: { root, sb, esc, run, toast, openDialog, load, get: () => ({ sources, mortgage, snapshots, settings, todos }), isMissing }
export function mountFinancieel(ctx) {
  const { root, sb, esc, run, toast } = ctx;
  let sub = '', cur = 'all', invYears = 20;
  try { const m = localStorage.getItem('fin-member'); if (m) cur = m; } catch { /* privé-modus */ }

  const data = () => {
    const d = ctx.get();
    const settings = (d.settings[0] && d.settings[0].data) || {};
    return { sources: [...d.sources].sort((a, b) => (a.position ?? 99) - (b.position ?? 99) || String(a.name).localeCompare(b.name)),
      mort: d.mortgage[0] || {}, snaps: [...d.snapshots].sort((a, b) => (a.month < b.month ? -1 : 1)), settings, todos: d.todos };
  };
  const members = st => ({ ouders: 'Ouders', ...(st.members || {}) });
  const memberName = (st, k) => members(st)[k] || k;

  function header(title) {
    return `<div class="fin-head"><button class="btn link" data-act="back">‹ Financieel</button><h2>${esc(title)}</h2></div>`;
  }
  function kpi(label, value, cls = '') { return `<div class="${cls}"><small>${esc(label)}</small><b>${esc(value)}</b></div>`; }
  function chips(st) {
    const ms = { all: 'Hele gezin', ...members(st) };
    if (!ms[cur]) cur = 'all';
    return `<div class="chips fin-chips">${Object.entries(ms).map(([k, v]) => `<button class="chip${k === cur ? ' on' : ''}" data-act="member" data-m="${esc(k)}">${esc(v)}</button>`).join('')}</div>`;
  }
  const stale = s => num(s.balance) !== null && daysAgo(s.as_of) > STALE_DAYS;
  const monthDone = snaps => snaps.some(x => x.month === today().slice(0, 7));
  const remindDay = st => num(st.remind_day) ?? 17;

  // ---------- Startscherm met subtegels ----------
  function home() {
    const { sources, mort, snaps, settings: st, todos } = data();
    const t = totals(sources, mort), m = mortgage(mort);
    // Vergelijken met de laatst vastgelegde maand vóór deze maand
    const prev = snaps.filter(x => x.month < today().slice(0, 7)).pop();
    const nStale = sources.filter(stale).length, open = todos.filter(x => !x.done).length;
    const pl = plan(sources, st);
    const due = new Date().getDate() >= remindDay(st) && !monthDone(snaps);
    const latest = sources.map(s => s.as_of).filter(Boolean).sort().pop();
    const tile = (k, icon, title, small) => `<button class="tile" data-sub="${k}"><span aria-hidden="true" class="fin-ic">${icon}</span><span>${title}</span><small>${small}</small></button>`;
    return `<div class="fin-hero card">
        <small>Netto vermogen hele gezin</small>
        <b class="fin-big">${esc(eur(t.net))}</b>
        ${prev ? `<small class="${t.net >= prev.net ? 'up' : 'down'}">${t.net >= prev.net ? '▲' : '▼'} ${esc(eur(Math.abs(t.net - prev.net)))} sinds ${esc(monthName(prev.month))}</small>` : ''}
        <small class="mut">${latest ? `Laatste saldo van ${esc(fmtD(latest))}` : 'Nog geen saldi ingevuld'}</small>
      </div>
      ${due ? `<button class="task-alert fin-due" data-sub="bijwerken">💶 Tijd om de saldi van ${esc(monthName(today().slice(0, 7)))} bij te werken. Tik hier.</button>` : ''}
      <nav class="tiles fin-tiles">
        ${tile('vermogen', '📊', 'Vermogen', `${esc(eur(t.net))} netto · verloop per maand`)}
        ${tile('rekeningen', '🏦', 'Rekeningen', `${sources.length} rekeningen${nStale ? ` · <b class="warn">${nStale} niet bijgewerkt</b>` : ''}`)}
        ${tile('huis', '🏠', 'Huis en hypotheek', m.pmt ? `Restschuld ${esc(eur(m.remaining))}` : 'Woning en hypotheek invullen')}
        ${tile('pensioen', '🧓', 'Pensioen', 'Doel en prognose bij 4, 6 en 8%')}
        ${tile('maand', '🧮', 'Maandverdeling', pl ? `Vrij boven de buffer: ${esc(eur(pl.free))}` : 'Leefgeld, inleg en buffer')}
        ${tile('afspraken', '✅', 'Afspraken', open ? `${open} open om te regelen` : 'Alles geregeld')}
        <a class="tile" href="#lasten" data-v="lasten"><span aria-hidden="true" class="fin-ic">💶</span><span>Vaste lasten</span><small>IBI, verzekeringen en abonnementen</small></a>
      </nav>
      <button class="btn primary wide fin-update" data-sub="bijwerken">Saldi bijwerken</button>`;
  }

  // ---------- Vermogen ----------
  function vermogen() {
    const { sources, mort, snaps, settings: st } = data();
    const t = totals(sources, mort, cur), withHouse = cur === 'all' || cur === 'ouders';
    const cats = ['woning', ...Object.keys(CATS)].filter(c => t.byCat[c] > 0);
    const name = cur === 'all' ? 'hele gezin' : memberName(st, cur);
    const netOf = x => (cur === 'all' ? x.net : (x.by_member && x.by_member[cur] ? x.by_member[cur].net : null));
    const hist = snaps.map(x => ({ m: x.month, v: netOf(x) })).filter(x => x.v !== null);
    let h = header(SUBS.vermogen) + chips(st);
    h += `<div class="fin-hero card"><small>Netto vermogen ${esc(name)}</small><b class="fin-big">${esc(eur(t.net))}</b></div>
      <div class="ls-sum">${kpi('Bezittingen', eur(t.assets))}${withHouse ? kpi('Hypotheek', t.debt ? '− ' + eur(t.debt) : '–', 'hot') : ''}${kpi('Direct beschikbaar', eur(t.liquid))}</div>`;
    if (cats.length) h += `<div class="fin-stack">${cats.map(c => `<span style="width:${(t.byCat[c] / t.assets * 100).toFixed(2)}%;background:${CAT_COLOR[c]}"></span>`).join('')}</div>
      <div class="fin-legend">${cats.map(c => `<span><i style="background:${CAT_COLOR[c]}"></i>${c === 'woning' ? 'Woning' : CATS[c]} <b>${esc(eur(t.byCat[c]))}</b></span>`).join('')}</div>`;
    h += `<div class="group"><h3>Verloop per maand</h3>`;
    if (hist.length >= 2) h += `<div class="card">${lineChart([{ v: hist.map(x => x.v), color: 'var(--blue)', w: 2.5, dots: hist.length < 13, area: true }], { labels: [[0, hist[0].m.slice(5) + '/' + hist[0].m.slice(2, 4)], [hist.length - 1, hist[hist.length - 1].m.slice(5) + '/' + hist[hist.length - 1].m.slice(2, 4)]] })}</div>`;
    else h += `<p class="ls-hint">De grafiek verschijnt vanaf twee vastgelegde maanden.</p>`;
    h += hist.slice().reverse().map((x, i, a) => {
      const prev = a[i + 1], diff = prev ? x.v - prev.v : null;
      return `<div class="fin-row"><span class="fin-name" style="text-transform:capitalize">${esc(monthName(x.m))}</span><span class="fin-amt">${esc(eur(x.v))}${diff !== null ? `<small class="${diff >= 0 ? 'up' : 'down'}">${diff >= 0 ? '+' : '−'} ${esc(eur(Math.abs(diff)))}</small>` : ''}</span></div>`;
    }).join('') + `</div>`;
    // Wanneer komt er geld vrij
    const tl = (cur === 'all' ? sources : sources.filter(s => s.member === cur)).map(s => ({ s, u: unlockOf(s) })).filter(x => x.u);
    if (t.m.end && withHouse) tl.push({ s: { name: 'Hypotheek afgelost', balance: null }, u: t.m.end, mort: true });
    tl.sort((a, b) => a.u.localeCompare(b.u));
    if (tl.length) h += `<div class="group"><h3>Wanneer komt het vrij</h3>${tl.map(({ s, u, mort: mo }) => {
      const yrs = (parse(u) - new Date()) / 3156e7;
      return `<div class="fin-row"><span class="fin-name"><b>${esc(s.name)}</b><small>${esc(fmtD(u))} · <span class="fin-pill${mo ? ' debt' : ''}">${u <= today() ? 'vrij' : 'over ' + (yrs < 1 ? Math.ceil(yrs * 12) + ' mnd' : pct(yrs.toFixed(1)) + ' jaar')}</span></small></span><span class="fin-amt">${num(s.balance) !== null ? esc(eur(s.balance)) : ''}</span></div>`;
    }).join('')}</div>`;
    return h;
  }

  // ---------- Rekeningen ----------
  function rekeningen() {
    const { sources, settings: st } = data();
    let h = header(SUBS.rekeningen) + `<button class="btn primary wide" data-sub="bijwerken">Saldi bijwerken</button>`;
    if (!sources.length) h += `<p class="empty">Nog geen rekeningen. Voeg je eerste rekening toe.</p>`;
    for (const c of Object.keys(CATS)) {
      const xs = sources.filter(s => s.category === c); if (!xs.length) continue;
      const tot = xs.reduce((a, s) => a + (num(s.balance) || 0), 0);
      h += `<div class="group"><h3 class="fin-h3"><span>${CAT_ICON[c]} ${CATS[c]}</span><span>${esc(eur(tot))}</span></h3>${xs.map(s => {
        const u = unlockOf(s), old = stale(s);
        const inleg = [num(s.monthly_contribution) ? eur(s.monthly_contribution) + '/mnd' : '', num(s.yearly_contribution) ? eur(s.yearly_contribution) + ' elke jan' : ''].filter(Boolean).join(', ');
        return `<div class="task fin-src${old ? ' stale' : ''}" data-id="${esc(s.id)}"><button class="txt" data-act="edit"><b>${esc(s.name)}</b>
          <small>${esc([s.institution, memberName(st, s.member) === s.owner_label ? '' : s.owner_label || memberName(st, s.member)].filter(Boolean).join(' · '))}</small>
          <small><span class="${old ? 'due' : ''}">${s.as_of ? 'Bijgewerkt ' + esc(fmtD(s.as_of)) : 'Nog geen saldo'}</span>${u ? ` · vrij ${u <= today() ? 'nu' : 'vanaf ' + esc(fmtD(u))}` : ''}${inleg ? ' · inleg ' + esc(inleg) : ''}</small></button>
          <span class="ls-amt">${num(s.balance) !== null ? esc(eur(s.balance)) : '–'}</span></div>`;
      }).join('')}</div>`;
    }
    h += `<button class="btn wide" data-act="new">Rekening toevoegen</button>`;
    return h;
  }

  function editSource(s = {}) {
    const st = data().settings, ms = members(st);
    const catLabels = Object.values(CATS), memLabels = Object.values(ms);
    ctx.openDialog({
      title: s.id ? 'Rekening bewerken' : 'Nieuwe rekening',
      fields: [
        { name: 'name', label: 'Naam (geen volledig rekeningnummer, hooguit de laatste 4 cijfers)', value: s.name, required: true },
        { name: 'institution', label: 'Bank of instelling', value: s.institution },
        { name: 'category', label: 'Soort', type: 'select', options: catLabels, value: CATS[s.category] || CATS.sparen },
        { name: 'member', label: 'Van wie', type: 'select', options: memLabels, value: ms[s.member] || memLabels[0] },
        { name: 'owner_label', label: 'Op naam van (bijv. Frans, gezamenlijk)', value: s.owner_label },
        { name: 'balance', label: 'Saldo in euro', inputmode: 'decimal', value: inAmt(s.balance) },
        { name: 'as_of', label: 'Saldo per datum', type: 'date', value: s.as_of || today() },
        { name: 'unlock_date', label: 'Vrij opneembaar vanaf (leeg = nu al)', type: 'date', value: s.unlock_date },
        { name: 'birth_date', label: 'Geboortedatum kind (alleen bij rekening kind)', type: 'date', value: s.birth_date },
        { name: 'monthly', label: 'Inleg per maand in euro', inputmode: 'decimal', value: inAmt(s.monthly_contribution) },
        { name: 'next', label: 'Nieuwe inleg per maand (optioneel)', inputmode: 'decimal', value: inAmt(s.next_contribution) },
        { name: 'next_from', label: 'Nieuwe inleg vanaf maand (JJJJ-MM)', value: s.next_contribution_from, inputmode: 'numeric' },
        { name: 'yearly', label: 'Inleg elke januari in euro', inputmode: 'decimal', value: inAmt(s.yearly_contribution) },
        { name: 'ret', label: 'Rendement per jaar in % (leeg = 4)', inputmode: 'decimal', value: inAmt(s.expected_return_pct) },
        { name: 'payout', label: 'Rente bij uitkering in % (pensioen, leeg = 2,5)', inputmode: 'decimal', value: inAmt(s.payout_rate_pct) },
        { name: 'proj', label: 'Meenemen in de groeiprognose', type: 'checkbox', value: s.include_in_projection !== false },
        { name: 'note', label: 'Notitie', type: 'textarea', value: s.note }
      ],
      onSave: async v => {
        const nums = ['balance', 'monthly', 'next', 'yearly', 'ret', 'payout'].map(k => [k, toAmount(v[k])]);
        if (nums.some(([, x]) => Number.isNaN(x))) { toast('Een bedrag klopt niet, gebruik alleen cijfers'); return false; }
        if (/\d{8,}/.test(v.name.replace(/\s/g, ''))) { toast('Zet geen volledig rekeningnummer in de naam, hooguit de laatste 4 cijfers'); return false; }
        if (v.next_from && !/^\d{4}-\d{2}$/.test(v.next_from)) { toast('Schrijf de maand als 2027-01'); return false; }
        const n = Object.fromEntries(nums);
        const row = {
          name: v.name.slice(0, 80), institution: v.institution || '',
          category: Object.keys(CATS).find(k => CATS[k] === v.category) || 'sparen',
          member: Object.keys(ms).find(k => ms[k] === v.member) || 'ouders', owner_label: v.owner_label || '',
          balance: n.balance, as_of: v.as_of || null, unlock_date: v.unlock_date || null, birth_date: v.birth_date || null,
          monthly_contribution: n.monthly || 0, next_contribution: n.next, next_contribution_from: v.next_from || null,
          yearly_contribution: n.yearly || 0, expected_return_pct: n.ret, payout_rate_pct: n.payout,
          include_in_projection: !!v.proj, note: v.note || ''
        };
        const ok = await run(s.id ? sb.from('fin_sources').update(row).eq('id', s.id) : sb.from('fin_sources').insert({ ...row, position: data().sources.length + 1 }), 'Opgeslagen');
        if (ok) { await ctx.load('fin_sources'); render(); }
        return ok;
      },
      onDelete: s.id ? async () => { await run(sb.from('fin_sources').delete().eq('id', s.id), 'Verwijderd'); await ctx.load('fin_sources'); render(); } : null
    });
  }

  // ---------- Huis en hypotheek ----------
  function huis() {
    const { mort } = data(), m = mortgage(mort), hv = num(mort.house_value);
    let h = header(SUBS.huis);
    if (!m.pmt && !hv) return h + `<p class="empty">Vul de woningwaarde en de hypotheek in, dan rekent de app de restschuld zelf uit.</p><button class="btn primary wide" data-act="mort">Invullen</button>`;
    h += `<div class="ls-sum">${kpi('Restschuld', eur(m.remaining), 'hot')}${m.pmt ? kpi('Maandlast', eur(m.pmt)) + kpi('Afgelost op', fmtD(m.end)) : ''}</div>`;
    if (hv) h += `<div class="ls-sum fin-two">${kpi('Woningwaarde', eur(hv))}${kpi('Overwaarde', eur(hv - m.remaining))}</div>`;
    if (m.pmt) {
      h += `<div class="gift-budget"><span>${m.k} van ${m.N} termijnen betaald · ${pct((m.paidPct * 100).toFixed(1))}% afgelost</span><div class="bar"><i style="width:${(m.paidPct * 100).toFixed(1)}%"></i></div></div>`;
      if (num(mort.override) !== null) h += `<p class="ls-hint">Berekend ${esc(eur(m.computed))}, volgens de bank ${esc(eur(mort.override))}. De app gebruikt het bedrag van de bank.</p>`;
      else h += `<p class="ls-hint">Restschuld berekend (annuïteit, ${pct(mort.rate_pct)}% rente, ${mort.years} jaar vanaf ${esc(fmtD(mort.start_date))}), niet van de bank.</p>`;
      const sc = m.schedule, step = sc.length > 12 ? 5 : 2, labels = sc.map((p, i) => [i, p.x]).filter(([i]) => i % step === 0);
      h += `<div class="group"><h3>Restschuld per jaar</h3><div class="card">${lineChart([{ v: sc.map(p => p.y), color: 'var(--terra)', area: true }], { labels })}</div></div>`;
    }
    return h + `<button class="btn wide" data-act="mort">Woning en hypotheek aanpassen</button>`;
  }
  function editMort() {
    const m = data().mort;
    ctx.openDialog({
      title: 'Woning en hypotheek',
      fields: [
        { name: 'house_value', label: 'Woningwaarde in euro', inputmode: 'decimal', value: inAmt(m.house_value) },
        { name: 'principal', label: 'Hoofdsom hypotheek in euro', inputmode: 'decimal', value: inAmt(m.principal) },
        { name: 'rate_pct', label: 'Rente per jaar in %', inputmode: 'decimal', value: inAmt(m.rate_pct) },
        { name: 'start_date', label: 'Ingangsdatum', type: 'date', value: m.start_date },
        { name: 'years', label: 'Looptijd in jaren', inputmode: 'numeric', value: m.years ?? 20 },
        { name: 'override', label: 'Restschuld volgens de bank (optioneel; leeg = zelf berekenen)', inputmode: 'decimal', value: inAmt(m.override) }
      ],
      onSave: async v => {
        const row = { id: 1, house_value: toAmount(v.house_value), principal: toAmount(v.principal), rate_pct: toAmount(v.rate_pct), start_date: v.start_date || null, years: toAmount(v.years) || 20, override: toAmount(v.override), as_of: today() };
        if (Object.values(row).some(x => Number.isNaN(x))) { toast('Een bedrag klopt niet'); return false; }
        const ok = await run(sb.from('fin_mortgage').upsert(row), 'Opgeslagen');
        if (ok) { await ctx.load('fin_mortgage'); render(); }
        return ok;
      }
    });
  }

  // ---------- Pensioen en prognose ----------
  function pensioen() {
    const { sources, settings: st } = data(), g = st.goal || {};
    let h = header(SUBS.pensioen);
    // Beleggingen naar de pensioendatum, tegen wat er nodig is
    const inv = sources.filter(s => s.category === 'beleggen' && s.include_in_projection !== false);
    const V0 = inv.reduce((a, s) => a + (num(s.balance) || 0), 0), Cf = k => inv.reduce((a, s) => a + contribAt(s, k), 0);
    // Eigen vermogen op de pensioendatum bij 4%: beleggingen plus de pensioenpotten (elk met hun eigen inleg)
    const pots = sources.filter(s => s.category === 'pensioen' && num(s.balance) !== null);
    if (g.date && (inv.length || pots.length)) {
      const M = monthsUntil(g.date);
      const invAt = project(V0, Cf, 4, M)[M];
      const potAt = pots.reduce((a, s) => a + project(num(s.balance), num(s.monthly_contribution) || 0, num(s.expected_return_pct) ?? 4, M, num(s.yearly_contribution) || 0)[M], 0);
      const need = num(g.need_nominal), at4 = invAt + potAt, ok = need ? at4 >= need : null;
      h += `<div class="fin-hero card${ok ? ' ok' : ok === false ? ' bad' : ''}"><small>Pensioendoel vanaf ${esc(fmtD(g.date))}</small>
        <b class="fin-big">${esc(eur(num(g.per_year) || 0))} <span class="mut" style="font-size:16px">per jaar</span></b>
        <small>In koopkracht van nu.${need ? ` Daarvoor is ca. ${esc(eur(need))} eigen vermogen nodig in ${esc(g.date.slice(0, 4))}, naast de staatspensioenen.` : ''}</small>
        ${need ? `<div class="gift-budget${ok ? '' : ' over'}"><span>Verwacht bij 4%: ${esc(eur(at4))} (${Math.round(at4 / need * 100)}% van wat nodig is)</span><div class="bar"><i style="width:${Math.min(100, at4 / need * 100).toFixed(1)}%"></i></div></div>
        <small>Beleggingen ${esc(eur(invAt))} + pensioenpotten ${esc(eur(potAt))}, met de huidige inleg.</small>
        <small><b>${ok ? 'Op koers: het doel wordt gehaald bij 4% rendement.' : 'Nog niet op koers bij 4%: kijk naar meer inleg of een later doel.'}</b></small>` : ''}</div>`;
    }
    if (Array.isArray(g.pensions) && g.pensions.length) {
      const tot = g.pensions.reduce((a, p) => a + (num(p.amount) || 0), 0);
      h += `<div class="group"><h3 class="fin-h3"><span>Opgebouwde pensioenen (bruto per jaar)</span><span>${esc(eur(tot))}</span></h3>${g.pensions.map(p =>
        `<div class="fin-row"><span class="fin-name"><b>${esc(p.name)}</b><small>vanaf ${esc(p.from || '')}</small></span><span class="fin-amt">${esc(eur(p.amount))}</span></div>`).join('')}
        ${g.pension_note ? `<p class="ls-hint">${esc(g.pension_note)}</p>` : ''}</div>`;
    }
    // Groeiprognose beleggingen
    if (inv.length) {
      const M = invYears * 12, { ser, html } = scenChart(V0, Cf, M);
      const y0 = new Date().getFullYear(), marks = [5, 10, 15, 20, 25, 30].filter(y => y <= invYears);
      const later = inv.filter(s => s.next_contribution_from).map(s => `vanaf ${monthName(s.next_contribution_from)} ${eur(s.next_contribution)}`);
      h += `<div class="group"><h3>Groeiprognose beleggingen</h3>
        <div class="chips fin-chips">${[10, 20, 30].map(y => `<button class="chip${y === invYears ? ' on' : ''}" data-act="years" data-y="${y}">${y} jaar</button>`).join('')}</div>
        <p class="ls-hint">Start met ${esc(eur(V0))} (${esc(inv.map(s => s.name).join(', '))}) en ${esc(eur(Cf(0)))} per maand${later.length ? ', ' + esc(later.join(', ')) : ''}. Na kosten, vóór belasting, elke maand rente-op-rente.</p>
        <div class="card">${html}</div>
        <div class="fin-table"><table><thead><tr><th>Na</th>${ser.slice(1).map(x => `<th>${x.r}%</th>`).join('')}</tr></thead><tbody>${marks.map(y => `<tr><td>${y} jaar <small class="mut">${y0 + y}</small></td>${ser.slice(1).map(x => `<td>${esc(eurK(x.v[y * 12]))}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        ${sources.some(s => s.category === 'beleggen' && s.include_in_projection === false) ? `<p class="ls-hint">Niet meegenomen: ${esc(sources.filter(s => s.category === 'beleggen' && s.include_in_projection === false).map(s => s.name).join(', '))}.</p>` : ''}</div>`;
    }
    // Pensioenpotten: uitkering per looptijd
    const ps = sources.filter(s => s.category === 'pensioen'), fallback = ps.map(s => s.unlock_date).filter(Boolean).sort()[0] || g.date;
    if (ps.length) h += `<div class="group"><h3>Pensioenpotten: wat levert het straks op</h3><p class="ls-hint">Op de pensioendatum koop je een uitkering. Hoe korter de looptijd, hoe hoger per maand. Bruto, vóór belasting.</p>${ps.map(s => {
      const p = projectPension(s, fallback); if (!p) return `<div class="card fin-card"><b>${esc(s.name)}</b><p class="ls-hint">Vul saldo en vrijvaldatum in.</p></div>`;
      return `<div class="card fin-card"><b>${esc(s.name)}</b><small class="mut">Vrij op ${esc(fmtD(p.date))}${p.assumed ? ' (aangenomen)' : ''} · nu ${esc(eur(s.balance))}, dan ca. ${esc(eur(p.fv))} bij ${pct(p.r)}%</small>
        <div class="fin-table"><table><thead><tr><th>Looptijd</th><th>Per maand</th><th>Per jaar</th></tr></thead><tbody>${p.options.map(o => `<tr><td>${o.y} jaar</td><td>${esc(eur(o.pm))}</td><td>${esc(eur(o.pm * 12))}</td></tr>`).join('')}</tbody></table></div></div>`;
    }).join('')}</div>`;
    // Rekeningen van de kinderen tot hun 18e
    const ks = sources.filter(s => s.category === 'kind' && unlockOf(s) && num(s.balance) !== null);
    if (ks.length) h += `<div class="group"><h3>Rekeningen kinderen: wat staat er op hun 18e</h3>${ks.map(s => {
      const M = monthsUntil(unlockOf(s)); if (M < 1) return '';
      const C = num(s.monthly_contribution) || 0, Y = num(s.yearly_contribution) || 0, vals = SCEN.slice(1).map(sc => project(num(s.balance), C, sc.r, M, Y)[M]);
      return `<div class="card fin-card"><b>${esc(memberName(st, s.member))}</b><small class="mut">18 jaar op ${esc(fmtD(unlockOf(s)))} · nu ${esc(eur(s.balance))}${C || Y ? '' : ', zonder extra inleg'}</small>
        <div class="fin-kids">${vals.map((v, i) => `<div><small>${SCEN[i + 1].r}%</small><b>${esc(eur(v))}</b></div>`).join('')}</div></div>`;
    }).join('')}</div>`;
    return h + `<button class="btn wide" data-act="settings">Doel en pensioenen aanpassen</button>`;
  }

  // ---------- Maandverdeling ----------
  function plan(sources, st) {
    const p = st.plan; if (!p) return null;
    const income = num(p.income) || 0, leef = num(p.leefgeld) || 0;
    const invest = sources.filter(s => s.category === 'beleggen').map(s => ({ name: s.name, now: num(s.monthly_contribution) || 0, later: s.next_contribution_from ? num(s.next_contribution) || 0 : null, from: s.next_contribution_from }));
    const savings = sources.filter(s => s.category === 'sparen').reduce((a, s) => a + (num(s.balance) || 0), 0);
    const buffer = leef * (num(p.buffer_months) || 0), reserve = num(p.reserve) || 0;
    return { income, incomeNext: num(p.income_next), incomeFrom: p.income_next_from, leef, invest, savings, buffer, reserve, months: num(p.buffer_months) || 0, free: savings - buffer - reserve, note: p.note };
  }
  function maand() {
    const { sources, settings: st } = data(), p = plan(sources, st);
    let h = header(SUBS.maand);
    if (!p) return h + `<p class="empty">Nog geen maandverdeling. Vul je netto inkomen en leefgeld in.</p><button class="btn primary wide" data-act="plan">Invullen</button>`;
    const col = (inc, later) => {
      const rows = [['Leefgeld', p.leef], ...p.invest.map(x => [x.name, later && x.later !== null && x.from <= later ? x.later : x.now])];
      const used = rows.reduce((a, r) => a + r[1], 0);
      return `<div class="card fin-card">${rows.map(([n, v]) => `<div class="fin-row"><span class="fin-name">${esc(n)}</span><span class="fin-amt">${esc(eur(v))}</span></div>`).join('')}
        <div class="fin-row fin-total"><span class="fin-name">Over</span><span class="fin-amt ${inc - used < 0 ? 'down' : 'up'}">${esc(eur(inc - used))}</span></div>
        <div class="fin-stack">${rows.filter(r => r[1] > 0).map(([, v], i) => `<span style="width:${(v / Math.max(inc, used) * 100).toFixed(1)}%;background:${['var(--blue)', 'var(--ok)', 'var(--terra)', 'var(--mut)'][i % 4]}"></span>`).join('')}</div></div>`;
    };
    h += `<div class="group"><h3 class="fin-h3"><span>Nu</span><span>netto ${esc(eur(p.income))} per maand</span></h3>${col(p.income, null)}</div>`;
    if (p.incomeNext && p.incomeFrom) h += `<div class="group"><h3 class="fin-h3"><span>Vanaf ${esc(monthName(p.incomeFrom))}</span><span>netto ${esc(eur(p.incomeNext))}</span></h3>${col(p.incomeNext, p.incomeFrom)}</div>`;
    const ok = p.free >= 0;
    h += `<div class="group"><h3>Buffer</h3><div class="fin-hero card ${ok ? 'ok' : 'bad'}">
      <small>Op de spaarrekening</small><b class="fin-big">${esc(eur(p.savings))}</b>
      <div class="gift-budget${ok ? '' : ' over'}"><span>Buffer ${p.months} maanden leefgeld: ${esc(eur(p.buffer))}${p.reserve ? ` + gereserveerd ${esc(eur(p.reserve))}` : ''}</span><div class="bar"><i style="width:${Math.min(100, p.savings / Math.max(1, p.buffer + p.reserve) * 100).toFixed(1)}%"></i></div></div>
      <small><b>${ok ? `Vrij boven de buffer: ${esc(eur(p.free))}` : `Nog ${esc(eur(-p.free))} tekort voor de buffer`}</b></small></div>
      ${p.note ? `<p class="ls-hint">${esc(p.note)}</p>` : ''}</div>`;
    return h + `<button class="btn wide" data-act="plan">Maandverdeling aanpassen</button>`;
  }
  async function saveSettings(patch, msg = 'Opgeslagen') {
    const st = data().settings, next = { ...st, ...patch };
    const ok = await run(sb.from('fin_settings').upsert({ id: 1, data: next }), msg);
    if (ok) { await ctx.load('fin_settings'); render(); }
    return ok;
  }
  function editPlan() {
    const p = data().settings.plan || {};
    ctx.openDialog({
      title: 'Maandverdeling',
      fields: [
        { name: 'income', label: 'Netto inkomen per maand', inputmode: 'decimal', value: inAmt(p.income) },
        { name: 'income_next', label: 'Netto inkomen later (optioneel)', inputmode: 'decimal', value: inAmt(p.income_next) },
        { name: 'income_next_from', label: 'Vanaf maand (JJJJ-MM)', inputmode: 'numeric', value: p.income_next_from },
        { name: 'leefgeld', label: 'Leefgeld per maand', inputmode: 'decimal', value: inAmt(p.leefgeld) },
        { name: 'buffer_months', label: 'Buffer: hoeveel maanden leefgeld', inputmode: 'numeric', value: p.buffer_months ?? 9 },
        { name: 'reserve', label: 'Extra gereserveerd op de spaarrekening (bijv. naheffing)', inputmode: 'decimal', value: inAmt(p.reserve) },
        { name: 'note', label: 'Afspraken (bijv. wat er in januari gebeurt)', type: 'textarea', value: p.note }
      ],
      onSave: async v => {
        const n = k => toAmount(v[k]);
        if (['income', 'income_next', 'leefgeld', 'buffer_months', 'reserve'].some(k => Number.isNaN(n(k)))) { toast('Een bedrag klopt niet'); return false; }
        if (v.income_next_from && !/^\d{4}-\d{2}$/.test(v.income_next_from)) { toast('Schrijf de maand als 2027-01'); return false; }
        return saveSettings({ plan: { income: n('income'), income_next: n('income_next'), income_next_from: v.income_next_from || null, leefgeld: n('leefgeld'), buffer_months: n('buffer_months') ?? 9, reserve: n('reserve'), note: v.note || '' } });
      }
    });
  }
  function editGoal() {
    const st = data().settings, g = st.goal || {};
    ctx.openDialog({
      title: 'Pensioendoel',
      fields: [
        { name: 'per_year', label: 'Doel per jaar (koopkracht van nu)', inputmode: 'decimal', value: inAmt(g.per_year) },
        { name: 'date', label: 'Vanaf (pensioendatum)', type: 'date', value: g.date },
        { name: 'need_nominal', label: 'Eigen vermogen nodig op die datum (nominaal)', inputmode: 'decimal', value: inAmt(g.need_nominal) },
        { name: 'pensions', label: 'Opgebouwde pensioenen, één per regel: naam; vanaf; bedrag per jaar', type: 'textarea', value: (g.pensions || []).map(p => `${p.name}; ${p.from || ''}; ${inAmt(p.amount)}`).join('\n') },
        { name: 'pension_note', label: 'Notitie', type: 'textarea', value: g.pension_note },
        { name: 'remind_day', label: 'Herinnering saldi bijwerken op dag van de maand (0 = uit)', inputmode: 'numeric', value: remindDay(st) }
      ],
      onSave: async v => {
        const pensions = String(v.pensions || '').split('\n').map(l => l.split(';').map(x => x.trim())).filter(x => x[0]).map(([name, from, amount]) => ({ name, from: from || '', amount: toAmount(amount) || 0 }));
        const rd = Math.max(0, Math.min(28, Math.round(toAmount(v.remind_day) ?? 17)));
        return saveSettings({ remind_day: rd, goal: { ...g, per_year: toAmount(v.per_year), date: v.date || null, need_nominal: toAmount(v.need_nominal), pensions, pension_note: v.pension_note || '' } });
      }
    });
  }

  // ---------- Afspraken en adviezen ----------
  function afspraken() {
    const { todos } = data();
    const open = todos.filter(t => !t.done).sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
    const done = todos.filter(t => t.done).sort((a, b) => ((b.done_at || '') > (a.done_at || '') ? 1 : -1));
    const row = t => `<div class="note-row${t.done ? ' done' : ''}" data-id="${esc(t.id)}">
      <button class="tick" data-act="tick" aria-label="${t.done ? 'Terugzetten' : 'Afvinken'}: ${esc(t.title)}"><span><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></button>
      <button class="note" data-act="todo"><b>${esc(t.title)}</b>${t.note ? `<p>${esc(t.note)}</p>` : ''}${t.remind_on && !t.done ? `<small class="mut">🔔 ${esc(fmtD(t.remind_on))}</small>` : ''}</button></div>`;
    return header(SUBS.afspraken) + `<button class="btn primary wide" data-act="newtodo">Afspraak of advies toevoegen</button>
      <div class="list">${open.length ? open.map(row).join('') : '<p class="empty">Alles geregeld.</p>'}</div>
      ${done.length ? `<details class="archive"><summary>Geregeld (${done.length})</summary>${done.map(row).join('')}</details>` : ''}`;
  }
  function editTodo(t = {}) {
    ctx.openDialog({
      title: t.id ? 'Afspraak bewerken' : 'Nieuwe afspraak',
      fields: [
        { name: 'title', label: 'Wat moet er gebeuren?', value: t.title, required: true },
        { name: 'note', label: 'Toelichting', type: 'textarea', value: t.note },
        { name: 'remind_on', label: 'Seintje op (optioneel)', type: 'date', value: t.remind_on }
      ],
      onSave: async v => {
        const row = { title: v.title.slice(0, 120), note: v.note || '', remind_on: v.remind_on || null };
        const ok = await run(t.id ? sb.from('fin_todos').update(row).eq('id', t.id) : sb.from('fin_todos').insert({ ...row, position: data().todos.length + 1 }), 'Opgeslagen');
        if (ok) { await ctx.load('fin_todos'); render(); }
        return ok;
      },
      onDelete: t.id ? async () => { await run(sb.from('fin_todos').delete().eq('id', t.id), 'Verwijderd'); await ctx.load('fin_todos'); render(); } : null
    });
  }

  // ---------- Saldi bijwerken en maand vastleggen ----------
  function bijwerken() {
    const { sources, snaps } = data(), ym = today().slice(0, 7);
    return header(SUBS.bijwerken) + `<p class="ls-hint">Vul de saldi van vandaag in. Wat je niet weet, laat je staan. Daarna wordt ${esc(monthName(ym))} vastgelegd${monthDone(snaps) ? ' (de eerdere stand van deze maand wordt overschreven)' : ''}.</p>
      <form id="finUpd">${Object.keys(CATS).map(c => {
        const xs = sources.filter(s => s.category === c); if (!xs.length) return '';
        return `<div class="group"><h3>${CAT_ICON[c]} ${CATS[c]}</h3>${xs.map(s => `<label class="fin-in${stale(s) ? ' stale' : ''}"><span><b>${esc(s.name)}</b><small>${esc(s.institution || '')} · nu ${num(s.balance) !== null ? esc(eur(s.balance, 2)) : '–'} (${esc(fmtD(s.as_of))})</small></span>
          <input name="${esc(s.id)}" inputmode="decimal" autocomplete="off" placeholder="${esc(inAmt(s.balance))}" aria-label="Nieuw saldo ${esc(s.name)}"></label>`).join('')}</div>`;
      }).join('')}
      <label class="fin-date">Saldo per datum<input type="date" name="__date" value="${today()}"></label>
      <button class="btn primary wide" type="submit">Opslaan en ${esc(monthName(ym))} vastleggen</button></form>`;
  }
  async function saveUpdate(form) {
    const fd = new FormData(form), d = fd.get('__date') || today(), { sources } = data();
    const changes = [];
    for (const s of sources) {
      const raw = String(fd.get(s.id) || '').trim(); if (!raw) continue;
      const v = toAmount(raw); if (Number.isNaN(v) || v === null) { toast(`Saldo van ${s.name} klopt niet`); return; }
      changes.push({ id: s.id, balance: v, as_of: d });
    }
    for (const c of changes) if (!await run(sb.from('fin_sources').update({ balance: c.balance, as_of: c.as_of }).eq('id', c.id))) return;
    await ctx.load('fin_sources');
    const fresh = data(), snap = snapshot(fresh.sources, fresh.mort, Object.keys(members(fresh.settings)), d.slice(0, 7));
    if (await run(sb.from('fin_snapshots').upsert(snap), `${changes.length === 1 ? '1 saldo' : changes.length + ' saldi'} bijgewerkt, ${monthName(d.slice(0, 7))} vastgelegd`)) {
      await ctx.load('fin_snapshots'); sub = 'vermogen'; render(); window.scrollTo(0, 0);
    }
  }

  function render() {
    // Niet opnieuw tekenen (bijv. door live bijwerken) terwijl de saldi worden ingevuld
    if (sub === 'bijwerken' && root.querySelector('#finUpd')) return;
    if (ctx.isMissing()) {
      root.innerHTML = '<p class="empty">Financieel staat nog niet in de database. Zodra de tabellen zijn klaargezet, verschijnt hier jullie vermogen.</p>';
      return;
    }
    root.innerHTML = ({ '': home, vermogen, rekeningen, huis, pensioen, maand, afspraken, bijwerken }[sub] || home)();
  }

  root.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act],[data-sub]'); if (!el || !root.contains(el)) return;
    if (el.dataset.sub) { sub = el.dataset.sub; render(); window.scrollTo(0, 0); return; }
    const act = el.dataset.act;
    if (act === 'back') { sub = ''; render(); window.scrollTo(0, 0); return; }
    if (act === 'member') { cur = el.dataset.m; try { localStorage.setItem('fin-member', cur); } catch { /* */ } render(); return; }
    if (act === 'years') { invYears = +el.dataset.y; render(); return; }
    if (act === 'new') { editSource(); return; }
    if (act === 'mort') { editMort(); return; }
    if (act === 'plan') { editPlan(); return; }
    if (act === 'settings') { editGoal(); return; }
    if (act === 'newtodo') { editTodo(); return; }
    const id = el.closest('[data-id]')?.dataset.id;
    if (act === 'edit') { const s = data().sources.find(x => x.id === id); if (s) editSource(s); return; }
    const t = data().todos.find(x => x.id === id);
    if (act === 'todo' && t) { editTodo(t); return; }
    if (act === 'tick' && t) {
      run(sb.from('fin_todos').update({ done: !t.done, done_at: t.done ? null : new Date().toISOString() }).eq('id', t.id), t.done ? 'Teruggezet' : 'Geregeld')
        .then(async () => { await ctx.load('fin_todos'); render(); });
    }
  });
  root.addEventListener('submit', ev => { if (ev.target.id === 'finUpd') { ev.preventDefault(); saveUpdate(ev.target); } });

  // Bij openen vanuit de tegel onder Meer altijd op het startscherm beginnen
  return { render, reset: () => { sub = ''; } };
}
