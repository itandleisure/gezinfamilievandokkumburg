// Tegel Kettlebell (onder Meer, en vanuit de trainingskaart op Gezond): schema van ca. 15 minuten met één kettlebell van 20 kg.
// Per oefening een zelfgetekend plaatje (begin en eind), techniekpunten, en een trainingsmodus met timer per set.
// Opbouw per twee weken en de geschiedenis staan in localStorage op het toestel. Klaar = Kracht afgevinkt in sport_log.

// ---------- Poppetje ----------
// Zijaanzicht, kijkt naar rechts. Hoeken in graden.
// Benen en romp: s = scheenbeen (0 = recht omhoog, + = knie naar voren), t = bovenbeen (− = heup naar achteren), b = romp (+ = voorover).
// Armen en bel in wereldhoeken: 0 = recht omlaag, 90 = naar voren, 180 = recht omhoog, −90 = naar achteren. f = buiging elleboog.
// rot draait romp en benen (liggen); de armen blijven in wereldhoeken. leg2 = achterste been vanaf de heup: { a, b } wereldhoeken.
const L = { shin: 27, thigh: 29, torso: 38, neck: 5, head: 8, up: 19, fore: 18 };
const rad = d => d * Math.PI / 180;
const add = (p, len, ang) => ({ x: p.x + len * Math.sin(rad(ang)), y: p.y - len * Math.cos(rad(ang)) });   // ang vanaf omhoog
const addW = (p, len, ang) => ({ x: p.x + len * Math.sin(rad(ang)), y: p.y + len * Math.cos(rad(ang)) });  // ang vanaf omlaag

function pose(p) {
  const r = p.rot || 0;
  const A = { x: 0, y: 0 };
  const K = add(A, L.shin, p.s + r), H = add(K, L.thigh, p.t + r), S = add(H, L.torso, p.b + r);
  const N = add(S, L.neck, (p.b + r) + (p.h || 0)), C = add(N, L.head, (p.b + r) + (p.h || 0));
  const T = add(A, 9, 90 + r);   // teen
  const pts = { A, K, H, S, N, C, T };
  if (p.leg2) { pts.K2 = addW(H, L.thigh, p.leg2.a); pts.A2 = addW(pts.K2, L.shin, p.leg2.b); pts.T2 = addW(pts.A2, 8, p.leg2.toe ?? 90); }
  pts.E = addW(S, L.up, p.u); pts.W = addW(pts.E, L.fore, p.u + (p.f || 0));
  if (p.u2 != null) { pts.E2 = addW(S, L.up, p.u2); pts.W2 = addW(pts.E2, L.fore, p.u2 + (p.f2 || 0)); }
  if (p.bell) pts.B = addW(p.bell.at === 2 ? pts.W2 : pts.W, p.bell.d ?? 12, p.bell.a ?? 0);
  return pts;
}

