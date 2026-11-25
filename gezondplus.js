// Extra hulpmiddelen op het tabblad Gezond: waterteller, snackkaart, trainingskaart en mijlpalen.
// (Het weekoverzicht op zondag is een pushmelding: zie supabase/functions/gezond-push.)
// Water en snacks staan per dag in health_day (alleen eigen gegevens); de laatst gevierde mijlpaal in health_settings.milestone_kg.

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const kgf = n => Number(n).toLocaleString('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf = n => Math.round(n).toLocaleString('nl-NL');

// ---------- Snackkaart ----------
// Nieuwe snacks achteraan toevoegen; de sleutel staat in de database
export const SNACKS = [
  { k: 'kwark', n: 'Kwark met muesli', p: '200 g magere kwark + 30 g muesli', kcal: 220, e: '🥣' },
  { k: 'appel', n: 'Appel', p: '1 middelgrote', kcal: 80, e: '🍎' },
  { k: 'mandarijn', n: 'Mandarijn', p: '1 stuk', kcal: 40, e: '🍊' },
  { k: 'sinaasappel', n: 'Sinaasappel', p: '1 stuk', kcal: 70, e: '🍊' },
  { k: 'ei', n: 'Gekookt ei', p: '1 ei', kcal: 75, e: '🥚' },
  { k: 'noten', n: 'Handje noten', p: '25 g, ongezouten', kcal: 160, e: '🥜' },
  { k: 'kaas', n: 'Boterham met kaas', p: '1 snee volkoren + 20 g kaas', kcal: 150, e: '🧀' },
  { k: 'serrano', n: 'Boterham serranoham', p: '1 snee volkoren + 2 plakjes', kcal: 125, e: '🥪' },
  { k: 'salami', n: 'Boterham salami', p: '1 snee volkoren + 4 plakjes', kcal: 165, e: '🥪' },
  { k: 'tomaat', n: 'Tomaatjes of komkommer', p: 'een bakje, zoveel je wilt', kcal: 20, e: '🍅' },
  { k: 'colazero', n: 'Cola Zero', p: 'optioneel, 1 blikje', kcal: 1, e: '🥤' }
];
const SNACK = Object.fromEntries(SNACKS.map(s => [s.k, s]));
export const snackKcal = obj => Object.entries(obj || {}).reduce((t, [k, n]) => t + (SNACK[k] ? SNACK[k].kcal * n : 0), 0);

// ---------- Trainingskaart ----------
// Korte sessies van ca. 15 minuten voor de dagen zonder padel. Kettlebell van 20 kg.
export const TRAININGS = [
  { k: 'kb-basis', n: 'Kettlebell basis', t: '15 min · 20 kg', e: '🏋️',
    warm: '2 min: armen zwaaien, 10 squats zonder gewicht, 10 heupkantelingen.',
    steps: ['5 rondes, rust 30 tot 45 sec na elke ronde:', '10× swing (kracht uit de heupen, rug recht)', '8× goblet squat (bel tegen je borst)', '6× row per arm (steun met je andere hand op een stoel)'],
    tip: 'Swing te zwaar? Begin met 3 rondes en bouw op.' },
  { k: 'lm-pump', n: 'LES MILLS+ kracht', t: '15–20 min · in de app', e: '📺',
    warm: 'De warming-up zit in de video.',
    steps: ['Open LES MILLS+ en filter op duur: 15–20 minuten.', 'Kies een korte BODYPUMP of CORE.', 'Gebruik de kettlebell of een lichte stang als gewicht.'],
    tip: 'Elke keer dezelfde workout is prima: zo merk je dat je sterker wordt.' },
  { k: 'kb-emom', n: 'Kettlebell EMOM', t: '15 min · 20 kg', e: '⏱️',
    warm: '2 min: 10 squats, 10 lunges, 5 langzame halo’s met de bel.',
    steps: ['Elke minuut start je een nieuwe oefening; de rest van de minuut is rust. 5 keer rond:', 'Minuut 1: 12× swing', 'Minuut 2: 8× goblet squat', 'Minuut 3: 10 push-ups (op je knieën mag)'],
    tip: 'Haal je het niet binnen de minuut? Doe dan 2 herhalingen minder.' },
  { k: 'lm-cardio', n: 'LES MILLS+ cardio', t: '15–20 min · in de app', e: '🥊',
    warm: 'De warming-up zit in de video.',
    steps: ['Kies een korte BODYCOMBAT of BODYATTACK van 15–20 minuten.', 'Houd een glas water klaar.'],
    tip: 'Liever naar buiten? 20 minuten stevig wandelen in de bergen telt ook.' },
  { k: 'kb-core', n: 'Buik en rug', t: '12 min · 20 kg', e: '🧘',
    warm: '1 min: losjes heupen draaien en rekken.',
    steps: ['3 rondes, rust 30 sec na elke ronde:', '30 sec plank', '10× kettlebell deadlift (rug recht, heupen naar achteren)', '8× dead bug per kant (op je rug, arm en been tegengesteld)', '20 sec zijplank per kant'],
    tip: 'Goed voor je rug na een dag kantoorwerk.' }
];
// Per weekdag (0 = maandag). Ma en wo is padel, zondag rustig.
const PLAN = [null, 'kb-basis', null, 'lm-pump', 'kb-emom', 'lm-cardio', 'kb-core'];
const TRAIN = Object.fromEntries(TRAININGS.map(t => [t.k, t]));

// ---------- Mijlpalen ----------
// Elke 2 kg vanaf het startgewicht, plus het doel zelf
export function milestones(startKg, goal) {
  const out = [];
  for (let m = Math.round((startKg - 2) * 10) / 10; m > goal + 0.4; m = Math.round((m - 2) * 10) / 10) out.push(m);
  out.push(goal);
  return out;
}
// Laagste mijlpaal die gehaald is met dit gewicht (of null)
export const reached = (list, kg) => list.filter(m => kg <= m + 1e-9).pop() ?? null;

// ---------- HTML ----------
export function extrasHtml({ day, today, dow, info, sport, settings, minKg, startKg, goal, openTrain }) {
  const water = info?.water ?? 0, wgoal = Number(settings?.water_goal ?? 8);
  const snacks = info?.snacks || {}, budget = Number(settings?.snack_kcal ?? 400), used = snackKcal(snacks), left = budget - used;
  const isToday = day === today, padel = dow === 0 || dow === 2;
  const wTxt = water >= wgoal ? `${water} glazen. Doel gehaald!` : `${water} van ${wgoal} glazen`;
  const glasses = Array.from({ length: Math.max(wgoal, water) }, (_, i) =>
    `<button class="gp-glass${i < water ? ' on' : ''}" data-water="${i < water && i === water - 1 ? i : i + 1}" aria-label="${i + 1} ${i ? 'glazen' : 'glas'}"><svg viewBox="0 0 24 32"><path class="gp-fill" d="M5 13h14l-1.6 15H6.6z"/><path class="gp-cup" d="M3 3h18l-2.5 26h-13z"/></svg></button>`).join('');

  // Training
  const todayT = PLAN[dow] ? TRAIN[PLAN[dow]] : null;
  const krachtOn = sport.includes('kracht');
  const card = (t, open) => `<details class="gp-tr"${open ? ' open' : ''} data-tr="${t.k}"><summary><span class="gp-e">${t.e}</span><b>${esc(t.n)}</b><small>${esc(t.t)}</small></summary>
    <p class="gp-warm"><b>Opwarmen:</b> ${esc(t.warm)}</p>
    <ul>${t.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ul>
    <p class="gp-tip mut">${esc(t.tip)}</p></details>`;
  const trainHead = padel && !todayT ? `<p class="gp-sub">${isToday ? 'Vandaag' : 'Deze dag'} is padel, dus geen extra training nodig. Wil je toch iets? Kies hieronder.</p>`
    : dow === 6 && !todayT ? '' : `<p class="gp-sub">${isToday ? 'Voor vandaag' : 'Voor deze dag'}:</p>`;
  const others = TRAININGS.filter(t => t !== todayT);

  // Mijlpalen
  const ms = milestones(startKg, goal), best = minKg != null ? reached(ms, minKg) : null;
  const next = ms.find(m => best == null || m < best);
  const msHtml = ms.map(m => {
    const ok = best != null && m >= best, isNext = m === next;
    return `<li class="gp-ms${ok ? ' ok' : ''}${isNext ? ' next' : ''}"><b>${kgf(m)}</b><small>${ok ? '✓ gehaald' : isNext && minKg != null ? 'nog ' + kgf(Math.max(0.1, minKg - m)) : m === goal ? 'doel' : '−' + nf(startKg - m) + ' kg'}</small></li>`;
  }).join('');

  return `
    <div class="card gp-card">
      <h3 class="gz-h3">💧 Water</h3>
      <div class="gp-water">${glasses}</div>
      <div class="gp-wrow"><span class="${water >= wgoal ? 'gz-ok-txt' : ''}">${wTxt}</span>
        <span><button class="btn gp-pm" data-wpm="-1" aria-label="Glas eraf"${water ? '' : ' disabled'}>−</button><button class="btn primary gp-pm" data-wpm="1" aria-label="Glas erbij">+</button></span></div>
      ${padel ? '<p class="gp-tip mut">Padeldag: drink na het spelen 2 glazen extra.</p>' : ''}
    </div>

    <div class="card gp-card">
      <h3 class="gz-h3">🍎 Snackkaart</h3>
      <div class="gp-budget"><span>Tussendoortjes ${isToday ? 'vandaag' : 'deze dag'}: <b>${nf(used)}</b> van ${nf(budget)} kcal</span>
        <b class="${left < 0 ? 'gp-over' : 'gz-ok-txt'}">${left < 0 ? nf(-left) + ' te veel' : 'nog ' + nf(left)}</b></div>
      <div class="meter" aria-hidden="true"><i style="width:${Math.min(100, used / budget * 100).toFixed(0)}%${left < 0 ? ';background:var(--terra)' : ''}"></i></div>
      <div class="gp-snacks">${SNACKS.map(s => {
        const n = snacks[s.k] || 0, fits = s.kcal <= left;
        return `<div class="gp-snack${n ? ' on' : ''}${!fits && !n ? ' nofit' : ''}">
          <button class="gp-sadd" data-snack="${s.k}" aria-label="${esc(s.n)} erbij"><span class="gp-e">${s.e}</span><b>${esc(s.n)}</b><small>${esc(s.p)}</small><span class="gp-kcal">${s.kcal} kcal${!fits && !n ? ' · past niet meer' : ''}</span>${n ? `<span class="gp-n">${n}×</span>` : ''}</button>
          ${n ? `<button class="gp-smin" data-snackmin="${s.k}" aria-label="${esc(s.n)} eraf">−</button>` : ''}</div>`;
      }).join('')}</div>
      <p class="gp-tip mut">Tik op een snack als je hem eet. Zo zie je meteen wat er nog past.</p>
    </div>

    <div class="card gp-card">
      <h3 class="gz-h3">🏋️ Trainingskaart</h3>
      ${trainHead}
      ${todayT ? card(todayT, openTrain !== false) : ''}
      ${todayT || padel ? `<button class="btn ${krachtOn ? 'done' : 'primary'} gp-did" data-did="1">${krachtOn ? 'Gedaan ✓' : 'Gedaan! Vink kracht af'}</button>` : '<p class="gp-sub">Zondag is rustdag. Een wandeling in de bergen of een rondje over het strand is genoeg.</p>'}
      <details class="gp-more"><summary>${todayT ? 'Andere sessies' : 'Alle sessies'}</summary>${others.map(t => card(t, false)).join('')}</details>
    </div>

    <div class="card gp-card">
      <h3 class="gz-h3">🎉 Mijlpalen</h3>
      <ol class="gp-mss">${msHtml}</ol>
      <p class="gp-tip mut">${best == null ? `Je eerste feestje is bij ${kgf(ms[0])} kg.` : best <= goal ? 'Doel gehaald. Wat een prestatie!' : `Volgende feestje bij ${kgf(next)} kg.`}</p>
    </div>`;
}

// ---------- Feestje ----------
export function celebrate(m, startKg, goal) {
  const done = m <= goal;
  const el = document.createElement('div');
  el.className = 'gp-party';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'Mijlpaal gehaald');
  const bits = Array.from({ length: 36 }, (_, i) => `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 9) * 0.12}s;background:${['#1d4e89', '#c4502b', '#2e7a48', '#f0a95e'][i % 4]}"></i>`).join('');
  el.innerHTML = `<div class="gp-conf">${bits}</div><div class="gp-pbox">
    <div class="gp-big">${done ? '🏆' : '🎉'}</div>
    <h2>${done ? 'Doel gehaald!' : '¡Enhorabuena!'}</h2>
    <p>${done ? `Je bent op ${kgf(goal)} kg. Ongelofelijk goed gedaan.` : `Onder de ${kgf(m)} kg. Dat is al ${nf(startKg - m)} kg eraf sinds je begon.`}</p>
    <button class="btn primary">¡Olé!</button></div>`;
  el.querySelector('button').onclick = () => el.remove();
  document.body.appendChild(el);
}
