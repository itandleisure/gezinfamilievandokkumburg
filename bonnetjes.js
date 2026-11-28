// Tegel Bonnetjes: aankopen met een foto van de bon en de einddatum van de garantie.
// Gedeeld met het gezin. Data: tabel `receipts`; foto's in de privé-bucket `fotos`, map `bonnetjes/` (zie supabase/schema.sql).
// "Garantie loopt bijna af" (binnen SOON_DAYS) staat bovenaan; verlopen bonnen staan ingeklapt onderaan.

const BUCKET = 'fotos', FOLDER = 'bonnetjes';
export const WARRANTY_YEARS = 3;   // standaard in Spanje
const SOON_DAYS = 90;
const MAX_PX = 1600;               // foto verkleinen voor het uploaden: scherp genoeg om de bon te lezen

const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
const today = () => iso(new Date());
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
export function addYears(s, n) {
  const d = parse(s), day = d.getDate();
  d.setDate(1); d.setFullYear(d.getFullYear() + n);
  d.setDate(Math.min(day, new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()));
  return iso(d);
}
const fmt = s => parse(s).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
const euro = n => n == null ? '' : Number(n).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
export function parseAmount(s) {
  const t = String(s || '').replace(/[€\s]/g, '');
  if (!t) return null;
  // 1.299,95 of 1299,95 of 1299.95
  const n = Number(/,\d{1,2}$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : NaN;
}
function left(s) {
  const d = daysBetween(today(), s);
  if (d < 0) return 'verlopen';
  if (d === 0) return 'laatste dag!';
  if (d < 14) return `nog ${d} dagen`;
  if (d < 70) return `nog ${Math.round(d / 7)} weken`;
  if (d < 730) return `nog ${Math.round(d / 30.4)} maanden`;
  return `nog ${Math.floor(d / 365.25)} jaar`;
}
// Indeling: bijna af, loopt nog, verlopen
export function groups(items, t0 = today()) {
  const soon = [], ok = [], gone = [];
  for (const r of items) {
    if (!r.warranty_until) ok.push(r);
    else if (r.warranty_until < t0) gone.push(r);
    else if (daysBetween(t0, r.warranty_until) <= SOON_DAYS) soon.push(r);
    else ok.push(r);
  }
  const by = (a, b) => (a.warranty_until || '9999') < (b.warranty_until || '9999') ? -1 : 1;
  return { soon: soon.sort(by), ok: ok.sort(by), gone: gone.sort((a, b) => -by(a, b)) };
}

// Foto verkleinen naar JPEG (ook HEIC van de iPhone, Safari kan dat lezen). Lukt het niet, dan het origineel.
async function shrink(file) {
  try {
    const url = URL.createObjectURL(file);
    const img = await new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = url; });
    const k = Math.min(1, MAX_PX / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(url);
    const blob = await new Promise(ok => c.toBlob(ok, 'image/jpeg', 0.82));
    if (blob) return blob;
  } catch { /* origineel gebruiken */ }
  return file;
}

const ICON_RECEIPT = '<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/></svg>';
const ICON_EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';

