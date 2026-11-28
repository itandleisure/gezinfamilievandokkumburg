// Tegel Weer (onder Meer): het weer in Cómpeta uit meerdere bronnen naast elkaar, plus het gemiddelde en hoe ver de bronnen uiteen liggen.
// Alle bronnen zijn gratis en zonder sleutel, dus er staat niets geheims in de code:
//  - Open-Meteo, één aanvraag per weermodel (ECMWF, ICON, GFS, Météo-France/AROME, UK Met Office en de "mix"), zodat een model dat
//    uitvalt de rest niet meesleept;
//  - MET Norway (de bron achter Yr), via locationforecast/complete, omgerekend naar dagwaarden.
// Knop "Mijn locatie": haalt na toestemming het weer op waar je nu bent (navigator.geolocation, alleen terwijl de app open is);
// de plaatsnaam komt van de gratis reverse-geocoding van BigDataCloud (zonder sleutel).
// Zoekveld: elke plaats intypen, via de gratis geocoding van Open-Meteo (`searchPlaces()`). Bij elke start staat de app weer op Cómpeta.
// Een hint voor wandelen in de bergen (Cómpeta) en hardlopen op het strand (Torrox Costa) staat bij vandaag en morgen.
// Alles wordt 30 minuten bewaard in localStorage, zodat de app niet bij elke tik opnieuw ophaalt.
const TZ = 'Europe/Madrid';
export const HOME = { naam: 'Cómpeta', lat: 36.8333, lon: -3.9726, home: true };
const BEACH = { naam: 'Torrox Costa', lat: 36.7286, lon: -3.9538 };
const CACHE_KEY = 'weer-cache-v1', CACHE_MIN = 30, DAYS = 7;

// Nieuwe bron? Achteraan toevoegen. `model` = Open-Meteo-model; leeg = de standaardmix van Open-Meteo.
export const MODELS = [
  { id: 'ecmwf', naam: 'ECMWF', uit: 'Europees weercentrum', model: 'ecmwf_ifs025' },
  { id: 'icon', naam: 'ICON', uit: 'Duitse weerdienst (DWD)', model: 'icon_seamless' },
  { id: 'gfs', naam: 'GFS', uit: 'Amerikaanse weerdienst (NOAA)', model: 'gfs_seamless' },
  { id: 'arome', naam: 'Météo-France', uit: 'AROME/ARPEGE, Frankrijk', model: 'meteofrance_seamless' },
  { id: 'ukmo', naam: 'UK Met Office', uit: 'Britse weerdienst', model: 'ukmo_seamless' },
  { id: 'mix', naam: 'Open-Meteo', uit: 'Beste mix van modellen', model: '' },
];
const MET = { id: 'met', naam: 'MET Norway', uit: 'Noorse weerdienst (Yr)' };

const DAILY = 'weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,precipitation_probability_max,snowfall_sum,wind_speed_10m_max,wind_gusts_10m_max';
const CURRENT = 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_gusts_10m,snowfall';

// ---------- Weercodes (WMO) ----------
export function codeInfo(c) {
  if (c == null) return ['·', 'Onbekend'];
  if (c === 0) return ['☀️', 'Zonnig'];
  if (c === 1) return ['🌤️', 'Overwegend zonnig'];
  if (c === 2) return ['⛅', 'Half bewolkt'];
  if (c === 3) return ['☁️', 'Bewolkt'];
  if (c === 45 || c === 48) return ['🌫️', 'Mist'];
  if (c >= 51 && c <= 57) return ['🌦️', 'Motregen'];
  if (c === 61 || c === 63) return ['🌧️', 'Regen'];
  if (c === 65) return ['🌧️', 'Zware regen'];
  if (c === 66 || c === 67) return ['🧊', 'IJzel'];
  if (c >= 71 && c <= 77) return ['🌨️', 'Sneeuw'];
  if (c >= 80 && c <= 82) return ['🌦️', 'Buien'];
  if (c === 85 || c === 86) return ['🌨️', 'Sneeuwbuien'];
  if (c >= 95) return ['⛈️', 'Onweer'];
  return ['☁️', 'Bewolkt'];
}
// MET Norway gebruikt woorden ("lightrainshowers_day"); omzetten naar een WMO-code
export function symbolToCode(s) {
  if (!s) return null;
  s = s.replace(/_(day|night|polartwilight)$/, '');
  if (s.includes('thunder')) return 95;
  if (s.includes('snow')) return s.includes('showers') ? 85 : s.startsWith('heavy') ? 75 : s.startsWith('light') ? 71 : 73;
  if (s.includes('sleet')) return 66;
  if (s.includes('rain')) return s.includes('showers') ? (s.startsWith('heavy') ? 82 : 80) : s.startsWith('heavy') ? 65 : s.startsWith('light') ? 61 : 63;
  return { clearsky: 0, fair: 1, partlycloudy: 2, cloudy: 3, fog: 45 }[s] ?? 3;
}

