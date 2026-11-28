// Weekmenu (afvalschema Frans): ca. 1.800 kcal, min. 110 g eiwit, 6 eetmomenten.
export const TARGET = 1800, LO = 1600, HI = 1950, PROT = 110;
const MAXK = 2300;
const CATNAME = { groente: 'Groente', fruit: 'Fruit', zuivel: 'Zuivel', eiwit: 'Vlees, vis & eieren', granen: 'Brood, granen & aardappelen', overig: 'Overig' };
// [naam, portie, kcal, eiwit, categorie?]
// Gewoon, makkelijk eten: kwark, brood met kaas/vleeswaren, aardappel-groente-vlees, pasta, rijst; zondag patat.
const BELEG = [["Kaas 30+", "1 plak (20 g)", 60, 5, "zuivel"], ["Jonge kaas 48+", "1 plak (20 g)", 75, 5, "zuivel"], ["Salami", "3 dunne plakjes (15 g)", 60, 3.5], ["Serranoham", "2 plakjes (20 g)", 50, 6], ["Gekookt ei", "1 stuk", 75, 6.5], ["Kipfilet (beleg)", "2 plakjes (30 g)", 35, 7], ["Smeerkaas light", "20 g", 35, 2, "zuivel"], ["Pindakaas", "10 g", 60, 2.5, "overig"], ["Tortilla (Spaanse omelet)", "1 punt (100 g)", 180, 7]];
export const SLOTS = [
{id:'o',time:'07:30',name:'Ontbijt',comps:[
 {id:'basis',label:'Kwark / yoghurt',cat:'zuivel',opts:[['Magere kwark','250 g',143,24],['Halfvolle kwark','250 g',190,22],['Griekse yoghurt 0%','250 g',145,25],['Stracciatella-yoghurt','2 bekertjes (250 g)',290,8],['Griekse stracciatella-yoghurt','1 beker (125 g)',200,4]],def:[0,0,0,0,0,0,0]},
 {id:'crunch',label:'Muesli',cat:'granen',opts:[['Muesli zonder toegevoegde suiker','40 g',150,4],['Havermout','40 g',150,5],['Krokante muesli','30 g',135,3],['Geen muesli','',0,0]],def:[0,0,1,0,0,1,3]},
 {id:'fruit',label:'Fruit erdoor',cat:'fruit',opts:[['Frambozen','100 g',52,1],['Blauwe bessen','100 g',57,1],['Aardbeien','150 g',48,1],['Banaan','½ stuk',50,.6],['Diepvries rood fruit','100 g',45,1],['Appel in stukjes','½ appel',40,.2],['Peer in stukjes','½ peer',45,.3],['Geen fruit','',0,0]],def:[4,5,3,4,6,5,7]},
 {id:'extra',label:'Extra',cat:'fruit',opts:[['Medjool-dadel','1 stuk',66,.4],['Walnoten','10 g',65,1.5,'overig'],['Honing','1 tl',30,0,'overig'],['Niets extra','',0,0]],def:[0,1,0,2,0,1,3]}]},
{id:'f',time:'10:30',name:'Fruit',comps:[
 {id:'fruit',label:'Fruit',cat:'fruit',opts:[['Appel','1 stuk',80,.4],['Mandarijnen','2 stuks',70,1.2],['Sinaasappel','1 stuk',70,1.3],['Peer','1 stuk',90,.6],['Banaan','1 stuk',105,1.3],['Geen fruit (strand: broodje komt eraan)','',0,0]],def:[0,1,2,0,1,2,5]}]},
{id:'l',time:'12:30',name:'Lunch',comps:[
 {id:'brood',label:'Brood',cat:'granen',opts:[['Volkorenbrood','3 sneetjes',255,12],['Volkorenbrood','2 sneetjes',170,8],['Groot pistolet / bocadillo','1 stuk (ca. 120 g)',320,11],['Stokbrood (barra de pan)','⅓ barra (ca. 15 cm, 85 g)',230,7]],def:[0,0,0,0,0,0,2]},
 {id:'b1',label:'Beleg 1',cat:'eiwit',opts:BELEG,def:[0,0,1,0,0,1,1]},
 {id:'b2',label:'Beleg 2',cat:'eiwit',opts:BELEG,def:[2,3,3,2,3,2,3]},
 {id:'b3',label:'Beleg 3',cat:'eiwit',opts:BELEG,def:[5,4,1,5,0,4,8]},
 {id:'erbij',label:'Erbij',cat:'groente',opts:[['Tomaat & komkommer','150 g',30,1],['Snoeptomaatjes','100 g',20,1],['Niets erbij','',0,0]],def:[0,2,0,2,0,1,2]}]},
{id:'m',time:'15:30',name:'Tussendoor',comps:[
 {id:'snack',label:'Snack',cat:'eiwit',opts:[['Gekookt ei','1 stuk',75,6.5],['Gekookt ei + mandarijn','1 + 1 stuk',110,7.5],['Ongezouten noten','handje (20 g)',120,4,'overig'],['Appel','1 stuk',80,.4,'fruit'],['Kwark met kaneel (thuis)','150 g',85,14,'zuivel'],['Snoeptomaatjes + kaasblokjes','100 g + 20 g',100,6,'zuivel'],['Chips','klein handje (20 g)',105,1.3,'overig']],def:[1,0,1,0,1,2,1]}]},
{id:'d',time:'19:00',name:'Avondeten',comps:[
 {id:'eiwit',label:'Vlees / vis / vega',cat:'eiwit',opts:[['Kipfilet','150 g',165,34],['Biefstuk','150 g',190,33],['Mager rundergehakt','125 g',170,27],['Varkenshaas','150 g',180,33],['Witvis (kabeljauw/merluza)','175 g',140,30],['Vega gehakt','100 g',180,18],['Frikandel (airfryer)','1 stuk',160,8],['Geen vlees','',0,0],['Eieren & hamblokjes','2 eieren + 30 g',200,19],['Kikkererwten','200 g uitgelekt',240,14],['Borrelplank: serrano, kipreepjes & kaas','40 g + 50 g + 20 g',215,28],['Eieren','3 stuks',225,19],['Linzen','200 g gekookt',230,18],['Halloumi','75 g',240,16],['Bonen & kaas','150 g bonen + 30 g kaas',255,17],['Mozzarella light','½ bol (60 g)',100,11],['Feta','60 g',160,9],['Veggieburger','1 stuk (100 g)',200,16],['Falafel','5 balletjes (100 g)',230,8],['Kipworstjes','2 stuks (120 g)',200,20]],def:[0,2,4,5,1,3,6]},
 {id:'groente',label:'Groente',cat:'groente',opts:[['Broccoli','300 g',100,8],['Bloemkool','300 g',75,6],['Sperziebonen','300 g',90,5],['Worteltjes','300 g',105,3],['Spinazie','300 g',70,9],['Rode kool','300 g',75,4],['Wokgroente','300 g',90,5],['Champignons','300 g',65,9],['Sla & rauwkost','250 g',50,3],['Paprika & ui','300 g',90,3],['Doperwten & wortel','250 g',150,9],['Salade: tomaat, sla & ui','250 g',55,2],['Rauwkost: komkommer, paprika & wortel','300 g',75,3]],def:[0,6,2,7,1,3,8]},
 {id:'koolh',label:'Aardappel / pasta / rijst',cat:'granen',opts:[['Aardappelen','250 g',195,5],['Krieltjes','250 g',200,5],['Volkorenpasta','75 g droog',260,10],['Rijst','70 g droog',250,5],['Patat (airfryer/oven)','250 g',375,6],['Patat (frituur)','200 g',500,7],['Tortilla-wraps','2 stuks',240,7],['Hamburgerbroodje volkoren','1 stuk',200,8],['Stokbrood','2 sneetjes (60 g)',160,5],['Diepvriespizza','½ pizza',430,16],['Gnocchi','200 g',300,7]],def:[0,2,3,2,0,1,4]},
 {id:'saus',label:'Saus / bakken',cat:'overig',opts:[['Boter of olie om te bakken','1 el',100,0],['Boter of olie om te bakken','½ el',50,0],['Pastasaus (tomaat) + ½ el olie','150 g',110,2],['Jus + ½ el boter','50 ml',75,0],['Fritessaus','25 g',75,0],['Mayonaise','20 g',140,0],['Currysaus (kokosmelk light)','100 ml',90,1],['Hummus & olijven','40 g + 6 stuks',125,3]],def:[0,2,1,2,0,3,4]}]},
{id:'a',time:'21:00',name:'Avond',comps:[
 {id:'snack',label:'Iets lekkers',cat:'overig',opts:[['Ongezouten noten','handje (15 g)',95,3],['Pure chocolade','2 blokjes (10 g)',60,1],['Mandarijn','1 stuk',35,.6,'fruit'],['Niets','',0,0]],def:[0,1,0,0,1,0,3]},
 {id:'drank',label:'Drinken',cat:'overig',opts:[['Water of thee','',0,0],['Cola Zero','1 blikje',1,0],['Cola (gewoon)','1 glas (250 ml)',105,0]],def:[0,0,0,0,0,0,0]}]}];
