import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';
import { mountMenu, cleanPlan, freshPlan, menuShopping } from './menu.js';

// ---------- Helpers ----------
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ICON_CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ICON_X = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ICON_REPEAT = '<svg viewBox="0 0 24 24"><path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></svg>';
const ICON_EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';
const ICON_PHONE = '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1"/></svg>';
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('show'), 2600); }
function confirmTwice(btn, label, fn) {
  if (btn.dataset.sure) { delete btn.dataset.sure; btn.classList.remove('sure'); btn.textContent = label; fn(); return; }
  btn.dataset.sure = 1; btn.classList.add('sure'); btn.textContent = 'Zeker? Tik nog een keer';
  setTimeout(() => { if (btn.dataset.sure) { delete btn.dataset.sure; btn.classList.remove('sure'); btn.textContent = label; } }, 3000);
}

// ---------- Vaste gegevens ----------
const CAT_ORDER = ['Groente', 'Fruit', 'Zuivel', 'Vlees, vis & eieren', 'Brood, granen & aardappelen', 'Basis', 'Huishouden', 'Verzorging', 'Overig'];
const DEFAULT_CATALOG = {
  Huishouden: ['WC-papier', 'Keukenpapier', 'Afwasmiddel', 'Vaatwastabletten', 'Wasmiddel', 'Wasverzachter', 'Vuilniszakken', 'Allesreiniger', 'Schoonmaakdoekjes', 'Sponsjes', 'Aluminiumfolie', 'Vershoudfolie', 'Bakpapier', 'Batterijen'],
  Verzorging: ['Tandpasta', 'Tandenborstels', 'Douchegel', 'Shampoo', 'Deodorant', 'Scheermesjes', 'Handzeep', 'Zonnebrand', 'Wattenstaafjes'],
  Basis: ['Koffie', 'Thee', 'Melk', 'Eieren', 'Brood', 'Boter', 'Water', 'Cola Zero', 'Olijfolie', 'Zout', 'Peper', 'Suiker']
};
const CONTACT_CATS = ['Nood', 'Medisch', 'Gemeente & politie', 'School', 'Huis & klussen', 'Familie', 'Overig'];

// ---------- Supabase ----------
if (SUPABASE_URL === 'VUL_IN' || SUPABASE_ANON_KEY === 'VUL_IN') {
  document.body.innerHTML = '<p style="padding:24px;font:16px system-ui">Vul eerst <code>config.js</code> in met de Project URL en de anon key van Supabase.</p>';
  throw new Error('config.js is nog niet ingevuld');
}
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
const MENU_ID = 'frans-v2';
const S = { shopping_items: [], catalog_items: [], menu_plan: [], notes: [], contacts: [], gift_lists: [], gift_items: [] };
const ORDER = { shopping_items: 'created_at', catalog_items: 'name', menu_plan: 'id', notes: 'updated_at', contacts: 'name', gift_lists: 'created_at', gift_items: 'created_at' };

async function load(t) {
  const { data, error } = await sb.from(t).select('*').order(ORDER[t], { ascending: t !== 'notes' });
  if (error) { toast('Laden mislukt: ' + error.message); return; }
  S[t] = data || [];
}
async function run(promise, okMsg) {
  const { error } = await promise;
  if (error) { toast('Niet gelukt: ' + error.message); return false; }
  if (okMsg) toast(okMsg);
  return true;
}

// ---------- Inloggen ----------
let started = false, recovering = false;
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  $('#loginMsg').textContent = 'Bezig…';
  const { error } = await sb.auth.signInWithPassword({ email: $('#loginEmail').value.trim(), password: $('#loginPass').value });
  $('#loginMsg').textContent = error ? 'Inloggen mislukt. Controleer je e-mail en wachtwoord.' : '';
});
$('#forgot').addEventListener('click', async () => {
  const email = $('#loginEmail').value.trim();
  if (!email) { $('#loginMsg').textContent = 'Vul eerst je e-mailadres in.'; return; }
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  $('#loginMsg').textContent = error ? 'Versturen mislukt: ' + error.message : 'Check je mail voor een link om een nieuw wachtwoord in te stellen.';
});
$('#newPassForm').addEventListener('submit', async e => {
  e.preventDefault();
  const { error } = await sb.auth.updateUser({ password: $('#newPass').value });
  if (error) { $('#loginMsg').textContent = 'Opslaan mislukt: ' + error.message; return; }
  recovering = false; $('#newPassForm').hidden = true; $('#loginForm').hidden = false;
  const { data } = await sb.auth.getSession(); show(data.session);
});
$('#logout').addEventListener('click', () => sb.auth.signOut());

