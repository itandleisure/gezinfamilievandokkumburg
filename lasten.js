// Tabblad Vaste lasten: terugkerende uitgaven zoals IBI, IVTM, basura, verzekeringen en abonnementen.
// Per post: bedrag, hoe vaak (every_months) en de eerstvolgende afschrijving (next_date).
// De app rekent de volgende keren zelf door (occurrences), dus next_date hoeft niet steeds bijgewerkt te worden.
// Bovenaan: totaal per jaar, gemiddeld per maand en wat er de komende 30 dagen afgaat; daaronder de tijdlijn van 12 maanden.
// Seintje vooraf (remind_days) stuurt gezond-push (runLasten). Data: tabel `expenses`, gedeeld met het hele gezin.
// Afspraken staan in Apple Agenda; dit gaat alleen over geld.

export const CATS = ['Huis', 'Auto', 'Verzekering', 'Abonnement', 'Overig'];
const CAT_ICON = { Huis: '🏠', Auto: '🚗', Verzekering: '🛡️', Abonnement: '📺', Overig: '📌' };
// Hoe vaak: aantal maanden ↔ tekst in het keuzemenu
const FREQ = [[1, 'Elke maand'], [2, 'Elke 2 maanden'], [3, 'Elk kwartaal'], [6, 'Elk halfjaar'], [12, 'Elk jaar'], [24, 'Elke 2 jaar']];
const FREQ_TXT = Object.fromEntries(FREQ);
const REMIND = [[0, 'Geen seintje'], [1, '1 dag vooraf'], [3, '3 dagen vooraf'], [7, '1 week vooraf'], [14, '2 weken vooraf'], [30, '1 maand vooraf']];
const REMIND_TXT = Object.fromEntries(REMIND);

// Snel toevoegen: de bekende vaste lasten in Spanje. Alleen bedrag en datum zelf invullen.
export const PRESETS = [
  { title: 'IBI (onroerendgoedbelasting)', cat: 'Huis', every_months: 12, note: 'Via Patronato de Recaudación. Soms in 2 termijnen: kies dan elk halfjaar.' },
  { title: 'Basura (afvalheffing)', cat: 'Huis', every_months: 12, note: '' },
  { title: 'IVTM (wegenbelasting)', cat: 'Auto', every_months: 12, note: 'Impuesto de circulación, per auto.' },
  { title: 'ITV (keuring)', cat: 'Auto', every_months: 12, note: 'Auto ouder dan 10 jaar: elk jaar. Daarvoor elke 2 jaar.' },
  { title: 'Autoverzekering', cat: 'Verzekering', every_months: 12, note: '' },
  { title: 'Huisverzekering', cat: 'Verzekering', every_months: 12, note: '' },
  { title: 'Zorgverzekering', cat: 'Verzekering', every_months: 1, note: '' },
  { title: 'Internet en telefoon', cat: 'Abonnement', every_months: 1, note: '' },
  { title: 'LES MILLS+', cat: 'Abonnement', every_months: 1, note: '' }
];

