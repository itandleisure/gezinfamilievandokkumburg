// Tabblad Klussen: dingen in en om het huis die ooit nog moeten (schilderen, de goot).
// Eenmalig, dus geen herhaling: terugkerende klusjes staan bij Taken.
// Per klus: plek, prioriteit, geschatte prijs, zelf of een vakman (uit Nummers) en een optionele foto.
// Data: tabel `house_jobs` (zie supabase/schema.sql), foto's in de private Storage-bucket `fotos` onder klussen/.

export const PRIOS = [null, 'Snel doen', 'Binnenkort', 'Ooit'];
const PRIO_SHORT = [null, 'Snel', 'Binnenkort', 'Ooit'];
const WHO = { zelf: 'Zelf', vakman: 'Vakman' };
const GEEN = 'Nog niemand gekozen';
const BUCKET = 'fotos';
const PLACE_KEY = 'klussen-plek';

const ICON_CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ICON_EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';
const ICON_PHONE = '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1"/></svg>';

export const euro = n => '€ ' + Number(n).toLocaleString('nl-NL', { minimumFractionDigits: Number(n) % 1 ? 2 : 0, maximumFractionDigits: 2 });
// '250', '1.500', '1.500,50', '€ 80' en '79.95' worden allemaal een getal
export function toNum(s) {
  let t = String(s ?? '').replace(/[€\s]/g, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const n = Number(t);
  return t !== '' && isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}
// Totaal van de geschatte kosten van de open klussen (zonder prijs telt als 0)
export function totals(jobs) {
  const open = jobs.filter(j => !j.done);
  const sum = l => l.reduce((s, j) => s + (Number(j.cost) || 0), 0);
  return { open: open.length, total: sum(open), vakman: sum(open.filter(j => j.who === 'vakman')), zelf: sum(open.filter(j => j.who !== 'vakman')),
    zonderPrijs: open.filter(j => j.cost == null).length, done: sum(jobs.filter(j => j.done)) };
}
const telHref = p => 'tel:' + String(p).replace(/[^\d+]/g, '');

// Foto kleiner maken (max 1600 px, JPEG) zodat hij snel uploadt en weinig ruimte kost
async function shrink(file) {
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.8));
    return blob || file;
  } catch { return file; }
}