function show(session) {
  if (recovering) return;
  $('#login').hidden = !!session; $('#app').hidden = !session;
  if (session && !started) { started = true; start(); }
}
sb.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    recovering = true; $('#app').hidden = true; $('#login').hidden = false;
    $('#loginForm').hidden = true; $('#newPassForm').hidden = false; $('#loginMsg').textContent = 'Kies een nieuw wachtwoord.';
    return;
  }
  if (event === 'SIGNED_OUT') { location.reload(); return; }
  show(session);
});
sb.auth.getSession().then(({ data }) => show(data.session));

// ---------- Navigatie ----------
const VIEWS = { boodschappen: 'Boodschappen', menu: 'Weekmenu', cadeaus: 'Cadeaus', notities: 'Notities', nummers: 'Belangrijke nummers' };
const current = () => (location.hash.slice(1) in VIEWS ? location.hash.slice(1) : 'boodschappen');
function route() {
  const v = current();
  for (const k in VIEWS) $('#view-' + k).hidden = k !== v;
  document.querySelectorAll('.tabs a').forEach(a => { if (a.dataset.v === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  $('#viewTitle').textContent = VIEWS[v];
  render(v); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', route);

// Niet opnieuw tekenen terwijl iemand in een lijst aan het typen is
let pending = false;
function render(v = current()) {
  const list = $('#view-' + v);
  const a = document.activeElement;
  if (a && list.contains(a) && a.closest('.list') && /INPUT|TEXTAREA/.test(a.tagName)) { pending = true; return; }
  ({ boodschappen: renderShop, menu: () => menu.render(), cadeaus: renderGifts, notities: renderNotes, nummers: renderContacts })[v]();
}
document.addEventListener('focusout', () => setTimeout(() => { if (pending) { pending = false; render(); } }, 50));

// ---------- Start ----------
let menu;
async function start() {
  fillShopForm();
  menu = mountMenu($('#menuRoot'), { getPlan, setPlan, toShopping: menuToShopping });
  route();
  await Promise.all(Object.keys(S).map(load));
  fillShopPick(); route();
  // Live bijwerken
  const timers = {};
  sb.channel('gezin').on('postgres_changes', { event: '*', schema: 'public' }, p => {
    const t = p.table; if (!(t in S)) return;
    clearTimeout(timers[t]);
    timers[t] = setTimeout(async () => { await load(t); if (t === 'catalog_items') fillShopPick(); render(); }, 250);
  }).subscribe();
  // Bijwerken als de app weer naar voren komt (telefoon uit slaapstand)
  document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') { await Promise.all(Object.keys(S).map(load)); fillShopPick(); render(); }
  });
}

// ---------- Weekmenu ----------
function getPlan() { const row = S.menu_plan.find(r => r.id === MENU_ID); return row ? cleanPlan(row.plan) : freshPlan(); }
let planTimer;
function setPlan(plan) {
  const row = S.menu_plan.find(r => r.id === MENU_ID);
  if (row) row.plan = plan; else S.menu_plan.push({ id: MENU_ID, plan });
  clearTimeout(planTimer);
  planTimer = setTimeout(() => run(sb.from('menu_plan').upsert({ id: MENU_ID, plan, updated_at: new Date().toISOString() })), 600);
}
async function menuToShopping() {
  const items = menuShopping(getPlan());
  if (!await run(sb.from('shopping_items').delete().eq('source', 'menu').eq('checked', false))) return;
  if (!await run(sb.from('shopping_items').insert(items.map(i => ({ ...i, source: 'menu' }))))) return;
  await load('shopping_items');
  toast(items.length + ' producten uit het menu op de lijst gezet');
  location.hash = 'boodschappen';
}

// ---------- Boodschappen ----------
function fillShopForm() {
  $('#shopCat').innerHTML = CAT_ORDER.map(c => `<option${c === 'Overig' ? ' selected' : ''}>${c}</option>`).join('');
  fillShopPick();
}
function fillShopPick() {
  const sel = $('#shopPick'), keep = sel.value;
  const own = S.catalog_items.map(c => `<option value="c:${esc(c.id)}">${esc(c.name)}</option>`).join('');
  sel.innerHTML = '<option value="">Kies iets of typ zelf…</option>'
    + Object.entries(DEFAULT_CATALOG).map(([cat, list]) => `<optgroup label="${cat}">${list.map(n => `<option value="d:${cat}:${esc(n)}">${esc(n)}</option>`).join('')}</optgroup>`).join('')
    + (own ? `<optgroup label="Onze eigen items">${own}</optgroup>` : '')
    + '<option value="__eigen">Iets anders…</option>';
  if ([...sel.options].some(o => o.value === keep)) sel.value = keep;
}
$('#shopPick').addEventListener('change', e => {
  const custom = e.target.value === '__eigen';
  $('#shopCustom').hidden = !custom;
  if (custom) $('#shopName').focus();
});
$('#shopAdd').addEventListener('submit', async e => {
  e.preventDefault();
  const v = $('#shopPick').value; let name = '', category = 'Overig';
  if (v === '__eigen') {
    name = $('#shopName').value.trim(); category = $('#shopCat').value;
    if (!name) { $('#shopName').focus(); return; }
    if ($('#shopRemember').checked && !S.catalog_items.some(c => c.name.toLowerCase() === name.toLowerCase()))
      run(sb.from('catalog_items').insert({ name, category }));
  } else if (v.startsWith('d:')) { const [, cat, ...rest] = v.split(':'); category = cat; name = rest.join(':'); }
  else if (v.startsWith('c:')) { const c = S.catalog_items.find(x => x.id === v.slice(2)); if (c) { name = c.name; category = c.category; } }
  if (!name) { toast('Kies eerst wat er op de lijst moet'); return; }
  const row = { name, category, qty: $('#shopQty').value.trim(), source: 'eigen' };
  if (await run(sb.from('shopping_items').insert(row))) {
    await load('shopping_items'); renderShop(); toast(name + ' toegevoegd');
    $('#shopPick').value = ''; $('#shopQty').value = ''; $('#shopName').value = ''; $('#shopCustom').hidden = true;
  }
});
function itemRow(i) {
  const meta = i.qty || '';
  return `<li class="item${i.checked ? ' done' : ''}" data-id="${esc(i.id)}">
    <button class="tick" data-act="tick" aria-label="${i.checked ? 'Niet afgevinkt maken' : 'Afvinken'}: ${esc(i.name)}"><span>${ICON_CHECK}</span></button>
    <div class="txt" data-act="tick"><b>${esc(i.name)}</b>${meta ? `<small>${esc(meta)}</small>` : ''}</div>
    <button class="mini${i.recurring ? ' on' : ''}" data-act="repeat" aria-pressed="${!!i.recurring}" aria-label="Elke week" title="Elke week terug">${ICON_REPEAT}</button>
    <button class="mini" data-act="del" aria-label="Verwijderen: ${esc(i.name)}">${ICON_X}</button></li>`;
}
function renderShop() {
  const items = S.shopping_items;
  const open = items.filter(i => !i.checked), done = items.filter(i => i.checked);
  const groups = CAT_ORDER.map(c => [c, open.filter(i => (CAT_ORDER.includes(i.category) ? i.category : 'Overig') === c)]).filter(g => g[1].length);
  $('#shopList').innerHTML = (open.length
    ? groups.map(([c, list]) => `<div class="group"><h3>${esc(c)}</h3><ul class="items">${list.map(itemRow).join('')}</ul></div>`).join('')
    : `<p class="empty">${S.shopping_items.length ? 'Alles is binnen. Lekker gewerkt!' : 'De lijst is nog leeg. Voeg hierboven iets toe of zet het weekmenu op de lijst.'}</p>`)
    + (done.length ? `<div class="cart-head"><h3>In de kar (${done.length})</h3></div><ul class="items">${done.map(itemRow).join('')}</ul>` : '');
}
$('#shopList').addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const id = el.closest('.item').dataset.id, it = S.shopping_items.find(i => i.id === id); if (!it) return;
  const act = el.dataset.act;
  if (act === 'tick') { it.checked = !it.checked; renderShop(); run(sb.from('shopping_items').update({ checked: it.checked }).eq('id', id)); }
  if (act === 'repeat') { it.recurring = !it.recurring; renderShop(); run(sb.from('shopping_items').update({ recurring: it.recurring }).eq('id', id), it.recurring ? 'Komt elke week terug' : 'Niet meer elke week'); }
  if (act === 'del') { S.shopping_items = S.shopping_items.filter(i => i.id !== id); renderShop(); run(sb.from('shopping_items').delete().eq('id', id)); }
});
$('#shopNewWeek').addEventListener('click', e => confirmTwice(e.currentTarget, 'Nieuwe week', async () => {
  await run(sb.from('shopping_items').delete().eq('checked', true).eq('recurring', false));
  await run(sb.from('shopping_items').update({ checked: false }).eq('recurring', true));
  await load('shopping_items'); renderShop(); toast('Klaar voor een nieuwe week');
}));
$('#shopShare').addEventListener('click', async () => {
  const open = S.shopping_items.filter(i => !i.checked);
  if (!open.length) { toast('Er staat niets open op de lijst'); return; }
  const cat = i => (CAT_ORDER.includes(i.category) ? i.category : 'Overig');
  const text = 'Boodschappen\n' + CAT_ORDER.map(c => {
    const l = open.filter(i => cat(i) === c); return l.length ? `\n${c}\n` + l.map(i => '- ' + i.name + (i.qty ? ' (' + i.qty + ')' : '')).join('\n') : '';
  }).join('');
  try { if (navigator.share) await navigator.share({ text }); else { await navigator.clipboard.writeText(text); toast('Lijst gekopieerd'); } }
  catch (err) { if (err && err.name !== 'AbortError') toast('Delen lukte niet'); }
});