// Datums als 'JJJJ-MM-DD' in de eigen tijdzone
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const today = () => iso(new Date());
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
// n maanden verder, op dezelfde dag van de maand (31 januari + 1 maand = 28/29 februari)
export function addMonths(s, n, day = parse(s).getDate()) {
  const d = parse(s); d.setDate(1); d.setMonth(d.getMonth() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return iso(d);
}
// Alle afschrijvingen van een post vanaf `from` tot en met `to` (doorgerekend vanaf next_date)
export function occurrences(e, from, to) {
  const step = Math.max(1, e.every_months || 12), day = parse(e.next_date).getDate(), out = [];
  let k = 0, d = e.next_date;
  while (d < from && k < 1000) d = addMonths(e.next_date, step * ++k, day);
  while (d <= to && k < 1000) { out.push(d); d = addMonths(e.next_date, step * ++k, day); }
  return out;
}
export const nextDate = (e, from = today()) => occurrences(e, from, addMonths(from, 25))[0] || e.next_date;
export const perYear = e => Number(e.amount || 0) * 12 / Math.max(1, e.every_months || 12);

// eur(12.5) = '€ 12,50', eur(85) = '€ 85'; eur(x, 0) = afgerond op hele euro's (voor totalen)
const eur = (n, dec) => '€ ' + Number(n || 0).toLocaleString('nl-NL', dec === 0 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 });
const fmt = s => parse(s).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
const monthName = s => parse(s).toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
function when(s) {
  const d = daysBetween(today(), s);
  if (d === 0) return 'vandaag';
  if (d === 1) return 'morgen';
  if (d < 14) return `over ${d} dagen`;
  if (d < 60) return `over ${Math.round(d / 7)} weken`;
  return `over ${Math.round(d / 30.4)} maanden`;
}
// Bedrag uit het invulveld: '1.234,56', '1234.56' of '85' → getal
function toAmount(s) {
  let t = String(s || '').replace(/[€\s]/g, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  const n = Number(t); return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}

const ICON_EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';

// ctx: { root, getItems, isMissing, esc, sb, load, run, toast, openDialog }
export function mountLasten(ctx) {
  const { root, esc, sb, run, toast } = ctx;
  root.innerHTML = `<div id="lsSum"></div>
    <button class="btn primary wide" data-act="new">Vaste last toevoegen</button>
    <div class="ls-quick" id="lsQuick"></div>
    <div class="list" id="lsList"></div>`;
  const sum = root.querySelector('#lsSum'), quick = root.querySelector('#lsQuick'), list = root.querySelector('#lsList');
  let months = 12;   // hoe ver de tijdlijn vooruit kijkt; "Toon verder" maakt er 24 van

  function row(e, d) {
    const soon = daysBetween(today(), d) <= 30;
    return `<div class="task ls-row${soon ? ' soon' : ''}" data-id="${esc(e.id)}">
      <span class="ls-ic" aria-hidden="true">${CAT_ICON[e.cat] || CAT_ICON.Overig}</span>
      <button class="txt" data-act="edit"><b>${esc(e.title)}</b>
        <small><span class="due">${esc(when(d))}</span> · ${esc(fmt(d))} · ${esc(FREQ_TXT[e.every_months] || '')}${e.remind_days ? ' · 🔔' : ''}</small>
        ${e.note ? `<small class="note-txt">${esc(e.note)}</small>` : ''}</button>
      <span class="ls-amt">${esc(eur(e.amount))}</span>
      <button class="mini" data-act="edit" aria-label="Bewerken: ${esc(e.title)}">${ICON_EDIT}</button>
    </div>`;
  }

  function render() {
    if (ctx.isMissing()) {
      sum.innerHTML = ''; quick.innerHTML = '';
      list.innerHTML = '<p class="empty">Vaste lasten staat nog niet in de database. Zodra die is klaargezet, kun je hier je posten invullen.</p>';
      return;
    }
    const items = ctx.getItems(), t0 = today();
    const used = new Set(items.map(e => e.title.toLowerCase()));
    const presets = PRESETS.filter(p => !used.has(p.title.toLowerCase()));
    quick.innerHTML = presets.length ? `<p class="ls-hint">Snel toevoegen:</p><div class="chips ls-chips">${presets.map(p =>
      `<button class="chip" data-act="preset" data-t="${esc(p.title)}">${CAT_ICON[p.cat]} ${esc(p.title.replace(/ \(.*\)$/, ''))}</button>`).join('')}</div>` : '';
    if (!items.length) {
      sum.innerHTML = '';
      list.innerHTML = '<p class="empty">Nog geen vaste lasten. Begin met de IBI of de autoverzekering: tik hierboven en vul het bedrag en de datum in.</p>';
      return;
    }
    // Totalen
    const year = items.reduce((s, e) => s + perYear(e), 0);
    const d30 = parse(t0); d30.setDate(d30.getDate() + 30);
    const in30 = items.reduce((s, e) => s + occurrences(e, t0, iso(d30)).length * Number(e.amount || 0), 0);
    sum.innerHTML = `<div class="ls-sum">
      <div><small>Per jaar</small><b>${esc(eur(year, 0))}</b></div>
      <div><small>Per maand gemiddeld</small><b>${esc(eur(Math.ceil(year / 12), 0))}</b></div>
      <div class="${in30 ? 'hot' : ''}"><small>Komende 30 dagen</small><b>${esc(eur(in30, 0))}</b></div>
    </div><p class="ls-hint">Zet elke maand ${esc(eur(Math.ceil(year / 12), 0))} opzij, dan kun je alles betalen.</p>`;
    // Tijdlijn: per maand wat er afgaat
    const end = addMonths(t0.slice(0, 8) + '01', months, 1); // eerste dag na de laatste maand
    // Maandelijkse posten (abonnementen) staan per maand als één regel, zodat de grote posten opvallen
    const monthly = items.filter(e => e.every_months === 1), mTot = monthly.reduce((s, e) => s + Number(e.amount || 0), 0);
    let html = monthly.length ? `<p class="ls-monthly">Elke maand: ${esc(monthly.map(e => e.title).join(', '))} <b>${esc(eur(mTot))}</b>. Dat zit in de maandtotalen hieronder; de grote posten staan per maand.</p>` : '';
    const all = items.filter(e => e.every_months !== 1).flatMap(e => occurrences(e, t0, end).filter(d => d < end).map(d => ({ e, d })))
      .sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : a.e.title.localeCompare(b.e.title)));
    const byMonth = new Map();
    for (const x of all) { const k = x.d.slice(0, 7); if (!byMonth.has(k)) byMonth.set(k, []); byMonth.get(k).push(x); }
    // Maanden zonder afschrijvingen ook tonen, zodat je de rustige maanden ziet
    for (let i = 0; i < months; i++) {
      const k = addMonths(t0.slice(0, 8) + '01', i, 1).slice(0, 7), xs = byMonth.get(k) || [];
      const tot = xs.reduce((s, x) => s + Number(x.e.amount || 0), 0) + mTot;
      const big = tot > year / 12 * 1.5;
      html += `<div class="group ls-month${i === 0 ? ' now' : ''}"><h3><span>${esc(monthName(k + '-01'))}</span><span class="${big ? 'big' : ''}">${tot ? esc(eur(tot, 0)) : '–'}</span></h3>${xs.length ? xs.map(x => row(x.e, x.d)).join('') : `<p class="ls-none">${monthly.length ? 'Alleen de maandelijkse posten' : 'Niets vast deze maand'}</p>`}</div>`;
    }
    html += `<button class="btn link" data-act="more">${months === 12 ? 'Toon nog een jaar verder' : 'Toon alleen komend jaar'}</button>`;
    // Alle posten per soort, met het bedrag per jaar
    html += `<details class="archive"><summary>Alle posten per soort (${items.length})</summary>${CATS.map(c => {
      const xs = items.filter(e => (CATS.includes(e.cat) ? e.cat : 'Overig') === c).sort((a, b) => perYear(b) - perYear(a));
      if (!xs.length) return '';
      const t = xs.reduce((s, e) => s + perYear(e), 0);
      return `<div class="group"><h3><span>${CAT_ICON[c]} ${c}</span><span>${esc(eur(t, 0))} per jaar</span></h3>${xs.map(e => row(e, nextDate(e))).join('')}</div>`;
    }).join('')}</details>`;
    list.innerHTML = html;
  }

  function edit(e = {}) {
    ctx.openDialog({
      title: e.id ? 'Vaste last bewerken' : 'Nieuwe vaste last',
      fields: [
        { name: 'title', label: 'Wat is het?', value: e.title, required: true },
        { name: 'amount', label: 'Bedrag in euro (een schatting mag)', inputmode: 'decimal', value: e.amount != null ? String(e.amount).replace('.', ',') : '', required: true },
        { name: 'every', label: 'Hoe vaak?', type: 'select', options: FREQ.map(f => f[1]), value: FREQ_TXT[e.every_months || 12] },
        { name: 'next_date', label: 'Wanneer gaat het er (weer) af?', type: 'date', value: e.next_date ? nextDate(e) : '', required: true },
        { name: 'cat', label: 'Soort', type: 'select', options: CATS, value: e.cat || 'Overig' },
        { name: 'remind', label: 'Seintje vooraf', type: 'select', options: REMIND.map(r => r[1]), value: REMIND_TXT[e.remind_days ?? 7] || REMIND_TXT[7] },
        { name: 'note', label: 'Notitie (optioneel, bijv. polisnummer of bank)', value: e.note }
      ],
      onSave: async v => {
        const amount = toAmount(v.amount);
        if (!v.title || !Number.isFinite(amount) || !v.next_date) { toast('Vul een naam, een bedrag en een datum in'); return false; }
        const data = {
          title: v.title.slice(0, 80), amount, cat: CATS.includes(v.cat) ? v.cat : 'Overig',
          every_months: (FREQ.find(f => f[1] === v.every) || [12])[0], next_date: v.next_date,
          remind_days: (REMIND.find(r => r[1] === v.remind) || [7])[0], note: v.note || ''
        };
        const ok = await run(e.id ? sb.from('expenses').update(data).eq('id', e.id) : sb.from('expenses').insert(data), e.id ? 'Opgeslagen' : 'Toegevoegd');
        if (ok) { await ctx.load('expenses'); render(); }
        return ok;
      },
      onDelete: e.id ? async () => { await run(sb.from('expenses').delete().eq('id', e.id), 'Verwijderd'); await ctx.load('expenses'); render(); } : null
    });
  }

  root.addEventListener('click', ev => {
    const el = ev.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act;
    if (act === 'more') { months = months === 12 ? 24 : 12; render(); return; }
    if ((act === 'new' || act === 'preset') && ctx.isMissing()) { toast('De database is nog niet klaar voor vaste lasten'); return; }
    if (act === 'new') { edit(); return; }
    if (act === 'preset') { const p = PRESETS.find(x => x.title === el.dataset.t); if (p) edit({ ...p, remind_days: 7 }); return; }
    const e = ctx.getItems().find(x => x.id === el.closest('.ls-row')?.dataset.id);
    if (e && act === 'edit') edit(e);
  });

  return { render };
}