// ctx: { root, sb, esc, run, toast, openDialog, load, getJobs, getContacts, isMissing }
export function mountKlussen(ctx) {
  const { root, sb, esc, run, toast } = ctx;
  root.innerHTML = '<div id="klSum"></div><button class="btn primary wide" data-act="new">Klus toevoegen</button><div class="chips task-who" id="klPlaces"></div><div class="list" id="klList"></div>'
    + '<dialog class="kl-photo" id="klPhoto"><img alt=""><button class="btn wide" data-act="closephoto">Sluiten</button></dialog>';
  const list = root.querySelector('#klList'), sumEl = root.querySelector('#klSum'), placeBar = root.querySelector('#klPlaces'), photoDlg = root.querySelector('#klPhoto');
  let place = localStorage.getItem(PLACE_KEY) || '';
  let doneOpen = false;
  const urls = {};   // pad -> { url, exp }

  const contacts = () => ctx.getContacts() || [];
  const contactOf = j => j.contact_id && contacts().find(c => c.id === j.contact_id);
  const contactLabel = c => `${c.name} · ${c.phone}`;

  async function signUrls(paths) {
    const need = paths.filter(p => !urls[p] || urls[p].exp < Date.now());
    if (!need.length) return;
    const { data } = await sb.storage.from(BUCKET).createSignedUrls(need, 3600);
    (data || []).forEach(d => { if (d.signedUrl) urls[d.path] = { url: d.signedUrl, exp: Date.now() + 3300e3 }; });
  }

  function row(j) {
    const c = contactOf(j);
    const meta = [j.place, j.cost != null ? euro(j.cost) : 'prijs nog onbekend', j.who === 'vakman' ? (c ? c.name : 'vakman') : 'zelf'].filter(Boolean);
    const img = j.photo && urls[j.photo];
    return `<div class="task kl${j.done ? ' done' : ''} p${j.priority}" data-id="${esc(j.id)}">
      <button class="tick" data-act="tick" aria-label="${j.done ? 'Terugzetten' : 'Klaar'}: ${esc(j.title)}"><span>${ICON_CHECK}</span></button>
      <button class="txt" data-act="edit"><b>${esc(j.title)}</b>
        <small>${meta.map(esc).join(' · ')}</small>
        ${j.done && j.done_at ? `<small>Klaar op ${esc(new Date(j.done_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }))}</small>` : ''}
        ${j.note ? `<small class="note-txt">${esc(j.note)}</small>` : ''}</button>
      ${j.photo ? `<button class="kl-thumb" data-act="photo" aria-label="Foto bekijken: ${esc(j.title)}">${img ? `<img src="${esc(img.url)}" alt="">` : '<span>Foto</span>'}</button>` : ''}
      ${c && !j.done ? `<a class="mini kl-call" href="${esc(telHref(c.phone))}" aria-label="Bel ${esc(c.name)}">${ICON_PHONE}</a>` : ''}
      <button class="mini" data-act="edit" aria-label="Bewerken: ${esc(j.title)}">${ICON_EDIT}</button>
    </div>`;
  }

  function render() {
    if (ctx.isMissing()) {
      sumEl.innerHTML = '';
      placeBar.hidden = true;
      list.innerHTML = '<p class="empty">De klusjeslijst staat nog niet in de database. Zodra die is klaargezet, kun je hier klussen toevoegen.</p>';
      return;
    }
    const all = ctx.getJobs();
    const places = [...new Set(all.filter(j => !j.done && j.place).map(j => j.place))].sort((a, b) => a.localeCompare(b, 'nl'));
    if (place && !places.includes(place)) place = '';
    placeBar.hidden = places.length < 2;
    placeBar.innerHTML = places.length < 2 ? '' : [['', 'Overal'], ...places.map(p => [p, p])].map(([id, n]) =>
      `<button class="chip${place === id ? ' on' : ''}" data-act="place" data-place="${esc(id)}" aria-pressed="${place === id}">${esc(n)}</button>`).join('');
    const shown = all.filter(j => !place || j.place === place);
    const t = totals(shown);
    sumEl.innerHTML = `<div class="kl-sum"><small>${place ? `Geschat voor ${esc(place)}` : 'Geschatte kosten van alle open klussen'}</small>
      <b>${euro(t.total)}</b>
      <span>${t.open === 1 ? '1 klus' : t.open + ' klussen'} open${t.open ? ` · vakman ${euro(t.vakman)} · zelf ${euro(t.zelf)}` : ''}${t.zonderPrijs ? ` · ${t.zonderPrijs} nog zonder prijs` : ''}</span></div>`;
    const open = shown.filter(j => !j.done).sort((a, b) => (Number(b.cost) || 0) - (Number(a.cost) || 0) || a.title.localeCompare(b.title, 'nl'));
    const done = shown.filter(j => j.done).sort((a, b) => ((b.done_at || '') > (a.done_at || '') ? 1 : -1));
    if (!all.length) { list.innerHTML = '<p class="empty">Nog geen klussen. Denk aan de goot, de buitenmuur schilderen of een kapotte tegel op het terras.</p>'; return; }
    list.innerHTML = [1, 2, 3].map(p => { const l = open.filter(j => (j.priority || 2) === p);
      return l.length ? `<div class="group${p === 1 ? ' g-due' : ''}"><h3>${PRIOS[p]}${totals(l).total ? ` <span class="mut">· ${euro(totals(l).total)}</span>` : ''}</h3>${l.map(row).join('')}</div>` : ''; }).join('')
      + (!open.length ? '<p class="empty">Alles klaar. Tijd voor een cerveza op het terras!</p>' : '')
      + (done.length ? `<details class="archive"${doneOpen ? ' open' : ''}><summary>Klaar (${done.length}) · ${euro(t.done)}</summary>${done.map(row).join('')}</details>` : '');
    const d = list.querySelector('.archive'); if (d) d.addEventListener('toggle', () => { doneOpen = d.open; });
    // Foto's: tijdelijke links ophalen en daarna opnieuw tekenen
    const paths = shown.filter(j => j.photo && !(urls[j.photo] && urls[j.photo].exp > Date.now())).map(j => j.photo);
    if (paths.length) signUrls(paths).then(() => { if (paths.some(p => urls[p])) render(); });
  }

  async function upload(id, file) {
    const blob = await shrink(file);
    const path = `klussen/${id}-${Date.now()}.jpg`;
    const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true });
    if (error) { toast('Foto opslaan lukte niet: ' + error.message); return null; }
    return path;
  }
  const removePhoto = path => path ? sb.storage.from(BUCKET).remove([path]) : null;

  function edit(j = {}) {
    const cs = [...contacts()].sort((a, b) => a.name.localeCompare(b.name, 'nl'));
    const cur = contactOf(j);
    ctx.openDialog({
      title: j.id ? 'Klus bewerken' : 'Nieuwe klus',
      fields: [
        { name: 'title', label: 'Wat moet er gebeuren?', value: j.title, required: true },
        { name: 'place', label: 'Waar? (ruimte of plek, bijv. terras, dak, badkamer)', value: j.place ?? (place || ''), list: [...new Set(ctx.getJobs().map(x => x.place).filter(Boolean))] },
        { name: 'priority', label: 'Hoe dringend?', type: 'select', options: PRIOS.slice(1), value: PRIOS[j.priority || 2] },
        { name: 'cost', label: 'Geschatte prijs in euro (optioneel)', inputmode: 'decimal', value: j.cost != null ? String(j.cost).replace('.', ',') : '' },
        { name: 'who', label: 'Wie doet het?', type: 'select', options: Object.values(WHO), value: WHO[j.who || 'zelf'] },
        { name: 'contact', label: 'Vakman uit Nummers (optioneel)', type: 'select', options: [GEEN, ...cs.map(contactLabel)], value: cur ? contactLabel(cur) : GEEN },
        { name: 'note', label: 'Notitie (optioneel, bijv. wat de vakman zei)', type: 'textarea', value: j.note },
        { name: 'photo', label: j.photo ? 'Andere foto kiezen (optioneel)' : 'Foto (optioneel)', type: 'file', accept: 'image/*' },
        ...(j.photo ? [{ name: 'nophoto', label: 'Foto weghalen', type: 'checkbox', value: false }] : [])
      ],
      onSave: async v => {
        if (!v.title) { toast('Vul in wat er moet gebeuren'); return false; }
        const cost = v.cost ? toNum(v.cost) : null;
        if (v.cost && cost == null) { toast('Vul de prijs in als getal, bijv. 250'); return false; }
        const contact = cs.find(c => contactLabel(c) === v.contact) || null;
        const data = { title: v.title.slice(0, 200), place: (v.place || '').slice(0, 60), priority: PRIOS.indexOf(v.priority) > 0 ? PRIOS.indexOf(v.priority) : 2, cost,
          // Een vakman uit Nummers kiezen betekent dat een vakman het doet
          who: contact || v.who === WHO.vakman ? 'vakman' : 'zelf', contact_id: contact ? contact.id : null, note: v.note || '' };
        const id = j.id || crypto.randomUUID();
        const file = v.photo instanceof File && v.photo.size ? v.photo : null;
        if (file) { toast('Foto opslaan…'); const p = await upload(id, file); if (p) data.photo = p; else if (!j.id) return false; }
        else if (v.nophoto) data.photo = null;
        const ok = await run(j.id ? sb.from('house_jobs').update(data).eq('id', j.id) : sb.from('house_jobs').insert({ id, ...data }), j.id ? 'Opgeslagen' : 'Klus toegevoegd');
        if (ok && j.photo && 'photo' in data && data.photo !== j.photo) removePhoto(j.photo);
        if (ok) { await ctx.load('house_jobs'); render(); }
        return ok;
      },
      onDelete: j.id ? async () => {
        if (await run(sb.from('house_jobs').delete().eq('id', j.id), 'Klus verwijderd')) removePhoto(j.photo);
        await ctx.load('house_jobs'); render();
      } : null
    });
  }

  async function tick(j) {
    j.done = !j.done; j.done_at = j.done ? new Date().toISOString() : null;
    render();
    if (!await run(sb.from('house_jobs').update({ done: j.done, done_at: j.done_at }).eq('id', j.id), j.done ? 'Klaar! Lekker gedaan' : 'Teruggezet')) { await ctx.load('house_jobs'); render(); }
  }

  async function showPhoto(j) {
    await signUrls([j.photo]);
    const u = urls[j.photo]; if (!u) { toast('Foto laden lukte niet'); return; }
    photoDlg.querySelector('img').src = u.url; photoDlg.querySelector('img').alt = j.title;
    photoDlg.showModal();
  }

  root.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    const act = el.dataset.act;
    if (act === 'closephoto') { photoDlg.close(); return; }
    if (act === 'place') { place = el.dataset.place; localStorage.setItem(PLACE_KEY, place); render(); return; }
    if (act === 'new') { if (ctx.isMissing()) { toast('De database is nog niet klaar voor klussen'); return; } edit(); return; }
    const j = ctx.getJobs().find(x => x.id === el.closest('.kl')?.dataset.id); if (!j) return;
    if (act === 'tick') tick(j);
    if (act === 'edit') edit(j);
    if (act === 'photo') showPhoto(j);
  });
  photoDlg.addEventListener('click', e => { if (e.target === photoDlg) photoDlg.close(); });

  return { render };
}