// ---------- Dialoog ----------
function openDialog({ title, fields, onSave, onDelete }) {
  const dlg = $('#dlg');
  $('#dlgTitle').textContent = title;
  $('#dlgFields').innerHTML = fields.map(f => {
    const id = 'f-' + f.name, v = esc(f.value ?? '');
    if (f.type === 'textarea') return `<label for="${id}">${f.label}<textarea id="${id}" name="${f.name}">${v}</textarea></label>`;
    if (f.type === 'select') return `<label for="${id}">${f.label}<select id="${id}" name="${f.name}">${f.options.map(o => `<option${o === f.value ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
    if (f.type === 'checkbox') return `<label class="check" style="margin-bottom:12px"><input type="checkbox" name="${f.name}"${f.value ? ' checked' : ''}> ${f.label}</label>`;
    return `<label for="${id}">${f.label}<input id="${id}" name="${f.name}" type="${f.type || 'text'}" value="${v}"${f.required ? ' required' : ''}${f.inputmode ? ` inputmode="${f.inputmode}"` : ''} autocomplete="off"></label>`;
  }).join('');
  const del = $('#dlgDelete'); del.hidden = !onDelete; del.textContent = 'Verwijderen'; delete del.dataset.sure; del.classList.remove('sure');
  del.onclick = () => confirmTwice(del, 'Verwijderen', async () => { dlg.close(); await onDelete(); });
  $('#dlgCancel').onclick = () => dlg.close();
  $('#dlgForm').onsubmit = async e => {
    e.preventDefault();
    const fd = new FormData($('#dlgForm')), out = {};
    fields.forEach(f => { out[f.name] = f.type === 'checkbox' ? fd.has(f.name) : String(fd.get(f.name) ?? '').trim(); });
    if (await onSave(out) !== false) dlg.close();
  };
  dlg.showModal();
  const first = $('#dlgFields input, #dlgFields textarea'); if (first && !fields[0].value) first.focus();
}

// ---------- Notities ----------
let archiveOpen = false;
function noteRow(n) {
  return `<div class="note-row${n.done ? ' done' : ''}" data-id="${esc(n.id)}">
    <button class="tick" data-act="done" aria-label="${n.done ? 'Terugzetten' : 'Afvinken'}: ${esc(n.title || 'notitie')}"><span>${ICON_CHECK}</span></button>
    <button class="note" data-act="open">${n.pinned && !n.done ? '<span class="pin">Vastgezet</span>' : ''}<b>${esc(n.title || 'Zonder titel')}</b>${n.body ? `<p>${esc(n.body)}</p>` : ''}${n.done && n.done_at ? `<small class="mut">Afgerond op ${new Date(n.done_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}</small>` : ''}</button>
  </div>`;
}
function renderNotes() {
  const q = $('#noteSearch').value.trim().toLowerCase();
  const all = S.notes.filter(n => !q || (n.title + ' ' + n.body).toLowerCase().includes(q));
  const open = all.filter(n => !n.done).sort((a, b) => (b.pinned - a.pinned) || (b.updated_at > a.updated_at ? 1 : -1));
  const done = all.filter(n => n.done).sort((a, b) => ((b.done_at || '') > (a.done_at || '') ? 1 : -1));
  $('#noteList').innerHTML = (open.length ? open.map(noteRow).join('')
    : `<p class="empty">${q ? 'Niets gevonden.' : done.length ? 'Alles afgerond. Netjes!' : 'Nog geen notities. Denk aan to-do\'s, recepten of wat de loodgieter zei.'}</p>`)
    + (done.length ? `<details class="archive"${archiveOpen || q ? ' open' : ''}><summary>Archief (${done.length})</summary>${done.map(noteRow).join('')}</details>` : '');
  const d = $('#noteList .archive'); if (d) d.addEventListener('toggle', () => { archiveOpen = d.open; });
}
$('#noteSearch').addEventListener('input', renderNotes);
function editNote(n = {}) {
  openDialog({
    title: n.id ? 'Notitie' : 'Nieuwe notitie',
    fields: [{ name: 'title', label: 'Titel', value: n.title }, { name: 'body', label: 'Tekst', type: 'textarea', value: n.body }, { name: 'pinned', label: 'Bovenaan vastzetten', type: 'checkbox', value: n.pinned }],
    onSave: async v => {
      if (!v.title && !v.body) return;
      const row = { ...v, updated_at: new Date().toISOString() };
      const ok = await run(n.id ? sb.from('notes').update(row).eq('id', n.id) : sb.from('notes').insert(row));
      if (ok) { await load('notes'); renderNotes(); } return ok;
    },
    onDelete: n.id ? async () => { await run(sb.from('notes').delete().eq('id', n.id), 'Notitie verwijderd'); await load('notes'); renderNotes(); } : null
  });
}
$('#noteNew').addEventListener('click', () => editNote());
$('#noteList').addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const n = S.notes.find(x => x.id === el.closest('.note-row').dataset.id); if (!n) return;
  if (el.dataset.act === 'open') { editNote(n); return; }
  n.done = !n.done; n.done_at = n.done ? new Date().toISOString() : null;
  renderNotes();
  run(sb.from('notes').update({ done: n.done, done_at: n.done_at }).eq('id', n.id), n.done ? 'Afgerond en naar het archief' : 'Teruggezet');
});