// Eén plaatje; alle getekende punten worden op de vloer gezet en in het midden geschoven
function figure(p, label) {
  const q = pose(p), all = Object.values(q);
  const minX = Math.min(...all.map(v => v.x)) - 9, maxX = Math.max(...all.map(v => v.x)) + 9;
  const lows = ['A', 'T', 'A2', 'T2', 'K2', p.rot ? 'H' : null, p.rot ? 'S' : null, p.rot ? 'C' : null].filter(k => k && q[k]).map(k => q[k].y + (k === 'C' ? L.head : 0));
  const bellLow = q.B && p.bell.floor ? q.B.y + 9 : -1e9;
  const dy = 129 - Math.max(...lows, bellLow), dx = 60 - (minX + maxX) / 2;
      let props = '';
  if (p.bench && q.W2) { const x = q.W2.x + dx, y = q.W2.y + dy + 2; props = `<rect class="kb-prop" x="${(x - 12).toFixed(1)}" y="${y.toFixed(1)}" width="26" height="${(130 - y).toFixed(1)}" rx="3"/>`; }
  let bell = '';
  if (q.B) {
    const B = { x: q.B.x + dx, y: q.B.y + dy }, hand = p.bell.at === 2 ? q.W2 : q.W, Hd = { x: hand.x + dx, y: hand.y + dy };
    const len = Math.hypot(Hd.x - B.x, Hd.y - B.y) || 1, ux = (Hd.x - B.x) / len, uy = (Hd.y - B.y) / len, px = -uy, py = ux;
    const P1 = `${(B.x + ux * 6 + px * 5.5).toFixed(1)},${(B.y + uy * 6 + py * 5.5).toFixed(1)}`, P2 = `${(B.x + ux * 6 - px * 5.5).toFixed(1)},${(B.y + uy * 6 - py * 5.5).toFixed(1)}`;
    const Q = `${(Hd.x + ux * 5).toFixed(1)},${(Hd.y + uy * 5).toFixed(1)}`;
    bell = `<g class="kb-bell"><path d="M${P1} Q${Q} ${P2}"/><circle cx="${B.x.toFixed(1)}" cy="${B.y.toFixed(1)}" r="8.5"/></g>`;
  }
  const seg = (a, b, w, cls = 'kb-limb') => q[a] && q[b] ? `<line class="${cls}" x1="${(q[a].x + dx).toFixed(1)}" y1="${(q[a].y + dy).toFixed(1)}" x2="${(q[b].x + dx).toFixed(1)}" y2="${(q[b].y + dy).toFixed(1)}" stroke-width="${w}"/>` : '';
  const C = { x: q.C.x + dx, y: q.C.y + dy };
  const spin = p.spin ? `<path class="kb-arrow" d="M${(C.x - 15).toFixed(1)} ${(C.y + 4).toFixed(1)} A15 11 0 1 1 ${(C.x + 13).toFixed(1)} ${(C.y + 8).toFixed(1)}" marker-end="url(#kbHead)"/>` : '';
  return `<figure class="kb-fig"><svg viewBox="0 0 120 136" role="img" aria-label="${label}">
    <defs><marker id="kbHead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path class="kb-head-arr" d="M0 0L10 5L0 10z"/></marker></defs>
    <line class="kb-floor" x1="2" y1="131" x2="118" y2="131"/>${props}
    <g class="kb-far">${seg('H', 'K2', 9)}${seg('K2', 'A2', 7)}${seg('A2', 'T2', 5)}${seg('S', 'E2', 7)}${seg('E2', 'W2', 6)}</g>
    <g class="kb-body">${seg('A', 'T', 5)}${seg('A', 'K', 7)}${seg('K', 'H', 9.5)}${seg('H', 'S', 13)}${seg('S', 'N', 6)}<circle cx="${C.x.toFixed(1)}" cy="${C.y.toFixed(1)}" r="${L.head}"/></g>
    ${bell}<g class="kb-body kb-arm">${seg('S', 'E', 7)}${seg('E', 'W', 6)}</g>${spin}</svg><figcaption>${label}</figcaption></figure>`;
}

