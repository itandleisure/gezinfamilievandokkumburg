// Tegel Dagvragen (onder Meer): elke dag 3 verdiepende vragen uit 3 verschillende thema's, om meer bij je gevoel te komen.
// Geen antwoordveld en geen opslag van antwoorden: je beantwoordt ze zelf, buiten de app.
// De vragen staan in dagvragen.json. De melding (standaard 21:00) stuurt gezond-push, met dezelfde keuze van vragen (`pick()`).
// Instelling per persoon in `dagvraag_prefs` (push aan/uit, uur), alleen van jezelf (RLS).
const TZ = 'Europe/Madrid';
export const HOURS = [7, 8, 12, 18, 19, 20, 21, 22];

export function today() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

// Zelfde rekenwijze als in supabase/functions/gezond-push/index.ts (pickDagvragen). Pas je dit aan, doe het daar ook.
// Dag n krijgt de thema's n, n+1 en n+3 (mod 6): elk thema komt 3 keer per 6 dagen voorbij.
// Per thema schuift de vraag één plek op bij elke keer dat het thema aan de beurt is; `extra` = "Andere vragen".
export function pick(themas, day, extra = 0) {
  const T = themas.length, n = Math.round(Date.parse(day + 'T12:00:00Z') / 864e5);
  const set = m => [((m % T) + T) % T, (((m + 1) % T) + T) % T, (((m + 3) % T) + T) % T];
  const ids = set(n).sort((a, b) => a - b);
  return ids.map(t => {
    const start = n - (((n % 6) + 6) % 6);
    let occ = 3 * Math.floor(n / 6);
    for (let m = start; m < n; m++) if (set(m).includes(t)) occ++;
    const qs = themas[t].vragen;
    return { thema: themas[t].naam, vraag: qs[(((occ + extra * 7) % qs.length) + qs.length) % qs.length] };
  });
}

let cache = null;
async function themas() {
  if (cache) return cache;
  const r = await fetch('dagvragen.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error(r.status);
  cache = (await r.json()).themas;
  return cache;
}

// ctx: { root, sb, esc, run, toast, getPrefs, isMissing, load, userId }
export function mountDagvragen(ctx) {
  const { root, esc, sb, run } = ctx;
  let data = null, failed = false;
  themas().then(t => { data = t; render(); }).catch(() => { failed = true; render(); });
  const extraKey = () => 'dagvragen-extra-' + today();
  const getExtra = () => Number(localStorage.getItem(extraKey()) || 0);

  function render() {
    if (failed) { root.innerHTML = '<p class="empty">De vragen konden niet worden geladen. Probeer het zo nog eens.</p>'; return; }
    if (!data) { root.innerHTML = '<p class="empty">Even laden…</p>'; return; }
    const extra = getExtra(), qs = pick(data, today(), extra), p = ctx.getPrefs();
    const on = !!p?.push, hour = p?.at_hour ?? 21;
    root.innerHTML = `<p class="mut dv-intro">Neem even de tijd. Lees een vraag, sluit je ogen en kijk wat er als eerste opkomt, nog voordat je gaat nadenken.</p>
      <div class="dv-list">${qs.map((q, i) => `<div class="card dv-q"><small>${i + 1} · ${esc(q.thema)}</small><p>${esc(q.vraag)}</p></div>`).join('')}</div>
      <button class="btn wide" data-act="other">Andere vragen</button>
      ${extra ? '<button class="btn link dv-back" data-act="back">Terug naar de vragen van vandaag</button>' : ''}
      ${ctx.isMissing() ? '<p class="mut dv-set">De melding kan aan zodra de database klaar is.</p>' : `<div class="card dv-set">
        <label class="dv-row"><span><b>Melding elke dag</b><small>Met de 3 vragen erin. Alleen op je eigen telefoon.</small></span>
          <input type="checkbox" class="dv-switch" data-act="push" ${on ? 'checked' : ''} aria-label="Melding elke dag"></label>
        <label class="dv-row"><span><b>Hoe laat?</b><small>Spaanse tijd</small></span>
          <select data-act="hour" ${on ? '' : 'disabled'}>${HOURS.map(h => `<option value="${h}" ${h === hour ? 'selected' : ''}>${String(h).padStart(2, '0')}:00</option>`).join('')}</select></label>
      </div>`}`;
  }

  async function save(change) {
    const p = ctx.getPrefs() || {};
    const row = { owner: ctx.userId(), push: p.push ?? false, at_hour: p.at_hour ?? 21, ...change, updated_at: new Date().toISOString() };
    const ok = await run(sb.from('dagvraag_prefs').upsert(row), row.push ? `Melding staat aan om ${String(row.at_hour).padStart(2, '0')}:00` : 'Melding staat uit');
    await ctx.load('dagvraag_prefs'); render();
    return ok;
  }

  root.addEventListener('click', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    if (el.dataset.act === 'other') { localStorage.setItem(extraKey(), String(getExtra() + 1)); render(); window.scrollTo(0, 0); }
    if (el.dataset.act === 'back') { localStorage.removeItem(extraKey()); render(); }
  });
  root.addEventListener('change', e => {
    const el = e.target.closest('[data-act]'); if (!el) return;
    if (el.dataset.act === 'push') save({ push: el.checked });
    if (el.dataset.act === 'hour') save({ at_hour: Number(el.value) });
  });

  return { render };
}