// ---------- Nummers ----------
const telHref = p => 'tel:' + String(p).replace(/[^\d+]/g, '');
function renderContacts() {
  const groups = CONTACT_CATS.map(c => [c, S.contacts.filter(x => (CONTACT_CATS.includes(x.category) ? x.category : 'Overig') === c)]).filter(g => g[1].length);
  $('#contactList').innerHTML = groups.length ? groups.map(([c, list]) => `<div class="group"><h3>${esc(c)}</h3>${list.map(x => `
    <div class="contact" data-id="${esc(x.id)}">
      <div class="txt"><b>${esc(x.name)}</b><small>${esc(x.phone)}${x.note ? ' · ' + esc(x.note) : ''}</small></div>
      <button class="mini" data-act="edit" aria-label="Bewerken: ${esc(x.name)}">${ICON_EDIT}</button>
      <a class="call" href="${esc(telHref(x.phone))}" aria-label="Bel ${esc(x.name)}">${ICON_PHONE}Bel</a>
    </div>`).join('')}</div>`).join('')
    : '<p class="empty">Nog geen nummers. Voeg de huisarts, school, gestor of loodgieter toe.</p>';
}
function editContact(x = {}) {
  openDialog({
    title: x.id ? 'Nummer bewerken' : 'Nummer toevoegen',
    fields: [{ name: 'name', label: 'Naam', value: x.name, required: true }, { name: 'phone', label: 'Telefoonnummer', type: 'tel', value: x.phone, required: true, inputmode: 'tel' },
      { name: 'category', label: 'Groep', type: 'select', options: CONTACT_CATS, value: x.category || 'Overig' }, { name: 'note', label: 'Notitie (optioneel)', value: x.note }],
    onSave: async v => {
      if (!v.name || !v.phone) return false;
      const ok = await run(x.id ? sb.from('contacts').update(v).eq('id', x.id) : sb.from('contacts').insert(v));
      if (ok) { await load('contacts'); renderContacts(); } return ok;
    },
    onDelete: x.id ? async () => { await run(sb.from('contacts').delete().eq('id', x.id), 'Nummer verwijderd'); await load('contacts'); renderContacts(); } : null
  });
}
$('#contactNew').addEventListener('click', () => editContact());
$('#contactList').addEventListener('click', e => { const b = e.target.closest('[data-act=edit]'); if (b) editContact(S.contacts.find(x => x.id === b.closest('.contact').dataset.id)); });