// ---------- Oefeningen ----------
// side = per arm of per been (de herhalingen tellen per kant)
const stand = { s: 0, t: 0, b: 0 };
const goblet = { u: 25, f: 130, bell: { a: 0, d: 9 } };
export const EX = {
  halo: { n: 'Halo', side: false, sec: 2.5,
    doel: 'Warmt je schouders op en maakt je bovenrug los. Licht en rustig.',
    a: { ...stand, u: 30, f: 120, bell: { a: 180, d: 10 }, spin: true }, b: { ...stand, u: 150, f: 125, bell: { a: -100, d: 9 }, spin: true },
    la: 'Bel voor je kin', lb: 'Bel achter je hoofd',
    cues: ['Pak de bel aan de hoorns, ondersteboven, voor je kin.', 'Draai hem in een cirkel om je hoofd: langs je oor, achter je hoofd, langs het andere oor.', 'Buik vast, niet hol in je rug. Hoofd blijft stil.', '5 rondjes linksom, dan 5 rechtsom.'] },
  deadlift: { n: 'Deadlift', side: false, sec: 2.5,
    doel: 'Billen, achterkant benen en rug. De basis van tillen: zo til je ook een krat water goed op.',
    a: { s: 16, t: -60, b: 62, u: -2, bell: { a: 0, d: 11, floor: true } }, b: { ...stand, u: 10, bell: { a: 0, d: 11 } },
    la: 'Heupen naar achteren', lb: 'Rechtop, billen aan',
    cues: ['Voeten op heupbreedte, bel tussen je voeten.', 'Duw je billen naar achteren alsof je met je billen een deur dichtduwt. Knieën een beetje gebogen.', 'Rug recht en lang, blik een meter voor je op de grond.', 'Sta op door de vloer weg te duwen. Bovenin billen aanspannen, niet achterover hangen.'],
    fout: 'Bol in je rug. Komt de bel niet meer bij de grond met een rechte rug? Zakt dan iets minder diep.' },
  swing: { n: 'Swing', side: false, sec: 2,
    doel: 'De koning van de kettlebell: billen en benen, en je hartslag gaat flink omhoog. Goed voor vetverbranding.',
    a: { s: 12, t: -64, b: 66, u: -28, bell: { a: -32, d: 12 } }, b: { ...stand, b: -3, u: 92, bell: { a: 92, d: 12 } },
    la: 'Bel tussen je benen', lb: 'Op borsthoogte',
    cues: ['Het is een deadlift met vaart, geen squat en geen armbeweging.', 'Zwaai de bel als een voetbal hoog tussen je benen naar achteren, heupen naar achteren.', 'Knal je heupen naar voren en span je billen aan: de bel zweeft vanzelf naar borsthoogte.', 'Armen zijn touwtjes. Laat de bel weer vallen en vang hem op met je heupen.'],
    fout: 'De bel omhoog tillen met je armen of schouders. De kracht komt uit je heupen.' },
  goblet: { n: 'Goblet squat', side: false, sec: 2.5,
    doel: 'Voor- en achterkant van je benen en je billen. Door de bel voor je borst blijf je vanzelf rechtop.',
    a: { ...stand, ...goblet }, b: { s: 38, t: -98, b: 22, u: 50, f: 115, bell: { a: 15, d: 9 } },
    la: 'Bel tegen je borst', lb: 'Diep zitten',
    cues: ['Houd de bel aan de hoorns tegen je borst, ellebogen naar beneden.', 'Voeten iets breder dan je heupen, tenen licht naar buiten.', 'Ga zitten tussen je hielen, knieën in de richting van je tenen. Hielen blijven op de grond.', 'Zo diep als lukt met een rechte rug. Duw dan krachtig omhoog.'],
    fout: 'Knieën die naar binnen vallen. Duw ze actief naar buiten.' },
  row: { n: 'Row', side: true, sec: 2.5,
    doel: 'Rug en armen. Goed voor je houding na een dag achter de computer.',
    a: { s: 14, t: -30, b: 78, u: -4, u2: 30, bell: { a: 0, d: 11 }, bench: true, leg2: { a: -22, b: -14 } },
    b: { s: 14, t: -30, b: 78, u: -75, f: 80, u2: 30, bell: { a: 0, d: 11 }, bench: true, leg2: { a: -22, b: -14 } },
    la: 'Arm lang', lb: 'Elleboog naar achteren',
    cues: ['Eén hand op een stoel, bank of de tafel. Rug recht, bijna plat.', 'Laat de bel aan een gestrekte arm onder je schouder hangen.', 'Trek je elleboog naar je broekzak, langs je lichaam.', 'Even vasthouden bovenin en langzaam terug. Eerst alle herhalingen links, dan rechts.'],
    fout: 'Draaien met je romp om de bel omhoog te krijgen. Je schouders blijven recht.' },
  floorpress: { n: 'Floor press', side: true, sec: 2.5,
    doel: 'Borst, schouders en achterkant arm. Veiliger dan drukken boven je hoofd: de grond beschermt je schouder.',
    a: { s: 90, t: -45, b: 0, rot: -90, u: 92, f: 88, bell: { a: 180, d: 9 } }, b: { s: 90, t: -45, b: 0, rot: -90, u: 180, f: 0, bell: { a: 180, d: 9 } },
    la: 'Elleboog op de grond', lb: 'Arm gestrekt omhoog',
    cues: ['Lig op je rug, knieën gebogen, voeten plat op de grond.', 'Pak de bel met één hand, elleboog op de grond, onderarm recht omhoog.', 'Duw de bel recht omhoog tot je arm gestrekt is. Pols recht.', 'Langzaam zakken tot je elleboog de grond raakt. Bel overpakken? Met twee handen, boven je borst.'] },
  lunge: { n: 'Achterwaartse lunge', side: true, sec: 4,
    doel: 'Benen en billen, één been tegelijk. Goed voor je balans en je knieën, en vertaalt direct naar padel en bergwandelen.',
    a: { ...stand, ...goblet }, b: { s: 4, t: -88, b: 6, u: 25, f: 130, bell: { a: 0, d: 9 }, leg2: { a: -34, b: -76, toe: 80 } },
    la: 'Rechtop staan', lb: 'Stap naar achteren',
    cues: ['Bel aan de hoorns tegen je borst. Rechtop.', 'Zet één grote stap naar achteren en zak recht naar beneden.', 'Achterste knie bijna op de grond, voorste knie boven je enkel.', 'Duw je terug via de hiel van je voorste been. Eerst alle herhalingen met één been, dan het andere.'],
    fout: 'Wiebelen? Houd je met één hand vast aan een stoel en houd de bel in de andere hand naast je lichaam.' },
  press: { n: 'Press', side: true, sec: 2.5,
    doel: 'Schouders en armen. Zwaar met 20 kg: daarom pas vanaf week 3 en alleen als het netjes gaat.',
    a: { ...stand, u: 12, f: 150, bell: { a: 25, d: 8 } }, b: { ...stand, u: 168, f: 0, bell: { a: -15, d: 10 } },
    la: 'Bel op je schouder', lb: 'Arm gestrekt omhoog',
    cues: ['De bel ligt in je hand op de buitenkant van je onderarm, tegen je borst (de "rack").', 'Billen en buik aanspannen, zodat je niet hol trekt.', 'Duw de bel recht omhoog tot je arm gestrekt naast je oor is.', 'Rustig terug naar je schouder. Gaat het niet netjes? Doe dan de floor press, dat is net zo goed.'] }
};