export const DAYS = ['Maandag','Dinsdag','Woensdag','Donderdag','Vrijdag','Zaterdag','Zondag'];
const PADEL = [0, 2];
// Zondag = strandzondag: kwark thuis, eind van de ochtend een groot broodje op het strand, 's middags ei + fruit, 's avonds patat.
const STRAND = 6;
// Standaardporties die afwijken van 1 (per dag): op zondag 2 plakken kaas en 4 plakjes ham op het broodje.
const DEFQ = { 'l.b1': { 6: 2 }, 'l.b2': { 6: 2 } };
export const QOPTS = [[0.5, '½ portie'], [1, '1 portie'], [1.5, '1½ portie'], [2, '2 porties']];
const QVAL = new Set(QOPTS.map(q => q[0]));
const qk = c => c.key + '#q';
const SKIP = new Set(['Geen muesli', 'Geen fruit', 'Geen fruit (strand: broodje komt eraan)', 'Niets extra', 'Niets erbij', 'Niets', 'Geen vlees', 'Water of thee']);
const COMPS = []; SLOTS.forEach(s => s.comps.forEach(c => { c.key = s.id + '.' + c.id; COMPS.push(c); }));

export const freshPlan = () => DAYS.map((_, d) => Object.fromEntries(COMPS.flatMap(c => {
  const q = DEFQ[c.key] && DEFQ[c.key][d];
  return q ? [[c.key, c.def[d]], [qk(c), q]] : [[c.key, c.def[d]]];
})));
export const cleanPlan = p => Array.isArray(p) && p.length === 7
  ? p.map((x, d) => Object.fromEntries(COMPS.flatMap(c => {
      const v = x && x[c.key], q = x && x[qk(c)];
      const out = [[c.key, Number.isInteger(v) && c.opts[v] ? v : c.def[d]]];
      if (QVAL.has(q) && q !== 1) out.push([qk(c), q]);
      return out;
    }).concat(x && typeof x[REC] === 'string' && /^[a-z0-9-]{1,40}$/.test(x[REC]) ? [[REC, x[REC]]] : [])))
  : freshPlan();