// ---------- Rekenhulp ----------
const nums = a => a.filter(v => typeof v === 'number' && isFinite(v));
export function stats(a) {
  const v = nums(a);
  if (!v.length) return null;
  return { avg: v.reduce((s, x) => s + x, 0) / v.length, min: Math.min(...v), max: Math.max(...v), n: v.length };
}
// Gevoelstemperatuur (Steadman, dezelfde formule als Open-Meteo), voor MET Norway dat die zelf niet geeft
export function apparent(t, rh, windMs) {
  if (t == null || rh == null || windMs == null) return null;
  const e = rh / 100 * 6.105 * Math.exp(17.27 * t / (237.7 + t));
  return t + 0.33 * e - 0.70 * windMs - 4.0;
}
const localParts = d => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' }).formatToParts(d).map(x => [x.type, x.value]));
const localDay = d => { const p = localParts(d); return `${p.year}-${p.month}-${p.day}`; };
export const today = () => localDay(new Date());
// Meest voorkomende weercode; bij gelijkspel de zwaarste (hogere code)
function modeCode(codes) {
  const v = codes.filter(c => c != null), n = {};
  if (!v.length) return null;
  for (const c of v) n[c] = (n[c] || 0) + 1;
  return Number(Object.keys(n).sort((a, b) => n[b] - n[a] || b - a)[0]);
}