// ---------- Opbouw ----------
// Per twee weken een stap. Herhalingen per oefening per stap; rust tussen de oefeningen in seconden.
export const STAGES = [
  { n: 'Week 1–2', k: 'Leren', rounds: 2, rest: [30, 60], tip: 'Rustig aan en techniek leren. 2 rondes per blok. Stop elke set als je er nog 3 had gekund.' },
  { n: 'Week 3–4', k: 'Basis', rounds: 3, rest: [20, 45], tip: 'Nu 3 rondes. Stop elke set als je er nog 2 had gekund. De press komt erbij.' },
  { n: 'Week 5–6', k: 'Meer', rounds: 3, rest: [20, 40], tip: 'Meer herhalingen en iets kortere rust. De laatste herhaling is zwaar, maar nog netjes.' },
  { n: 'Week 7+', k: 'Sterker', rounds: 3, rest: [15, 30], tip: 'Zak bij elke herhaling in 3 tellen. Gaat alles makkelijk? Dan is een bel van 24 kg voor deadlift, swing en squat de volgende stap.' }
];
const REPS = { halo: [5, 5, 5, 5], deadlift: [8, 10, 12, 12], swing: [10, 12, 15, 15], goblet: [6, 8, 10, 10], row: [6, 8, 10, 10], floorpress: [6, 8, 10, 10], lunge: [4, 6, 6, 8], press: [3, 4, 5, 6] };
const BLOCK_REST = 45;    // tussen twee blokken
const WARM = 120;         // opwarmen

export const DAYS = [
  { k: 'A', n: 'Dag A · Basiskracht', when: 'Dinsdag', blocks: () => [['deadlift', 'row'], ['goblet', 'floorpress']],
    x: 'Tillen, trekken, zitten en drukken: je hele lijf in vier oefeningen.' },
  { k: 'B', n: 'Dag B · Swing en benen', when: 'Vrijdag', blocks: st => [['swing', st ? 'press' : 'floorpress'], ['lunge', 'row']],
    x: 'Swings voor je hartslag, lunges voor padel en de bergen.' },
  { k: 'C', n: 'Dag C · Kort en pittig', when: 'Zaterdag, of als je weinig tijd hebt', emom: ['swing', 'goblet', 'row', 'floorpress'],
    x: 'Elke minuut een nieuwe oefening. Wat over is van de minuut is rust. Optioneel.' }
];

