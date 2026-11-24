// Spaans oefenen: werkwoorden vervoegen (typen of inspreken) en zinnen uit de lessen. Voortgang blijft op dit toestel (localStorage).
const P = [
  { k: 'yo', es: ['Yo'], nl: ['Ik'] },
  { k: 'tu', es: ['Tú'], nl: ['Jij'] },
  { k: 'el', es: ['Él', 'Ella'], nl: ['Hij', 'Zij'] },
  { k: 'nos', es: ['Nosotros'], nl: ['Wij'] },
  { k: 'vos', es: ['Vosotros'], nl: ['Jullie'] },
  { k: 'ellos', es: ['Ellos'], nl: ['Zij'] }];
const PL = ['yo', 'tú', 'él / ella', 'nosotros', 'vosotros', 'ellos'];
// c: [Spaans, Nederlands] of [enkelvoud es, enkelvoud nl, meervoud es, meervoud nl]
const V = {
  vivir: { nl: 'wonen', pres: 'vivo vives vive vivimos vivís viven', ind: 'viví viviste vivió vivimos vivisteis vivieron', fut: 'viviré vivirás vivirá viviremos viviréis vivirán', part: 'vivido',
    d: { pres: 'woon woont woont wonen wonen wonen', past: 'woonde woonde woonde woonden woonden woonden', part: 'gewoond', inf: 'wonen' },
    c: [['en Cómpeta', 'in Cómpeta'], ['en España', 'in Spanje'], ['en Málaga', 'in Málaga']] },
  tener: { nl: 'hebben', pres: 'tengo tienes tiene tenemos tenéis tienen', ind: 'tuve tuviste tuvo tuvimos tuvisteis tuvieron', fut: 'tendré tendrás tendrá tendremos tendréis tendrán', part: 'tenido',
    d: { pres: 'heb hebt heeft hebben hebben hebben', past: 'had had had hadden hadden hadden', part: 'gehad', inf: 'hebben' },
    c: [['una casa', 'een huis'], ['un perro', 'een hond'], ['un coche', 'een auto']] },
  hablar: { nl: 'spreken', pres: 'hablo hablas habla hablamos habláis hablan', ind: 'hablé hablaste habló hablamos hablasteis hablaron', fut: 'hablaré hablarás hablará hablaremos hablaréis hablarán', part: 'hablado',
    d: { pres: 'spreek spreekt spreekt spreken spreken spreken', past: 'sprak sprak sprak spraken spraken spraken', part: 'gesproken', inf: 'spreken' },
    c: [['español', 'Spaans'], ['con Antonio', 'met Antonio'], ['holandés', 'Nederlands']] },
  comer: { nl: 'eten', pres: 'como comes come comemos coméis comen', ind: 'comí comiste comió comimos comisteis comieron', fut: 'comeré comerás comerá comeremos comeréis comerán', part: 'comido',
    d: { pres: 'eet eet eet eten eten eten', past: 'at at at aten aten aten', part: 'gegeten', inf: 'eten' },
    c: [['pan con queso', 'brood met kaas'], ['tortilla', 'tortilla'], ['en el restaurante', 'in het restaurant']] },
  beber: { nl: 'drinken', pres: 'bebo bebes bebe bebemos bebéis beben', ind: 'bebí bebiste bebió bebimos bebisteis bebieron', fut: 'beberé beberás beberá beberemos beberéis beberán', part: 'bebido',
    d: { pres: 'drink drinkt drinkt drinken drinken drinken', past: 'dronk dronk dronk dronken dronken dronken', part: 'gedronken', inf: 'drinken' },
    c: [['café', 'koffie'], ['agua', 'water'], ['una Coca-Cola Zero', 'een Coca-Cola Zero']] },
  ir: { nl: 'gaan', pres: 'voy vas va vamos vais van', ind: 'fui fuiste fue fuimos fuisteis fueron', fut: 'iré irás irá iremos iréis irán', part: 'ido',
    d: { pres: 'ga gaat gaat gaan gaan gaan', past: 'ging ging ging gingen gingen gingen', part: 'gegaan', inf: 'gaan', aux: 'zijn' },
    c: [['a la tienda', 'naar de winkel'], ['a Málaga', 'naar Málaga'], ['a la playa', 'naar het strand']] },
  ser: { nl: 'zijn (wie/wat)', pres: 'soy eres es somos sois son', ind: 'fui fuiste fue fuimos fuisteis fueron', fut: 'seré serás será seremos seréis serán', part: 'sido',
    d: { pres: 'ben bent is zijn zijn zijn', past: 'was was was waren waren waren', part: 'geweest', inf: 'zijn', aux: 'zijn' },
    c: [['de Holanda', 'uit Nederland'], ['feliz', 'blij', 'felices', 'blij'], ['de Cómpeta', 'uit Cómpeta']] },
  estar: { nl: 'zijn (waar/hoe)', pres: 'estoy estás está estamos estáis están', ind: 'estuve estuviste estuvo estuvimos estuvisteis estuvieron', fut: 'estaré estarás estará estaremos estaréis estarán', part: 'estado',
    d: { pres: 'ben bent is zijn zijn zijn', past: 'was was was waren waren waren', part: 'geweest', inf: 'zijn', aux: 'zijn' },
    c: [['en casa', 'thuis'], ['en la oficina', 'op kantoor'], ['en Málaga', 'in Málaga']] },
  querer: { nl: 'willen', pres: 'quiero quieres quiere queremos queréis quieren', ind: 'quise quisiste quiso quisimos quisisteis quisieron', fut: 'querré querrás querrá querremos querréis querrán', part: 'querido',
    d: { pres: 'wil wilt wil willen willen willen', past: 'wilde wilde wilde wilden wilden wilden', part: 'gewild', inf: 'willen' },
    c: [['un café', 'een koffie'], ['una casa', 'een huis'], ['pan', 'brood']] },
  necesitar: { nl: 'nodig hebben', pres: 'necesito necesitas necesita necesitamos necesitáis necesitan', ind: 'necesité necesitaste necesitó necesitamos necesitasteis necesitaron', fut: 'necesitaré necesitarás necesitará necesitaremos necesitaréis necesitarán', part: 'necesitado',
    d: { pres: 'heb hebt heeft hebben hebben hebben', past: 'had had had hadden hadden hadden', part: 'gehad', inf: 'hebben', tail: 'nodig' },
    c: [['pan', 'brood'], ['leche', 'melk'], ['una bolsa', 'een tas']] },
  comprar: { nl: 'kopen', pres: 'compro compras compra compramos compráis compran', ind: 'compré compraste compró compramos comprasteis compraron', fut: 'compraré comprarás comprará compraremos compraréis comprarán', part: 'comprado',
    d: { pres: 'koop koopt koopt kopen kopen kopen', past: 'kocht kocht kocht kochten kochten kochten', part: 'gekocht', inf: 'kopen' },
    c: [['pan', 'brood'], ['leche', 'melk'], ['una bolsa', 'een tas']] }
};
const W = s => s.split(' ');
const HE = W('he has ha hemos habéis han'), HAB = W('había habías había habíamos habíais habían'), VOY = W('voy vas va vamos vais van');
const HEB = W('heb hebt heeft hebben hebben hebben'), HAD = W('had had had hadden hadden hadden'), ZAL = W('zal zult zal zullen zullen zullen');
const GA = W('ga gaat gaat gaan gaan gaan'), BEN = W('ben bent is zijn zijn zijn'), WAS = W('was was was waren waren waren');
const tl = (v, r) => [v.d.tail, r].filter(Boolean).join(' ');
const T = [
  { k: 'pres', n: 'Nu', x: 'Tegenwoordige tijd: wat je nu of altijd doet.', es: (v, i) => W(v.pres)[i], nl: (v, i) => [W(v.d.pres)[i], tl(v, '')] },
  { k: 'ind', n: 'Verleden tijd', x: 'Wat je gisteren of op één moment deed (ayer, el año pasado).', es: (v, i) => W(v.ind)[i], nl: (v, i) => [W(v.d.past)[i], tl(v, '')] },
  { k: 'perf', n: 'Ik heb …', x: 'Wat je vandaag of deze week hebt gedaan: he, has, ha … + vorm op -ado / -ido.', es: (v, i) => HE[i] + ' ' + v.part, nl: (v, i) => [(v.d.aux ? BEN : HEB)[i], tl(v, v.d.part)] },
  { k: 'plus', n: 'Ik had …', x: 'Wat al gebeurd was vóór iets anders: había, habías … + vorm op -ado / -ido.', es: (v, i) => HAB[i] + ' ' + v.part, nl: (v, i) => [(v.d.aux ? WAS : HAD)[i], tl(v, v.d.part)] },
  { k: 'fut', n: 'Toekomst', x: 'Wat je later zult doen. De uitgang komt achter het hele werkwoord.', es: (v, i) => W(v.fut)[i], nl: (v, i) => [ZAL[i], tl(v, v.d.inf)] },
  { k: 'ira', n: 'Ik ga …', x: 'De makkelijkste toekomst: ir + a + heel werkwoord.', es: (v, i, k) => VOY[i] + ' a ' + k, nl: (v, i) => [GA[i], tl(v, v.d.inf)] }];
