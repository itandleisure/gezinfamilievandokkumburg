// Zoeken door de hele app: één zoekveld dat tegelijk kijkt in notities, nummers, bonnetjes, klussen,
// vaste lasten, recepten, cadeaus en de boodschappenlijst. Alles staat al in het geheugen (S in app.js),
// dus zoeken gaat meteen en zonder extra aanvragen. Een tik op een resultaat opent het item zelf.

// Kleine letters en zonder accenten, zodat "compete" ook "Cómpeta" vindt en "nino" ook "niño"
export const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Alle woorden moeten ergens in de tekst voorkomen (volgorde maakt niet uit)
export function matches(text, q) {
  const t = norm(text), words = norm(q).split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every(w => t.includes(w));
}

const ICON_SEARCH = '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>';
const MAX = 8; // per onderdeel, daarna "nog x"

// Onderdelen in de volgorde waarin ze getoond worden.
// get(d) geeft de rijen, text(x) waarop gezocht wordt, title/sub wat je ziet, view + id waar een tik heen gaat.
export const SOURCES = [
  { key: 'notities', n: 'Notities', view: 'notities', get: d => d.notes,
    text: x => [x.title, x.body].join(' '), title: x => x.title || 'Zonder titel', sub: x => (x.done ? 'Archief · ' : '') + (x.body || '') },
  { key: 'nummers', n: 'Nummers', view: 'nummers', get: d => d.contacts,
    text: x => [x.name, x.phone, x.note, x.category].join(' '), title: x => x.name, sub: x => [x.phone, x.note].filter(Boolean).join(' · ') },
  { key: 'boodschappen', n: 'Boodschappenlijst', view: 'boodschappen', get: d => d.shopping_items,
    text: x => [x.name, x.qty, x.category].join(' '), title: x => x.name, sub: x => [x.checked ? 'In de kar' : 'Op de lijst', x.qty].filter(Boolean).join(' · ') },
  { key: 'recepten', n: 'Recepten', view: 'recepten', get: d => d.recipes,
    text: x => [x.n, x.es, ...(x.ingr || []).map(g => g[0]), ...(x.vingr || []).map(g => g[0])].join(' '), title: x => x.n, sub: x => [x.es, x.min ? x.min + ' min' : ''].filter(Boolean).join(' · ') },
  { key: 'cadeaus', n: 'Cadeaus', view: 'cadeaus', get: d => [
      ...d.gift_lists.map(l => ({ ...l, _list: true })),
      ...d.gift_items.map(i => ({ ...i, _listTitle: (d.gift_lists.find(l => l.id === i.list_id) || {}).title || '' }))],
    text: x => x._list ? x.title : [x.name, x.note, x._listTitle].join(' '),
    title: x => x._list ? x.title : x.name, sub: x => x._list ? 'Cadeaulijst' : 'Idee voor ' + x._listTitle + (x.bought ? ' · gekocht' : '') },
  { key: 'klussen', n: 'Klussen', view: 'klussen', get: d => d.house_jobs,
    text: x => [x.title, x.place, x.note].join(' '), title: x => x.title, sub: x => [x.done ? 'Klaar' : '', x.place, x.note].filter(Boolean).join(' · ') },
  { key: 'bonnetjes', n: 'Bonnetjes', view: 'bonnetjes', get: d => d.receipts,
    text: x => [x.product, x.store, x.note].join(' '), title: x => x.product, sub: x => [x.store, x.note].filter(Boolean).join(' · ') },
  { key: 'lasten', n: 'Vaste lasten', view: 'lasten', get: d => d.expenses,
    text: x => [x.title, x.cat, x.note].join(' '), title: x => x.title, sub: x => [x.cat, x.note].filter(Boolean).join(' · ') }
];

// Zoek in alle onderdelen; geeft [{ src, hits, total }] zonder lege groepen
export function searchAll(d, q) {
  if (norm(q).trim().length < 2) return [];
  return SOURCES.map(src => {
    const all = (src.get(d) || []).filter(x => matches(src.text(x), q));
    return { src, hits: all.slice(0, MAX), total: all.length };
  }).filter(g => g.total);
}

// ctx: { root, esc, data(): {notes, contacts, …}, open(view, item) }
export function mountZoeken(ctx) {
  const { root, esc } = ctx;
  root.innerHTML = `<div class="zk-bar">${ICON_SEARCH}<input type="search" id="zkInput" placeholder="Zoek in de hele app" aria-label="Zoek in de hele app" autocomplete="off" enterkeyhint="search"></div>
    <div id="zkList" class="zk-list"></div>`;
  const input = root.querySelector('#zkInput'), list = root.querySelector('#zkList');
  let shown = []; // [{ src, hits }] van de laatste keer tekenen

  const short = s => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > 90 ? s.slice(0, 88) + '…' : s; };

  function render() {
    const q = input.value;
    if (norm(q).trim().length < 2) {
      shown = [];
      list.innerHTML = `<p class="empty">Typ minstens 2 letters. Er wordt gezocht in notities, nummers, de boodschappenlijst, recepten, cadeaus, klussen, bonnetjes en vaste lasten.</p>`;
      return;
    }
    shown = searchAll(ctx.data(), q);
    list.innerHTML = shown.length ? shown.map((g, gi) => `<section class="zk-group">
      <h3>${esc(g.src.n)} <span class="mut">${g.total}</span></h3>
      ${g.hits.map((x, i) => `<button class="zk-hit" data-g="${gi}" data-i="${i}"><b>${esc(short(g.src.title(x)))}</b>${g.src.sub(x) ? `<small>${esc(short(g.src.sub(x)))}</small>` : ''}</button>`).join('')}
      ${g.total > g.hits.length ? `<button class="zk-more" data-more="${gi}">Nog ${g.total - g.hits.length} in ${esc(g.src.n)}</button>` : ''}
    </section>`).join('') : `<p class="empty">Niets gevonden voor “${esc(q.trim())}”.</p>`;
  }

  input.addEventListener('input', render);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') input.blur(); });
  list.addEventListener('click', e => {
    const more = e.target.closest('[data-more]');
    if (more) { const g = shown[+more.dataset.more]; if (g) ctx.open(g.src.view, null, input.value); return; }
    const b = e.target.closest('.zk-hit'); if (!b) return;
    const g = shown[+b.dataset.g], x = g && g.hits[+b.dataset.i]; if (!x) return;
    ctx.open(g.src.view, x, input.value);
  });

  return {
    render,
    // Bij het openen van Zoeken meteen het toetsenbord tonen
    focus() { setTimeout(() => { input.focus(); input.select(); }, 60); }
  };
}