// De stappen van een training, in volgorde
export function steps(day, st) {
  const S = STAGES[st], out = [{ kind: 'warm', secs: WARM }];
  if (day.emom) {
    for (let r = 0; r < S.rounds; r++) day.emom.forEach(k => out.push({ kind: 'emom', ex: k, reps: REPS[k][st], round: r + 1, rounds: S.rounds, secs: 60 }));
    return out;
  }
  const blocks = day.blocks(st);
  blocks.forEach((bl, bi) => {
    for (let r = 0; r < S.rounds; r++) bl.forEach((k, i) => {
      const lastInBlock = r === S.rounds - 1 && i === bl.length - 1;
      out.push({ kind: 'set', ex: k, reps: REPS[k][st], round: r + 1, rounds: S.rounds, block: bi, rest: lastInBlock ? (bi === blocks.length - 1 ? 0 : BLOCK_REST) : S.rest[i ? 1 : 0] });
    });
  });
  return out;
}
// Geschatte duur in minuten (ca. 3 sec per herhaling, 10 sec wisselen van kant)
export function minutes(day, st) {
  const t = steps(day, st).reduce((s, x) => s + (x.kind === 'set' ? x.reps * EX[x.ex].sec * (EX[x.ex].side ? 2 : 1) + (EX[x.ex].side ? 10 : 0) + x.rest : x.secs), 0);
  return Math.round(t / 60);
}

// ---------- Opslag op het toestel ----------
const LS = 'kb-v1';
const loadLS = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; } };
const saveLS = v => localStorage.setItem(LS, JSON.stringify(v));

// ---------- Geluid, trillen, scherm aan ----------
let actx = null;
function unlockAudio() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); if (actx.state === 'suspended') actx.resume(); } catch { } }
function beep(n = 1) {
  try { navigator.vibrate?.(n > 1 ? [200, 100, 200] : 150); } catch { }
  if (!actx) return;
  for (let i = 0; i < n; i++) {
    const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + i * 0.25;
    o.frequency.value = n > 1 ? 880 : 660; o.connect(g); g.connect(actx.destination);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2);
    o.start(t0); o.stop(t0 + 0.22);
  }
}
let lock = null;
async function wake(on) { try { if (on && 'wakeLock' in navigator) lock = await navigator.wakeLock.request('screen'); else if (!on && lock) { await lock.release(); lock = null; } } catch { } }