const BASIS = ['vivir', 'tener', 'hablar', 'comer', 'beber', 'ir'];
const PRE = [
  { n: 'Stap 1: nu', v: BASIS, t: ['pres'], p: ['yo', 'tu', 'el'] },
  { n: 'Stap 2: nu + gaan', v: BASIS, t: ['pres', 'ira'], p: ['yo', 'tu', 'el'] },
  { n: 'Stap 3: meer', v: Object.keys(V), t: ['pres', 'ind', 'perf', 'ira'], p: ['yo', 'tu', 'el', 'nos', 'ellos'] },
  { n: 'Stap 4: alles', v: Object.keys(V), t: T.map(t => t.k), p: P.map(p => p.k) }];

// Zinnen uit de lessen (voorstellen, winkel, dagen, vaste fouten). tip = uitleg bij een fout die vaak terugkomt.
const THEMA = { voor: 'Jezelf voorstellen', winkel: 'In de winkel', dagen: 'Dagen en groeten', getal: 'Getallen 1–100', fout: 'Vaste fouten' };
const ZIN = [
  ['voor', 'Ik heet Frans.', 'Me llamo Frans.', 'Me llamo, niet "mi llamo" (mi = mijn).'],
  ['voor', 'Ik ben Nederlands.', 'Soy holandés.'],
  ['voor', 'Ik woon in Cómpeta, in Andalusië.', 'Vivo en Cómpeta, en Andalucía.', 'Wonen in een plaats: vivo en.'],
  ['voor', 'Ik ben vijfenveertig jaar.', 'Tengo cuarenta y cinco años.', 'Leeftijd gaat met tener: tengo … años.'],
  ['voor', 'Ik spreek Nederlands en een beetje Spaans.', 'Hablo holandés y un poco de español.', 'Hablo holandés zonder "de". "de" komt alleen na "un poco".'],
  ['voor', 'Ik ben getrouwd.', 'Estoy casado.'],
  ['voor', 'Ik heb twee kinderen, een dochter en een zoon.', 'Tengo dos hijos, una hija y un hijo.', 'una hija (vrouwelijk), un hijo (mannelijk).'],
  ['voor', 'Hoe heet jij?', '¿Cómo te llamas?'],
  ['voor', 'Waar kom je vandaan?', '¿De dónde eres?', 'Antwoord met soy: Soy holandés.'],
  ['voor', 'Waar woon je?', '¿Dónde vives?', 'Antwoord met vivo: Vivo en Cómpeta.'],
  ['voor', 'Hoe oud ben je?', '¿Cuántos años tienes?'],
  ['voor', 'Welke talen spreek je?', '¿Qué idiomas hablas?'],
  ['voor', 'Ben je getrouwd?', '¿Estás casado?'],
  ['voor', 'Heb je kinderen?', '¿Tienes hijos?'],
  ['winkel', 'Wat heeft u nodig?', '¿Qué necesita?'],
  ['winkel', 'Nog iets?', '¿Algo más?'],
  ['winkel', 'Dat is drie euro vijftig.', 'Son tres euros con cincuenta.'],
  ['winkel', 'Een fijne dag!', '¡Que tenga un buen día!'],
  ['winkel', 'Twee broden, alstublieft.', 'Dos panes, por favor.'],
  ['winkel', 'Een stuk kaas.', 'Un trozo de queso.'],
  ['winkel', 'Twee liter melk.', 'Dos litros de leche.', 'Geen s achter leche: dos litros de leche.'],
  ['winkel', 'Een doos thee.', 'Una caja de té.', 'una caja (vrouwelijk).'],
  ['winkel', 'Nee, verder niets, dank u.', 'No, nada más, gracias.'],
  ['winkel', 'Hoeveel kost het?', '¿Cuánto cuesta?'],
  ['winkel', 'Alstublieft (bij het betalen).', 'Aquí tiene.', 'Uitspraak: "a-kie tie-ne".'],
  ['winkel', 'Dank u, insgelijks.', 'Gracias, igualmente.'],
  ['winkel', 'Ik heb een tas nodig.', 'Necesito una bolsa.'],
  ['winkel', 'Ik wil serranoham.', 'Quiero jamón serrano.'],
  ['winkel', 'Ik koop fruit in de winkel.', 'Compro fruta en la tienda.', 'Klemtoon: COMpro (ik koop). Compró = hij kocht.'],
  ['dagen', 'Goedemorgen.', 'Buenos días.'],
  ['dagen', 'Goedemiddag.', 'Buenas tardes.'],
  ['dagen', 'Tot straks.', 'Hasta luego.'],
  ['dagen', 'Graag gedaan.', 'De nada.'],
  ['dagen', 'Ik weet het niet.', 'No sé.'],
  ['dagen', 'Vandaag is het maandag.', 'Hoy es lunes.'],
  ['dagen', 'Gisteren was het zondag.', 'Ayer fue domingo.'],
  ['dagen', 'Morgen is het woensdag.', 'Mañana es miércoles.'],
  ['dagen', 'Vandaag is het donderdag.', 'Hoy es jueves.'],
  ['dagen', 'Morgen is het zaterdag.', 'Mañana es sábado.'],
  ['dagen', 'Gisteren was het dinsdag.', 'Ayer fue martes.'],
  ['dagen', 'Vandaag is het vrijdag.', 'Hoy es viernes.'],
  ['fout', 'Ik ga naar de winkel.', 'Voy a la tienda.', 'Voy klinkt als "boj", niet "foi".'],
  ['fout', 'Ik woon in Spanje.', 'Vivo en España.', 'en = in, de = van/uit.'],
  ['fout', 'Ik ben uit Nederland.', 'Soy de Holanda.', 'Waar je vandaan komt: soy de.'],
  ['fout', 'Ik spreek Spaans.', 'Hablo español.', 'Geen "de" na hablo.'],
  ['fout', 'Ik heb een dochter.', 'Tengo una hija.'],
  ['fout', 'Ik heet Frans, en jij?', 'Me llamo Frans, ¿y tú?', 'me llamo, niet mi llamo.']
].map(([th, nl, es, tip], i) => ({ id: 'z|' + i, th, nl, es, tip }));
const EEN = W('cero uno dos tres cuatro cinco seis siete ocho nueve diez once doce trece catorce quince dieciséis diecisiete dieciocho diecinueve veinte veintiuno veintidós veintitrés veinticuatro veinticinco veintiséis veintisiete veintiocho veintinueve');
const TIEN = { 3: 'treinta', 4: 'cuarenta', 5: 'cincuenta', 6: 'sesenta', 7: 'setenta', 8: 'ochenta', 9: 'noventa' };
const getal = n => n === 100 ? 'cien' : n < 30 ? EEN[n] : TIEN[Math.floor(n / 10)] + (n % 10 ? ' y ' + EEN[n % 10] : '');
const GTIP = 'Tot 29 één woord (veintiuno). Vanaf 31 met "y": treinta y ocho. Let op: treinta ("trein"), cincuenta ("kwen").';