// Vaste avondmaaltijden (ideeënlijst): één tik zet de vier onderdelen van het avondeten.
// Een gerecht = { n: naam, k: { 'd.eiwit': optie, ... }, q: { 'd.eiwit': portie, ... } }. Opties volgen de posities in SLOTS.
const DKEYS = ['d.eiwit', 'd.groente', 'd.koolh', 'd.saus'];
// Recept uit het receptenboekje dat op een dag staat (id uit recepten.js), alleen ter info bij Avondeten
export const REC = 'd.rec';
const dish = (n, e, g, k, s) => ({ n, k: { 'd.eiwit': e, 'd.groente': g, 'd.koolh': k, 'd.saus': s }, q: {} });
export const DISHES = [
  dish('Aardappelen, sperziebonen & varkenshaas', 3, 2, 0, 3),
  dish('Pasta met gehakt', 2, 7, 2, 2),
  dish('Pasta vega met spinazie', 5, 4, 2, 2),
  dish('Rijst met wokgroente & kip', 0, 6, 3, 1),
  dish('Vis met krieltjes & broccoli', 4, 0, 1, 1),
  dish('Aardappelen, bloemkool & biefstuk', 1, 1, 0, 1),
  dish('Zondag patat met frikandel', 6, 8, 4, 4)
];
export const cleanDishes = list => Array.isArray(list)
  ? list.filter(x => x && typeof x.n === 'string' && x.n.trim() && x.k).map(x => ({
      n: x.n.trim().slice(0, 60),
      k: Object.fromEntries(DKEYS.map(key => { const c = COMPS.find(c => c.key === key), v = x.k[key]; return [key, Number.isInteger(v) && c.opts[v] ? v : c.def[0]]; })),
      q: Object.fromEntries(DKEYS.filter(key => x.q && QVAL.has(x.q[key]) && x.q[key] !== 1).map(key => [key, x.q[key]]))
    }))
  : DISHES;