// ---------- Ophalen ----------
function omUrl(p, model, withCurrent = true) {
  const q = new URLSearchParams({ latitude: p.lat, longitude: p.lon, daily: DAILY, timezone: TZ, forecast_days: DAYS, wind_speed_unit: 'kmh' });
  if (withCurrent) q.set('current', CURRENT);
  if (model) q.set('models', model);
  return 'https://api.open-meteo.com/v1/forecast?' + q;
}
async function getJson(url, ms = 12000) {
  const ac = new AbortController(), t = setTimeout(() => ac.abort(), ms);
  try {
    const r = await fetch(url, { signal: ac.signal });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

// Open-Meteo-antwoord omzetten naar { now, days: { 'YYYY-MM-DD': {...} } }
export function parseOpenMeteo(j) {
  const c = j.current || {}, d = j.daily || {}, days = {};
  (d.time || []).forEach((t, i) => {
    const day = {
      code: d.weather_code?.[i] ?? null, tmax: d.temperature_2m_max?.[i] ?? null, tmin: d.temperature_2m_min?.[i] ?? null,
      fmax: d.apparent_temperature_max?.[i] ?? null, fmin: d.apparent_temperature_min?.[i] ?? null,
      mm: d.precipitation_sum?.[i] ?? null, prob: d.precipitation_probability_max?.[i] ?? null, snow: d.snowfall_sum?.[i] ?? null,
      wind: d.wind_speed_10m_max?.[i] ?? null, gust: d.wind_gusts_10m_max?.[i] ?? null,
    };
    if (day.tmax != null || day.mm != null) days[t] = day;
  });
  const now = c.temperature_2m == null ? null : {
    temp: c.temperature_2m, feel: c.apparent_temperature ?? null, mm: c.precipitation ?? null, code: c.weather_code ?? null,
    wind: c.wind_speed_10m ?? null, gust: c.wind_gusts_10m ?? null, snow: c.snowfall ?? null,
  };
  return { now, days };
}

// MET Norway (locationforecast/complete) omzetten naar hetzelfde formaat
export function parseMet(j, nowDate = new Date()) {
  const ts = j?.properties?.timeseries || [];
  const days = {};
  let now = null;
  for (let i = 0; i < ts.length; i++) {
    const e = ts[i], t = new Date(e.time), inst = e.data?.instant?.details || {}, n1 = e.data?.next_1_hours, n6 = e.data?.next_6_hours;
    const key = localDay(t), d = days[key] ??= { temps: [], feels: [], mm: 0, mmN: 0, probs: [], winds: [], gusts: [], snow: 0, codes: [], noon: null };
    const T = inst.air_temperature, ws = inst.wind_speed, feel = apparent(T, inst.relative_humidity, ws);
    if (T != null) d.temps.push(T);
    if (feel != null) d.feels.push(feel);
    if (ws != null) d.winds.push(ws * 3.6);
    if (inst.wind_speed_of_gust != null) d.gusts.push(inst.wind_speed_of_gust * 3.6);
    // Neerslag: per uur zolang er uurwaarden zijn, daarna per blok van 6 uur (de tijdreeks loopt dan ook in stappen van 6 uur)
    const step = ts[i + 1] ? (new Date(ts[i + 1].time) - t) / 36e5 : 1;
    const blk = n1 && step < 6 ? n1 : n6 && step >= 6 ? n6 : null;
    if (blk?.details?.precipitation_amount != null) {
      d.mm += blk.details.precipitation_amount; d.mmN++;
      if (T != null && T <= 1) d.snow += blk.details.precipitation_amount; // in mm water, grof; ruwweg 1 mm = 1 cm sneeuw
    }
    for (const b of [n1, n6]) if (b?.details?.probability_of_precipitation != null) d.probs.push(b.details.probability_of_precipitation);
    const sym = (n1 || n6)?.summary?.symbol_code;
    if (sym) d.codes.push(symbolToCode(sym));
    const h = Number(localParts(t).hour);
    if (n6?.summary?.symbol_code && h >= 10 && h <= 14 && d.noon == null) d.noon = symbolToCode(n6.summary.symbol_code);
    if (!now && t.getTime() + 36e5 > nowDate.getTime() && T != null) {
      now = { temp: T, feel, mm: n1?.details?.precipitation_amount ?? null, code: symbolToCode((n1 || n6)?.summary?.symbol_code), wind: ws != null ? ws * 3.6 : null, gust: inst.wind_speed_of_gust != null ? inst.wind_speed_of_gust * 3.6 : null, snow: null };
    }
  }
  const out = {};
  for (const [k, d] of Object.entries(days)) {
    if (d.temps.length < 2) continue; // halve dag aan het eind van de reeks overslaan
    const sev = d.codes.length ? Math.max(...d.codes) : null; // zoals Open-Meteo: de zwaarste code van de dag
    out[k] = {
      code: sev ?? d.noon, tmax: Math.max(...d.temps), tmin: Math.min(...d.temps),
      fmax: d.feels.length ? Math.max(...d.feels) : null, fmin: d.feels.length ? Math.min(...d.feels) : null,
      mm: d.mmN ? Math.round(d.mm * 10) / 10 : null, prob: d.probs.length ? Math.max(...d.probs) : null,
      snow: d.snow ? Math.round(d.snow * 10) / 10 : 0, wind: d.winds.length ? Math.max(...d.winds) : null, gust: d.gusts.length ? Math.max(...d.gusts) : null,
    };
  }
  return { now, days: out };
}

export async function fetchAll(place = HOME) {
  const jobs = [
    ...MODELS.map(m => getJson(omUrl(place, m.model)).then(parseOpenMeteo)),
    getJson(`https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${place.lat.toFixed(4)}&lon=${place.lon.toFixed(4)}`).then(j => parseMet(j)),
    place.home ? getJson(omUrl(BEACH, '', false)).then(parseOpenMeteo) : Promise.reject(new Error('geen strand')),
  ];
  const res = await Promise.allSettled(jobs);
  const sources = [...MODELS, MET].map((s, i) => ({ id: s.id, naam: s.naam, uit: s.uit, ok: res[i].status === 'fulfilled' && (res[i].value.now || Object.keys(res[i].value.days).length > 0), ...(res[i].status === 'fulfilled' ? res[i].value : { now: null, days: {} }) }));
  const beach = res.at(-1).status === 'fulfilled' ? res.at(-1).value.days : {};
  return { at: Date.now(), sources, beach };
}

// ---------- Samenvatten over de bronnen ----------
const RAIN_MM = 0.5; // vanaf zoveel mm per dag telt een bron als "regen"
export function combineDay(sources, key) {
  const rows = sources.filter(s => s.ok && s.days[key]).map(s => ({ s, d: s.days[key] }));
  if (!rows.length) return null;
  const pick = f => rows.map(r => r.d[f]);
  const mmRows = rows.filter(r => r.d.mm != null);
  return {
    key, n: rows.length, rows,
    code: modeCode(pick('code')), tmax: stats(pick('tmax')), tmin: stats(pick('tmin')), fmax: stats(pick('fmax')), fmin: stats(pick('fmin')),
    mm: stats(pick('mm')), prob: stats(pick('prob')), snow: stats(pick('snow')), wind: stats(pick('wind')), gust: stats(pick('gust')),
    wet: mmRows.filter(r => r.d.mm >= RAIN_MM).length, wetN: mmRows.length,
  };
}
export function combineNow(sources) {
  const rows = sources.filter(s => s.ok && s.now).map(s => ({ s, d: s.now }));
  if (!rows.length) return null;
  const pick = f => rows.map(r => r.d[f]);
  return { n: rows.length, rows, code: modeCode(pick('code')), temp: stats(pick('temp')), feel: stats(pick('feel')), mm: stats(pick('mm')), wind: stats(pick('wind')), gust: stats(pick('gust')), snow: stats(pick('snow')) };
}

// Hoe eens zijn de bronnen het over de temperatuur?
export function agree(st, small = 2, mid = 4) {
  if (!st || st.n < 2) return null;
  const w = st.max - st.min;
  return w <= small ? ['eens', 'De bronnen zijn het eens'] : w <= mid ? ['redelijk', 'Kleine verschillen tussen de bronnen'] : ['oneens', 'De bronnen lopen flink uiteen'];
}

// ---------- Hints: wandelen in de bergen, hardlopen op het strand ----------
export function hints(day, beach, home = true) {
  const out = [];
  if (day) {
    const t = day.tmax?.avg, wind = day.wind?.avg ?? 0, gust = day.gust?.avg ?? 0, snow = day.snow?.max ?? 0, wetShare = day.wetN ? day.wet / day.wetN : 0;
    let why = null;
    if (snow > 0.2) why = 'kans op sneeuw in de bergen';
    else if (wetShare > 0.5) why = 'de meeste bronnen geven regen';
    else if (gust >= 55 || wind >= 35) why = home ? 'harde wind op de bergkam' : 'harde wind';
    else if (t != null && t >= 30) why = 'te warm, ga hooguit heel vroeg';
    else if (t != null && t < 6) why = 'koud, kleed je goed aan';
    const ok = !why || why.startsWith('koud');
    out.push({ ok, wat: home ? 'Wandelen in de bergen' : 'Wandelen', why: why || (wetShare > 0 ? 'meestal droog, neem een regenjas mee' : 'droog en rustig weer') });
  }
  if (beach) {
    const t = beach.tmax, wind = beach.wind ?? 0, prob = beach.prob ?? 0, mm = beach.mm ?? 0;
    let why = null, ok = true;
    if (mm >= 2 || prob >= 60) { why = 'regen verwacht'; ok = false; }
    else if (wind >= 30) { why = 'veel wind aan de kust'; ok = false; }
    else if (t != null && t >= 27) why = 'warm, loop vroeg in de ochtend of na zonsondergang';
    out.push({ ok, wat: 'Hardlopen op het strand (Torrox Costa)', why: why || (t != null ? `rond ${Math.round(t)}° en weinig wind` : 'weinig wind') });
  }
  return out;
}

// ---------- Tekenen ----------
const r0 = v => v == null ? '–' : Math.round(v);
const range = (st, unit = '') => !st ? '–' : Math.round(st.min) === Math.round(st.max) ? `${Math.round(st.min)}${unit}` : `${Math.round(st.min)}–${Math.round(st.max)}${unit}`;
const mm1 = v => v == null ? '–' : v < 0.1 ? '0' : v < 10 ? v.toFixed(1).replace('.', ',') : Math.round(v);
function dayName(key, i) {
  if (i === 0) return 'Vandaag';
  if (i === 1) return 'Morgen';
  const d = new Date(key + 'T12:00:00Z');
  const s = d.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
// Plaatsnaam bij een locatie (gratis, zonder sleutel); lukt het niet, dan gewoon "Jouw locatie"
async function placeName(lat, lon) {
  try {
    const j = await getJson(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=nl`, 6000);
    return j.city || j.locality || j.principalSubdivision || 'Jouw locatie';
  } catch { return 'Jouw locatie'; }
}
export async function searchPlaces(q) {
  const j = await getJson('https://geocoding-api.open-meteo.com/v1/search?' + new URLSearchParams({ name: q, count: 6, language: 'nl', format: 'json' }), 8000);
  return (j.results || []).map(r => ({ naam: r.name, waar: [r.admin1, r.country].filter(Boolean).join(', '), lat: r.latitude, lon: r.longitude, home: false }));
}
function locate() {
  return new Promise((ok, no) => {
    if (!navigator.geolocation) return no(new Error('geen'));
    navigator.geolocation.getCurrentPosition(p => ok(p.coords), no, { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 6e4 });
  });
}
function loadCache() { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch { return null; } }
function saveCache(d) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch {} }

// ctx: { root, esc, onSummary(text) } — onSummary zet een kort zinnetje op de tegel onder Meer
export function mountWeer(ctx) {
  const { root, esc } = ctx;
  // homeData = Cómpeta (bewaard in localStorage), hereData = waar je nu bent (alleen in het geheugen)
  let homeData = loadCache(), hereData = null, place = HOME, busy = false, failed = false, open = null, locMsg = '', locating = false, found = null, query = '';
  const cur = () => place.home ? homeData : hereData;

  async function refresh(force = false) {
    if (busy) return;
    const data = cur();
    if (!force && data && Date.now() - data.at < CACHE_MIN * 6e4) { summary(); return; }
    busy = true; render();
    const p = place;
    try {
      const d = await fetchAll(p);
      if (d.sources.some(s => s.ok)) { if (p.home) { homeData = d; saveCache(d); } else hereData = d; failed = false; } else failed = true;
    } catch { failed = true; }
    busy = false; summary(); render();
  }
  async function useLocation() {
    if (busy) return;
    busy = true; locating = true; locMsg = ''; render();
    try {
      const c = await locate();
      const lat = Math.round(c.latitude * 1e4) / 1e4, lon = Math.round(c.longitude * 1e4) / 1e4;
      place = { naam: await placeName(lat, lon), lat, lon, home: false };
      hereData = null; open = null;
    } catch (e) {
      locMsg = e && e.code === 1
        ? 'De app mag je locatie niet zien. Zet het aan op de iPhone via Instellingen > Privacy en beveiliging > Locatievoorzieningen > Safari-websites > "Bij gebruik van app", en probeer het opnieuw.'
        : 'Je locatie kon niet worden bepaald. Probeer het zo nog eens, liefst buiten of met wifi aan.';
      busy = false; locating = false; render(); return;
    }
    busy = false; locating = false; refresh(true);
  }
  async function search(q) {
    query = q.trim();
    if (query.length < 2) return;
    found = 'busy'; locMsg = ''; render();
    try { found = await searchPlaces(query); } catch { found = 'fout'; }
    render();
  }
  function choose(i) {
    const r = Array.isArray(found) && found[i];
    if (!r) return;
    place = r; hereData = null; open = null; found = null; locMsg = '';
    refresh(true);
  }
  function goHome() { place = HOME; locMsg = ''; open = null; render(); refresh(); }
  function summary() {
    const data = homeData; // de tegel toont altijd Cómpeta
    const now = data && combineNow(data.sources), d0 = data && combineDay(data.sources, today());
    if (!now && !d0) return;
    ctx.onSummary?.(`Nu ${r0(now?.temp?.avg)}° · regen ${d0?.prob ? range(d0.prob, '%') : `bij ${d0?.wet ?? 0} van ${d0?.wetN ?? 0}`}`);
  }

  function sourceTable(rows, kind) {
    const head = kind === 'now' ? '<th>Bron</th><th>Temp</th><th>Voelt</th><th>Wind</th><th>Regen</th>' : '<th>Bron</th><th>Max/min</th><th>Voelt</th><th>Regenkans</th><th>mm</th><th>Wind</th>';
    const body = rows.map(({ s, d }) => kind === 'now'
      ? `<tr><td><b>${codeInfo(d.code)[0]} ${esc(s.naam)}</b></td><td>${r0(d.temp)}°</td><td>${r0(d.feel)}°</td><td>${r0(d.wind)}</td><td>${mm1(d.mm)}</td></tr>`
      : `<tr><td><b>${codeInfo(d.code)[0]} ${esc(s.naam)}</b></td><td>${r0(d.tmax)}°/${r0(d.tmin)}°</td><td>${r0(d.fmax)}°</td><td>${d.prob == null ? '<span class="mut">–</span>' : r0(d.prob) + '%'}</td><td>${mm1(d.mm)}${d.snow > 0.1 ? ` <span class="wx-snow">❄ ${mm1(d.snow)}</span>` : ''}</td><td>${r0(d.wind)}</td></tr>`).join('');
    return `<div class="wx-tablewrap"><table class="wx-table"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
  }

  function nowCard(now, d0) {
    const [ic, txt] = codeInfo(now.code), ag = agree(now.temp);
    const snow = (now.snow?.max ?? 0) > 0 || (d0?.snow?.max ?? 0) > 0.1;
    return `<div class="card wx-now">
      <div class="wx-now-top"><span class="wx-big-ic" aria-hidden="true">${ic}</span>
        <div><div class="wx-big">${r0(now.temp.avg)}°</div><div class="wx-txt">${esc(txt)} in ${esc(place.naam)}</div></div></div>
      <div class="wx-facts">
        <div><small>Voelt als</small><b>${r0(now.feel?.avg)}°</b><i>${range(now.feel, '°')}</i></div>
        <div><small>Bronnen</small><b>${range(now.temp, '°')}</b><i class="wx-ag ${ag ? ag[0] : ''}">${ag ? esc(ag[0]) : ''}</i></div>
        <div><small>Wind</small><b>${r0(now.wind?.avg)} km/u</b><i>${now.gust ? 'stoten ' + r0(now.gust.avg) : ''}</i></div>
        ${d0 ? `<div><small>Regenkans vandaag</small><b>${d0.prob ? range(d0.prob, '%') : '–'}</b><i>regen bij ${d0.wet} van ${d0.wetN} bronnen</i></div>` : ''}
      </div>
      ${snow ? `<p class="wx-alert">❄ Sneeuw mogelijk${d0?.snow?.max ? `: tot ${mm1(d0.snow.max)} cm volgens ${d0.rows.filter(r => r.d.snow > 0.1).length} bron(nen)` : ''}</p>` : ''}
      <details class="wx-more"><summary>Per bron, nu</summary>${sourceTable(now.rows, 'now')}</details>
    </div>`;
  }

  function hintBlock(day, beach, label) {
    const hs = hints(day, beach, place.home);
    if (!hs.length) return '';
    return `<div class="wx-hints"><small>${esc(label)}</small>${hs.map(h => `<div class="wx-hint ${h.ok ? 'ok' : 'no'}"><b>${h.ok ? '✓' : '✗'} ${esc(h.wat)}</b><span>${esc(h.why)}</span></div>`).join('')}</div>`;
  }

  function dayCard(d, i) {
    const [ic, txt] = codeInfo(d.code), ag = agree(d.tmax);
    const isOpen = open === d.key;
    const snow = (d.snow?.max ?? 0) > 0.1;
    return `<div class="card wx-day ${isOpen ? 'open' : ''}">
      <button class="wx-day-head" data-day="${d.key}" aria-expanded="${isOpen}">
        <span class="wx-ic" aria-hidden="true">${ic}</span>
        <span class="wx-day-name"><b>${esc(dayName(d.key, i))}</b><small>${esc(txt)}${snow ? ' · ❄ sneeuw' : ''}</small></span>
        <span class="wx-t"><b>${r0(d.tmax?.avg)}°</b><small>${r0(d.tmin?.avg)}°</small></span>
      </button>
      <div class="wx-row">
        <span><small>Max bronnen</small>${range(d.tmax, '°')} <i class="wx-ag ${ag ? ag[0] : ''}">${ag ? esc(ag[0]) : ''}</i></span>
        <span><small>Voelt als</small>${range(d.fmax, '°')}</span>
        <span><small>Regenkans</small>${d.prob ? range(d.prob, '%') : '–'}</span>
        <span><small>Regen</small>${d.wet}/${d.wetN} bronnen${d.mm && d.mm.max >= 0.1 ? ` · ${mm1(d.mm.min)}–${mm1(d.mm.max)} mm` : ''}</span>
        <span><small>Wind</small>${range(d.wind, '')} km/u</span>
      </div>
      ${isOpen ? sourceTable(d.rows, 'day') : ''}
    </div>`;
  }

  function placeBar() {
    return `<div class="wx-place" role="group" aria-label="Plaats">
      <button class="chip" data-act="home" aria-pressed="${place.home}">🏠 Cómpeta</button>
      <button class="chip" data-act="here" aria-pressed="${!place.home}">📍 ${locating ? 'Locatie zoeken…' : place.home ? 'Mijn locatie' : esc(place.naam)}</button>
    </div>
    <form class="wx-search" role="search">
      <input type="search" name="q" placeholder="Zoek een plaats, bijv. Nerja" value="${esc(query)}" autocomplete="off" enterkeyhint="search" aria-label="Zoek een plaats">
      <button class="btn" type="submit">Zoek</button>
    </form>
    ${found === 'busy' ? '<p class="mut wx-found">Zoeken…</p>' : found === 'fout' ? '<p class="wx-locmsg">Zoeken lukte niet. Probeer het zo nog eens.</p>'
      : Array.isArray(found) ? (found.length ? `<div class="wx-found">${found.map((r, i) => `<button class="btn" data-pick="${i}"><b>${esc(r.naam)}</b><small>${esc(r.waar)}</small></button>`).join('')}<button class="btn link" data-act="closefound">Sluiten</button></div>`
      : `<p class="mut wx-found">Geen plaats gevonden met "${esc(query)}".</p>`) : ''}
    ${locMsg ? `<p class="wx-locmsg">${esc(locMsg)}</p>` : ''}`;
  }

  function render() {
    const data = cur();
    if (!data) {
      root.innerHTML = placeBar() + (failed ? '<p class="empty">Het weer kon niet worden opgehaald. Controleer je internet en probeer het opnieuw.</p><button class="btn wide" data-act="refresh">Opnieuw proberen</button>' : `<p class="empty">Het weer wordt opgehaald uit meerdere bronnen…</p>`);
      return;
    }
    const now = combineNow(data.sources);
    const keys = [...new Set(data.sources.flatMap(s => Object.keys(s.days)))].filter(k => k >= today()).sort().slice(0, DAYS);
    const days = keys.map(k => combineDay(data.sources, k)).filter(Boolean);
    const ok = data.sources.filter(s => s.ok), missing = data.sources.filter(s => !s.ok);
    const at = new Date(data.at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit', timeZone: TZ });
    root.innerHTML = `${placeBar()}
      ${now ? nowCard(now, days[0]?.key === today() ? days[0] : null) : ''}
      ${days[0] ? hintBlock(days[0], data.beach?.[days[0].key], 'Vandaag goed om…') : ''}
      ${days[1] ? hintBlock(days[1], data.beach?.[days[1].key], 'Morgen goed om…') : ''}
      <h2 class="wx-h">De komende dagen</h2>
      <p class="mut wx-tip">Tik op een dag om alle bronnen naast elkaar te zien. De grote getallen zijn het gemiddelde.</p>
      <div class="wx-days">${days.map(dayCard).join('')}</div>
      <p class="mut wx-foot">${ok.length} bronnen: ${ok.map(s => esc(s.naam)).join(', ')}.${missing.length ? ` Niet bereikbaar: ${missing.map(s => esc(s.naam)).join(', ')}.` : ''} Bijgewerkt om ${at}. Weerdata van Open-Meteo.com (CC BY 4.0) en MET Norway.</p>
      <button class="btn wide" data-act="refresh" ${busy ? 'disabled' : ''}>${busy ? 'Bezig met ophalen…' : 'Ververs het weer'}</button>`;
  }

  root.addEventListener('click', e => {
    const b = e.target.closest('[data-day],[data-pick],[data-act]');
    if (!b) return;
    if (b.dataset.act === 'refresh') refresh(true);
    else if (b.dataset.act === 'here') useLocation();
    else if (b.dataset.pick != null) choose(Number(b.dataset.pick));
    else if (b.dataset.act === 'closefound') { found = null; render(); }
    else if (b.dataset.act === 'home') { if (!place.home) goHome(); }
    else if (b.dataset.day) { open = open === b.dataset.day ? null : b.dataset.day; render(); }
  });

  root.addEventListener('submit', e => {
    if (!e.target.matches('.wx-search')) return;
    e.preventDefault();
    const q = e.target.q.value; e.target.q.blur(); search(q);
  });

  refresh();
  return { render: () => { render(); refresh(); } };
}