// ---------- Cadeaus ----------
const fmtDate = d => d ? new Date(d + 'T12:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
const safeUrl = s => /^https:\/\/\S+$/i.test(s) ? s : '';
function renderGifts() {
  const lists = [...S.gift_lists].sort((a, b) => (a.event_date || '9999') < (b.event_date || '9999') ? -1 : 1);
  $('#giftList').innerHTML = lists.length ? lists.map(l => {
    const items = S.gift_items.filter(i => i.list_id === l.id), n = items.filter(i => i.bought).length;
    return `<section class="gift" data-id="${esc(l.id)}">
      <div class="gift-head"><div><h3>${esc(l.title)}</h3><small>${[fmtDate(l.event_date), items.length ? `${n} van ${items.length} gekocht` : ''].filter(Boolean).join(' · ')}</small></div>
      <button class="mini" data-act="editlist" aria-label="Lijst bewerken">${ICON_EDIT}</button></div>
      <ul class="items">${items.map(i => {
        const url = safeUrl(i.note);
        return `<li class="item${i.bought ? ' done' : ''}" data-item="${esc(i.id)}">
        <button class="tick" data-act="buy" aria-label="${i.bought ? 'Nog niet gekocht' : 'Gekocht'}: ${esc(i.name)}"><span>${ICON_CHECK}</span></button>
        <div class="txt"><b>${esc(i.name)}</b>${i.note ? `<small>${url ? `<a href="${esc(url)}" target="_blank" rel="noopener">Link</a>` : esc(i.note)}</small>` : ''}</div>
        <button class="mini" data-act="delitem" aria-label="Verwijderen: ${esc(i.name)}">${ICON_X}</button></li>`;
      }).join('')}</ul>
      <form data-act="additem"><input name="name" placeholder="Idee toevoegen (A, B, C…)" aria-label="Cadeau-idee" autocomplete="off"><button class="btn" type="submit">Voeg toe</button></form>
    </section>`;
  }).join('') : '<p class="empty">Nog geen cadeaulijsten. Maak er een per verjaardag of feest, bijvoorbeeld "Verjaardag Frans".</p>';
}
function editList(l = {}) {
  openDialog({
    title: l.id ? 'Cadeaulijst bewerken' : 'Nieuwe cadeaulijst',
    fields: [{ name: 'title', label: 'Voor wie / welke gelegenheid', value: l.title, required: true }, { name: 'event_date', label: 'Datum (optioneel)', type: 'date', value: l.event_date }],
    onSave: async v => {
      if (!v.title) return false;
      const row = { title: v.title, event_date: v.event_date || null };
      const ok = await run(l.id ? sb.from('gift_lists').update(row).eq('id', l.id) : sb.from('gift_lists').insert(row));
      if (ok) { await load('gift_lists'); renderGifts(); } return ok;
    },
    onDelete: l.id ? async () => { await run(sb.from('gift_lists').delete().eq('id', l.id), 'Lijst verwijderd'); await Promise.all([load('gift_lists'), load('gift_items')]); renderGifts(); } : null
  });
}
$('#giftNew').addEventListener('click', () => editList());
$('#giftList').addEventListener('click', async e => {
  const el = e.target.closest('[data-act]'); if (!el || el.tagName === 'FORM') return;
  const listId = el.closest('.gift').dataset.id, act = el.dataset.act;
  if (act === 'editlist') { editList(S.gift_lists.find(l => l.id === listId)); return; }
  const itemId = el.closest('[data-item]')?.dataset.item, it = S.gift_items.find(i => i.id === itemId); if (!it) return;
  if (act === 'buy') { it.bought = !it.bought; renderGifts(); run(sb.from('gift_items').update({ bought: it.bought }).eq('id', it.id)); }
  if (act === 'delitem') { S.gift_items = S.gift_items.filter(i => i.id !== it.id); renderGifts(); run(sb.from('gift_items').delete().eq('id', it.id)); }
});
$('#giftList').addEventListener('submit', async e => {
  e.preventDefault();
  const f = e.target, inp = f.querySelector('input'), name = inp.value.trim(); if (!name) return;
  const list_id = f.closest('.gift').dataset.id;
  if (await run(sb.from('gift_items').insert({ list_id, name }))) { inp.value = ''; await load('gift_items'); inp.blur(); pending = false; renderGifts(); }
});
