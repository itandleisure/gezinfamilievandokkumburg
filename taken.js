// Tabblad Taken: terugkerende klusjes (bijv. airco-filter elke 3 maanden).
// Afvinken zet de volgende datum; wat aan de beurt of te laat is staat bovenaan.
// Data: tabel `tasks` (zie supabase/schema.sql). Gedeeld en live tussen beide telefoons.

const UNITS = { dag: ['dag', 'dagen'], week: ['week', 'weken'], maand: ['maand', 'maanden'], jaar: ['jaar', 'jaar'] };
const UNIT_OPTS = ['dagen', 'weken', 'maanden', 'jaar'];
const UNIT_FROM_OPT = { dagen: 'dag', weken: 'week', maanden: 'maand', jaar: 'jaar' };
const UNIT_TO_OPT = { dag: 'dagen', week: 'weken', maand: 'maanden', jaar: 'jaar' };

// Datums als 'JJJJ-MM-DD' in de eigen tijdzone
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d, 12); };
export const today = () => iso(new Date());
const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
export function addInterval(s, n, unit) {
  const d = parse(s);
  if (unit === 'dag') d.setDate(d.getDate() + n);
  else if (unit === 'week') d.setDate(d.getDate() + 7 * n);
  else {
    const months = unit === 'jaar' ? 12 * n : n, day = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + months);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
  }
  return iso(d);
}
const every = t => t.every_n === 1 ? `Elke ${UNITS[t.every_unit]?.[0] || t.every_unit}` : `Elke ${t.every_n} ${UNITS[t.every_unit]?.[1] || t.every_unit}`;
const fmt = s => parse(s).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
function when(s) {
  const d = daysBetween(today(), s);
  if (d === 0) return 'vandaag';
  if (d === 1) return 'morgen';
  if (d === -1) return 'gisteren al';
  if (d < 0) return (-d < 14 ? `${-d} dagen` : `${Math.round(-d / 7)} weken`) + ' te laat';
  if (d < 14) return `over ${d} dagen`;
  if (d < 60) return `over ${Math.round(d / 7)} weken`;
  return `over ${Math.round(d / 30)} maanden`;
}
export const dueCount = tasks => tasks.filter(t => t.next_due <= today()).length;

const ICON_CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const ICON_EDIT = '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>';

const SAMEN = 'Samen';
const FILTER_KEY = 'taken-filter';