// ---------- Scherm ----------
// ctx: { root, esc, toast, today() -> 'jjjj-mm-dd', hasKracht(day), markKracht(day) }
export function mountKettlebell(ctx) {
  const { root, esc } = ctx;
  let st = loadLS(), runState = null, tick = null, finished = null;
  if (st.stage == null) { st.stage = 0; st.since = ctx.today(); saveLS(st); }

  const exLine = (k, reps) => { const e = EX[k]; return `${reps}×${e.side ? (k === 'lunge' ? ' per been' : ' per arm') : ''}`; };
  const pics = k => `<div class="kb-pics">${figure(EX[k].a, esc(EX[k].la))}<span class="kb-to" aria-hidden="true">→</span>${figure(EX[k].b, esc(EX[k].lb))}</div>`;
  const exCard = (k, extra = '') => { const e = EX[k];
    return `<details class="kb-ex" data-ex="${k}"><summary><span class="kb-thumb">${figure(e.b, '')}</span><span><b>${esc(e.n)}</b>${extra ? `<small>${extra}</small>` : ''}</span></summary>
      ${pics(k)}<p class="kb-doel">${esc(e.doel)}</p><ol class="kb-cues">${e.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ol>
      ${e.fout ? `<p class="kb-fout"><b>Let op:</b> ${esc(e.fout)}</p>` : ''}</details>`; };

  // Welke dag is de volgende? Afwisselend A en B; C alleen als je hem zelf kiest.
  const nextDay = () => { const last = (st.log || []).filter(x => x.d !== 'C').pop(); return last?.d === 'A' ? 'B' : 'A'; };

  function render() {
    if (runState) return renderRun();
    if (finished) return renderDone();
    const S = STAGES[st.stage], weeks = Math.floor((new Date(ctx.today() + 'T12:00') - new Date((st.since || ctx.today()) + 'T12:00')) / 6048e5);
    const pick = st.day || nextDay(), day = DAYS.find(d => d.k === pick), done = ctx.hasKracht(ctx.today());
    const list = day.emom
      ? `<p class="kb-blockh">${STAGES[st.stage].rounds}× rond, elke minuut een oefening</p>${day.emom.map((k, i) => exCard(k, `Minuut ${i + 1}: ${exLine(k, REPS[k][st.stage])}`)).join('')}`
      : day.blocks(st.stage).map((bl, bi) => `<p class="kb-blockh">Blok ${bi + 1} · ${S.rounds} rondes, om en om${bi ? '' : ''}</p>
          ${bl.map((k, i) => exCard(k, `${String.fromCharCode(65 + bi)}${i + 1} · ${S.rounds} sets van ${exLine(k, REPS[k][st.stage])} · dan ${S.rest[i ? 1 : 0]} sec rust`)).join('')}`).join('');
    const last = (st.log || []).slice(-1)[0];
    root.innerHTML = `
      <div class="card kb-head">
        <p class="kb-kicker">🏋️ Kettlebell 20 kg · ca. 15 minuten</p>
        <div class="kb-days" role="tablist">${DAYS.map(d => `<button role="tab" class="kb-day" aria-selected="${d.k === pick}" data-day="${d.k}"><b>${d.k}</b><small>${esc(d.when.split(',')[0])}</small></button>`).join('')}</div>
        <h2 class="kb-title">${esc(day.n)}</h2>
        <p class="mut kb-x">${esc(day.x)} Ongeveer ${minutes(day, st.stage)} minuten.</p>
        <button class="btn primary kb-start" data-act="start">▶ Start training</button>
        ${done ? '<p class="kb-ok">✓ Kracht staat vandaag al afgevinkt in Gezond.</p>' : last ? `<p class="mut kb-last">Laatst: dag ${esc(last.d)} op ${new Date(last.t + 'T12:00').toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>` : ''}
      </div>

      <div class="card kb-stage">
        <h3 class="gz-h3">📈 Opbouw</h3>
        <div class="kb-stages">${STAGES.map((s, i) => `<button class="kb-st${i === st.stage ? ' on' : ''}${i < st.stage ? ' past' : ''}" data-stage="${i}" aria-pressed="${i === st.stage}"><b>${esc(s.n)}</b><small>${esc(s.k)}</small></button>`).join('')}</div>
        <p class="kb-tip">${esc(S.tip)}</p>
        ${weeks >= 2 && st.stage < STAGES.length - 1 ? `<button class="btn kb-up" data-stage="${st.stage + 1}">Al ${weeks} weken bezig. Door naar ${esc(STAGES[st.stage + 1].n)}?</button>` : ''}
      </div>

      <div class="kb-list">
        <div class="kb-warm card"><b>Eerst 2 minuten opwarmen</b><span class="mut">5 halo's linksom en rechtsom, 10 squats zonder gewicht, 10 keer rustig voorover buigen met rechte rug.</span></div>
        ${list}
        <p class="mut kb-hint">Tik op een oefening voor het plaatje en de techniek.</p>
      </div>

      <details class="card kb-why"><summary>💡 Waarom zo? (3 × 8 of 1 × 24)</summary>
        <p><b>Je hebt gelijk: 3 setjes van 8 werkt beter dan 1 keer 24.</b> Bij 24 herhalingen is het gewicht eigenlijk te licht. De laatste herhalingen worden slordig en het wordt een conditietest in plaats van krachttraining. Met 3 sets van 6 tot 12 is elke herhaling zwaar genoeg én netjes. Dat geeft je spieren het signaal: blijf hier.</p>
        <p><b>Waarom kracht als je afvalt?</b> Je eet minder, en dan pakt je lichaam ook spier als brandstof. Krachttraining zorgt dat je vooral vet verliest. Meer spier verbrandt ook in rust meer en houdt je knieën en rug sterk, ook bij padel.</p>
        <p><b>Waarom om en om?</b> Je doet steeds een oefening voor de benen en dan een voor de armen of rug. Terwijl de een werkt, rust de ander. Zo heeft elke spier toch 1,5 tot 2 minuten rust, terwijl jij maar 30 tot 60 seconden stilstaat. Zo past alles in 15 minuten en blijft je hartslag omhoog. 20 seconden rust tussen dezelfde oefening is te kort voor kracht: dan zak je snel in.</p>
        <p><b>Hoe zwaar?</b> Stop elke set als je er nog 2 of 3 had gekund. Niet tot je echt niet meer kunt. Gaan alle sets makkelijk? Dan door naar de volgende stap van de opbouw.</p>
        <p><b>Hoe vaak?</b> 2 keer per week is genoeg, 3 is mooi meegenomen. Zet er een dag tussen: bijvoorbeeld dinsdag dag A en vrijdag dag B. Maandag en woensdag is padel.</p>
        <p><b>Veilig:</b> spierpijn de dag erna is normaal. Scherpe pijn in je rug, knie of schouder niet: stop dan met die oefening.</p>
      </details>

      <details class="card kb-all"><summary>📖 Alle oefeningen</summary>${Object.keys(EX).map(k => exCard(k)).join('')}</details>`;
  }

  // ---------- Trainingsmodus ----------
  function start() {
    unlockAudio(); wake(true);
    const day = DAYS.find(d => d.k === (st.day || nextDay()));
    runState = { day, list: steps(day, st.stage), i: 0, phase: 'go', end: 0, pausedLeft: null };
    begin(0);
  }
  function begin(i) {
    const r = runState; r.i = i; r.pausedLeft = null;
    if (i >= r.list.length) return finish();
    const s = r.list[i];
    if (s.kind === 'warm' || s.kind === 'emom') { r.phase = 'timed'; r.end = Date.now() + s.secs * 1000; }
    else r.phase = 'go';
    renderRun(); loop();
  }
  function rest(secs) {
    const r = runState;
    if (!secs) return begin(r.i + 1);
    r.phase = 'rest'; r.end = Date.now() + secs * 1000; r.pausedLeft = null; renderRun(); loop();
  }
  function loop() {
    clearInterval(tick);
    tick = setInterval(() => {
      const r = runState; if (!r || r.pausedLeft != null || r.phase === 'go') return;
      const left = Math.ceil((r.end - Date.now()) / 1000);
      const el = root.querySelector('#kbClock'); if (el) el.textContent = fmt(Math.max(0, left));
      const ring = root.querySelector('#kbRing'); if (ring) ring.style.strokeDashoffset = String(ringOff(left));
      if (left === 3 && !r.warned) { r.warned = true; beep(1); }
      if (left <= 0) { r.warned = false; beep(2); if (r.phase === 'rest') begin(r.i + 1); else begin(r.i + 1); }
    }, 250);
  }
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const total = () => { const r = runState, s = r.list[r.i]; return r.phase === 'rest' ? s.rest : s.secs; };
  const ringOff = left => 302 * (1 - Math.max(0, left) / (total() || 1));
  function stop(save) { clearInterval(tick); wake(false); runState = null; if (!save) render(); }
  function finish() {
    const r = runState, today = ctx.today();
    clearInterval(tick); wake(false);
    st.log = [...(st.log || []), { d: r.day.k, t: today, s: st.stage }].slice(-60); st.day = null; saveLS(st);
    const already = ctx.hasKracht(today);
    if (!already) ctx.markKracht(today);
    runState = null; finished = { n: r.day.n, already };
    renderDone();
    beep(2);
  }

  function renderDone() {
    root.innerHTML = `<div class="card kb-done"><div class="kb-big">💪</div><h2>¡Muy bien!</h2>
      <p>${esc(finished.n)} zit erop.</p><p class="kb-ok">✓ ${finished.already ? 'Kracht stond vandaag al afgevinkt' : 'Kracht is afgevinkt in Gezond'}.</p>
      <p class="mut">Drink een glas water. De volgende keer: dag ${nextDay()}.</p>
      <button class="btn primary wide" data-act="back">Terug naar het schema</button></div>`;
  }

  function renderRun() {
    const r = runState, s = r.list[r.i], n = r.list.length, next = r.list[r.i + 1];
    const bar = `<div class="kb-prog" aria-label="Stap ${r.i + 1} van ${n}"><i style="width:${(r.i / n * 100).toFixed(0)}%"></i></div>`;
    const top = `<div class="kb-runtop"><button class="btn" data-act="stop">✕ Stoppen</button><span class="mut">Stap ${r.i + 1} van ${n}</span></div>`;
    const clock = (label, secs) => `<div class="kb-clock"><svg viewBox="0 0 110 110"><circle class="kb-ringbg" cx="55" cy="55" r="48"/><circle id="kbRing" class="kb-ring" cx="55" cy="55" r="48" style="stroke-dashoffset:${ringOff(Math.ceil((r.end - Date.now()) / 1000))}"/></svg>
      <div><b id="kbClock">${fmt(Math.max(0, r.pausedLeft ?? Math.ceil((r.end - Date.now()) / 1000)))}</b><small>${label}</small></div></div>
      <div class="kb-ctrl"><button class="btn" data-act="minus">−15 s</button><button class="btn" data-act="pause">${r.pausedLeft != null ? '▶ Verder' : '⏸ Pauze'}</button><button class="btn" data-act="plus">+15 s</button></div>`;
    const nextTxt = x => !x ? 'Daarna ben je klaar!' : x.kind === 'warm' ? '' : `Hierna: <b>${esc(EX[x.ex].n)}</b>, ${exLine(x.ex, x.reps)}`;
    let body;
    if (s.kind === 'warm') {
      body = `<h2 class="kb-now">Opwarmen</h2><ul class="kb-warmlist"><li>5 halo's linksom en 5 rechtsom</li><li>10 squats zonder gewicht</li><li>10 keer voorover buigen met rechte rug</li><li>Schouders en armen losschudden</li></ul>
        ${pics('halo')}${clock('opwarmen', s.secs)}<p class="kb-next">${nextTxt(next)}</p><button class="btn primary kb-big-btn" data-act="skip">Klaar, beginnen</button>`;
    } else if (r.phase === 'rest') {
      body = `<h2 class="kb-now kb-resting">Rust</h2>${clock('rust', s.rest)}
        <p class="kb-next">${nextTxt(next)}</p>${next && next.kind !== 'warm' ? pics(next.ex) : ''}
        <button class="btn primary kb-big-btn" data-act="skip">Rust overslaan</button>`;
    } else {
      const e = EX[s.ex];
      body = `<p class="kb-setinfo">${s.kind === 'emom' ? `Ronde ${s.round} van ${s.rounds} · elke minuut` : `Set ${s.round} van ${s.rounds}`}</p>
        <h2 class="kb-now">${esc(e.n)}</h2><p class="kb-reps">${exLine(s.ex, s.reps)}</p>
        ${pics(s.ex)}
        ${s.kind === 'emom' ? `${clock('deze minuut', 60)}<p class="kb-next">${nextTxt(next)}</p><button class="btn primary kb-big-btn" data-act="skip">Volgende minuut nu</button>`
          : `<button class="btn primary kb-big-btn" data-act="setdone">✓ Set klaar${s.rest ? ` · ${s.rest} sec rust` : ''}</button><p class="kb-next">${nextTxt(next)}</p>`}
        <details class="kb-cues-run"><summary>Techniek</summary><ol class="kb-cues">${e.cues.map(c => `<li>${esc(c)}</li>`).join('')}</ol>${e.fout ? `<p class="kb-fout"><b>Let op:</b> ${esc(e.fout)}</p>` : ''}</details>`;
    }
    root.innerHTML = `<div class="kb-run">${top}${bar}${body}</div>`;
  }

  root.addEventListener('click', e => {
    const t = e.target.closest('[data-act],[data-day],[data-stage]'); if (!t) return;
    if (t.dataset.day) { st.day = t.dataset.day; saveLS(st); render(); return; }
    if (t.dataset.stage) { st.stage = Number(t.dataset.stage); st.since = ctx.today(); saveLS(st); render(); ctx.toast(`Opbouw: ${STAGES[st.stage].n}`); return; }
    const a = t.dataset.act, r = runState;
    if (a === 'start') { start(); window.scrollTo(0, 0); }
    else if (a === 'back') { finished = null; render(); window.scrollTo(0, 0); }
    else if (a === 'stop') { stop(); window.scrollTo(0, 0); }
    else if (!r) return;
    else if (a === 'setdone') { unlockAudio(); rest(r.list[r.i].rest); window.scrollTo(0, 0); }
    else if (a === 'skip') { begin(r.i + 1); window.scrollTo(0, 0); }
    else if (a === 'pause') {
      if (r.pausedLeft != null) { r.end = Date.now() + r.pausedLeft * 1000; r.pausedLeft = null; } else r.pausedLeft = Math.max(0, Math.ceil((r.end - Date.now()) / 1000));
      renderRun();
    } else if (a === 'plus' || a === 'minus') {
      const d = (a === 'plus' ? 15 : -15) * 1000;
      if (r.pausedLeft != null) r.pausedLeft = Math.max(0, r.pausedLeft + d / 1000); else r.end = Math.max(Date.now() + 1000, r.end + d);
      const left = r.pausedLeft ?? Math.ceil((r.end - Date.now()) / 1000);
      const el = root.querySelector('#kbClock'); if (el) el.textContent = fmt(left);
    }
  });
  // Telefoon even weggelegd: de timer loopt op de klok, dus bij terugkomen klopt hij meteen weer
  document.addEventListener('visibilitychange', () => { if (runState && document.visibilityState === 'visible') { if (runState.phase !== 'go') wake(true); } });

  return { render, running: () => !!runState };
}

// Voor de test-pagina: alle plaatjes los
export const _figure = figure;