// ctx: { root, sb, esc, run, toast, openDialog, load, getItems, isMissing }
export function mountBonnetjes(ctx) {
  const { root, sb, esc, run, toast } = ctx;
  root.innerHTML = `<div class="row2"><input type="search" id="rcSearch" placeholder="Zoeken" aria-label="Zoeken in bonnetjes">
    <button class="btn primary" data-act="new">Bon toevoegen</button></div><div class="list" id="rcList"></div>`;
  const list = root.querySelector('#rcList'), search = root.querySelector('#rcSearch');
  const urls = new Map();   // pad -> { url, exp }
  let goneOpen = false;

  function row(r) {
    const until = r.warranty_until;
    const st = !until ? '' : until < today() ? 'gone' : daysBetween(today(), until) <= SOON_DAYS ? 'soon' : 'ok';
    return `<div class="rc ${st}" data-id="${esc(r.id)}">
      <button class="rc-photo" data-act="photo" aria-label="${r.photo_path ? 'Bon bekijken' : 'Foto toevoegen'}: ${esc(r.product)}">${r.photo_path ? `<img alt="" data-path="${esc(r.photo_path)}">` : ICON_RECEIPT}</button>
      <button class="txt" data-act="edit"><b>${esc(r.product)}</b>
        <small>${[r.store, r.bought_on && fmt(r.bought_on), euro(r.amount)].filter(Boolean).map(esc).join(' · ')}</small>
        ${until ? `<small class="wt">Garantie tot ${esc(fmt(until))} · <span>${esc(left(until))}</span></small>` : '<small class="wt">Geen garantie ingevuld</small>'}
        ${r.note ? `<small class="note-txt">${esc(r.note)}</small>` : ''}</button>
      <button class="mini" data-act="edit" aria-label="Bewerken: ${esc(r.product)}">${ICON_EDIT}</button>
    </div>`;
  }

  function render() {
    if (ctx.isMissing()) { list.innerHTML = '<p class="empty">De bonnetjes staan nog niet in de database. Zodra die is klaargezet, kun je hier je bonnen bewaren.</p>'; return; }
    const q = search.value.trim().toLowerCase();
    const all = ctx.getItems().filter(r => !q || [r.product, r.store, r.note, r.amount, r.bought_on].join(' ').toLowerCase().includes(q));
    if (!ctx.getItems().length) { list.innerHTML = '<p class="empty">Nog geen bonnetjes. Maak een foto van de bon van de wasmachine, de airco of je nieuwe telefoon, dan weet je altijd tot wanneer de garantie loopt.</p>'; return; }
    if (!all.length) { list.innerHTML = '<p class="empty">Niets gevonden.</p>'; return; }
    const g = groups(all);
    list.innerHTML =
      (g.soon.length ? `<div class="task-alert">Garantie loopt bijna af bij ${g.soon.length === 1 ? '1 aankoop' : g.soon.length + ' aankopen'}</div>` : '')
      + (g.soon.length ? `<div class="group g-due"><h3>Garantie loopt bijna af</h3>${g.soon.map(row).join('')}</div>` : '')
      + (g.ok.length ? `<div class="group"><h3>Onder garantie</h3>${g.ok.map(row).join('')}</div>` : '')
      + (g.gone.length ? `<details class="archive"${goneOpen || q ? ' open' : ''}><summary>Garantie verlopen (${g.gone.length})</summary>${g.gone.map(row).join('')}</details>` : '');
    const d = list.querySelector('.archive'); if (d) d.addEventListener('toggle', () => { goneOpen = d.open; if (d.open) thumbs(); });
    thumbs();
  }

  // Miniaturen: tijdelijke links (1 uur) voor de foto's, in één keer opgehaald
  async function signed(paths) {
    const now = Date.now(), need = paths.filter(p => !(urls.get(p)?.exp > now));
    if (need.length) {
      const { data } = await sb.storage.from(BUCKET).createSignedUrls(need, 3600);
      (data || []).forEach(x => { if (x.signedUrl) urls.set(x.path, { url: x.signedUrl, exp: now + 3300e3 }); });
    }
    return p => urls.get(p)?.url;
  }
  async function thumbs() {
    const imgs = [...list.querySelectorAll('img[data-path]')]; if (!imgs.length) return;
    const get = await signed([...new Set(imgs.map(i => i.dataset.path))]);
    imgs.forEach(i => { const u = get(i.dataset.path); if (u && i.src !== u) i.src = u; });
  }

  function view(r) {
    signed([r.photo_path]).then(get => {
      const u = get(r.photo_path); if (!u) { toast('Foto laden mislukt'); return; }
      const ov = document.createElement('div');
      ov.className = 'photo-view'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-label', 'Bon van ' + r.product);
      ov.innerHTML = `<img src="${esc(u)}" alt="Bon van ${esc(r.product)}"><div class="pv-bar"><a class="btn" href="${esc(u)}" target="_blank" rel="noopener">Openen</a><button class="btn primary" type="button">Sluiten</button></div>`;
      ov.addEventListener('click', e => { if (!e.target.closest('a')) ov.remove(); });
      document.body.appendChild(ov);
    });
  }

  async function upload(id, file) {
    const blob = await shrink(file);
    if (blob.size > 5 * 1024 * 1024) { toast('De foto is te groot (max. 5 MB)'); return null; }
    const path = `${FOLDER}/${id}.jpg`;
    const { error } = await sb.storage.from(BUCKET).upload(path, blob, { upsert: true, contentType: blob.type || 'image/jpeg' });
    if (error) { toast('Foto opslaan mislukt: ' + error.message); return null; }
    urls.delete(path);
    return path;
  }

  function edit(r = {}) {
    ctx.openDialog({
      title: r.id ? 'Bon bewerken' : 'Nieuwe bon',
      fields: [
        { name: 'photo', label: r.photo_path ? 'Andere foto van de bon (optioneel)' : 'Foto van de bon', type: 'file' },
        { name: 'product', label: 'Wat heb je gekocht?', value: r.product, required: true },
        { name: 'store', label: 'Winkel', value: r.store },
        { name: 'bought_on', label: 'Aankoopdatum', type: 'date', value: r.bought_on || today(), required: true },
        { name: 'amount', label: 'Bedrag in € (optioneel)', inputmode: 'decimal', value: r.amount == null ? '' : String(r.amount).replace('.', ',') },
        { name: 'warranty_until', label: `Garantie tot (leeg = ${WARRANTY_YEARS} jaar na aankoop)`, type: 'date', value: r.warranty_until || '' },
        { name: 'note', label: 'Notitie (optioneel, bijv. serienummer)', value: r.note }
      ],
      onSave: async v => {
        const amount = parseAmount(v.amount);
        if (!v.product || !v.bought_on) { toast('Vul in wat je gekocht hebt en wanneer'); return false; }
        if (Number.isNaN(amount)) { toast('Het bedrag klopt niet'); return false; }
        const id = r.id || crypto.randomUUID();
        const data = { product: v.product.slice(0, 120), store: v.store.slice(0, 80), bought_on: v.bought_on, amount,
          warranty_until: v.warranty_until || addYears(v.bought_on, WARRANTY_YEARS), note: v.note };
        if (v.photo) { toast('Foto opslaan…'); const p = await upload(id, v.photo); if (!p) return false; data.photo_path = p; }
        const ok = await run(r.id ? sb.from('receipts').update(data).eq('id', r.id) : sb.from('receipts').insert({ id, ...data }), r.id ? 'Opgeslagen' : 'Bon bewaard');
        if (ok) { await ctx.load('receipts'); render(); }
        return ok;
      },
      onDelete: r.id ? async () => {
        if (await run(sb.from('receipts').delete().eq('id', r.id), 'Bon verwijderd') && r.photo_path) await sb.storage.from(BUCKET).remove([r.photo_path]);
        await ctx.load('receipts'); render();
      } : null
    });
  }

  search.addEventListener('input', render);
  root.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    if (el.dataset.act === 'new') { if (ctx.isMissing()) { toast('De database is nog niet klaar voor bonnetjes'); return; } edit(); return; }
    const r = ctx.getItems().find(x => x.id === el.closest('.rc')?.dataset.id); if (!r) return;
    if (el.dataset.act === 'photo') { if (r.photo_path) view(r); else edit(r); }
    if (el.dataset.act === 'edit') edit(r);
  });

  return { render };
}