const nf = n => Math.round(n).toLocaleString('nl-NL');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Boodschappen uit het menu: [{name, qty, category}]
// recipeItems(id) geeft de boodschappen van een recept uit het receptenboekje (of null). Staat er op een dag een recept,
// dan gaan de ingrediënten van dat recept (voor 4) mee in plaats van de losse onderdelen van Avondeten (alleen jouw portie).
export function menuShopping(plan, recipeItems = () => null) {
  const map = new Map(), recs = [];
  plan.forEach(day => {
    const ri = day[REC] && recipeItems(day[REC]);
    if (ri) recs.push(...ri);
    COMPS.forEach(c => {
      if (ri && DKEYS.includes(c.key)) return;
      const o = c.opts[day[c.key]]; if (!o || SKIP.has(o[0])) return;
      const k = o[0] + '|' + o[1];
      const cur = map.get(k) || { name: o[0], portie: o[1], category: CATNAME[o[4] || c.cat], n: 0 };
      cur.n += day[qk(c)] || 1; map.set(k, cur);
    });
  });
  return [...map.values()].map(x => ({ name: x.name, qty: (x.portie ? x.portie + ' ' : '') + '×' + String(x.n).replace('.', ','), category: x.category })).concat(recs);
}

const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const todayIdx = () => (new Date().getDay() + 6) % 7;
// Het menu loopt altijd 7 dagen vooruit vanaf vandaag. Elke weekdag komt er precies één keer in voor,
// dus een dag die voorbij is, wordt vanzelf de dag van volgende week (het plan blijft per weekdag opgeslagen).
const MONTHS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const dateOf = d => { const t = new Date(); t.setHours(12, 0, 0, 0); t.setDate(t.getDate() + (d - todayIdx() + 7) % 7); return t; };
const ahead = () => [0, 1, 2, 3, 4, 5, 6].map(i => { const d = (todayIdx() + i) % 7; return { d, date: dateOf(d) }; });