const store = {
  get(k, d) { try { const v = localStorage.getItem('spaans-' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('spaans-' + k, JSON.stringify(v)); } catch { } }
};
const esc = s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';');
const norm = s => s.toLowerCase().replace(/[.,;:¿?¡!"]/g, ' ').replace(/\s+/g, ' ').trim()
  .replace(/^(yo|t[uú]|[eé]l|ella|nosotros|nosotras|vosotros|vosotras|ellos|ellas)\s+/, '');
const bare = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const pick = a => a[Math.floor(Math.random() * a.length)];
const pick2 = s => ({ v: [...s.v], t: [...s.t], p: [...s.p] });
const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;

function make(vk, tk, pk) {
  const v = V[vk], t = T.find(x => x.k === tk), i = P.findIndex(p => p.k === pk), p = P[i];
  const g = Math.floor(Math.random() * p.es.length), c = pick(v.c);
  const [fin, rest] = t.nl(v, i), pl = i > 2 && c.length > 2, ce = pl ? c[2] : c[0], cn = pl ? c[3] : c[1];
  return { id: vk + '|' + tk + '|' + pk, vk, t, subj: p.es[g], nl: [p.nl[g], fin, cn, rest].filter(Boolean).join(' ') + '.', ans: t.es(v, i, vk), rest: ce + '.' };
}

export function mountSpaans(root) {
  let sel = store.get('sel', pick2(PRE[0]));
  let sc = store.get('score', { ok: 0, bad: 0, run: 0 });
  let mist = store.get('mist', []);
  let thema = store.get('thema', Object.keys(THEMA));
  let mode = store.get('mode', 'verb'), onlyMist = false, cur = null, done = false, ovV = 'vivir', built = false;
  const $ = s => root.querySelector(s);

  function build() {
    built = true;
    root.innerHTML = `
      <div class="chips" role="tablist" aria-label="Manier van oefenen">
        <button class="chip" data-m="verb" role="tab">Werkwoord typen</button>
        <button class="chip" data-m="zin" role="tab">Hele zin inspreken</button>
        <button class="chip" data-m="les" role="tab">Zinnen uit de les</button>
      </div>
      <div class="card sp-card">
        <div class="sp-tags"><span class="sp-tag sp-t" id="spTense"></span><span class="sp-tag" id="spVerb"></span></div>
        <p class="sp-hint" id="spHint"></p>
        <p class="sp-nl" id="spNl"></p>
        <form class="sp-es" id="spForm" autocomplete="off">
          <span id="spSubj"></span>
          <input id="spInp" aria-label="Jouw antwoord" autocapitalize="off" spellcheck="false">
          <span id="spRest"></span>
        </form>
        <p class="sp-hint" id="spMicNote" hidden></p>
        <div class="sp-acc" aria-label="Letters met accent">${['á', 'é', 'í', 'ó', 'ú', 'ñ'].map(l => `<button type="button" class="btn">${l}</button>`).join('')}</div>
        <div class="sp-row">
          <button class="btn primary" id="spCheck" type="button">Controleer</button>
          <button class="btn sp-mic" id="spMic" type="button" hidden>Inspreken</button>
          <button class="btn" id="spShow" type="button">Weet ik niet</button>
          <button class="btn" id="spSay" type="button" hidden>Luister</button>
          <button class="btn" id="spNext" type="button">Volgende</button>
        </div>
        <div class="sp-fb" id="spFb" aria-live="polite"></div>
      </div>
      <div class="sp-score"><div><b id="spOk">0</b><span>goed</span></div><div><b id="spBad">0</b><span>fout</span></div><div><b id="spRun">0</b><span>op rij goed</span></div></div>
      <details class="sp-box" open><summary>Wat wil je oefenen?</summary>
        <div class="chips" id="spPre">${PRE.map((p, i) => `<button class="chip" data-p="${i}">${p.n}</button>`).join('')}</div>
        <p class="sp-leg">Werkwoorden</p><div class="sp-opts" id="spOv"></div>
        <p class="sp-leg">Tijden</p><div class="sp-opts" id="spOt"></div>
        <p class="sp-leg">Personen</p><div class="sp-opts" id="spOp"></div>
        <p class="sp-leg">Zinnen uit de les: onderwerpen</p><div class="sp-opts" id="spOz"></div>
      </details>
      <details class="sp-box"><summary>Nog oefenen</summary>
        <p class="mut" id="spMInfo"></p><div class="sp-mist" id="spMList"></div>
        <div class="sp-row"><button class="btn" id="spMist" type="button">Alleen mijn fouten</button><button class="btn" id="spReset" type="button">Score op nul</button></div>
      </details>
      <details class="sp-box"><summary>Overzicht: alle vormen</summary>
        <div class="chips" id="spTabs"></div><div class="sp-grid" id="spGrid"></div>
      </details>`;

    root.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.m) { mode = b.dataset.m; store.set('mode', mode); next(); }
      else if (b.dataset.p) { sel = pick2(PRE[b.dataset.p]); store.set('sel', sel); opts(); next(); }
      else if (b.dataset.ov) { ovV = b.dataset.ov; overview(); }
      else if (b.closest('.sp-acc')) {
        const i = $('#spInp'), s = i.selectionStart ?? i.value.length, en = i.selectionEnd ?? s;
        i.value = i.value.slice(0, s) + b.textContent + i.value.slice(en); i.focus(); i.setSelectionRange(s + 1, s + 1);
      }
    });
    $('#spForm').addEventListener('submit', e => { e.preventDefault(); check(); });
    $('#spCheck').onclick = check;
    $('#spShow').onclick = show;
    $('#spNext').onclick = () => { onlyMist = onlyMist && mist.length > 0; next(); };
    $('#spMist').onclick = () => { onlyMist = true; next(); root.scrollIntoView({ behavior: 'smooth' }); };
    $('#spReset').onclick = () => { sc = { ok: 0, bad: 0, run: 0 }; mist = []; onlyMist = false; save(); next(); };
    if ('speechSynthesis' in window) {
      $('#spSay').hidden = false;
      $('#spSay').onclick = () => { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance([cur.subj, cur.ans, cur.rest].filter(Boolean).join(' ')); u.lang = 'es-ES'; u.rate = .8; speechSynthesis.speak(u); } catch { } };
    }
    $('#spMic').onclick = listen;
    opts(); overview(); paint(); next();
  }

  function opts() {
    const box = (id, list, key, label) => {
      const el = $(id);
      el.innerHTML = list.map(x => `<label class="check"><input type="checkbox" value="${x}" ${sel[key].includes(x) ? 'checked' : ''}> ${esc(label(x))}</label>`).join('');
      el.onchange = () => {
        const v = [...el.querySelectorAll('input:checked')].map(i => i.value);
        if (!v.length) { el.querySelector('input').checked = true; v.push(list[0]); }
        sel[key] = v; store.set('sel', sel); markPre(); next();
      };
    };
    box('#spOv', Object.keys(V), 'v', k => k + ' (' + V[k].nl + ')');
    box('#spOt', T.map(t => t.k), 't', k => T.find(t => t.k === k).n);
    box('#spOp', P.map(p => p.k), 'p', k => PL[P.findIndex(p => p.k === k)]);
    const oz = $('#spOz');
    oz.innerHTML = Object.keys(THEMA).map(k => `<label class="check"><input type="checkbox" value="${k}" ${thema.includes(k) ? 'checked' : ''}> ${esc(THEMA[k])}</label>`).join('');
    oz.onchange = () => {
      thema = [...oz.querySelectorAll('input:checked')].map(i => i.value);
      if (!thema.length) { oz.querySelector('input').checked = true; thema = [oz.querySelector('input').value]; }
      store.set('thema', thema); if (mode === 'les') next();
    };
    markPre();
  }
  function lesItem() {
    const pool = ZIN.filter(z => thema.includes(z.th));
    if (thema.includes('getal')) for (let i = 0; i < 8; i++) pool.push(null);
    const z = pick(pool.length ? pool : ZIN);
    if (!z) { const n = 1 + Math.floor(Math.random() * 100); return { id: 'g|' + n, les: true, t: { n: THEMA.getal, x: 'Schrijf of zeg het getal in het Spaans.' }, tip: GTIP, tag: 'zeg het getal', subj: '', rest: '', nl: String(n), ans: getal(n) }; }
    return { id: z.id, les: true, t: { n: THEMA[z.th], x: 'Vertaal de hele zin in het Spaans.' }, tip: z.tip, tag: 'hele zin', subj: '', rest: '', nl: z.nl, ans: z.es };
  }
  function markPre() {
    const s = JSON.stringify(sel);
    root.querySelectorAll('#spPre .chip').forEach(b => b.setAttribute('aria-selected', JSON.stringify(pick2(PRE[b.dataset.p])) === s));
  }

  function next() {
    if (mode === 'les' && !onlyMist) { let c = lesItem(); if (cur) for (let n = 0; n < 5 && c.id === cur.id; n++) c = lesItem(); cur = c; done = false; return draw(); }
    let pool;
    if (onlyMist && mist.length) pool = mist;
    else { onlyMist = false; pool = []; for (const v of sel.v) for (const t of sel.t) for (const p of sel.p) pool.push(v + '|' + t + '|' + p); }
    let id = pick(pool); if (cur && pool.length > 1) while (id === cur.id) id = pick(pool);
    cur = make(...id.split('|')); done = false; draw();
  }
  function draw() {
    const z = mode !== 'verb';
    root.querySelectorAll('[data-m]').forEach(b => b.setAttribute('aria-selected', b.dataset.m === mode));
    $('#spTense').textContent = cur.t.n; $('#spVerb').textContent = cur.les ? cur.tag : cur.vk + ' = ' + V[cur.vk].nl; $('#spHint').textContent = cur.t.x;
    $('#spNl').textContent = cur.nl; $('#spSubj').textContent = cur.subj; $('#spRest').textContent = cur.rest;
    $('#spForm').classList.toggle('zin', z); $('#spSubj').hidden = z; $('#spRest').hidden = z;
    $('#spInp').placeholder = cur.les && cur.tag !== 'hele zin' ? 'typ of zeg het getal' : z ? 'zeg of typ de hele zin' : 'typ hier';
    $('#spMic').hidden = !(z && Rec);
    $('#spMicNote').hidden = !z;
    $('#spMicNote').textContent = Rec ? 'Tik op Inspreken en zeg de hele zin in het Spaans.'
      : 'Tik in het vak en dan op het microfoontje van je toetsenbord. Zet je toetsenbord op Spaans.';
    $('#spInp').value = ''; $('#spFb').innerHTML = onlyMist ? '<span class="mut">Je oefent nu je fouten.</span>' : '';
    $('#spCheck').textContent = 'Controleer';
  }
  function save() { store.set('score', sc); store.set('mist', mist); paint(); }
  function check() {
    if (done) { next(); return; }
    const z = mode !== 'verb', a = norm($('#spInp').value), r = z ? norm(cur.subj + ' ' + cur.ans + ' ' + cur.rest) : cur.ans;
    const nr = !cur.les && !mist.includes(cur.id);
    if (!a) { $('#spInp').focus(); return; }
    done = true; $('#spCheck').textContent = 'Volgende';
    const full = esc([cur.subj, cur.ans, cur.rest].filter(Boolean).join(' '));
    if (a === r || bare(a) === bare(r)) {
      sc.ok++; sc.run++; mist = mist.filter(m => m !== cur.id);
      $('#spFb').innerHTML = (a === r ? `<b class="sp-ok">¡Muy bien!</b> ${full}` : `<b class="sp-ok">Goed!</b> Let op de accenten: <span class="sp-ans">${z ? full : esc(r)}</span>`)
        + (z ? '' : '<br><span class="mut">Zeg de hele zin nu nog even hardop.</span>');
    } else {
      sc.bad++; sc.run = 0; if (nr) mist.push(cur.id);
      $('#spFb').innerHTML = `<b class="sp-bad">Bijna.</b> Jij had "${esc(a)}". Het is: <span class="sp-ans">${z ? full : esc(r)}</span>${z ? '' : '<br>' + full}`;
    }
    tip(); save();
  }
  function tip() { if (cur.tip) $('#spFb').insertAdjacentHTML('beforeend', `<br><span class="mut">Tip: ${esc(cur.tip)}</span>`); }
  function show() {
    if (done) return; done = true; sc.run = 0; if (!cur.les && !mist.includes(cur.id)) mist.push(cur.id);
    $('#spFb').innerHTML = `Het antwoord is <span class="sp-ans">${esc(cur.ans)}</span>` + (cur.les ? '' : `<br>${esc(cur.subj + ' ' + cur.ans + ' ' + cur.rest)}`);
    $('#spCheck').textContent = 'Volgende'; tip(); save();
  }
  function listen() {
    if (!Rec || done) return;
    let r; try { r = new Rec(); } catch { return; }
    r.lang = 'es-ES'; r.interimResults = false; r.maxAlternatives = 3;
    const btn = $('#spMic'); btn.textContent = 'Ik luister…'; btn.disabled = true;
    r.onresult = e => {
      const alts = [...e.results[0]].map(x => x.transcript);
      const target = bare(norm([cur.subj, cur.ans, cur.rest].join(' ')));
      $('#spInp').value = alts.find(t => bare(norm(t)) === target) || alts[0];
      check();
    };
    r.onerror = e => { $('#spFb').innerHTML = `<span class="mut">${e.error === 'not-allowed' ? 'Geef de app toestemming voor de microfoon, of gebruik het microfoontje van je toetsenbord.' : 'Ik verstond je niet goed. Probeer het nog eens.'}</span>`; };
    r.onend = () => { btn.textContent = 'Inspreken'; btn.disabled = false; };
    try { r.start(); } catch { r.onend(); }
  }
  function paint() {
    $('#spOk').textContent = sc.ok; $('#spBad').textContent = sc.bad; $('#spRun').textContent = sc.run;
    $('#spMInfo').textContent = mist.length ? `Deze ${mist.length === 1 ? 'vorm ging' : mist.length + ' vormen gingen'} nog fout. Doe je ze goed, dan verdwijnen ze.` : 'Nog geen fouten. Lekker bezig!';
    $('#spMList').innerHTML = mist.map(m => { const [v, t, p] = m.split('|'); return `<span>${esc(PL[P.findIndex(x => x.k === p)] + ' · ' + v + ' · ' + T.find(x => x.k === t).n)}</span>`; }).join('');
    $('#spMist').disabled = !mist.length;
  }
  function overview() {
    $('#spTabs').innerHTML = Object.keys(V).map(k => `<button class="chip" data-ov="${k}" aria-selected="${k === ovV}">${k}</button>`).join('');
    const v = V[ovV];
    $('#spGrid').innerHTML = T.map(t => `<div class="sp-tc"><h3>${esc(t.n)}</h3><table>${PL.map((p, i) => `<tr><td>${p}</td><td>${esc(t.es(v, i, ovV))}</td></tr>`).join('')}</table></div>`).join('');
  }

  return { render() { if (!built) build(); } };
}