// ctx: { root, getTasks, isMissing, esc, sb, load, run, toast, openDialog, onChange, getMembers, me }
// getMembers(): rijen uit family_members ({ owner, name }); leeg = functie "wie doet het" nog niet in de database
export function mountTaken(ctx) {
  const { root, esc, sb, run, toast } = ctx;
  root.innerHTML = '<button class="btn primary wide" data-act="new">Taak toevoegen</button><div class="chips task-who" id="taskWho"></div><div class="list" id="taskList"></div>';
  const list = root.querySelector('#taskList'), whoBar = root.querySelector('#taskWho');
  let filter = localStorage.getItem(FILTER_KEY) || 'alle';   // 'alle' of het id van een gezinslid
  const members = () => ctx.getMembers ? ctx.getMembers() : [];
  const nameOf = id => (members().find(m => m.owner === id) || {}).name;
  // Wie doet het: naam van de persoon, of "Samen" als er niemand is gekozen
  const who = t => (t.assignee && nameOf(t.assignee)) || SAMEN;

  function row(t, cls = '') {
    const doneToday = t.last_done === today();
    const late = t.next_due < today();
    return `<div class="task${doneToday ? ' done' : ''}${late ? ' late' : ''} ${cls}" data-id="${esc(t.id)}">
      <button class="tick" data-act="tick" aria-label="${doneToday ? 'Terugzetten' : 'Gedaan'}: ${esc(t.title)}"><span>${ICON_CHECK}</span></button>
      <button class="txt" data-act="edit"><b>${esc(t.title)}${members().length ? ` <span class="who${!nameOf(t.assignee) ? ' samen' : t.assignee === ctx.me?.() ? ' me' : ''}">${esc(who(t))}</span>` : ''}</b>
        <small>${doneToday ? `Gedaan! Volgende keer ${esc(fmt(t.next_due))}` : `<span class="due">${esc(when(t.next_due))}</span> · ${esc(fmt(t.next_due))}`} · ${esc(every(t))}</small>
        ${t.note ? `<small class="note-txt">${esc(t.note)}</small>` : ''}</button>
      <button class="mini" data-act="edit" aria-label="Bewerken: ${esc(t.title)}">${ICON_EDIT}</button>
    </div>`;
  }

  function render() {
    if (ctx.isMissing()) {
      list.innerHTML = '<p class="empty">De takenlijst staat nog niet in de database. Zodra die is klaargezet, verschijnen hier je klusjes.</p>';
      return;
    }
    const t0 = today(), week = addInterval(t0, 7, 'dag');
    const ms = members();
    if (ms.length && filter !== 'alle' && !ms.some(m => m.owner === filter)) filter = 'alle';
    whoBar.hidden = !ms.length;
    whoBar.innerHTML = ms.length ? [['alle', 'Iedereen'], ...ms.map(m => [m.owner, m.name])].map(([id, n]) =>
      `<button class="chip${filter === id ? ' on' : ''}" data-act="who" data-who="${esc(id)}" aria-pressed="${filter === id}">${esc(n)}</button>`).join('')
      + '<button class="chip ghost" data-act="names" aria-label="Namen aanpassen">✎ Namen</button>' : '';
    // Filter op persoon: zijn of haar eigen taken plus de taken die je samen doet
    const mine = t => filter === 'alle' || !t.assignee || t.assignee === filter || !ms.some(m => m.owner === t.assignee);
    const all = [...ctx.getTasks()].filter(mine).sort((a, b) => (a.next_due < b.next_due ? -1 : a.next_due > b.next_due ? 1 : a.title.localeCompare(b.title)));
    const doneToday = all.filter(t => t.last_done === t0);
    const rest = all.filter(t => t.last_done !== t0);
    const due = rest.filter(t => t.next_due <= t0);
    const soon = rest.filter(t => t.next_due > t0 && t.next_due <= week);
    const later = rest.filter(t => t.next_due > week);
    const group = (title, items, cls = '') => items.length ? `<div class="group ${cls}"><h3>${title}</h3>${items.map(t => row(t)).join('')}</div>` : '';
    if (!all.length && filter !== 'alle' && ctx.getTasks().length) { list.innerHTML = `<p class="empty">${esc(nameOf(filter) || '')} heeft nu geen taken. Lekker!</p>`; return; }
    if (!all.length) { list.innerHTML = '<p class="empty">Nog geen taken. Denk aan het airco-filter, de rookmelders of de butaanfles.</p>'; return; }
    list.innerHTML =
      (due.length ? `<div class="task-alert">${due.length === 1 ? '1 taak is' : due.length + ' taken zijn'} aan de beurt</div>`
        : `<div class="task-alert ok">Niets aan de beurt. Lekker bezig!</div>`)
      + group('Aan de beurt', due, 'g-due')
      + group('Deze week', soon)
      + group('Later', later)
      + group('Vandaag gedaan', doneToday, 'g-done');
  }

  async function save(id, patch, msg) {
    const t = ctx.getTasks().find(x => x.id === id); if (t) Object.assign(t, patch);
    render(); ctx.onChange();
    if (!await run(sb.from('tasks').update(patch).eq('id', id), msg)) { await ctx.load('tasks'); render(); ctx.onChange(); }
  }

  function tick(t) {
    const t0 = today();
    if (t.last_done === t0 && t.prev_due) {
      save(t.id, { next_due: t.prev_due, last_done: t.prev_done, prev_due: null, prev_done: null }, 'Teruggezet');
      return;
    }
    const next = addInterval(t0, t.every_n, t.every_unit);
    save(t.id, { prev_due: t.next_due, prev_done: t.last_done, last_done: t0, next_due: next }, `Gedaan! Volgende keer ${fmt(next)}`);
  }

  function editNames() {
    const ms = members();
    ctx.openDialog({
      title: 'Namen aanpassen',
      fields: ms.map((m, i) => ({ name: 'n' + i, label: m.owner === ctx.me?.() ? 'Jouw naam' : 'Naam van de ander', value: m.name, required: true })),
      onSave: async v => {
        const rows = ms.map((m, i) => ({ owner: m.owner, name: (v['n' + i] || '').slice(0, 30), updated_at: new Date().toISOString() }));
        if (rows.some(r => !r.name)) { toast('Vul beide namen in'); return false; }
        const ok = await run(sb.from('family_members').upsert(rows), 'Namen opgeslagen');
        if (ok) { await ctx.load('family_members'); render(); }
        return ok;
      }
    });
  }

  function edit(t = {}) {
    const ms = members();
    // Nieuwe taak in een gefilterde lijst: standaard voor die persoon
    const cur = t.id ? who(t) : (filter !== 'alle' && nameOf(filter)) || SAMEN;
    ctx.openDialog({
      title: t.id ? 'Taak bewerken' : 'Nieuwe taak',
      fields: [
        { name: 'title', label: 'Wat moet er gebeuren?', value: t.title, required: true },
        { name: 'every_n', label: 'Hoe vaak? Elke …', type: 'number', inputmode: 'numeric', value: t.every_n ?? 1, required: true },
        { name: 'every_unit', label: '… keer per', type: 'select', options: UNIT_OPTS, value: UNIT_TO_OPT[t.every_unit || 'maand'] },
        { name: 'next_due', label: t.id ? 'Volgende keer aan de beurt' : 'Eerste keer aan de beurt', type: 'date', value: t.next_due || today(), required: true },
        ...(ms.length ? [{ name: 'who', label: 'Wie doet het?', type: 'select', options: [...ms.map(m => m.name), SAMEN], value: cur }] : []),
        { name: 'note', label: 'Notitie (optioneel)', value: t.note }
      ],
      onSave: async v => {
        const n = parseInt(v.every_n, 10);
        if (!v.title || !(n > 0) || !v.next_due) { toast('Vul een naam, een aantal en een datum in'); return false; }
        const rowData = { title: v.title, every_n: n, every_unit: UNIT_FROM_OPT[v.every_unit] || 'maand', next_due: v.next_due, note: v.note };
        if (ms.length) rowData.assignee = (ms.find(m => m.name === v.who) || {}).owner || null;
        const ok = await run(t.id ? sb.from('tasks').update(rowData).eq('id', t.id) : sb.from('tasks').insert(rowData), t.id ? 'Opgeslagen' : 'Taak toegevoegd');
        if (ok) { await ctx.load('tasks'); render(); ctx.onChange(); }
        return ok;
      },
      onDelete: t.id ? async () => { await run(sb.from('tasks').delete().eq('id', t.id), 'Taak verwijderd'); await ctx.load('tasks'); render(); ctx.onChange(); } : null
    });
  }

  root.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    if (el.dataset.act === 'who') { filter = el.dataset.who; localStorage.setItem(FILTER_KEY, filter); render(); return; }
    if (el.dataset.act === 'names') { editNames(); return; }
    if (el.dataset.act === 'new') { if (ctx.isMissing()) { toast('De database is nog niet klaar voor taken'); return; } edit(); return; }
    const t = ctx.getTasks().find(x => x.id === el.closest('.task')?.dataset.id); if (!t) return;
    if (el.dataset.act === 'tick') tick(t);
    if (el.dataset.act === 'edit') edit(t);
  });

  return { render };
}