export function mountMenu(root, { getPlan, setPlan, toShopping, getEaten, setEaten, getDefault = freshPlan, setDefault, getDishes, setDishes, recipeName, openRecipe }) {
  let day = todayIdx(), dishOpen = false;
  const opt = (plan, c, d) => c.opts[plan[d][c.key]];
  const mul = (plan, c, d) => plan[d][qk(c)] || 1;
  const tot = (plan, d) => COMPS.reduce((a, c) => { const o = opt(plan, c, d), m = mul(plan, c, d); a.k += o[2] * m; a.p += o[3] * m; return a; }, { k: 0, p: 0 });
  const slotK = (plan, s, d) => s.comps.reduce((a, c) => a + opt(plan, c, d)[2] * mul(plan, c, d), 0);
  const DC = DKEYS.map(key => COMPS.find(c => c.key === key));
  const dishK = g => DC.reduce((a, c) => { const o = c.opts[g.k[c.key]]; a.k += o[2] * (g.q[c.key] || 1); a.p += o[3] * (g.q[c.key] || 1); return a; }, { k: 0, p: 0 });
  const isDish = (plan, g, d) => DC.every(c => plan[d][c.key] === g.k[c.key] && mul(plan, c, d) === (g.q[c.key] || 1));
  const fromDay = (plan, d, n) => ({ n, k: Object.fromEntries(DC.map(c => [c.key, plan[d][c.key]])), q: Object.fromEntries(DC.filter(c => mul(plan, c, d) !== 1).map(c => [c.key, mul(plan, c, d)])) });
  const dishHtml = plan => {
    if (!getDishes) return '';
    const list = getDishes(), rid = plan[day][REC], rn = rid && recipeName ? recipeName(rid) : '';
    const book = openRecipe ? `<div class="mbook">${rn ? `<button class="mrec" type="button" data-rec="${esc(rid)}"><span>📖 Recept</span><b>${esc(rn)}</b><small>Tik voor ingrediënten en bereiding</small></button>` : ''}<button class="btn mbook-open" type="button" data-rec="">📖 Receptenboekje: ideeën met foto</button></div>` : '';
    return `${book}<div class="dishes"><div class="dlab">Vaste gerechten: kies met één tik</div><div class="dchips">${
      list.map((g, i) => { const t = dishK(g), on = isDish(plan, g, day); return `<button class="dchip" type="button" data-dish="${i}" aria-pressed="${on}">${on ? '✓ ' : ''}${esc(g.n)}<small>${nf(t.k)} kcal · ${nf(t.p)} g eiwit</small></button>`; }).join('')
    }</div><details class="dedit"${dishOpen ? ' open' : ''}><summary>Gerechten aanpassen of toevoegen</summary>
      <p class="mut">Stel hieronder het avondeten in zoals jullie het willen. Geef het een naam en tik op Bewaar. Bij een bestaand gerecht tik je op Bijwerken: dan krijgt het het avondeten zoals het nu staat.</p>
      <div class="dnew"><input id="dishName" type="text" maxlength="60" placeholder="Naam, bijv. Kip met rijst" autocomplete="off" enterkeyhint="done"><button class="btn primary" type="button" id="dishAdd">Bewaar</button></div>
      ${list.map((g, i) => `<div class="drow"><span>${esc(g.n)}<small>${nf(dishK(g).k)} kcal</small></span><button class="btn" type="button" data-dupd="${i}">Bijwerken</button><button class="btn danger" type="button" data-ddel="${i}">Wis</button></div>`).join('')}
      ${list.length ? '' : '<p class="mut">Nog geen gerechten.</p>'}
    </details></div>`;
  };

  function render() {
    const keepName = root.querySelector('#dishName'), keepVal = keepName ? keepName.value : '', keepFocus = keepName && document.activeElement === keepName;
    const plan = getPlan(), t = tot(plan, day), pct = v => Math.min(100, v / MAXK * 100);
    const st = t.k < LO ? ['Iets aan de lage kant: neem een fruit of kwarkje extra.', 'var(--warn)']
      : t.k > HI ? ['Boven je zone: kies een lichter bijgerecht of minder olie.', 'var(--warn)']
      : ['Binnen je zone.', 'var(--ok)'];
    const isToday = day === todayIdx();
    const eaten = isToday ? ((getEaten() || {})[todayKey()] || []) : [];
    const eatenK = SLOTS.filter(s => eaten.includes(s.id)).reduce((a, s) => a + slotK(plan, s, day), 0);
    const eatenHtml = eaten.length ? `<details class="eaten"><summary>✓ Al gegeten vandaag: ${SLOTS.filter(s => eaten.includes(s.id)).map(s => s.name).join(', ')} <span>${nf(eatenK)} kcal · nog ${nf(Math.max(0, t.k - eatenK))} kcal te gaan</span></summary>${
      SLOTS.filter(s => eaten.includes(s.id)).map(s => `<div class="eaten-row"><span><b>${s.time}</b> ${s.name}</span><button class="btn" type="button" data-uneat="${s.id}">Terugzetten</button></div>`).join('')}</details>` : '';
    root.innerHTML = `
      <div class="mtabs" role="tablist" aria-label="Komende 7 dagen">${ahead().map(({ d, date }, i) => `<button class="mtab" role="tab" data-d="${d}" aria-selected="${d === day}"><b>${i ? DAYS[d].slice(0, 2) + ' ' + date.getDate() : 'Vandaag'}${PADEL.includes(d) ? '<span class="pd" title="Padeldag"></span>' : ''}</b><small>${nf(tot(plan, d).k)} kcal</small></button>`).join('')}</div>
      <div class="msum">
        <div class="mut" style="font-size:14px">${DAYS[day]} ${dateOf(day).getDate()} ${MONTHS[dateOf(day).getMonth()]}${PADEL.includes(day) ? ' · padel 11:00–12:00' : ''}${day === STRAND ? ' · strandzondag: groot broodje eind van de ochtend' : ''}</div>
        <div class="big">${nf(t.k)} <small>kcal · ${nf(t.p)} g eiwit</small></div>
        <div class="meter"><i style="width:${pct(t.k)}%;background:${st[1]}"></i><span class="zone" style="left:${pct(LO)}%;width:${pct(HI) - pct(LO)}%"></span></div>
        <div style="font-weight:600;color:${st[1]};font-size:14px">${st[0]}</div>
      </div>
      ${eatenHtml}
      ${SLOTS.filter(s => !eaten.includes(s.id)).map(s => `<article class="meal"><div class="time">${s.time}</div><div><h3>${s.name}<span>${nf(slotK(plan, s, day))} kcal${isToday ? `<button class="eat" type="button" data-eat="${s.id}" aria-label="${s.name} gegeten">✓ Gegeten</button>` : ''}</span></h3>${s.id === 'd' ? dishHtml(plan) : ''}${
        s.comps.map(c => `<div class="mrow"><label for="m-${c.key}">${c.label}</label><select id="m-${c.key}" data-k="${c.key}">${
          c.opts.map((o, i) => `<option value="${i}"${plan[day][c.key] === i ? ' selected' : ''}>${esc(o[0])}${o[1] ? ' · ' + esc(o[1]) : ''} (${o[2]} kcal)</option>`).join('')
        }</select><select class="q" data-q="${c.key}" aria-label="Portie ${c.label}">${
          QOPTS.map(([v, l]) => `<option value="${v}"${mul(plan, c, day) === v ? ' selected' : ''}>${l}</option>`).join('')
        }</select><button class="all" type="button" data-all="${c.key}" title="Zet deze keuze en portie op alle 7 dagen">Alle 7 dagen</button></div>`).join('')
      }</div></article>`).join('')}
      ${isToday && eaten.length === SLOTS.length ? '<p class="empty">Alles gegeten voor vandaag. Goed bezig!</p>' : ''}
      <p class="mut" style="font-size:13px">Het menu loopt altijd 7 dagen vooruit, vanaf vandaag. Zet op boodschappenlijst neemt precies die 7 dagen mee. Staat er op een dag een recept, dan gaan de ingrediënten van dat recept mee (voor 4). Hetzelfde product komt op één regel, en wat er al op de lijst staat, komt er niet nog een keer op.</p>
      <div class="actions"><button class="btn primary" type="button" id="menuToShop">Zet op boodschappenlijst</button><button class="btn" type="button" id="menuReset">Standaardmenu</button>${setDefault ? '<button class="btn" type="button" id="menuSaveDef">Maak standaardmenu</button>' : ''}</div>
      ${setDefault ? '<p class="mut" style="font-size:13px">Standaardmenu zet de hele week terug naar jullie vaste menu. Maak standaardmenu slaat de week zoals hij nu staat op als dat vaste menu.</p>' : ''}`;
    if (keepVal || keepFocus) { const n = root.querySelector('#dishName'); if (n) { n.value = keepVal; if (keepFocus) n.focus({ preventScroll: true }); } }
  }

  root.addEventListener('click', e => {
    const eat = e.target.closest('[data-eat],[data-uneat]');
    if (eat) {
      const all = { ...(getEaten() || {}) }, k = todayKey(), id = eat.dataset.eat || eat.dataset.uneat;
      const cur = new Set(all[k] || []); if (eat.dataset.eat) cur.add(id); else cur.delete(id);
      all[k] = [...cur];
      for (const d of Object.keys(all)) if (d < new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10)) delete all[d];
      setEaten(all); render(); return;
    }
    const ds = e.target.closest('.dedit > summary');
    if (ds) { dishOpen = !ds.parentElement.open; return; }
    const dc = e.target.closest('[data-dish]');
    if (dc) {
      const g = getDishes()[+dc.dataset.dish]; if (!g) return;
      const plan = getPlan().map(x => ({ ...x }));
      DKEYS.forEach(key => { plan[day][key] = g.k[key]; if (g.q[key]) plan[day][key + '#q'] = g.q[key]; else delete plan[day][key + '#q']; });
      delete plan[day][REC];
      setPlan(plan); render(); return;
    }
    const rb = e.target.closest('[data-rec]');
    if (rb && openRecipe) { openRecipe(rb.dataset.rec || null, day); return; }
    if (e.target.closest('#dishAdd')) { addDish(); return; }
    const tab = e.target.closest('.mtab');
    if (tab) { day = +tab.dataset.d; render(); return; }
    const all = e.target.closest('.all');
    if (all) {
      const plan = getPlan().map(x => ({ ...x })), k = all.dataset.all, v = plan[day][k], q = plan[day][k + '#q'];
      plan.forEach(p => { p[k] = v; if (q) p[k + '#q'] = q; else delete p[k + '#q']; }); setPlan(plan); render();
      const b = root.querySelector(`[data-all="${k}"]`); if (b) { b.textContent = 'Op alle dagen'; b.classList.add('done'); }
      return;
    }
    if (e.target.closest('#menuToShop')) { toShopping(); return; }
    // Twee keer tikken ter bevestiging
    const sure = (b, label, act) => {
      if (b.dataset.sure) { act(); return; }
      b.dataset.sure = 1; b.textContent = 'Zeker? Tik nog een keer'; b.classList.add('sure');
      setTimeout(() => { if (b.isConnected && b.dataset.sure) { delete b.dataset.sure; b.textContent = label; b.classList.remove('sure'); } }, 3000);
    };
    const r = e.target.closest('#menuReset');
    if (r) { sure(r, 'Standaardmenu', () => { setPlan(getDefault().map(x => ({ ...x }))); render(); }); return; }
    const du = e.target.closest('[data-dupd]');
    if (du) { sure(du, 'Bijwerken', () => { const list = getDishes().slice(), i = +du.dataset.dupd; if (!list[i]) return; list[i] = fromDay(getPlan(), day, list[i].n); setDishes(list); render(); }); return; }
    const dd = e.target.closest('[data-ddel]');
    if (dd) { sure(dd, 'Wis', () => { const list = getDishes().slice(); list.splice(+dd.dataset.ddel, 1); setDishes(list); render(); }); return; }
    const sd = e.target.closest('#menuSaveDef');
    if (sd) sure(sd, 'Maak standaardmenu', () => {
      setDefault(getPlan().map(x => ({ ...x }))); render();
      const b = root.querySelector('#menuSaveDef'); if (b) { b.textContent = '✓ Opgeslagen als standaard'; b.classList.add('done'); }
    });
  });
  function addDish() {
    const inp = root.querySelector('#dishName'), n = inp ? inp.value.trim() : '';
    if (!n) { if (inp) { inp.placeholder = 'Typ eerst een naam'; inp.focus(); } return; }
    const list = getDishes().slice(), g = fromDay(getPlan(), day, n), i = list.findIndex(x => x.n.toLowerCase() === n.toLowerCase());
    if (i >= 0) list[i] = g; else list.push(g);
    inp.value = ''; inp.blur(); setDishes(list); render();
  }
  root.addEventListener('toggle', e => { if (e.target.classList && e.target.classList.contains('dedit')) dishOpen = e.target.open; }, true);
  root.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'dishName') { e.preventDefault(); addDish(); } });
  root.addEventListener('change', e => {
    const k = e.target.dataset.k, q = e.target.dataset.q; if (!k && !q) return;
    const plan = getPlan().map(x => ({ ...x }));
    if (k) plan[day][k] = +e.target.value;
    else { const v = +e.target.value; if (v === 1) delete plan[day][q + '#q']; else plan[day][q + '#q'] = v; }
    setPlan(plan); render();
    // Focus alleen terugzetten met toetsenbord/muis. Op de iPhone opent focus() het keuzemenu opnieuw.
    if (!matchMedia('(pointer: coarse)').matches) {
      const sel = root.querySelector(k ? `[data-k="${k}"]` : `[data-q="${q}"]`); if (sel) sel.focus({ preventScroll: true });
    }
  });
  return { render };
}
